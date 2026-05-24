const STANDARD_SLOTS = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
];

function parseSlotToMinutes(slot) {
    if (!slot) return null;
    const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
}

function minutesToSlot(mins) {
    let h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function getTodayDayName() {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
}

function optimizeSchedule({ todayAppointments, schedule }) {
    const dayName = getTodayDayName();
    const dayConfig = (schedule?.days || []).find((d) => d.day === dayName);
    const isWorkingDay = dayConfig?.active !== false;

    const activeAppts = todayAppointments.filter(
        (a) => a.status === 'confirmed' || a.status === 'pending' || a.status === 'completed'
    );

    const slotUsage = {};
    STANDARD_SLOTS.forEach((s) => {
        slotUsage[s] = [];
    });

    activeAppts.forEach((a) => {
        if (slotUsage[a.time]) {
            slotUsage[a.time].push(a);
        }
    });

    const emptySlots = STANDARD_SLOTS.filter((s) => !slotUsage[s].length);
    const overbooked = STANDARD_SLOTS.filter((s) => slotUsage[s].length > 1).map((s) => ({
        slot: s,
        count: slotUsage[s].length,
        patients: slotUsage[s].map((a) => a.patient),
    }));

    const bookedMinutes = STANDARD_SLOTS.filter((s) => slotUsage[s].length)
        .map((s) => parseSlotToMinutes(s))
        .filter((m) => m !== null)
        .sort((a, b) => a - b);

    const idlePeriods = [];
    for (let i = 1; i < bookedMinutes.length; i++) {
        const gap = bookedMinutes[i] - bookedMinutes[i - 1];
        if (gap >= 120) {
            idlePeriods.push({
                from: minutesToSlot(bookedMinutes[i - 1]),
                to: minutesToSlot(bookedMinutes[i]),
                gapMinutes: gap,
                label: `${gap / 60}h gap between ${minutesToSlot(bookedMinutes[i - 1])} and ${minutesToSlot(bookedMinutes[i])}`,
            });
        }
    }

    const suggestions = [];
    if (emptySlots.length && activeAppts.length) {
        const lastBooked = [...activeAppts].sort(
            (a, b) => parseSlotToMinutes(b.time) - parseSlotToMinutes(a.time)
        );
        const lateAppt = lastBooked[lastBooked.length - 1];
        const lateSlot = lateAppt?.time;
        const earlyEmpty = emptySlots.find(
            (s) => parseSlotToMinutes(s) < parseSlotToMinutes(lateSlot)
        );
        if (earlyEmpty && lateSlot && earlyEmpty !== lateSlot) {
            suggestions.push({
                type: 'move',
                appointmentId: lateAppt.id,
                patient: lateAppt.patient,
                from: lateSlot,
                to: earlyEmpty,
                message: `Move ${lateAppt.patient}'s appointment from ${lateSlot} to ${earlyEmpty} to fill an empty slot.`,
            });
        }
    }

    if (idlePeriods.length && emptySlots.length) {
        const gap = idlePeriods[0];
        const fillSlot = emptySlots.find(
            (s) =>
                parseSlotToMinutes(s) > parseSlotToMinutes(gap.from) &&
                parseSlotToMinutes(s) < parseSlotToMinutes(gap.to)
        );
        if (fillSlot) {
            suggestions.push({
                type: 'idle',
                from: gap.from,
                to: gap.to,
                suggestedSlot: fillSlot,
                message: `Long idle period (${gap.gapMinutes / 60}h) detected — consider booking at ${fillSlot}.`,
            });
        }
    }

    overbooked.forEach((ob) => {
        if (emptySlots.length) {
            suggestions.push({
                type: 'overbook',
                slot: ob.slot,
                message: `Overbooking at ${ob.slot} (${ob.count} patients) — move one to ${emptySlots[0]}.`,
                suggestedSlot: emptySlots[0],
            });
        }
    });

    if (!isWorkingDay && activeAppts.length) {
        suggestions.push({
            type: 'warning',
            message: 'Today is marked as a non-working day but you have appointments scheduled.',
        });
    }

    const utilization = Math.round(
        ((STANDARD_SLOTS.length - emptySlots.length) / STANDARD_SLOTS.length) * 100
    );

    return {
        emptySlots,
        overbooked,
        idlePeriods,
        suggestions: suggestions.slice(0, 4),
        utilization,
        isWorkingDay,
        totalToday: activeAppts.length,
    };
}

module.exports = { optimizeSchedule, STANDARD_SLOTS, parseSlotToMinutes };

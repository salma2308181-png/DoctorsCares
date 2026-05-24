const CATEGORY_ICONS = {
    visit: 'fa-stethoscope',
    test: 'fa-vial',
    checkup: 'fa-heart-pulse',
    'follow-up': 'fa-rotate-left',
    procedure: 'fa-syringe',
    other: 'fa-notes-medical',
};

const CATEGORY_COLORS = {
    visit: 'blue',
    test: 'purple',
    checkup: 'green',
    'follow-up': 'amber',
    procedure: 'red',
    other: 'slate',
};

function formatMonthYear(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatFullDate(d) {
    return new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function inferCategoryFromText(text) {
    const t = (text || '').toLowerCase();
    if (t.includes('blood test') || t.includes('lab') || t.includes('test')) return 'test';
    if (t.includes('follow-up') || t.includes('follow up')) return 'follow-up';
    if (t.includes('checkup') || t.includes('check-up')) return 'checkup';
    if (t.includes('dentist') || t.includes('dental')) return 'visit';
    if (t.includes('cardio')) return 'checkup';
    return 'visit';
}

function buildTimelineEntry({ title, category, eventDate, provider, notes, memberName, source, id }) {
    const cat = category || inferCategoryFromText(title);
    return {
        id,
        title,
        category: cat,
        categoryLabel: cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' '),
        icon: CATEGORY_ICONS[cat] || CATEGORY_ICONS.other,
        color: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other,
        eventDate: new Date(eventDate),
        monthYear: formatMonthYear(eventDate),
        fullDate: formatFullDate(eventDate),
        provider: provider || '',
        notes: notes || '',
        memberName: memberName || 'Self',
        source,
    };
}

function groupTimelineByYear(entries) {
    const sorted = [...entries].sort((a, b) => b.eventDate - a.eventDate);
    const years = {};
    sorted.forEach((e) => {
        const year = e.eventDate.getFullYear();
        if (!years[year]) years[year] = [];
        years[year].push(e);
    });
    return Object.keys(years)
        .sort((a, b) => Number(b) - Number(a))
        .map((year) => ({
            year,
            events: years[year],
        }));
}

function buildMedicalTimeline({
    manualEntries,
    appointments,
    visitNotes,
    doctorMap,
    familyMap,
    accountHolderName,
    filterMemberId,
}) {
    const entries = [];

    manualEntries.forEach((e) => {
        const memberId = e.familyMember?.toString() || null;
        if (filterMemberId === 'self' && memberId) return;
        if (filterMemberId && filterMemberId !== 'self' && memberId !== filterMemberId) return;

        const memberName = memberId
            ? familyMap[memberId]?.fullName || 'Family'
            : accountHolderName;

        entries.push(
            buildTimelineEntry({
                id: e._id.toString(),
                title: e.title,
                category: e.category,
                eventDate: e.eventDate,
                provider: e.provider,
                notes: e.notes,
                memberName,
                source: e.source,
            })
        );
    });

    appointments
        .filter((a) => a.status === 'completed')
        .forEach((a) => {
            const memberId = a.familyMember?.toString() || null;
            if (filterMemberId === 'self' && memberId) return;
            if (filterMemberId && filterMemberId !== 'self' && memberId !== filterMemberId) return;

            const doc = doctorMap[a.doctor.toString()];
            const memberName = memberId
                ? familyMap[memberId]?.fullName || 'Family'
                : accountHolderName;

            entries.push(
                buildTimelineEntry({
                    id: `appt-${a._id}`,
                    title: a.reason || `${doc?.specialty || 'Doctor'} Visit`,
                    category: inferCategoryFromText(a.reason),
                    eventDate: a.appointmentDate,
                    provider: doc?.fullName || 'Doctor',
                    notes: `${doc?.specialty || ''} consultation`.trim(),
                    memberName,
                    source: 'system',
                })
            );
        });

    visitNotes.forEach((n) => {
        const memberId = n.familyMember?.toString() || null;
        if (filterMemberId === 'self' && memberId) return;
        if (filterMemberId && filterMemberId !== 'self' && memberId !== filterMemberId) return;

        const doc = doctorMap[n.doctor.toString()];
        const memberName = memberId
            ? familyMap[memberId]?.fullName || 'Family'
            : accountHolderName;

        entries.push(
            buildTimelineEntry({
                id: `note-${n._id}`,
                title: n.diagnosis || 'Medical Record',
                category: n.abnormalResult ? 'test' : inferCategoryFromText(n.diagnosis),
                eventDate: n.visitDate,
                provider: doc?.fullName || 'Doctor',
                notes: n.notes,
                memberName,
                source: 'system',
            })
        );
    });

    const deduped = [];
    const seen = new Set();
    entries
        .sort((a, b) => b.eventDate - a.eventDate)
        .forEach((e) => {
            const key = `${e.title}-${e.fullDate}-${e.memberName}`;
            if (seen.has(key)) return;
            seen.add(key);
            deduped.push(e);
        });

    return {
        timeline: deduped,
        timelineByYear: groupTimelineByYear(deduped),
        totalEvents: deduped.length,
    };
}

module.exports = {
    buildMedicalTimeline,
    inferCategoryFromText,
    CATEGORY_ICONS,
};

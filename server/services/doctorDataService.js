const { User, Patient, Doctor, Appointment, Payment, VisitNote, FamilyMember } = require('../models');
const { rankPatients } = require('../utils/patientPriority');
const { optimizeSchedule } = require('../utils/scheduleOptimizer');

function avatarUrl(name, size = 128) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Doctor')}&background=2563eb&color=fff&size=${size}`;
}

function calcAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function formatDateLabel(d) {
    if (!d) return '';
    const date = new Date(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const apptDay = new Date(date);
    apptDay.setHours(0, 0, 0, 0);
    if (apptDay.getTime() === today.getTime()) return 'Today';
    if (apptDay.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeAgo(d) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    return formatDateLabel(d);
}

function isSameDay(a, b) {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

function mapAppointmentRow(appt, patientUser, familyMember) {
    const status =
        appt.status === 'confirmed' ? 'confirmed' : appt.status;
    const displayStatus =
        appt.status === 'confirmed' ? 'upcoming' : appt.status;

    const displayName = familyMember
        ? `${patientUser?.fullName || 'Patient'} (for ${familyMember.fullName})`
        : patientUser?.fullName || 'Patient';

    return {
        id: appt._id.toString(),
        patient: displayName,
        patientShort: familyMember?.fullName || patientUser?.fullName || 'Patient',
        accountHolder: patientUser?.fullName || 'Patient',
        patientId: appt.patient.toString(),
        age: patientUser?.age ?? null,
        avatar: avatarUrl(familyMember?.fullName || patientUser?.fullName, 64),
        date: formatDateLabel(appt.appointmentDate),
        appointmentDate: appt.appointmentDate,
        time: appt.timeSlot,
        reason: appt.reason || 'Consultation',
        status: appt.status,
        displayStatus,
        price: appt.fee,
        familyMemberName: familyMember?.fullName || null,
    };
}

function buildEarningsPeriod(payments, appointments, period) {
    const now = new Date();
    let start;
    let subtitle;

    if (period === 'daily') {
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        subtitle = `Today — ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    } else if (period === 'weekly') {
        start = new Date(now);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        subtitle = `This Week — ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        subtitle = `This Month — ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }

    const periodPayments = payments.filter(
        (p) => p.type === 'payment' && p.status === 'success' && new Date(p.createdAt) >= start
    );
    const periodAppts = appointments.filter((a) => new Date(a.appointmentDate) >= start);

    const total = periodPayments.reduce((s, p) => s + p.amount, 0);
    const sessions = periodAppts.filter((a) => a.status === 'completed').length;
    const cancelled = periodAppts.filter((a) => a.status === 'cancelled').length;
    const avg = sessions > 0 ? Math.round(total / sessions) : 0;

    let bars = [];
    if (period === 'daily') {
        const slots = [...new Set(periodAppts.map((a) => a.timeSlot))].slice(0, 8);
        if (!slots.length) slots.push('9:00 AM', '12:00 PM', '3:00 PM');
        bars = slots.map((label) => {
            const match = periodAppts.find((a) => a.timeSlot === label);
            if (!match) return { label, val: 0, cancelled: false };
            return {
                label,
                val: match.status === 'cancelled' ? 0 : match.fee,
                cancelled: match.status === 'cancelled',
            };
        });
    } else if (period === 'weekly') {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        bars = days.map((label, i) => {
            const dayStart = new Date(start);
            dayStart.setDate(start.getDate() + i);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);
            const val = periodPayments
                .filter((p) => {
                    const d = new Date(p.createdAt);
                    return d >= dayStart && d <= dayEnd;
                })
                .reduce((s, p) => s + p.amount, 0);
            return { label, val, cancelled: false };
        });
    } else {
        const weeks = ['W1', 'W2', 'W3', 'W4'];
        bars = weeks.map((label, i) => {
            const wStart = new Date(start);
            wStart.setDate(1 + i * 7);
            const wEnd = new Date(wStart);
            wEnd.setDate(wStart.getDate() + 6);
            wEnd.setHours(23, 59, 59, 999);
            const val = periodPayments
                .filter((p) => {
                    const d = new Date(p.createdAt);
                    return d >= wStart && d <= wEnd;
                })
                .reduce((s, p) => s + p.amount, 0);
            return { label, val, cancelled: false };
        });
    }

    const transactions = periodPayments.slice(0, 10).map((p) => {
        const patientName = p.patientName || 'Patient';
        return {
            name: patientName,
            type: 'Completed',
            amount: `+${p.amount.toLocaleString('en-EG')} EGP`,
            date: formatDateLabel(p.createdAt) + (p.timeSlot ? `, ${p.timeSlot}` : ''),
            icon: 'fa-check-circle',
            positive: true,
            avatar: avatarUrl(patientName, 64),
        };
    });

    return {
        total: `${total.toLocaleString('en-EG')} EGP`,
        sessions,
        cancelled,
        avg: `${avg.toLocaleString('en-EG')} EGP`,
        bars,
        subtitle,
        transactions,
    };
}

function buildNotifications(appointments, payments, profile, patientMap) {
    const notifs = [];

    appointments
        .filter((a) => a.status === 'pending')
        .slice(0, 5)
        .forEach((a) => {
            const p = patientMap[a.patient.toString()];
            notifs.push({
                id: `appt-pending-${a._id}`,
                type: 'booking',
                title: 'New Appointment Request',
                body: `${p?.fullName || 'A patient'} requested a consultation on ${formatDateLabel(a.appointmentDate)} at ${a.timeSlot}. Reason: ${a.reason || 'Consultation'}.`,
                time: timeAgo(a.createdAt),
                color: 'blue',
                icon: 'fa-calendar-plus',
                read: false,
                createdAt: a.createdAt,
            });
        });

    appointments
        .filter((a) => a.status === 'cancelled')
        .slice(0, 3)
        .forEach((a) => {
            const p = patientMap[a.patient.toString()];
            notifs.push({
                id: `appt-cancel-${a._id}`,
                type: 'cancellation',
                title: 'Appointment Cancelled',
                body: `${p?.fullName || 'Patient'} cancelled the appointment on ${formatDateLabel(a.appointmentDate)} at ${a.timeSlot}.`,
                time: timeAgo(a.updatedAt || a.createdAt),
                color: 'red',
                icon: 'fa-calendar-times',
                read: true,
                createdAt: a.updatedAt || a.createdAt,
            });
        });

    payments
        .filter((p) => p.type === 'payment' && p.status === 'success')
        .slice(0, 3)
        .forEach((p) => {
            notifs.push({
                id: `pay-${p._id}`,
                type: 'payment',
                title: 'Payment Received',
                body: `Payment of ${p.amount} EGP received from ${p.patientName || 'patient'}.`,
                time: timeAgo(p.createdAt),
                color: 'green',
                icon: 'fa-check-circle',
                read: true,
                createdAt: p.createdAt,
            });
        });

    (profile?.documents || [])
        .filter((d) => d.status === 'pending')
        .forEach((d) => {
            notifs.push({
                id: `doc-${d.name}`,
                type: 'reminder',
                title: 'Document Review Pending',
                body: `Your ${d.name} is currently under review by the verification team.`,
                time: '2 days ago',
                color: 'amber',
                icon: 'fa-file-alt',
                read: true,
                createdAt: new Date(0),
            });
        });

    return notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getDoctorDashboardData(doctorUserId) {
    const user = await User.findById(doctorUserId).lean();
    const profile = await Doctor.findOne({ user: doctorUserId }).lean();
    if (!user || !profile) {
        throw new Error('Doctor profile not found');
    }

    const [appointments, payments, visitNotes] = await Promise.all([
        Appointment.find({ doctor: doctorUserId }).sort({ appointmentDate: 1, createdAt: -1 }).lean(),
        Payment.find({ doctor: doctorUserId, type: 'payment' }).sort({ createdAt: -1 }).lean(),
        VisitNote.find({ doctor: doctorUserId }).sort({ visitDate: -1 }).lean(),
    ]);

    const patientIds = [...new Set(appointments.map((a) => a.patient.toString()))];
    const [patientUsers, patientProfiles] = await Promise.all([
        User.find({ _id: { $in: patientIds } }).lean(),
        Patient.find({ user: { $in: patientIds } }).lean(),
    ]);

    const patientMap = {};
    patientUsers.forEach((u) => {
        const prof = patientProfiles.find((p) => p.user.toString() === u._id.toString());
        patientMap[u._id.toString()] = {
            ...u,
            age: calcAge(prof?.dateOfBirth),
            gender: prof?.gender || '',
            bloodType: prof?.bloodType || '',
            primaryCondition: prof?.primaryCondition || 'General',
            phone: prof?.phone || '',
        };
    });

    const familyMemberIds = [
        ...new Set(appointments.filter((a) => a.familyMember).map((a) => a.familyMember.toString())),
    ];
    const familyMembers = familyMemberIds.length
        ? await FamilyMember.find({ _id: { $in: familyMemberIds } }).lean()
        : [];
    const familyMap = Object.fromEntries(familyMembers.map((f) => [f._id.toString(), f]));

    payments.forEach((p) => {
        p.patientName = patientMap[p.patient.toString()]?.fullName;
        const appt = appointments.find((a) => a._id.toString() === p.appointment?.toString());
        p.timeSlot = appt?.timeSlot;
    });

    const mappedAppts = appointments.map((a) => {
        const fm = a.familyMember ? familyMap[a.familyMember.toString()] : null;
        return mapAppointmentRow(a, patientMap[a.patient.toString()], fm);
    });

    const now = new Date();
    const todayAppts = mappedAppts.filter((a) => isSameDay(a.appointmentDate, now));

    const todayPayments = payments.filter(
        (p) => p.status === 'success' && isSameDay(p.createdAt, now)
    );
    let todayEarnings = todayPayments.reduce((s, p) => s + p.amount, 0);
    if (!todayEarnings) {
        todayEarnings = todayAppts
            .filter((a) => a.status === 'confirmed' || a.status === 'completed')
            .reduce((s, a) => s + (a.price || 0), 0);
    }

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newPatientsWeek = patientIds.filter((pid) => {
        const first = appointments.find((a) => a.patient.toString() === pid);
        return first && new Date(first.createdAt) >= weekAgo;
    }).length;

    const apptCounts = {
        pending: mappedAppts.filter((a) => a.status === 'pending').length,
        upcoming: mappedAppts.filter((a) => a.status === 'confirmed').length,
        completed: mappedAppts.filter((a) => a.status === 'completed').length,
        cancelled: mappedAppts.filter((a) => a.status === 'cancelled').length,
    };

    const patients = patientIds.map((pid) => {
        const pu = patientMap[pid];
        const pAppts = appointments.filter((a) => a.patient.toString() === pid);
        const pNotes = visitNotes.filter((n) => n.patient.toString() === pid);
        const latestNote = pNotes[0];
        return {
            id: pid,
            name: pu?.fullName || 'Patient',
            age: pu?.age,
            gender: pu?.gender || '',
            phone: pu?.phone || '',
            visits: pAppts.length,
            lastVisit: pAppts[0]
                ? new Date(pAppts[0].appointmentDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                  })
                : '—',
            condition: pu?.primaryCondition || latestNote?.diagnosis || 'General',
            blood: pu?.bloodType || '—',
            notes: latestNote?.notes || '',
            avatar: avatarUrl(pu?.fullName, 128),
            history: pNotes.map((n) => ({
                date: new Date(n.visitDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }),
                diagnosis: n.diagnosis,
                notes: n.notes,
            })),
        };
    });

    const notifications = buildNotifications(appointments, payments, profile, patientMap);
    const unreadNotifCount = notifications.filter((n) => !n.read).length;

    const firstName = user.fullName.replace(/^Dr\.?\s*/i, '').split(' ')[0];

    const patientPriority = rankPatients(patients, appointments, visitNotes, patientMap);
    const scheduleOptimizer = optimizeSchedule({
        todayAppointments: todayAppts,
        schedule: {
            days: profile.workingDays || [],
            duration: profile.appointmentDuration || 30,
            lunchStart: profile.lunchBreakStart || '13:00',
            lunchEnd: profile.lunchBreakEnd || '14:00',
        },
    });

    return {
        doctor: {
            name: user.fullName,
            firstName,
            email: user.email,
            specialty: profile.specialty,
            title: profile.title,
            location: profile.location,
            phone: profile.phone || '',
            bio: profile.bio || '',
            yearsExperience: profile.yearsExperience || 0,
            clinicName: profile.clinicName || '',
            clinicAddress: profile.clinicAddress || profile.location || '',
            inClinicFee: profile.inClinicFee ?? profile.consultationPrice ?? 600,
            onlineFee: profile.onlineFee ?? 400,
            verified: profile.verified,
            rating: profile.rating,
            reviewCount: profile.reviewCount,
            avatar: avatarUrl(user.fullName, 256),
            documents: profile.documents || [],
            suspended: profile.suspended,
            suspendReason: profile.suspendReason || '',
        },
        stats: {
            todayCount: todayAppts.length,
            pendingCount: apptCounts.pending,
            totalPatients: patientIds.length,
            todayEarnings,
            newPatientsWeek,
        },
        todayAppointments: todayAppts.slice(0, 6),
        recentAlerts: notifications.slice(0, 4),
        appointments: {
            pending: mappedAppts.filter((a) => a.status === 'pending'),
            upcoming: mappedAppts.filter((a) => a.status === 'confirmed'),
            completed: mappedAppts.filter((a) => a.status === 'completed'),
            cancelled: mappedAppts.filter((a) => a.status === 'cancelled'),
        },
        apptCounts,
        patients,
        schedule: {
            days: profile.workingDays || [],
            duration: profile.appointmentDuration || 30,
            lunchStart: profile.lunchBreakStart || '13:00',
            lunchEnd: profile.lunchBreakEnd || '14:00',
            blockedDates: profile.blockedDates || [],
        },
        earnings: {
            daily: buildEarningsPeriod(payments, appointments, 'daily'),
            weekly: buildEarningsPeriod(payments, appointments, 'weekly'),
            monthly: buildEarningsPeriod(payments, appointments, 'monthly'),
        },
        notifications,
        unreadNotifCount,
        patientPriority,
        scheduleOptimizer,
    };
}

module.exports = {
    avatarUrl,
    getDoctorDashboardData,
};

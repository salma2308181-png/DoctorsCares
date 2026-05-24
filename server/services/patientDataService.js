const {
    User,
    Patient,
    Doctor,
    Appointment,
    Payment,
    VisitNote,
    Announcement,
    FamilyMember,
    MedicalHistoryEntry,
} = require('../models');
const { buildMedicalTimeline } = require('../utils/medicalHistory');

function patientAvatarUrl(name, size = 128) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Patient')}&background=10b981&color=fff&size=${size}`;
}

function doctorAvatarUrl(name, size = 128) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Doctor')}&background=2563eb&color=fff&size=${size}`;
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

function isUpcoming(appt) {
    if (appt.status === 'cancelled' || appt.status === 'completed') return false;
    const d = new Date(appt.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
}

function mapPatientAppointment(appt, doctorInfo, familyMember) {
    const forName = familyMember?.fullName;
    return {
        id: appt._id.toString(),
        doctorId: appt.doctor.toString(),
        doctorName: doctorInfo?.fullName || 'Doctor',
        specialty: doctorInfo?.specialty || '',
        title: doctorInfo?.title || '',
        location: doctorInfo?.location || '',
        avatar: doctorAvatarUrl(doctorInfo?.fullName, 64),
        date: formatDateLabel(appt.appointmentDate),
        appointmentDate: appt.appointmentDate,
        time: appt.timeSlot,
        reason: appt.reason || 'Consultation',
        status: appt.status,
        fee: appt.fee,
        cancelReason: appt.cancelReason || '',
        bookedFor: forName || null,
        familyMemberId: appt.familyMember?.toString() || null,
    };
}

function buildPatientNotifications(appointments, announcements, doctorMap) {
    const notifs = [];

    appointments.forEach((a) => {
        const doc = doctorMap[a.doctor.toString()];
        const docName = doc?.fullName || 'Your doctor';

        if (a.status === 'pending') {
            notifs.push({
                id: `appt-pending-${a._id}`,
                type: 'booking',
                title: 'Appointment Request Sent',
                body: `Your request with ${docName} on ${formatDateLabel(a.appointmentDate)} at ${a.timeSlot} is awaiting confirmation.`,
                time: timeAgo(a.createdAt),
                color: 'amber',
                icon: 'fa-clock',
                read: false,
                createdAt: a.createdAt,
            });
        } else if (a.status === 'confirmed') {
            notifs.push({
                id: `appt-conf-${a._id}`,
                type: 'booking',
                title: 'Appointment Confirmed',
                body: `${docName} confirmed your visit on ${formatDateLabel(a.appointmentDate)} at ${a.timeSlot}.`,
                time: timeAgo(a.updatedAt || a.createdAt),
                color: 'blue',
                icon: 'fa-calendar-check',
                read: false,
                createdAt: a.updatedAt || a.createdAt,
            });
        } else if (a.status === 'cancelled') {
            notifs.push({
                id: `appt-cancel-${a._id}`,
                type: 'cancellation',
                title: 'Appointment Cancelled',
                body: `Your appointment with ${docName} on ${formatDateLabel(a.appointmentDate)} was cancelled.${a.cancelReason ? ' Reason: ' + a.cancelReason : ''}`,
                time: timeAgo(a.updatedAt || a.createdAt),
                color: 'red',
                icon: 'fa-calendar-times',
                read: true,
                createdAt: a.updatedAt || a.createdAt,
            });
        } else if (a.status === 'completed') {
            notifs.push({
                id: `appt-done-${a._id}`,
                type: 'records',
                title: 'Visit Completed',
                body: `Your consultation with ${docName} is complete. Health records are available.`,
                time: timeAgo(a.updatedAt || a.createdAt),
                color: 'green',
                icon: 'fa-file-medical',
                read: true,
                createdAt: a.updatedAt || a.createdAt,
            });
        }
    });

    announcements.forEach((ann) => {
        notifs.push({
            id: `ann-${ann._id}`,
            type: 'system',
            title: ann.title,
            body: ann.body,
            time: timeAgo(ann.createdAt),
            color: 'blue',
            icon: 'fa-bullhorn',
            read: true,
            createdAt: ann.createdAt,
        });
    });

    return notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getPatientDashboardData(patientUserId, options = {}) {
    const { activeFamilyMemberId = null } = options;
    const user = await User.findById(patientUserId).lean();
    const profile = await Patient.findOne({ user: patientUserId }).lean();
    if (!user) throw new Error('Patient not found');

    const [appointments, visitNotes, announcements, bookableDoctors, familyMembers, manualHistory] =
        await Promise.all([
        Appointment.find({ patient: patientUserId }).sort({ appointmentDate: -1, createdAt: -1 }).lean(),
        VisitNote.find({ patient: patientUserId }).sort({ visitDate: -1 }).lean(),
        Announcement.find({
            status: 'sent',
            audience: { $in: ['all', 'patients'] },
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(),
        Doctor.find({ verified: true, suspended: { $ne: true } })
            .populate('user', 'fullName email isActive')
            .lean(),
        FamilyMember.find({ accountHolder: patientUserId }).sort({ createdAt: 1 }).lean(),
        MedicalHistoryEntry.find({ accountHolder: patientUserId }).sort({ eventDate: -1 }).lean(),
    ]);

    const familyMap = Object.fromEntries(
        familyMembers.map((f) => [f._id.toString(), f])
    );

    const familyList = familyMembers.map((f) => ({
        id: f._id.toString(),
        fullName: f.fullName,
        relationship: f.relationship,
        relationshipLabel: f.relationship.charAt(0).toUpperCase() + f.relationship.slice(1),
        gender: f.gender || '',
        bloodType: f.bloodType || '',
        primaryCondition: f.primaryCondition || '',
        dateOfBirth: f.dateOfBirth,
        avatar: patientAvatarUrl(f.fullName, 128),
    }));

    const activeMember =
        activeFamilyMemberId && activeFamilyMemberId !== 'self'
            ? familyList.find((f) => f.id === activeFamilyMemberId)
            : null;

    const doctorIds = [...new Set(appointments.map((a) => a.doctor.toString()))];
    const doctorUsers = await User.find({ _id: { $in: doctorIds } }).lean();
    const doctorProfiles = await Doctor.find({ user: { $in: doctorIds } }).lean();

    const doctorMap = {};
    doctorUsers.forEach((u) => {
        const prof = doctorProfiles.find((d) => d.user.toString() === u._id.toString());
        doctorMap[u._id.toString()] = {
            fullName: u.fullName,
            specialty: prof?.specialty,
            title: prof?.title,
            location: prof?.location,
            rating: prof?.rating,
            reviewCount: prof?.reviewCount,
            consultationPrice: prof?.consultationPrice,
        };
    });

    const mappedAppts = appointments.map((a) => {
        const fm = a.familyMember ? familyMap[a.familyMember.toString()] : null;
        return mapPatientAppointment(a, doctorMap[a.doctor.toString()], fm);
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const upcoming = mappedAppts.filter(
        (a) =>
            (a.status === 'pending' || a.status === 'confirmed') &&
            new Date(a.appointmentDate) >= todayStart
    );
    const past = mappedAppts.filter((a) => a.status === 'completed');
    const cancelled = mappedAppts.filter((a) => a.status === 'cancelled');
    const pending = mappedAppts.filter((a) => a.status === 'pending');

    const doctorIdsVisited = new Set(
        appointments.filter((a) => a.status === 'completed' || a.status === 'confirmed').map((a) => a.doctor.toString())
    );

    const myDoctors = [...doctorIdsVisited].map((did) => {
        const info = doctorMap[did];
        const docAppts = appointments.filter((a) => a.doctor.toString() === did);
        const lastAppt = docAppts[0];
        return {
            id: did,
            name: info?.fullName || 'Doctor',
            specialty: info?.specialty || '',
            title: info?.title || '',
            location: info?.location || '',
            rating: info?.rating ?? 5,
            reviewCount: info?.reviewCount ?? 0,
            avatar: doctorAvatarUrl(info?.fullName, 128),
            visits: docAppts.length,
            lastVisit: lastAppt ? formatDateLabel(lastAppt.appointmentDate) : '—',
        };
    });

    const healthRecords = visitNotes.map((n) => {
        const doc = doctorMap[n.doctor.toString()];
        return {
            id: n._id.toString(),
            doctorName: doc?.fullName || 'Doctor',
            specialty: doc?.specialty || '',
            diagnosis: n.diagnosis,
            notes: n.notes,
            date: new Date(n.visitDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
            avatar: doctorAvatarUrl(doc?.fullName, 64),
        };
    });

    const notifications = buildPatientNotifications(appointments, announcements, doctorMap);
    const unreadNotifCount = notifications.filter((n) => !n.read).length;

    const firstName = user.fullName.split(' ')[0];

    const availableDoctors = bookableDoctors
        .filter((d) => d.user?.isActive !== false)
        .map((d) => ({
            id: d.user._id.toString(),
            name: d.user.fullName,
            specialty: d.specialty,
            title: d.title,
            location: d.location,
            fee: d.consultationPrice || d.inClinicFee || 600,
            rating: d.rating,
        }));

    const filterForTimeline = 'self';

    const syncedApptIds = new Set(
        manualHistory.filter((e) => e.appointment).map((e) => e.appointment.toString())
    );
    const syncedNoteIds = new Set(
        manualHistory.filter((e) => e.visitNote).map((e) => e.visitNote.toString())
    );
    const timelineAppointments = appointments.filter((a) => !syncedApptIds.has(a._id.toString()));
    const timelineVisitNotes = visitNotes.filter((n) => !syncedNoteIds.has(n._id.toString()));

    const medicalHistory = buildMedicalTimeline({
        manualEntries: manualHistory,
        appointments: timelineAppointments,
        visitNotes: timelineVisitNotes,
        doctorMap,
        familyMap,
        accountHolderName: user.fullName,
        filterMemberId: filterForTimeline,
    });

    return {
        patient: {
            name: user.fullName,
            firstName,
            email: user.email,
            phone: profile?.phone || '',
            gender: profile?.gender || '',
            dateOfBirth: profile?.dateOfBirth,
            bloodType: profile?.bloodType || '',
            primaryCondition: profile?.primaryCondition || '',
            avatar: patientAvatarUrl(user.fullName, 256),
        },
        stats: {
            upcomingCount: upcoming.length,
            doctorsVisited: doctorIdsVisited.size,
            recordsCount: healthRecords.length,
            pendingCount: pending.length,
        },
        upcomingAppointments: upcoming.slice(0, 5),
        appointments: { upcoming, past, cancelled, pending },
        apptCounts: {
            upcoming: upcoming.length,
            past: past.length,
            cancelled: cancelled.length,
            pending: pending.length,
        },
        healthRecords,
        myDoctors,
        notifications,
        unreadNotifCount,
        availableDoctors,
        familyMembers: familyList,
        activeFamilyMember: activeMember,
        activeFamilyMemberId: activeFamilyMemberId || 'self',
        medicalHistory,
    };
}

module.exports = {
    patientAvatarUrl,
    getPatientDashboardData,
};

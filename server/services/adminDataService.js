const {
    User,
    Patient,
    Doctor,
    Appointment,
    Payment,
    Specialty,
    City,
    Announcement,
    SystemSetting,
} = require('../models');

const COMMISSION_RATE = 0.15;

function formatDate(d) {
    return new Date(d).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(d) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

async function getSetting(key, fallback) {
    const row = await SystemSetting.findOne({ key }).lean();
    return row ? row.value : fallback;
}

function toDoctorRow(doc, apptCountMap) {
    const u = doc.user;
    if (!u || !u._id) return null;
    return {
        userId: u._id.toString(),
        name: u.fullName,
        email: u.email,
        specialty: doc.specialty,
        location: doc.location,
        title: doc.title,
        rating: doc.rating,
        reviewCount: doc.reviewCount,
        appointments: apptCountMap[u._id.toString()] || 0,
        verified: doc.verified,
        suspended: doc.suspended,
        suspendReason: doc.suspendReason || 'Policy Violation',
        featured: doc.featured,
        documentsComplete: doc.documentsComplete,
        consultationPrice: doc.consultationPrice,
        submitted: doc.createdAt,
        isActive: u.isActive,
    };
}

async function getAdminDashboardData() {
    const [
        patientUsers,
        doctorUsers,
        allDoctors,
        appointments,
        payments,
        specialties,
        cities,
        announcements,
    ] = await Promise.all([
        User.find({ role: 'patient' }).sort({ createdAt: -1 }).lean(),
        User.find({ role: 'doctor' }).sort({ createdAt: -1 }).lean(),
        Doctor.find().populate('user', 'fullName email isActive createdAt').lean(),
        Appointment.find().sort({ createdAt: -1 }).limit(100).lean(),
        Payment.find().sort({ createdAt: -1 }).limit(50).lean(),
        Specialty.find().sort({ name: 1 }).lean(),
        City.find().sort({ name: 1 }).lean(),
        Announcement.find().sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    const userIds = [...new Set([
        ...appointments.flatMap((a) => [a.patient, a.doctor]),
        ...payments.flatMap((p) => [p.patient, p.doctor]),
    ])];
    const relatedUsers = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = Object.fromEntries(relatedUsers.map((u) => [u._id.toString(), u]));

    const apptCounts = await Appointment.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: '$doctor', count: { $sum: 1 } } },
    ]);
    const apptCountMap = Object.fromEntries(apptCounts.map((a) => [a._id.toString(), a.count]));
    const docByUser = Object.fromEntries(allDoctors.map((d) => [d.user._id.toString(), d]));

    const pendingList = allDoctors
        .filter((d) => !d.verified && !d.suspended)
        .map((d) => toDoctorRow(d, apptCountMap))
        .filter(Boolean);

    const activeDoctors = allDoctors.filter((d) => d.verified && !d.suspended);
    const activeList = activeDoctors.map((d) => toDoctorRow(d, apptCountMap)).filter(Boolean);

    const suspendedList = allDoctors
        .filter((d) => d.suspended)
        .map((d) => toDoctorRow(d, apptCountMap))
        .filter(Boolean);

    const patientProfiles = await Patient.find({
        user: { $in: patientUsers.map((p) => p._id) },
    }).lean();
    const profileByUser = Object.fromEntries(patientProfiles.map((p) => [p.user.toString(), p]));

    const patients = patientUsers.map((u) => ({
        id: u._id.toString(),
        name: u.fullName,
        email: u.email,
        phone: profileByUser[u._id.toString()]?.phone || '—',
        joined: u.createdAt,
        isActive: u.isActive,
    }));

    const doctorsForPromote = doctorUsers.map((u) => ({
        id: u._id.toString(),
        name: u.fullName,
        email: u.email,
    }));

    const apptList = appointments.map((a) => ({
        id: a._id.toString(),
        code: a._id.toString().slice(-6).toUpperCase(),
        patientName: userMap[a.patient.toString()]?.fullName || 'Unknown',
        doctorName: userMap[a.doctor.toString()]?.fullName || 'Unknown',
        date: formatDate(a.appointmentDate),
        time: a.timeSlot,
        fee: a.fee,
        status: a.status,
        flagged: a.flagged,
    }));

    const apptStats = {
        confirmed: await Appointment.countDocuments({ status: 'confirmed' }),
        pending: await Appointment.countDocuments({ status: 'pending' }),
        cancelled: await Appointment.countDocuments({ status: 'cancelled' }),
        flagged: await Appointment.countDocuments({ flagged: true }),
    };

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [monthlyPaymentRows, refundPendingRows] = await Promise.all([
        Payment.find({
            type: 'payment',
            status: 'success',
            createdAt: { $gte: startOfMonth },
        }).lean(),
        Payment.find({ type: 'refund', status: 'pending' }).lean(),
    ]);

    const monthlyRevenue = monthlyPaymentRows.reduce((sum, p) => sum + p.amount, 0);
    const refundPending = refundPendingRows;

    const transactions = payments.map((p) => ({
        id: p._id.toString().slice(-8).toUpperCase(),
        patientName: userMap[p.patient.toString()]?.fullName || '—',
        doctorName: userMap[p.doctor.toString()]?.fullName || '—',
        amount: p.amount,
        commission: p.commission,
        type: p.type,
        status: p.status,
        date: formatDate(p.createdAt),
    }));

    const refundRequests = await Payment.find({ type: 'refund', status: 'pending' })
        .sort({ createdAt: -1 })
        .lean();
    const refunds = refundRequests.map((p) => {
        const appt = appointments.find((a) => a._id.toString() === p.appointment?.toString());
        return {
            id: p._id.toString(),
            bookingCode: appt ? appt._id.toString().slice(-6).toUpperCase() : '—',
            patientName: userMap[p.patient.toString()]?.fullName || '—',
            doctorName: userMap[p.doctor.toString()]?.fullName || '—',
            amount: p.amount,
            reason: p.refundReason,
            date: formatDate(p.createdAt),
        };
    });

    const specialtyCounts = await Doctor.aggregate([
        { $match: { verified: true, suspended: false } },
        { $group: { _id: '$specialty', count: { $sum: 1 } } },
    ]);
    const specCountMap = Object.fromEntries(specialtyCounts.map((s) => [s._id, s.count]));

    const specialtiesList = specialties.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        icon: s.icon,
        iconBg: s.iconBg,
        iconColor: s.iconColor,
        doctorCount: specCountMap[s.name] || 0,
    }));

    const citiesList = await Promise.all(
        cities.map(async (c) => {
            const doctorsInCity = await Doctor.find({
                location: new RegExp(c.name, 'i'),
                verified: true,
                suspended: false,
            })
                .select('user')
                .lean();
            const doctorIds = doctorsInCity.map((d) => d.user);
            const doctorCount = doctorsInCity.length;
            const patientIds = doctorIds.length
                ? await Appointment.distinct('patient', { doctor: { $in: doctorIds } })
                : [];
            return {
                id: c._id.toString(),
                name: c.name,
                doctorCount,
                patientCount: patientIds.length,
            };
        })
    );

    const featuredDoctors = activeDoctors
        .filter((d) => d.featured)
        .map((d) => ({
            userId: d.user._id.toString(),
            name: d.user.fullName,
            specialty: d.specialty,
            location: d.location,
        }));

    const topDoctors = await Appointment.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: '$doctor', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
    ]);
    const topDoctorList = topDoctors.map((t, i) => {
        const u = userMap[t._id.toString()] || doctorUsers.find((d) => d._id.toString() === t._id.toString());
        const doc = docByUser[t._id.toString()];
        return {
            rank: i + 1,
            name: u?.fullName || 'Doctor',
            specialty: doc?.specialty || '—',
            appointments: t.count,
            rating: doc?.rating || 5,
        };
    });

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekAppts = await Appointment.find({
        createdAt: { $gte: weekStart },
    }).lean();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyBookings = dayNames.map((label, i) => {
        const count = weekAppts.filter((a) => new Date(a.createdAt).getDay() === i).length;
        return { label, count, height: Math.min(100, Math.max(10, count * 15)) };
    });

    const recentActivity = [];
    for (const a of appointments.slice(0, 5)) {
        recentActivity.push({
            type: 'booking',
            text: `<strong>${userMap[a.patient.toString()]?.fullName}</strong> booked with ${userMap[a.doctor.toString()]?.fullName}`,
            time: timeAgo(a.createdAt),
            badge: a.status === 'confirmed' ? 'Confirmed' : a.status,
            badgeClass: a.status === 'confirmed' ? 'badge-success' : 'badge-pending',
        });
    }
    for (const d of pendingList.slice(0, 2)) {
        recentActivity.push({
            type: 'doctor',
            text: `<strong>${d.name}</strong> awaiting doctor approval`,
            time: timeAgo(d.submitted),
            badge: 'Pending',
            badgeClass: 'badge-pending',
        });
    }

    const commissionPercent = await getSetting('commissionPercent', 15);
    const minBookingFee = await getSetting('minBookingFee', 100);
    const refundWindowHours = await getSetting('refundWindowHours', 24);

    const newDoctorsMonth = await User.countDocuments({ role: 'doctor', createdAt: { $gte: startOfMonth } });
    const newPatientsMonth = await User.countDocuments({ role: 'patient', createdAt: { $gte: startOfMonth } });

    const totalBookings = await Appointment.countDocuments();
    const cancelledCount = await Appointment.countDocuments({ status: 'cancelled' });
    const completionRate = totalBookings
        ? Math.round(((totalBookings - cancelledCount) / totalBookings) * 100)
        : 0;

    const unreadAnnouncements = await Announcement.countDocuments({ status: 'sent' });

    return {
        stats: {
            totalDoctors: activeDoctors.length,
            totalPatients: patientUsers.filter((p) => p.isActive).length,
            totalBookings,
            monthlyRevenue,
            pendingDoctors: pendingList.length,
            pendingRefunds: refundPending.length,
            unreadNotifications: unreadAnnouncements,
        },
        pendingDoctors: pendingList,
        pendingDoctorsCount: pendingList.length,
        activeDoctors: activeList,
        suspendedDoctors: suspendedList,
        patients,
        doctors: doctorsForPromote,
        appointments: apptList,
        apptStats,
        flaggedCount: apptStats.flagged,
        payments: {
            monthlyRevenue,
            commission: Math.round(monthlyRevenue * (commissionPercent / 100)),
            pendingRefunds: refundPending.reduce((s, p) => s + p.amount, 0),
            refundCount: refundPending.length,
            commissionPercent,
        },
        transactions,
        refunds,
        specialties: specialtiesList,
        cities: citiesList,
        featuredDoctors,
        topDoctors: topDoctorList,
        weeklyBookings,
        recentActivity,
        announcements: announcements.map((a) => ({
            id: a._id.toString(),
            title: a.title,
            body: a.body,
            audience: a.audience,
            channel: a.channel,
            status: a.status,
            date: formatDate(a.createdAt),
        })),
        settings: {
            commissionPercent,
            minBookingFee,
            refundWindowHours,
        },
        reports: {
            newDoctorsMonth,
            newPatientsMonth,
            completionRate,
            cancellationRate: totalBookings ? Math.round((cancelledCount / totalBookings) * 1000) / 10 : 0,
            specialtyBreakdown: specialtyCounts.slice(0, 5).map((s) => ({
                name: s._id,
                percent: activeDoctors.length ? Math.round((s.count / activeDoctors.length) * 100) : 0,
            })),
        },
    };
}

module.exports = { getAdminDashboardData, COMMISSION_RATE };

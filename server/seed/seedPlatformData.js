const {
    User,
    Doctor,
    Patient,
    Appointment,
    Payment,
    Specialty,
    City,
    Announcement,
    SystemSetting,
} = require('../models');

const DEFAULT_SPECIALTIES = [
    { name: 'Cardiology', slug: 'cardiology', icon: 'fa-heartbeat', iconBg: '#dbeafe', iconColor: '#2563eb' },
    { name: 'Dermatology', slug: 'dermatology', icon: 'fa-allergies', iconBg: '#fce7f3', iconColor: '#db2777' },
    { name: 'Pediatrics', slug: 'pediatrics', icon: 'fa-baby', iconBg: '#d1fae5', iconColor: '#059669' },
    { name: 'Orthopedics', slug: 'orthopedics', icon: 'fa-bone', iconBg: '#fef3c7', iconColor: '#d97706' },
    { name: 'Neurology', slug: 'neurology', icon: 'fa-brain', iconBg: '#ede9fe', iconColor: '#7c3aed' },
    { name: 'Ophthalmology', slug: 'ophthalmology', icon: 'fa-eye', iconBg: '#e0f2fe', iconColor: '#0284c7' },
];

const DEFAULT_CITIES = ['Cairo', 'Alexandria', 'Giza', 'Mansoura'];

async function seedPlatformData() {
    if (await Specialty.countDocuments()) {
        console.log('Platform data already seeded.');
        return;
    }

    console.log('Seeding platform data...');

    for (const s of DEFAULT_SPECIALTIES) {
        await Specialty.create(s);
    }
    for (const name of DEFAULT_CITIES) {
        await City.create({ name, slug: name.toLowerCase() });
    }

    await SystemSetting.insertMany([
        { key: 'commissionPercent', value: 15 },
        { key: 'minBookingFee', value: 100 },
        { key: 'refundWindowHours', value: 24 },
    ]);

    const doctorUser = await User.findOne({ email: 'doctor@doctorscares.eg' });
    const patientUser = await User.findOne({ email: 'patient@doctorscares.eg' });

    if (doctorUser) {
        await Doctor.findOneAndUpdate(
            { user: doctorUser._id },
            { featured: true, verified: true, rating: 4.9, reviewCount: 240 },
            { upsert: false }
        );
    }

    const pendingDoctors = [
        { email: 'yasmine@doctorscares.eg', name: 'Dr. Yasmine El-Sayed', specialty: 'Dermatology', location: 'Cairo, Maadi' },
        { email: 'omar.f@doctorscares.eg', name: 'Dr. Omar Farouk', specialty: 'Cardiology', location: 'Alexandria' },
    ];

    for (const p of pendingDoctors) {
        const exists = await User.findOne({ email: p.email });
        if (exists) continue;
        const u = await User.create({
            email: p.email,
            password: 'pending123',
            fullName: p.name,
            role: 'doctor',
        });
        await Doctor.create({
            user: u._id,
            specialty: p.specialty,
            location: p.location,
            verified: false,
            documentsComplete: true,
        });
    }

    if (doctorUser && patientUser) {
        const dates = [0, 1, 2, 3].map((d) => {
            const dt = new Date();
            dt.setDate(dt.getDate() + d);
            return dt;
        });

        for (let i = 0; i < dates.length; i++) {
            const appt = await Appointment.create({
                patient: patientUser._id,
                doctor: doctorUser._id,
                appointmentDate: dates[i],
                timeSlot: ['9:00 AM', '11:00 AM', '2:00 PM', '10:00 AM'][i],
                reason: 'Consultation',
                fee: 600,
                status: i === 0 ? 'pending' : 'confirmed',
                flagged: i === 0,
            });

            await Payment.create({
                appointment: appt._id,
                patient: patientUser._id,
                doctor: doctorUser._id,
                amount: 600,
                commission: 90,
                type: 'payment',
                status: 'success',
            });
        }

        await Payment.create({
            patient: patientUser._id,
            doctor: doctorUser._id,
            amount: 350,
            commission: 0,
            type: 'refund',
            status: 'pending',
            refundReason: 'Appointment missed by doctor',
        });
    }

    await Announcement.create({
        title: 'System Maintenance',
        body: 'Scheduled maintenance this Sunday 2–4 AM. Booking remains available.',
        audience: 'all',
        channel: 'in-app',
        status: 'sent',
    });

    console.log('Platform data seeded.');
}

module.exports = seedPlatformData;

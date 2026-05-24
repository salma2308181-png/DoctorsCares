const { User, Patient, Doctor, Appointment, Payment, VisitNote } = require('../models');

async function seedDoctorData() {
    const doctorUser = await User.findOne({ email: 'doctor@doctorscares.eg' });
    const patientUser = await User.findOne({ email: 'patient@doctorscares.eg' });
    if (!doctorUser || !patientUser) return;

    await Doctor.findOneAndUpdate(
        { user: doctorUser._id },
        {
            bio: 'Board-certified cardiologist with extensive experience in interventional cardiology and heart failure management.',
            yearsExperience: 18,
            clinicName: 'Heart & Care Medical Center',
            clinicAddress: '90th Street, New Cairo, Cairo',
            inClinicFee: 600,
            onlineFee: 400,
            consultationPrice: 600,
        }
    );

    await Patient.findOneAndUpdate(
        { user: patientUser._id },
        {
            bloodType: 'O+',
            primaryCondition: 'Hypertension',
            phone: '01000000002',
        }
    );

    const extraPatients = [
        { email: 'rana.patient@doctorscares.eg', name: 'Rana Mostafa', gender: 'Female', condition: 'Hypertension', blood: 'A+' },
        { email: 'khaled.patient@doctorscares.eg', name: 'Khaled Ibrahim', gender: 'Male', condition: 'Atrial Fibrillation', blood: 'B+' },
    ];

    const patientIds = [patientUser._id];

    for (const p of extraPatients) {
        let u = await User.findOne({ email: p.email });
        if (!u) {
            u = await User.create({
                email: p.email,
                password: 'patient123',
                fullName: p.name,
                role: 'patient',
            });
            await Patient.create({
                user: u._id,
                gender: p.gender,
                primaryCondition: p.condition,
                bloodType: p.blood,
                dateOfBirth: new Date('1990-01-15'),
            });
        }
        patientIds.push(u._id);
    }

    const pendingCount = await Appointment.countDocuments({
        doctor: doctorUser._id,
        status: 'pending',
    });

    if (pendingCount < 2) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await Appointment.create({
            patient: patientIds[0],
            doctor: doctorUser._id,
            appointmentDate: new Date(),
            timeSlot: '11:00 AM',
            reason: 'Follow-up on cardiac stress test results',
            fee: 600,
            status: 'pending',
        });
        await Appointment.create({
            patient: patientIds[1] || patientIds[0],
            doctor: doctorUser._id,
            appointmentDate: tomorrow,
            timeSlot: '9:30 AM',
            reason: 'Chest pain and shortness of breath',
            fee: 600,
            status: 'pending',
        });
    }

    const noteCount = await VisitNote.countDocuments({ doctor: doctorUser._id });
    if (!noteCount) {
        await VisitNote.create({
            doctor: doctorUser._id,
            patient: patientUser._id,
            diagnosis: 'Hypertension Follow-up',
            notes: 'BP stabilized. Continue current regimen.',
            visitDate: new Date(),
        });
    }
}

module.exports = seedDoctorData;

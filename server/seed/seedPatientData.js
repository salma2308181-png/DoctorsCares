const {
    User,
    Patient,
    Appointment,
    VisitNote,
    FamilyMember,
    MedicalHistoryEntry,
} = require('../models');

async function seedPatientData() {
    const patientUser = await User.findOne({ email: 'patient@doctorscares.eg' });
    const doctorUser = await User.findOne({ email: 'doctor@doctorscares.eg' });
    if (!patientUser || !doctorUser) return;

    await Patient.findOneAndUpdate(
        { user: patientUser._id },
        {
            phone: '01000000002',
            gender: 'Male',
            bloodType: 'O+',
            primaryCondition: 'Hypertension',
            dateOfBirth: new Date('1995-06-15'),
        },
        { upsert: true }
    );

    const familySeed = [
        { fullName: 'Hassan Ahmed', relationship: 'father', gender: 'Male', primaryCondition: 'Diabetes', bloodType: 'A+' },
        { fullName: 'Fatima Ahmed', relationship: 'mother', gender: 'Female', primaryCondition: 'Arthritis', bloodType: 'B+' },
        { fullName: 'Omar Ahmed', relationship: 'child', gender: 'Male', dateOfBirth: new Date('2018-03-10'), bloodType: 'O+' },
    ];

    for (const fm of familySeed) {
        const exists = await FamilyMember.findOne({
            accountHolder: patientUser._id,
            fullName: fm.fullName,
        });
        if (!exists) {
            await FamilyMember.create({ accountHolder: patientUser._id, ...fm });
        }
    }

    const historySeed = [
        { title: 'Dentist Visit', category: 'visit', eventDate: new Date('2026-01-12'), provider: 'Dr. Nadia Dental Clinic', notes: 'Routine cleaning and check-up.' },
        { title: 'Blood Test', category: 'test', eventDate: new Date('2026-02-08'), provider: 'Al Borg Lab', notes: 'Complete blood count — results normal.' },
        { title: 'Cardiology Checkup', category: 'checkup', eventDate: new Date('2026-03-15'), provider: 'Dr. Karim Cardiology', notes: 'ECG and blood pressure monitoring.' },
    ];

    for (const entry of historySeed) {
        const exists = await MedicalHistoryEntry.findOne({
            accountHolder: patientUser._id,
            title: entry.title,
            eventDate: entry.eventDate,
        });
        if (!exists) {
            await MedicalHistoryEntry.create({
                accountHolder: patientUser._id,
                source: 'manual',
                ...entry,
            });
        }
    }

    const completed = await Appointment.findOne({
        patient: patientUser._id,
        doctor: doctorUser._id,
        status: 'completed',
    });
    if (!completed) {
        const past = new Date('2026-05-10');
        const appt = await Appointment.create({
            patient: patientUser._id,
            doctor: doctorUser._id,
            appointmentDate: past,
            timeSlot: '10:00 AM',
            reason: 'Hypertension follow-up',
            fee: 600,
            status: 'completed',
        });
        const noteExists = await VisitNote.findOne({ appointment: appt._id });
        if (!noteExists) {
            await VisitNote.create({
                doctor: doctorUser._id,
                patient: patientUser._id,
                appointment: appt._id,
                diagnosis: 'Hypertension Follow-up',
                notes: 'Blood pressure stable. Continue current medication.',
                visitDate: past,
            });
        }
        const followUpExists = await MedicalHistoryEntry.findOne({
            accountHolder: patientUser._id,
            title: 'Follow-up',
            eventDate: past,
        });
        if (!followUpExists) {
            await MedicalHistoryEntry.create({
                accountHolder: patientUser._id,
                title: 'Follow-up',
                category: 'follow-up',
                eventDate: past,
                provider: 'Dr. Demo Doctor',
                notes: 'Hypertension follow-up — stable.',
                source: 'system',
                appointment: appt._id,
            });
        }
    }

    const oldAppt = await Appointment.findOne({
        patient: patientUser._id,
        status: 'completed',
        appointmentDate: { $lt: new Date('2025-01-01') },
    });
    if (!oldAppt) {
        const veryOld = new Date('2024-11-20');
        await Appointment.create({
            patient: patientUser._id,
            doctor: doctorUser._id,
            appointmentDate: veryOld,
            timeSlot: '11:00 AM',
            reason: 'General checkup',
            fee: 600,
            status: 'completed',
        });
    }

    const abnormalNote = await VisitNote.findOne({
        patient: patientUser._id,
        abnormalResult: true,
    });
    if (!abnormalNote) {
        await VisitNote.create({
            doctor: doctorUser._id,
            patient: patientUser._id,
            diagnosis: 'Elevated cholesterol — abnormal lab',
            notes: 'LDL above normal range. Diet and medication review recommended.',
            visitDate: new Date('2026-02-10'),
            abnormalResult: true,
        });
    }
}

module.exports = seedPatientData;

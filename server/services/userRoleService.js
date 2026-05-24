const { User, Patient, Doctor } = require('../models');

async function promoteUserToDoctor(userId, { specialty, title }) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found.');
    }
    if (user.role === 'admin') {
        throw new Error('Admin accounts cannot be changed to doctor.');
    }
    if (user.role === 'doctor') {
        throw new Error('This user is already a doctor.');
    }

    if (!specialty || !String(specialty).trim()) {
        throw new Error('Specialty is required to approve a doctor.');
    }

    const patientProfile = await Patient.findOne({ user: user._id });

    user.role = 'doctor';
    await user.save();

    let doctorProfile = await Doctor.findOne({ user: user._id });
    if (doctorProfile) {
        doctorProfile.specialty = specialty.trim();
        doctorProfile.title = title || 'Specialist';
        doctorProfile.phone = patientProfile?.phone || doctorProfile.phone;
        doctorProfile.gender = patientProfile?.gender || doctorProfile.gender;
        doctorProfile.verified = true;
        await doctorProfile.save();
    } else {
        await Doctor.create({
            user: user._id,
            phone: patientProfile?.phone || '',
            gender: patientProfile?.gender || '',
            specialty: specialty.trim(),
            title: title || 'Specialist',
            location: 'Cairo',
            verified: true,
        });
    }

    return user;
}

async function revertDoctorToPatient(userId) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found.');
    }
    if (user.role !== 'doctor') {
        throw new Error('Only doctors can be reverted to patient.');
    }

    user.role = 'patient';
    await user.save();

    await Doctor.findOneAndUpdate({ user: user._id }, { verified: false });

    if (!(await Patient.findOne({ user: user._id }))) {
        const doctorProfile = await Doctor.findOne({ user: user._id });
        await Patient.create({
            user: user._id,
            phone: doctorProfile?.phone || '',
            gender: doctorProfile?.gender || '',
        });
    }

    return user;
}

module.exports = {
    promoteUserToDoctor,
    revertDoctorToPatient,
};

const { User, Patient, Doctor, Admin } = require('../models');
const { dashboardPathForRole } = require('../utils/dashboardPaths');

function buildSessionUser(user, profile = null) {
    const session = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.fullName,
    };

    if (user.role === 'doctor' && profile) {
        session.specialty = profile.specialty;
        session.verified = profile.verified;
    }

    return session;
}

async function registerUser({ fullName, email, password, role, phone, gender, dateOfBirth, specialty, title }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
        throw new Error('An account with this email already exists.');
    }

    if (role !== 'patient') {
        throw new Error('Public registration is for patients only. Doctors are approved by an administrator.');
    }

    const user = await User.create({
        email: normalizedEmail,
        password,
        fullName: fullName.trim(),
        role,
    });

    await Patient.create({
        user: user._id,
        phone: phone || '',
        gender: gender || '',
        dateOfBirth: dateOfBirth || undefined,
    });

    return user;
}

async function loginUser({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, isActive: true });

    if (!user) {
        throw new Error('Invalid email or password.');
    }

    const passwordOk = await user.comparePassword(password);
    if (!passwordOk) {
        throw new Error('Invalid email or password.');
    }

    let profile = null;
    if (user.role === 'patient') {
        profile = await Patient.findOne({ user: user._id });
    } else if (user.role === 'doctor') {
        profile = await Doctor.findOne({ user: user._id });
    } else if (user.role === 'admin') {
        profile = await Admin.findOne({ user: user._id });
    }

    return { user, profile, session: buildSessionUser(user, profile) };
}

module.exports = {
    buildSessionUser,
    registerUser,
    loginUser,
    dashboardPathForRole,
};

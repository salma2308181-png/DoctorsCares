const { User, Patient, Doctor, Admin } = require('../models');

const DEMO_ACCOUNTS = [
    {
        email: 'admin@doctorscares.eg',
        password: 'admin123',
        fullName: 'Super Admin',
        role: 'admin',
        profile: { department: 'System' },
        profileModel: Admin,
    },
    {
        email: 'doctor@doctorscares.eg',
        password: 'doctor123',
        fullName: 'Dr. Hassan Mahmoud',
        role: 'doctor',
        profile: {
            phone: '01000000001',
            specialty: 'Cardiology',
            title: 'Professor',
            location: 'New Cairo',
            gender: 'Male',
            verified: true,
            consultationPrice: 600,
        },
        profileModel: Doctor,
    },
    {
        email: 'patient@doctorscares.eg',
        password: 'patient123',
        fullName: 'Ahmed Ali',
        role: 'patient',
        profile: {
            phone: '01000000002',
            gender: 'Male',
            dateOfBirth: new Date('1995-06-15'),
        },
        profileModel: Patient,
    },
];

async function ensureProfile(user, profileModel, profileData) {
    const existing = await profileModel.findOne({ user: user._id });
    if (existing) {
        Object.assign(existing, profileData);
        await existing.save();
        return existing;
    }
    return profileModel.create({ user: user._id, ...profileData });
}

async function ensureUser(account) {
    const email = account.email.toLowerCase();
    let user = await User.findOne({ email });

    if (user) {
        user.password = account.password;
        user.fullName = account.fullName;
        user.role = account.role;
        user.isActive = true;
        await user.save();
        console.log(`  Updated user: ${email} (${account.role})`);
    } else {
        user = await User.create({
            email,
            password: account.password,
            fullName: account.fullName,
            role: account.role,
        });
        console.log(`  Created user: ${email} (${account.role})`);
    }

    await ensureProfile(user, account.profileModel, account.profile);
    return user;
}

async function seedDemoUsers(options = {}) {
    const { verbose = true } = options;

    if (verbose) console.log('\nSeeding demo accounts...\n');

    for (const account of DEMO_ACCOUNTS) {
        await ensureUser(account);
    }

    if (verbose) {
        console.log('\n--- Login credentials (role is detected from email) ---\n');
        for (const account of DEMO_ACCOUNTS) {
            console.log(`  ${account.role.toUpperCase().padEnd(8)}  ${account.email}  /  ${account.password}`);
        }
        console.log('');
    } else {
        console.log('Demo accounts synced (admin, doctor, patient).');
    }
}

module.exports = seedDemoUsers;

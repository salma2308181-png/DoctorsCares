require('dotenv').config();
const mongoose = require('mongoose');
const seedDemoUsers = require('./seedUsers');
const seedPlatformData = require('./seedPlatformData');
const seedSiteContent = require('./seedSiteContent');
const seedDoctorData = require('./seedDoctorData');
const seedPatientData = require('./seedPatientData');

async function main() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is missing from .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
        await seedDemoUsers();
        await seedPlatformData();
        await seedSiteContent();
        await seedDoctorData();
        await seedPatientData();
        await mongoose.disconnect();
        console.log('Seed finished.');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exit(1);
    }
}

main();

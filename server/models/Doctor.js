const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        phone: { type: String, trim: true },
        specialty: { type: String, required: true, trim: true },
        title: {
            type: String,
            enum: ['Professor', 'Consultant', 'Specialist'],
            default: 'Specialist',
        },
        location: { type: String, trim: true, default: 'Cairo' },
        gender: { type: String, enum: ['Male', 'Female', ''], default: '' },
        verified: { type: Boolean, default: false },
        consultationPrice: { type: Number, default: 400 },
        inClinicFee: { type: Number, default: 600 },
        onlineFee: { type: Number, default: 400 },
        bio: { type: String, default: '' },
        yearsExperience: { type: Number, default: 0 },
        clinicName: { type: String, default: '' },
        clinicAddress: { type: String, default: '' },
        appointmentDuration: { type: Number, default: 30 },
        lunchBreakStart: { type: String, default: '13:00' },
        lunchBreakEnd: { type: String, default: '14:00' },
        workingDays: {
            type: [
                {
                    day: String,
                    active: { type: Boolean, default: true },
                    from: { type: String, default: '09:00' },
                    to: { type: String, default: '17:00' },
                },
            ],
            default: () => [
                { day: 'Mon', active: true, from: '09:00', to: '17:00' },
                { day: 'Tue', active: true, from: '09:00', to: '17:00' },
                { day: 'Wed', active: true, from: '09:00', to: '17:00' },
                { day: 'Thu', active: true, from: '09:00', to: '17:00' },
                { day: 'Fri', active: false, from: '09:00', to: '13:00' },
                { day: 'Sat', active: false, from: '10:00', to: '14:00' },
                { day: 'Sun', active: false, from: '09:00', to: '12:00' },
            ],
        },
        blockedDates: {
            type: [{ date: String, reason: { type: String, default: '' } }],
            default: [],
        },
        documents: {
            type: [
                {
                    name: String,
                    status: { type: String, enum: ['verified', 'pending', 'missing'], default: 'pending' },
                },
            ],
            default: () => [
                { name: 'Medical License', status: 'verified' },
                { name: 'Board Certification', status: 'verified' },
            ],
        },
        featured: { type: Boolean, default: false },
        suspended: { type: Boolean, default: false },
        suspendReason: { type: String, default: '' },
        rating: { type: Number, default: 5, min: 0, max: 5 },
        reviewCount: { type: Number, default: 0 },
        documentsComplete: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);

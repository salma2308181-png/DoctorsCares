const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        phone: { type: String, trim: true },
        gender: { type: String, enum: ['Male', 'Female', ''], default: '' },
        dateOfBirth: { type: Date },
        bloodType: { type: String, default: '' },
        primaryCondition: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
    {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        familyMember: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember', default: null },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        appointmentDate: { type: Date, required: true },
        timeSlot: { type: String, required: true },
        reason: { type: String, default: '' },
        fee: { type: Number, required: true },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'completed'],
            default: 'pending',
        },
        flagged: { type: Boolean, default: false },
        cancelReason: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);

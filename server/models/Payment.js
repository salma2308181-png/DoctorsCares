const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
        patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true },
        commission: { type: Number, default: 0 },
        type: { type: String, enum: ['payment', 'refund'], default: 'payment' },
        status: { type: String, enum: ['success', 'pending', 'failed', 'denied'], default: 'success' },
        refundReason: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);

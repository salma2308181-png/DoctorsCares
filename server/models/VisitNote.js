const mongoose = require('mongoose');

const visitNoteSchema = new mongoose.Schema(
    {
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        familyMember: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember', default: null },
        appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
        diagnosis: { type: String, default: '' },
        notes: { type: String, default: '' },
        abnormalResult: { type: Boolean, default: false },
        visitDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('VisitNote', visitNoteSchema);

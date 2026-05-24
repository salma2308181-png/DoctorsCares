const mongoose = require('mongoose');

const medicalHistoryEntrySchema = new mongoose.Schema(
    {
        accountHolder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        familyMember: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FamilyMember',
            default: null,
        },
        title: { type: String, required: true, trim: true },
        category: {
            type: String,
            enum: ['visit', 'test', 'checkup', 'follow-up', 'procedure', 'other'],
            default: 'visit',
        },
        eventDate: { type: Date, required: true },
        provider: { type: String, default: '' },
        notes: { type: String, default: '' },
        source: {
            type: String,
            enum: ['manual', 'system', 'doctor'],
            default: 'doctor',
        },
        appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
        visitNote: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitNote' },
    },
    { timestamps: true }
);

medicalHistoryEntrySchema.index({ accountHolder: 1, eventDate: -1 });

module.exports = mongoose.model('MedicalHistoryEntry', medicalHistoryEntrySchema);

const { MedicalHistoryEntry } = require('../models');
const { inferCategoryFromText } = require('./medicalHistory');

async function syncMedicalHistoryFromVisitNote(visitNote, { doctorName } = {}) {
    if (!visitNote?._id) return null;

    const existing = await MedicalHistoryEntry.findOne({ visitNote: visitNote._id });
    if (existing) return existing;

    return MedicalHistoryEntry.create({
        accountHolder: visitNote.patient,
        familyMember: visitNote.familyMember || null,
        title: visitNote.diagnosis || 'Medical visit',
        category: visitNote.abnormalResult ? 'test' : inferCategoryFromText(visitNote.diagnosis),
        eventDate: visitNote.visitDate || new Date(),
        provider: doctorName || '',
        notes: visitNote.notes || '',
        source: 'system',
        appointment: visitNote.appointment || null,
        visitNote: visitNote._id,
    });
}

module.exports = { syncMedicalHistoryFromVisitNote };

const express = require('express');
const { requireRole } = require('../auth/auth');
const { User, Doctor, Appointment, Payment, VisitNote, Patient, MedicalHistoryEntry } = require('../models');
const { redirectDoctor } = require('../utils/doctorRedirect');
const { inferCategoryFromText } = require('../utils/medicalHistory');
const { syncMedicalHistoryFromVisitNote } = require('../utils/medicalHistorySync');

const router = express.Router();
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function parseWorkingDays(body) {
    return DAY_NAMES.map((day) => ({
        day,
        active: body[`day_${day}_active`] === 'on',
        from: body[`day_${day}_from`] || '09:00',
        to: body[`day_${day}_to`] || '17:00',
    }));
}

async function assertDoctorAppointment(doctorId, appointmentId) {
    const appt = await Appointment.findOne({ _id: appointmentId, doctor: doctorId });
    if (!appt) throw new Error('Appointment not found');
    return appt;
}

async function assertDoctorPatient(doctorId, patientId) {
    const hasVisit = await Appointment.exists({ doctor: doctorId, patient: patientId });
    if (!hasVisit) throw new Error('Patient not found in your records');
}

async function syncPaymentForAppointment(appointmentId, status) {
    await Payment.findOneAndUpdate({ appointment: appointmentId }, { status });
}

router.post('/doctor/appointments/:id/accept', requireRole('doctor'), async (req, res) => {
    try {
        const appt = await assertDoctorAppointment(req.session.user.id, req.params.id);
        appt.status = 'confirmed';
        await appt.save();
        await syncPaymentForAppointment(appt._id, 'success');
        return redirectDoctor(req, res, 'Appointment confirmed', false, '/doctor/appointments?apptTab=upcoming');
    } catch (err) {
        return redirectDoctor(req, res, err.message, true);
    }
});

router.post('/doctor/appointments/:id/reject', requireRole('doctor'), async (req, res) => {
    try {
        const appt = await assertDoctorAppointment(req.session.user.id, req.params.id);
        appt.status = 'cancelled';
        appt.cancelReason = req.body.reason || 'Rejected by doctor';
        await appt.save();
        await syncPaymentForAppointment(appt._id, 'denied');
        return redirectDoctor(req, res, 'Appointment rejected', false, '/doctor/appointments');
    } catch (err) {
        return redirectDoctor(req, res, err.message, true);
    }
});

router.post('/doctor/appointments/:id/cancel', requireRole('doctor'), async (req, res) => {
    try {
        const appt = await assertDoctorAppointment(req.session.user.id, req.params.id);
        appt.status = 'cancelled';
        appt.cancelReason = req.body.reason || 'Cancelled by doctor';
        await appt.save();
        await syncPaymentForAppointment(appt._id, 'denied');
        return redirectDoctor(req, res, 'Appointment cancelled', false, '/doctor/appointments');
    } catch (err) {
        return redirectDoctor(req, res, err.message, true);
    }
});

router.post('/doctor/appointments/:id/reschedule', requireRole('doctor'), async (req, res) => {
    try {
        const appt = await assertDoctorAppointment(req.session.user.id, req.params.id);
        const { newDate, newTime } = req.body;
        if (!newDate || !newTime) throw new Error('Date and time required');
        appt.appointmentDate = new Date(newDate);
        appt.timeSlot = newTime;
        appt.status = 'confirmed';
        await appt.save();
        return redirectDoctor(req, res, 'Appointment rescheduled', false, '/doctor/appointments');
    } catch (err) {
        return redirectDoctor(req, res, err.message, true);
    }
});

router.post('/doctor/appointments/:id/notes', requireRole('doctor'), async (req, res) => {
    try {
        const appt = await assertDoctorAppointment(req.session.user.id, req.params.id);
        const diagnosis = req.body.diagnosis?.trim();
        const notes = req.body.notes?.trim();
        if (!diagnosis) throw new Error('Diagnosis is required');

        const visitNote = await VisitNote.create({
            doctor: req.session.user.id,
            patient: appt.patient,
            familyMember: appt.familyMember || null,
            appointment: appt._id,
            diagnosis,
            notes: notes || '',
            abnormalResult: req.body.abnormalResult === 'on' || req.body.abnormalResult === 'true',
            visitDate: new Date(),
        });

        const doctorUser = await User.findById(req.session.user.id).select('fullName').lean();
        await syncMedicalHistoryFromVisitNote(visitNote, { doctorName: doctorUser?.fullName || '' });

        appt.status = 'completed';
        await appt.save();

        return redirectDoctor(req, res, 'Visit notes saved', false, '/doctor/appointments');
    } catch (err) {
        return redirectDoctor(req, res, err.message, true);
    }
});

router.post('/doctor/patients/:patientId/notes', requireRole('doctor'), async (req, res) => {
    try {
        await assertDoctorPatient(req.session.user.id, req.params.patientId);
        const diagnosis = req.body.diagnosis?.trim();
        const notes = req.body.notes?.trim();
        if (!diagnosis) throw new Error('Diagnosis is required');

        const visitNote = await VisitNote.create({
            doctor: req.session.user.id,
            patient: req.params.patientId,
            diagnosis,
            notes: notes || '',
            visitDate: new Date(),
        });

        const doctorUser = await User.findById(req.session.user.id).select('fullName').lean();
        await syncMedicalHistoryFromVisitNote(visitNote, { doctorName: doctorUser?.fullName || '' });

        return redirectDoctor(req, res, 'Patient note saved', false, '/doctor/patients');
    } catch (err) {
        return redirectDoctor(req, res, err.message, true);
    }
});

router.post('/doctor/schedule', requireRole('doctor'), async (req, res) => {
    try {
        await Doctor.findOneAndUpdate(
            { user: req.session.user.id },
            {
                appointmentDuration: Number(req.body.appointmentDuration) || 30,
                lunchBreakStart: req.body.lunchBreakStart || '13:00',
                lunchBreakEnd: req.body.lunchBreakEnd || '14:00',
                workingDays: parseWorkingDays(req.body),
            }
        );
        return redirectDoctor(req, res, 'Schedule settings saved', false, '/doctor/schedule');
    } catch (err) {
        return redirectDoctor(req, res, err.message, true);
    }
});

router.post('/doctor/schedule/block', requireRole('doctor'), async (req, res) => {
    try {
        const date = req.body.blockDate;
        if (!date) throw new Error('Select a date to block');
        const doc = await Doctor.findOne({ user: req.session.user.id });
        if (!doc) throw new Error('Doctor profile not found');
        if (!doc.blockedDates.some((b) => b.date === date)) {
            doc.blockedDates.push({ date, reason: req.body.blockReason?.trim() || '' });
            await doc.save();
        }
        return redirectDoctor(req, res, 'Date blocked', false, '/doctor/schedule');
    } catch (err) {
        return redirectDoctor(req, res, err.message, true);
    }
});

router.post('/doctor/schedule/block/:index/delete', requireRole('doctor'), async (req, res) => {
    try {
        const doc = await Doctor.findOne({ user: req.session.user.id });
        if (!doc) throw new Error('Doctor profile not found');
        const idx = Number(req.params.index);
        doc.blockedDates.splice(idx, 1);
        await doc.save();
        return redirectDoctor(req, res, 'Blocked date removed', false, '/doctor/schedule');
    } catch (err) {
        return redirectDoctor(req, res, err.message, true);
    }
});

router.post('/doctor/profile', requireRole('doctor'), async (req, res) => {
    try {
        const tab = req.body.tab || 'info';
        const doctorId = req.session.user.id;

        if (tab === 'info') {
            await User.findByIdAndUpdate(doctorId, {
                fullName: req.body.fullName?.trim(),
            });
            await Doctor.findOneAndUpdate(
                { user: doctorId },
                {
                    specialty: req.body.specialty?.trim(),
                    title: req.body.title,
                    yearsExperience: Number(req.body.yearsExperience) || 0,
                    bio: req.body.bio?.trim(),
                    phone: req.body.phone?.trim(),
                }
            );
        } else if (tab === 'clinic') {
            await Doctor.findOneAndUpdate(
                { user: doctorId },
                {
                    clinicName: req.body.clinicName?.trim(),
                    clinicAddress: req.body.clinicAddress?.trim(),
                    inClinicFee: Number(req.body.inClinicFee) || 0,
                    onlineFee: Number(req.body.onlineFee) || 0,
                    consultationPrice: Number(req.body.inClinicFee) || 600,
                    location: req.body.clinicAddress?.trim(),
                }
            );
        }

        return redirectDoctor(req, res, 'Profile saved', false, '/doctor/profile');
    } catch (err) {
        return redirectDoctor(req, res, err.message, true);
    }
});

router.post('/doctor/patients/:patientId/history', requireRole('doctor'), async (req, res) => {
    try {
        await assertDoctorPatient(req.session.user.id, req.params.patientId);
        const { title, category, eventDate, provider, notes } = req.body;
        if (!title?.trim() || !eventDate) {
            throw new Error('Title and date are required');
        }

        const doctorUser = await User.findById(req.session.user.id).select('fullName').lean();
        await MedicalHistoryEntry.create({
            accountHolder: req.params.patientId,
            familyMember: null,
            title: title.trim(),
            category: category || inferCategoryFromText(title),
            eventDate: new Date(eventDate),
            provider: provider?.trim() || doctorUser?.fullName || '',
            notes: notes?.trim() || '',
            source: 'doctor',
        });

        return redirectDoctor(req, res, 'Medical history entry added', false, '/doctor/patients');
    } catch (err) {
        return redirectDoctor(req, res, err.message, true);
    }
});

router.post('/doctor/patients/:patientId/condition', requireRole('doctor'), async (req, res) => {
    try {
        await Patient.findOneAndUpdate(
            { user: req.params.patientId },
            {
                primaryCondition: req.body.primaryCondition?.trim(),
                bloodType: req.body.bloodType?.trim(),
            }
        );
        return redirectDoctor(req, res, 'Patient info updated', false, '/doctor/patients');
    } catch (err) {
        return redirectDoctor(req, res, err.message, true);
    }
});

module.exports = router;

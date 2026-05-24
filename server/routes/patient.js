const express = require('express');
const { requireRole } = require('../auth/auth');
const { User, Patient, Doctor, Appointment, Payment, SystemSetting, FamilyMember } = require('../models');
const { redirectPatient } = require('../utils/patientRedirect');

const router = express.Router();

async function getMinBookingFee() {
    const row = await SystemSetting.findOne({ key: 'minBookingFee' }).lean();
    return row?.value ?? 100;
}

router.post('/patient/profile', requireRole('patient'), async (req, res) => {
    try {
        const patientId = req.session.user.id;
        await User.findByIdAndUpdate(patientId, {
            fullName: req.body.fullName?.trim(),
        });
        const dob = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined;
        await Patient.findOneAndUpdate(
            { user: patientId },
            {
                phone: req.body.phone?.trim(),
                gender: req.body.gender,
                bloodType: req.body.bloodType?.trim(),
                primaryCondition: req.body.primaryCondition?.trim(),
                ...(dob && !Number.isNaN(dob.getTime()) ? { dateOfBirth: dob } : {}),
            },
            { upsert: true }
        );
        return redirectPatient(req, res, 'Profile saved', false, '/patient/profile');
    } catch (err) {
        return redirectPatient(req, res, err.message, true);
    }
});

router.post('/patient/appointments/book', requireRole('patient'), async (req, res) => {
    try {
        const { doctorId, appointmentDate, timeSlot, reason } = req.body;
        if (!doctorId || !appointmentDate || !timeSlot) {
            throw new Error('Doctor, date, and time are required');
        }

        const apptDay = new Date(appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (apptDay < today) {
            throw new Error('Appointment date must be today or in the future');
        }

        const doctorProfile = await Doctor.findOne({
            user: doctorId,
            verified: true,
            suspended: { $ne: true },
        }).populate('user', 'isActive');
        if (!doctorProfile?.user?.isActive) {
            throw new Error('Doctor not available for booking');
        }

        const dateStr = appointmentDate.slice(0, 10);
        if (doctorProfile.blockedDates?.some((b) => b.date === dateStr)) {
            throw new Error('Doctor is not available on this date');
        }

        const conflict = await Appointment.findOne({
            doctor: doctorId,
            appointmentDate: apptDay,
            timeSlot,
            status: { $in: ['pending', 'confirmed'] },
        });
        if (conflict) {
            throw new Error('This time slot is already booked');
        }

        const fee = doctorProfile.consultationPrice || doctorProfile.inClinicFee || 600;
        const minFee = await getMinBookingFee();
        if (fee < minFee) {
            throw new Error(`Minimum booking fee is ${minFee} EGP`);
        }

        const appt = await Appointment.create({
            patient: req.session.user.id,
            familyMember: req.body.familyMemberId && req.body.familyMemberId !== '' ? req.body.familyMemberId : null,
            doctor: doctorId,
            appointmentDate: apptDay,
            timeSlot,
            reason: reason?.trim() || 'Consultation',
            fee,
            status: 'pending',
        });

        await Payment.create({
            appointment: appt._id,
            patient: req.session.user.id,
            doctor: doctorId,
            amount: fee,
            commission: Math.round(fee * 0.15),
            type: 'payment',
            status: 'pending',
        });

        const redirectTo = req.body.redirectTo || '/patient/appointments';
        return redirectPatient(req, res, 'Appointment request sent', false, redirectTo);
    } catch (err) {
        const errFallback = req.body.redirectTo || '/patient/appointments';
        return redirectPatient(req, res, err.message, true, errFallback);
    }
});

router.post('/patient/appointments/:id/cancel', requireRole('patient'), async (req, res) => {
    try {
        const appt = await Appointment.findOne({
            _id: req.params.id,
            patient: req.session.user.id,
        });
        if (!appt) throw new Error('Appointment not found');
        if (appt.status === 'completed' || appt.status === 'cancelled') {
            throw new Error('This appointment cannot be cancelled');
        }
        appt.status = 'cancelled';
        appt.cancelReason = req.body.reason?.trim() || 'Cancelled by patient';
        await appt.save();
        await Payment.findOneAndUpdate({ appointment: appt._id }, { status: 'denied' });
        return redirectPatient(req, res, 'Appointment cancelled', false, '/patient/appointments');
    } catch (err) {
        return redirectPatient(req, res, err.message, true);
    }
});

router.post('/patient/family/switch', requireRole('patient'), (req, res) => {
    const memberId = req.body.familyMemberId || 'self';
    req.session.activeFamilyMemberId = memberId === 'self' ? null : memberId;
    const back = req.body.redirectTo || req.get('Referer') || '/patient/dashboard';
    return res.redirect(back);
});

router.post('/patient/family/add', requireRole('patient'), async (req, res) => {
    try {
        const { fullName, relationship, gender, bloodType, primaryCondition, dateOfBirth } = req.body;
        if (!fullName?.trim() || !relationship) {
            throw new Error('Name and relationship are required');
        }
        await FamilyMember.create({
            accountHolder: req.session.user.id,
            fullName: fullName.trim(),
            relationship,
            gender: gender || '',
            bloodType: bloodType?.trim() || '',
            primaryCondition: primaryCondition?.trim() || '',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        });
        return redirectPatient(req, res, 'Family member added', false, '/patient/family');
    } catch (err) {
        return redirectPatient(req, res, err.message, true, '/patient/family');
    }
});

router.post('/patient/family/:id/delete', requireRole('patient'), async (req, res) => {
    try {
        await FamilyMember.findOneAndDelete({
            _id: req.params.id,
            accountHolder: req.session.user.id,
        });
        if (req.session.activeFamilyMemberId === req.params.id) {
            req.session.activeFamilyMemberId = null;
        }
        return redirectPatient(req, res, 'Family member removed', false, '/patient/family');
    } catch (err) {
        return redirectPatient(req, res, err.message, true, '/patient/family');
    }
});

module.exports = router;

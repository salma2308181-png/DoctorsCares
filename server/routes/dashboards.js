const express = require('express');
const { requireRole } = require('../auth/auth');

const router = express.Router();

/** Legacy single-page dashboard URLs → split routes (do not render old templates). */
router.get('/patient-dashboard', requireRole('patient'), (req, res) => {
    const section = req.query.section || 'overview';
    const map = {
        overview: '/patient/dashboard',
        appointments: '/patient/appointments',
        records: '/patient/records',
        doctors: '/patient/doctors',
        notifications: '/patient/notifications',
        profile: '/patient/profile',
    };
    const target = map[section] || '/patient/dashboard';
    const params = new URLSearchParams(req.url.includes('?') ? req.url.split('?')[1] : '');
    params.delete('section');
    if (section === 'appointments' && req.url.includes('#book')) {
        params.set('focus', 'book');
    }
    const rest = params.toString();
    res.redirect(rest ? `${target}?${rest}` : target);
});

router.get('/doctor-dashboard', requireRole('doctor'), (req, res) => {
    const section = req.query.section || 'overview';
    const map = {
        overview: '/doctor/dashboard',
        appointments: '/doctor/appointments',
        schedule: '/doctor/schedule',
        patients: '/doctor/patients',
        earnings: '/doctor/earnings',
        notifications: '/doctor/notifications',
        profile: '/doctor/profile',
    };
    const target = map[section] || '/doctor/dashboard';
    const params = new URLSearchParams(req.url.includes('?') ? req.url.split('?')[1] : '');
    params.delete('section');
    const rest = params.toString();
    res.redirect(rest ? `${target}?${rest}` : target);
});

module.exports = router;

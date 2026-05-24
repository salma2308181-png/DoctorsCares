const express = require('express');
const { requireRole } = require('../auth/auth');
const { getDoctorDashboardData } = require('../services/doctorDataService');

const router = express.Router();

const DOCTOR_PAGES = {
    dashboard: { title: 'Overview', view: 'pages/overview' },
    appointments: { title: 'Appointments', view: 'pages/appointments' },
    schedule: { title: 'Schedule', view: 'pages/schedule' },
    patients: { title: 'Patients', view: 'pages/patients' },
    earnings: { title: 'Earnings', view: 'pages/earnings' },
    notifications: { title: 'Notifications', view: 'pages/notifications' },
    profile: { title: 'Profile', view: 'pages/profile' },
};

async function renderDoctorPage(req, res, pageKey) {
    const page = DOCTOR_PAGES[pageKey];
    const data = await getDoctorDashboardData(req.session.user.id);

    res.render('doctor/layout', {
        user: req.session.user,
        activePage: pageKey,
        pageTitle: page.title,
        contentView: page.view,
        apptTab: req.query.apptTab || null,
        flash: {
            success: req.query.success || null,
            error: req.query.error || null,
        },
        ...data,
    });
}

router.get('/doctor/dashboard', requireRole('doctor'), (req, res) => renderDoctorPage(req, res, 'dashboard'));
router.get('/doctor/appointments', requireRole('doctor'), (req, res) => renderDoctorPage(req, res, 'appointments'));
router.get('/doctor/schedule', requireRole('doctor'), (req, res) => renderDoctorPage(req, res, 'schedule'));
router.get('/doctor/patients', requireRole('doctor'), (req, res) => renderDoctorPage(req, res, 'patients'));
router.get('/doctor/earnings', requireRole('doctor'), (req, res) => renderDoctorPage(req, res, 'earnings'));
router.get('/doctor/notifications', requireRole('doctor'), (req, res) => renderDoctorPage(req, res, 'notifications'));
router.get('/doctor/profile', requireRole('doctor'), (req, res) => renderDoctorPage(req, res, 'profile'));

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
    const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const params = new URLSearchParams(q);
    params.delete('section');
    const rest = params.toString();
    res.redirect(rest ? `${target}?${rest}` : target);
});

module.exports = router;

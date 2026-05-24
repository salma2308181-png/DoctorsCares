const express = require('express');
const { requireRole } = require('../auth/auth');
const { User } = require('../models');
const { getPatientDashboardData } = require('../services/patientDataService');

const router = express.Router();

const PATIENT_PAGES = {
    dashboard: { title: 'Overview', view: 'pages/overview' },
    appointments: { title: 'Appointments', view: 'pages/appointments' },
    records: { title: 'Health Records', view: 'pages/records' },
    'medical-history': { title: 'Medical History', view: 'pages/medical-history' },
    family: { title: 'Family Accounts', view: 'pages/family' },
    doctors: { title: 'My Doctors', view: 'pages/doctors' },
    notifications: { title: 'Notifications', view: 'pages/notifications' },
    profile: { title: 'Profile', view: 'pages/profile' },
};

async function renderPatientPage(req, res, pageKey) {
    const page = PATIENT_PAGES[pageKey];
    const [data, account] = await Promise.all([
        getPatientDashboardData(req.session.user.id, {
            activeFamilyMemberId: req.session.activeFamilyMemberId || null,
        }),
        User.findById(req.session.user.id).select('isActive').lean(),
    ]);

    res.render('patient/layout', {
        user: req.session.user,
        activePage: pageKey,
        pageTitle: page.title,
        contentView: page.view,
        isActive: account?.isActive !== false,
        preselectDoctorId: req.query.doctorId || '',
        scrollToBook: req.query.focus === 'book' || !!req.query.doctorId,
        apptTab: req.query.apptTab || null,
        flash: {
            success: req.query.success || null,
            error: req.query.error || null,
        },
        ...data,
        profile: data.patient,
    });
}

router.get('/patient/dashboard', requireRole('patient'), (req, res) => renderPatientPage(req, res, 'dashboard'));
router.get('/patient/appointments', requireRole('patient'), (req, res) => renderPatientPage(req, res, 'appointments'));
router.get('/patient/records', requireRole('patient'), (req, res) => renderPatientPage(req, res, 'records'));
router.get('/patient/medical-history', requireRole('patient'), (req, res) => {
    if (req.query.member && req.query.member !== 'self') {
        return res.redirect('/patient/medical-history');
    }
    renderPatientPage(req, res, 'medical-history');
});
router.get('/patient/family', requireRole('patient'), (req, res) => renderPatientPage(req, res, 'family'));
router.get('/patient/doctors', requireRole('patient'), (req, res) => renderPatientPage(req, res, 'doctors'));
router.get('/patient/notifications', requireRole('patient'), (req, res) => renderPatientPage(req, res, 'notifications'));
router.get('/patient/profile', requireRole('patient'), (req, res) => renderPatientPage(req, res, 'profile'));

module.exports = router;

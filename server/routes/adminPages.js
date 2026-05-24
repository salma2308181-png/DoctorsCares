const express = require('express');
const { requireRole } = require('../auth/auth');
const { getAdminDashboardData } = require('../services/adminDataService');
const { getAdminContentData } = require('../services/contentService');
const { getAdminViewLocals } = require('../utils/adminViewHelpers');

const router = express.Router();

const ADMIN_PAGES = {
    dashboard: { title: 'Dashboard', view: 'pages/dashboard' },
    doctors: { title: 'Doctor Management', view: 'pages/doctors' },
    patients: { title: 'Patient Management', view: 'pages/patients' },
    appointments: { title: 'Appointments', view: 'pages/appointments' },
    payments: { title: 'Payments & Finance', view: 'pages/payments' },
    categories: { title: 'Categories', view: 'pages/categories' },
    reports: { title: 'Reports & Analytics', view: 'pages/reports' },
    notifications: { title: 'Notifications', view: 'pages/notifications' },
    settings: { title: 'System Settings', view: 'pages/settings' },
    'content-about': { title: 'About Page', view: 'pages/content-about' },
    'content-services': { title: 'Services Page', view: 'pages/content-services' },
    'content-blogs': { title: 'Blog Posts', view: 'pages/content-blogs' },
    'content-home': { title: 'Home Page', view: 'pages/content-home' },
    'content-contact': { title: 'Contact Page', view: 'pages/content-contact' },
    'content-footer': { title: 'Footer', view: 'pages/content-footer' },
};

const CONTENT_PAGES = new Set([
    'content-about',
    'content-services',
    'content-blogs',
    'content-home',
    'content-contact',
    'content-footer',
]);

async function renderAdminPage(req, res, pageKey) {
    const page = ADMIN_PAGES[pageKey];
    const [data, contentData] = await Promise.all([
        getAdminDashboardData(),
        CONTENT_PAGES.has(pageKey) ? getAdminContentData(pageKey) : Promise.resolve({}),
    ]);

    const viewData = {
        user: req.session.user,
        activePage: pageKey,
        pageTitle: page.title,
        contentView: page.view,
        flash: {
            success: req.query.success || null,
            error: req.query.error || null,
        },
        ...getAdminViewLocals(req.session.user),
        ...data,
        ...contentData,
    };
    viewData.s = viewData.stats || {};
    viewData.pay = viewData.payments || {};
    viewData.rep = viewData.reports || {};
    viewData.aStats = viewData.apptStats || {};

    res.render('admin/layout', viewData);
}

router.get('/admin/dashboard', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'dashboard'));
router.get('/admin/doctors', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'doctors'));
router.get('/admin/patients', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'patients'));
router.get('/admin/appointments', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'appointments'));
router.get('/admin/payments', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'payments'));
router.get('/admin/categories', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'categories'));
router.get('/admin/reports', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'reports'));
router.get('/admin/notifications', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'notifications'));
router.get('/admin/settings', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'settings'));
router.get('/admin/content/about', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'content-about'));
router.get('/admin/content/services', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'content-services'));
router.get('/admin/content/blogs', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'content-blogs'));
router.get('/admin/content/home', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'content-home'));
router.get('/admin/content/contact', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'content-contact'));
router.get('/admin/content/footer', requireRole('admin'), (req, res) => renderAdminPage(req, res, 'content-footer'));

router.get('/admin-dashboard', requireRole('admin'), (req, res) => {
    const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(`/admin/dashboard${q}`);
});

module.exports = router;

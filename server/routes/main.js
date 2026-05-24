const express = require('express');
const {
    getAboutPageData,
    getServicesPageData,
    getBlogsPageData,
    getHomePageData,
    getContactPageData,
} = require('../services/contentService');
const { getPublicDoctors } = require('../services/doctorsPublicService');

const router = express.Router();

router.get('', async (req, res) => {
    const data = await getHomePageData();
    res.render('index', {
        pageTitle: 'DoctorsCares | Premier Healthcare Portal',
        activePage: 'home',
        ...data,
    });
});

router.get('/doctors', async (req, res) => {
    const publicDoctors = await getPublicDoctors();
    res.render('doctors', {
        pageTitle: 'Find Doctors | DoctorsCares',
        activePage: 'doctors',
        publicDoctors,
        bookingConfig: {
            isPatient: req.session?.user?.role === 'patient',
        },
    });
});

router.get('/services', async (req, res) => {
    const data = await getServicesPageData();
    res.render('services', {
        pageTitle: 'Services | DoctorsCares',
        activePage: 'services',
        ...data,
    });
});

router.get('/about', async (req, res) => {
    const data = await getAboutPageData();
    res.render('about', {
        pageTitle: 'About | DoctorsCares',
        activePage: 'about',
        ...data,
    });
});

router.get('/blogs', async (req, res) => {
    const data = await getBlogsPageData();
    res.render('blogs', {
        pageTitle: 'Blog | DoctorsCares',
        activePage: 'blogs',
        ...data,
    });
});

router.get('/contact', async (req, res) => {
    const data = await getContactPageData();
    res.render('contact', {
        pageTitle: 'Contact | DoctorsCares',
        activePage: 'contact',
        flash: {
            success: req.query.success || null,
            error: req.query.error || null,
        },
        ...data,
    });
});

router.get('/login', (req, res) => {
    res.redirect('/auth/login');
});

router.get('/logout', (req, res) => {
    res.redirect('/auth/logout');
});

module.exports = router;

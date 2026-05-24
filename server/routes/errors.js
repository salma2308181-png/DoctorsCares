const express = require('express');
const { dashboardPathForRole } = require('../utils/dashboardPaths');

const router = express.Router();

router.use((req, res) => {
    const dashHref = req.session?.user?.role
        ? dashboardPathForRole(req.session.user.role)
        : '/auth/login';

    res.status(404).render('404', {
        pageTitle: 'Page Not Found | DoctorsCares',
        activePage: '',
        dashHref,
    });
});

module.exports = router;

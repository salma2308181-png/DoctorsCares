const express = require('express');
const { redirectIfAuthenticated } = require('../auth/auth');
const { registerUser, loginUser, dashboardPathForRole } = require('../services/authService');
const { safeRedirectPath } = require('../utils/safeRedirect');
const { setSessionUser } = require('../config/session');

const router = express.Router();

function renderLogin(res, { error = null, signupError = null, values = {}, mode = 'login', next = '' }) {
    return res.render('login', { error, signupError, values, mode, next });
}

router.get('/login', redirectIfAuthenticated, (req, res) => {
    renderLogin(res, { values: {}, next: req.query.next || '' });
});

router.post('/login', async (req, res) => {
    const { email, password, next } = req.body;
    const values = { email };
    const nextPath = next || '';

    if (!email || !password) {
        return renderLogin(res, {
            error: 'Please enter your email and password.',
            values,
            next: nextPath,
        });
    }

    try {
        const { session: userSession } = await loginUser({ email, password });
        await setSessionUser(req, userSession);
        const destination = safeRedirectPath(nextPath, userSession.role) || dashboardPathForRole(userSession.role);
        return res.redirect(destination);
    } catch (err) {
        return renderLogin(res, {
            error: err.message || 'Login failed.',
            values,
            next: nextPath,
        });
    }
});

router.post('/signup', async (req, res) => {
    const { fullName, email, password, phone, gender, dateOfBirth } = req.body;

    const values = { fullName, email, phone, gender, dateOfBirth };

    if (!fullName || !email || !password) {
        return renderLogin(res, {
            signupError: 'Please fill in all required fields.',
            values,
            mode: 'signup',
        });
    }

    if (password.length < 6) {
        return renderLogin(res, {
            signupError: 'Password must be at least 6 characters.',
            values,
            mode: 'signup',
        });
    }

    try {
        const user = await registerUser({
            fullName,
            email,
            password,
            role: 'patient',
            phone,
            gender,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        });

        const { session: userSession } = await loginUser({ email: user.email, password });
        await setSessionUser(req, userSession);
        return res.redirect(dashboardPathForRole(user.role));
    } catch (err) {
        return renderLogin(res, {
            signupError: err.message || 'Registration failed.',
            values,
            mode: 'signup',
        });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
});

module.exports = router;

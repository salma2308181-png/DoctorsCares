const { dashboardPathForRole } = require('../utils/dashboardPaths');

const attachUserToLocals = (req, res, next) => {
    res.locals.user = req.session?.user || null;
    next();
};

function isLoggedIn(req) {
    return Boolean(req.session?.user?.id);
}

function loginRedirectUrl(req) {
    const returnTo = req.originalUrl || req.url;
    if (!returnTo || returnTo.startsWith('/auth/')) {
        return '/auth/login';
    }
    return `/auth/login?next=${encodeURIComponent(returnTo)}`;
}

const requireAuth = (req, res, next) => {
    if (isLoggedIn(req)) {
        return next();
    }
    return res.redirect(loginRedirectUrl(req));
};

const requireRole = (role) => (req, res, next) => {
    const sessionUser = req.session?.user;
    if (!sessionUser?.id) {
        return res.redirect(loginRedirectUrl(req));
    }
    if (sessionUser.role === role) {
        return next();
    }
    return res.redirect(dashboardPathForRole(sessionUser.role));
};

const redirectIfAuthenticated = (req, res, next) => {
    if (isLoggedIn(req)) {
        return res.redirect(dashboardPathForRole(req.session.user.role));
    }
    return next();
};

module.exports = {
    attachUserToLocals,
    isLoggedIn,
    requireAuth,
    requireRole,
    redirectIfAuthenticated,
};

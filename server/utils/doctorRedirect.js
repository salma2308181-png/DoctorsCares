const LEGACY_SECTION_MAP = {
    overview: '/doctor/dashboard',
    appointments: '/doctor/appointments',
    schedule: '/doctor/schedule',
    patients: '/doctor/patients',
    earnings: '/doctor/earnings',
    notifications: '/doctor/notifications',
    profile: '/doctor/profile',
};

function normalizeDoctorPath(path) {
    const p = String(path);
    if (!p.startsWith('/doctor-dashboard')) return p;
    try {
        const url = new URL(p, 'http://local');
        const section = url.searchParams.get('section') || 'overview';
        const base = LEGACY_SECTION_MAP[section] || '/doctor/dashboard';
        url.searchParams.delete('section');
        const rest = url.searchParams.toString();
        return rest ? `${base}?${rest}` : base;
    } catch {
        return '/doctor/dashboard';
    }
}

function isAllowedDoctorPath(path) {
    const p = normalizeDoctorPath(path);
    return p.startsWith('/doctor/');
}

function getDoctorRedirectPath(req, fallback = '/doctor/dashboard') {
    const fromBody = req.body?.redirectTo;
    if (fromBody && isAllowedDoctorPath(fromBody)) {
        return normalizeDoctorPath(fromBody);
    }
    const referer = req.get('referer');
    if (referer) {
        try {
            const url = new URL(referer);
            if (url.pathname.startsWith('/doctor/') || url.pathname.startsWith('/doctor-dashboard')) {
                return normalizeDoctorPath(url.pathname + url.search);
            }
        } catch {
            /* ignore */
        }
    }
    return fallback;
}

function redirectDoctor(req, res, msg, isError = false, fallback = '/doctor/dashboard') {
    const base = getDoctorRedirectPath(req, fallback);
    const sep = base.includes('?') ? '&' : '?';
    const key = isError ? 'error' : 'success';
    return res.redirect(`${base}${sep}${key}=${encodeURIComponent(msg)}`);
}

module.exports = { getDoctorRedirectPath, redirectDoctor, normalizeDoctorPath };

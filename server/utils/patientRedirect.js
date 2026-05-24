const LEGACY_SECTION_MAP = {
    overview: '/patient/dashboard',
    appointments: '/patient/appointments',
    records: '/patient/records',
    doctors: '/patient/doctors',
    notifications: '/patient/notifications',
    profile: '/patient/profile',
};

const PATIENT_PATH_PREFIXES = [
    '/patient/dashboard',
    '/patient/appointments',
    '/patient/records',
    '/patient/doctors',
    '/patient/notifications',
    '/patient/profile',
    '/doctors',
];

function normalizePatientPath(path) {
    const p = String(path);
    if (!p.startsWith('/patient-dashboard')) return p;
    try {
        const hasBookHash = p.includes('#book');
        const clean = p.split('#')[0];
        const url = new URL(clean, 'http://local');
        const section = url.searchParams.get('section') || 'overview';
        const base = LEGACY_SECTION_MAP[section] || '/patient/dashboard';
        url.searchParams.delete('section');
        if (hasBookHash || section === 'appointments') {
            url.searchParams.set('focus', 'book');
        }
        const rest = url.searchParams.toString();
        return rest ? `${base}?${rest}` : base;
    } catch {
        return '/patient/dashboard';
    }
}

function isAllowedPatientPath(path) {
    const p = normalizePatientPath(path);
    return PATIENT_PATH_PREFIXES.some((prefix) => p.startsWith(prefix));
}

function getPatientRedirectPath(req, fallback = '/patient/dashboard') {
    const fromBody = req.body?.redirectTo;
    if (fromBody && isAllowedPatientPath(fromBody)) {
        return normalizePatientPath(fromBody);
    }
    const referer = req.get('referer');
    if (referer) {
        try {
            const url = new URL(referer);
            if (
                url.pathname.startsWith('/patient/') ||
                url.pathname.startsWith('/patient-dashboard') ||
                url.pathname === '/doctors'
            ) {
                return normalizePatientPath(url.pathname + url.search + url.hash);
            }
        } catch {
            /* ignore */
        }
    }
    return fallback;
}

function redirectPatient(req, res, msg, isError = false, fallback = '/patient/dashboard') {
    const base = getPatientRedirectPath(req, fallback);
    const sep = base.includes('?') ? '&' : '?';
    const key = isError ? 'error' : 'success';
    return res.redirect(`${base}${sep}${key}=${encodeURIComponent(msg)}`);
}

module.exports = { getPatientRedirectPath, redirectPatient, normalizePatientPath };

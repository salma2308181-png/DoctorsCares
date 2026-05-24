const ALLOWED_BY_ROLE = {
    patient: [
        '/patient/dashboard',
        '/patient/appointments',
        '/patient/records',
        '/patient/doctors',
        '/patient/notifications',
        '/patient/profile',
        '/patient-dashboard',
        '/doctors',
    ],
    doctor: [
        '/doctor/dashboard',
        '/doctor/appointments',
        '/doctor/schedule',
        '/doctor/patients',
        '/doctor/earnings',
        '/doctor/notifications',
        '/doctor/profile',
        '/doctor-dashboard',
    ],
    admin: ['/admin', '/admin-dashboard'],
};

function safeRedirectPath(path, role) {
    if (!path || typeof path !== 'string') return null;
    const p = path.trim();
    if (!p.startsWith('/') || p.startsWith('//') || p.includes('://')) return null;

    const prefixes = ALLOWED_BY_ROLE[role];
    if (!prefixes?.some((prefix) => p.startsWith(prefix))) return null;
    return p;
}

module.exports = { safeRedirectPath };

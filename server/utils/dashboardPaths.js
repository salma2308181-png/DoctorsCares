const DASHBOARD_PATHS = {
    admin: '/admin/dashboard',
    doctor: '/doctor/dashboard',
    patient: '/patient/dashboard',
};

function dashboardPathForRole(role) {
    return DASHBOARD_PATHS[role] || '/';
}

module.exports = { DASHBOARD_PATHS, dashboardPathForRole };

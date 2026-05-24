function avatarUrl(name, size = 64) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=2563eb&color=fff&size=${size}`;
}

function fmtMoney(n) {
    return `EGP ${Number(n || 0).toLocaleString('en-EG')}`;
}

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' });
}

function apptStatusClass(status) {
    if (status === 'confirmed' || status === 'completed') return 'status-active';
    if (status === 'cancelled') return 'status-cancelled';
    return 'status-flagged';
}

function txnStatusClass(status) {
    if (status === 'success') return 'status-active';
    if (status === 'denied') return 'status-cancelled';
    return 'status-flagged';
}

function getAdminViewLocals(user) {
    return {
        adminName: user?.name || 'Admin',
        avatarUrl,
        fmtMoney,
        fmtDate,
        apptStatusClass,
        txnStatusClass,
    };
}

module.exports = {
    avatarUrl,
    fmtMoney,
    fmtDate,
    apptStatusClass,
    txnStatusClass,
    getAdminViewLocals,
};

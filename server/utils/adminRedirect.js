function getAdminRedirectPath(req, fallback = '/admin/dashboard') {
    const fromForm = req.body?.redirectTo;
    if (fromForm && String(fromForm).startsWith('/admin')) {
        return fromForm;
    }
    const referer = req.get('Referer');
    if (referer) {
        try {
            const path = new URL(referer).pathname;
            if (path.startsWith('/admin')) return path;
        } catch {
            /* ignore invalid referer */
        }
    }
    return fallback;
}

function redirectAdmin(req, res, msg, isError = false, fallback = '/admin/dashboard') {
    const base = getAdminRedirectPath(req, fallback);
    const param = isError ? 'error' : 'success';
    const sep = base.includes('?') ? '&' : '?';
    return res.redirect(`${base}${sep}${param}=${encodeURIComponent(msg)}`);
}

module.exports = { getAdminRedirectPath, redirectAdmin };

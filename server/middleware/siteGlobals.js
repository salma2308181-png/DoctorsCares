const { getFooterData, DEFAULT_PAGES } = require('../services/contentService');

const FALLBACK_FOOTER = {
    ...DEFAULT_PAGES.footer,
    specialties: [],
};

async function attachSiteGlobals(req, res, next) {
    try {
        res.locals.siteFooter = await getFooterData();
    } catch {
        res.locals.siteFooter = FALLBACK_FOOTER;
    }
    next();
}

module.exports = attachSiteGlobals;

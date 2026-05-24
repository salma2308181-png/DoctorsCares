const { SitePage, ServiceItem, BlogPost, Testimonial } = require('../models');
const {
    DEFAULT_PAGES,
    DEFAULT_SERVICES,
    DEFAULT_BLOGS,
    DEFAULT_TESTIMONIALS,
} = require('../services/contentService');

async function seedSiteContent() {
    let seeded = false;

    for (const slug of ['about', 'services', 'blogs', 'home', 'contact', 'footer']) {
        const exists = await SitePage.findOne({ slug });
        if (!exists) {
            await SitePage.create({ slug, ...DEFAULT_PAGES[slug] });
            seeded = true;
        }
    }

    if (!(await ServiceItem.countDocuments())) {
        for (const item of DEFAULT_SERVICES) {
            await ServiceItem.create(item);
        }
        seeded = true;
    }

    if (!(await BlogPost.countDocuments())) {
        for (const post of DEFAULT_BLOGS) {
            await BlogPost.create(post);
        }
        seeded = true;
    }

    if (!(await Testimonial.countDocuments())) {
        for (const item of DEFAULT_TESTIMONIALS) {
            await Testimonial.create(item);
        }
        seeded = true;
    }

    if (seeded) {
        console.log('Site content seeded (pages, services, blogs, testimonials).');
    }
}

module.exports = seedSiteContent;

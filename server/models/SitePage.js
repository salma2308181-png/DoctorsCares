const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, default: '' },
    },
    { _id: false }
);

const statSchema = new mongoose.Schema(
    {
        value: { type: String, default: '' },
        label: { type: String, default: '' },
    },
    { _id: false }
);

const heroCardSchema = new mongoose.Schema(
    {
        icon: { type: String, default: 'fa-check-circle' },
        title: { type: String, default: '' },
        subtitle: { type: String, default: '' },
    },
    { _id: false }
);

const socialLinkSchema = new mongoose.Schema(
    {
        label: { type: String, default: '' },
        url: { type: String, default: '#' },
        icon: { type: String, default: 'fa-link' },
    },
    { _id: false }
);

const sitePageSchema = new mongoose.Schema(
    {
        slug: {
            type: String,
            required: true,
            unique: true,
            enum: ['about', 'services', 'blogs', 'home', 'contact', 'footer'],
        },
        sectionLabel: { type: String, default: '' },
        heading: { type: String, default: '' },
        headingHighlight: { type: String, default: '' },
        description: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        imageBadge: { type: String, default: '' },
        statValue: { type: String, default: '' },
        statLabel: { type: String, default: '' },
        ctaText: { type: String, default: 'Get Started' },
        ctaLink: { type: String, default: '/doctors' },
        secondaryCtaText: { type: String, default: '' },
        secondaryCtaLink: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' },
        address: { type: String, default: '' },
        tagline: { type: String, default: '' },
        copyrightText: { type: String, default: '' },
        privacyLink: { type: String, default: '#' },
        termsLink: { type: String, default: '#' },
        useLiveStats: { type: Boolean, default: true },
        features: { type: [featureSchema], default: [] },
        stats: { type: [statSchema], default: [] },
        heroCards: { type: [heroCardSchema], default: [] },
        socialLinks: { type: [socialLinkSchema], default: [] },
        testimonialsSectionLabel: { type: String, default: '' },
        testimonialsHeading: { type: String, default: '' },
        testimonialsHeadingHighlight: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SitePage', sitePageSchema);

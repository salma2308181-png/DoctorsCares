const { SitePage, ServiceItem, BlogPost, Testimonial, ContactMessage, Doctor, User, Specialty } =
    require('../models');

const DEFAULT_PAGES = {
    about: {
        sectionLabel: 'About Us',
        heading: 'Why Choose',
        headingHighlight: 'DoctorsCares',
        description:
            'We partner with the highest-rated medical professionals in Egypt to ensure you receive world-class treatment. Our platform is built to save you time and give you total peace of mind.',
        imageUrl:
            'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
        imageBadge: '#1 Rated Platform',
        statValue: '98%',
        statLabel: 'Patient Satisfaction',
        ctaText: 'Get Started',
        ctaLink: '/doctors',
        features: [
            {
                title: '100% Verified Doctors',
                description: 'Every physician undergoes strict credential verification.',
            },
            {
                title: 'Instant Confirmation',
                description: 'Book an appointment and get confirmed in under 60 seconds.',
            },
            {
                title: 'Full Patient History',
                description: 'Access your medical records, reports, and prescriptions anytime.',
            },
        ],
    },
    services: {
        sectionLabel: 'What We Offer',
        heading: 'World-Class',
        headingHighlight: 'Services',
        description: "From emergency care to online consultations, we've got you covered.",
    },
    blogs: {
        sectionLabel: 'Stay Informed',
        heading: 'Medical',
        headingHighlight: 'Insights',
        description: 'Expert articles from our medical team to keep you healthy and informed.',
    },
    home: {
        sectionLabel: "Egypt's #1 Trusted Healthcare Platform",
        heading: 'Your Health,',
        headingHighlight: 'Our Priority.',
        description:
            "Connect with Egypt's most verified specialists. Book appointments in seconds, get real-time confirmations, and take control of your health journey.",
        imageUrl:
            'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80',
        ctaText: 'Find a Specialist',
        ctaLink: '/doctors',
        secondaryCtaText: 'Learn More',
        secondaryCtaLink: '/about',
        useLiveStats: true,
        testimonialsSectionLabel: 'Patient Stories',
        testimonialsHeading: 'What Patients',
        testimonialsHeadingHighlight: 'Say',
        heroCards: [
            {
                icon: 'fa-check-circle',
                title: 'Appointment Confirmed',
                subtitle: 'Dr. Zeina - Today 3:00 PM',
            },
            {
                icon: 'fa-star',
                title: 'Rated 5.0',
                subtitle: 'By 2,400 patients',
            },
        ],
    },
    contact: {
        sectionLabel: 'Get In Touch',
        heading: "We're Here",
        headingHighlight: 'to Help You',
        description: 'Have a question or need support? Our team is available 7 days a week to assist you.',
        phone: '+20 100 000 0000',
        email: 'support@doctorscares.eg',
        address: 'New Cairo, Egypt',
    },
    footer: {
        tagline: "Egypt's premier platform connecting patients with verified, top-rated medical professionals.",
        phone: '+20 100 000 0000',
        email: 'support@doctorscares.eg',
        address: 'New Cairo, Egypt',
        copyrightText: '© 2026 DoctorsCares | All Rights Reserved',
        privacyLink: '#',
        termsLink: '#',
        socialLinks: [
            { label: 'Facebook', url: '#', icon: 'fab fa-facebook-f' },
            { label: 'Instagram', url: '#', icon: 'fab fa-instagram' },
            { label: 'LinkedIn', url: '#', icon: 'fab fa-linkedin-in' },
            { label: 'Twitter', url: '#', icon: 'fab fa-twitter' },
        ],
    },
};

const DEFAULT_SERVICES = [
    {
        title: 'Emergency Care',
        description: '24/7 rapid response teams ready for any critical medical situation, around the clock.',
        icon: 'ambulance',
        link: '#',
        sortOrder: 0,
    },
    {
        title: 'Telehealth',
        description: 'Consult with top specialists from the comfort and safety of your own home.',
        icon: 'video',
        link: '#',
        sortOrder: 1,
    },
    {
        title: 'Pharmacy',
        description: 'Order prescribed medicine online with fast, reliable doorstep delivery.',
        icon: 'pills',
        link: '#',
        sortOrder: 2,
    },
    {
        title: 'Medical Records',
        description: 'Securely store and access your complete health history anytime, anywhere.',
        icon: 'file-medical-alt',
        link: '#',
        sortOrder: 3,
    },
];

const DEFAULT_BLOGS = [
    {
        title: 'The Power of Antioxidants',
        excerpt: 'Learn how certain foods can dramatically boost your immune system and protect your body naturally.',
        imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80',
        tag: 'Nutrition',
        publishedAt: new Date('2026-04-01'),
        featured: false,
        sortOrder: 0,
    },
    {
        title: 'Heart Health Essentials',
        excerpt: 'Top 5 cardio exercises recommended by leading Egyptian cardiologists for a stronger heart.',
        imageUrl: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=600&q=80',
        tag: 'Cardiology',
        publishedAt: new Date('2026-03-01'),
        featured: true,
        sortOrder: 1,
    },
    {
        title: 'Managing Stress in 2026',
        excerpt: 'Proven techniques from psychiatrists to manage stress and improve your overall wellbeing.',
        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
        tag: 'Mental Health',
        publishedAt: new Date('2026-02-01'),
        featured: false,
        sortOrder: 2,
    },
];

const DEFAULT_TESTIMONIALS = [
    {
        quote: 'Booking was incredibly easy. I found a cardiologist and had a confirmed appointment within minutes. Truly life-changing.',
        authorName: 'Rana Mostafa',
        authorMeta: 'Patient since 2024',
        authorImage: 'https://randomuser.me/api/portraits/women/68.jpg',
        featured: false,
        sortOrder: 0,
    },
    {
        quote: 'The telehealth feature is phenomenal. I consulted with a top neurologist from home. The quality of care was exceptional.',
        authorName: 'Khaled Ibrahim',
        authorMeta: 'Patient since 2023',
        authorImage: 'https://randomuser.me/api/portraits/men/54.jpg',
        featured: true,
        sortOrder: 1,
    },
    {
        quote: 'I love how all my records are in one place. The doctors are verified and professional. This platform is a game-changer.',
        authorName: 'Dina Farouk',
        authorMeta: 'Patient since 2025',
        authorImage: 'https://randomuser.me/api/portraits/women/12.jpg',
        featured: false,
        sortOrder: 2,
    },
];

function formatBlogDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatCount(n) {
    if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
    return `${n}+`;
}

async function getSitePage(slug) {
    let page = await SitePage.findOne({ slug }).lean();
    if (!page) {
        page = { slug, ...DEFAULT_PAGES[slug] };
    }
    return page;
}

async function getLivePlatformStats() {
    const [doctorCount, patientCount, doctors] = await Promise.all([
        Doctor.countDocuments({ verified: true, suspended: { $ne: true } }),
        User.countDocuments({ role: 'patient', isActive: true }),
        Doctor.find({ verified: true, suspended: { $ne: true } }).select('rating').lean(),
    ]);

    const avg =
        doctors.length > 0
            ? (doctors.reduce((sum, d) => sum + (d.rating || 5), 0) / doctors.length).toFixed(1)
            : '4.9';

    return [
        { value: formatCount(doctorCount || 1), label: 'Verified Doctors' },
        { value: formatCount(patientCount || 1), label: 'Happy Patients' },
        { value: `${avg}★`, label: 'Average Rating' },
    ];
}

async function resolveHomeStats(home) {
    if (home.useLiveStats !== false) {
        return getLivePlatformStats();
    }
    if (home.stats?.length) return home.stats;
    return getLivePlatformStats();
}

async function getActiveTestimonials() {
    const items = await Testimonial.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
    return items.length ? items : DEFAULT_TESTIMONIALS;
}

async function getActiveServices() {
    const items = await ServiceItem.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
    if (items.length) return items;
    return DEFAULT_SERVICES;
}

async function getPublishedBlogs() {
    const posts = await BlogPost.find({ isPublished: true })
        .sort({ sortOrder: 1, publishedAt: -1 })
        .lean();
    return posts.length ? posts : DEFAULT_BLOGS;
}

async function getFooterData() {
    const [footer, specialties] = await Promise.all([
        getSitePage('footer'),
        Specialty.find().sort({ name: 1 }).limit(6).lean(),
    ]);

    return {
        tagline: footer.tagline || DEFAULT_PAGES.footer.tagline,
        phone: footer.phone || DEFAULT_PAGES.footer.phone,
        email: footer.email || DEFAULT_PAGES.footer.email,
        address: footer.address || DEFAULT_PAGES.footer.address,
        copyrightText: footer.copyrightText || DEFAULT_PAGES.footer.copyrightText,
        privacyLink: footer.privacyLink || '#',
        termsLink: footer.termsLink || '#',
        socialLinks: footer.socialLinks?.length ? footer.socialLinks : DEFAULT_PAGES.footer.socialLinks,
        specialties: specialties.map((s) => ({ name: s.name, slug: s.slug })),
    };
}

async function getHomePageData() {
    const home = await getSitePage('home');
    const [stats, testimonials] = await Promise.all([resolveHomeStats(home), getActiveTestimonials()]);

    return {
        home: {
            ...home,
            stats,
            heroCards: home.heroCards?.length ? home.heroCards : DEFAULT_PAGES.home.heroCards,
        },
        testimonials,
    };
}

async function getContactPageData() {
    const contact = await getSitePage('contact');
    return { contact };
}

async function getAboutPageData() {
    const about = await getSitePage('about');
    return { about };
}

async function getServicesPageData() {
    const [page, services] = await Promise.all([getSitePage('services'), getActiveServices()]);
    return { page, services };
}

async function getBlogsPageData() {
    const [page, blogs] = await Promise.all([getSitePage('blogs'), getPublishedBlogs()]);
    return {
        page,
        blogs: blogs.map((b) => ({ ...b, dateLabel: formatBlogDate(b.publishedAt) })),
    };
}

async function getAdminContentData(pageKey) {
    const about = await getSitePage('about');
    const servicesPage = await getSitePage('services');
    const blogsPage = await getSitePage('blogs');
    const homePage = await getSitePage('home');
    const contactPage = await getSitePage('contact');
    const footerPage = await getSitePage('footer');

    const [services, blogs, testimonials, contactMessages] = await Promise.all([
        ServiceItem.find().sort({ sortOrder: 1, createdAt: 1 }).lean(),
        BlogPost.find().sort({ sortOrder: 1, publishedAt: -1 }).lean(),
        Testimonial.find().sort({ sortOrder: 1, createdAt: 1 }).lean(),
        ContactMessage.find().sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    const base = {
        aboutPage: about,
        servicesPage,
        blogsPage,
        homePage,
        contactPage,
        footerPage,
        serviceItems: services,
        blogPosts: blogs.map((b) => ({
            ...b,
            id: b._id.toString(),
            dateLabel: formatBlogDate(b.publishedAt),
            dateInput: b.publishedAt
                ? new Date(b.publishedAt).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10),
        })),
        testimonialItems: testimonials.map((t) => ({ ...t, id: t._id.toString() })),
        contactMessages: contactMessages.map((m) => ({
            ...m,
            id: m._id.toString(),
            dateLabel: new Date(m.createdAt).toLocaleString('en-EG'),
        })),
    };

    if (pageKey === 'content-home') {
        base.liveStats = await getLivePlatformStats();
    }

    return base;
}

module.exports = {
    DEFAULT_PAGES,
    DEFAULT_SERVICES,
    DEFAULT_BLOGS,
    DEFAULT_TESTIMONIALS,
    formatBlogDate,
    getSitePage,
    getLivePlatformStats,
    getActiveServices,
    getPublishedBlogs,
    getActiveTestimonials,
    getFooterData,
    getHomePageData,
    getContactPageData,
    getAboutPageData,
    getServicesPageData,
    getBlogsPageData,
    getAdminContentData,
};

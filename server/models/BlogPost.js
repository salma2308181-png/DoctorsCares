const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        excerpt: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        tag: { type: String, default: 'Health' },
        link: { type: String, default: '#' },
        publishedAt: { type: Date, default: Date.now },
        featured: { type: Boolean, default: false },
        sortOrder: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('BlogPost', blogPostSchema);

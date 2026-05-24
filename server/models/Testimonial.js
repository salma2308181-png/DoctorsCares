const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
    {
        quote: { type: String, required: true },
        authorName: { type: String, required: true },
        authorMeta: { type: String, default: '' },
        authorImage: { type: String, default: '' },
        featured: { type: Boolean, default: false },
        sortOrder: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);

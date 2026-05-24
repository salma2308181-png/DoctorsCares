const mongoose = require('mongoose');

const specialtySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, required: true, unique: true },
        icon: { type: String, default: 'fa-stethoscope' },
        iconBg: { type: String, default: '#dbeafe' },
        iconColor: { type: String, default: '#2563eb' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Specialty', specialtySchema);

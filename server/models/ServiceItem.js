const mongoose = require('mongoose');

const serviceItemSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        icon: { type: String, default: 'stethoscope' },
        link: { type: String, default: '#' },
        sortOrder: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ServiceItem', serviceItemSchema);

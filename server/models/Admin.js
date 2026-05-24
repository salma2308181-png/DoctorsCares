const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        department: { type: String, trim: true, default: 'Operations' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);

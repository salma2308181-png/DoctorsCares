const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        body: { type: String, required: true },
        audience: {
            type: String,
            enum: ['all', 'doctors', 'patients'],
            default: 'all',
        },
        channel: { type: String, enum: ['in-app', 'email', 'sms'], default: 'in-app' },
        status: { type: String, enum: ['draft', 'sent'], default: 'sent' },
        sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);

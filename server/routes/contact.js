const express = require('express');
const { ContactMessage } = require('../models');

const router = express.Router();

router.post('/contact', async (req, res) => {
    const { fullName, email, subject, message } = req.body;

    if (!fullName?.trim() || !email?.trim() || !message?.trim()) {
        return res.redirect('/contact?error=' + encodeURIComponent('Please fill in name, email, and message.'));
    }

    try {
        await ContactMessage.create({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            subject: subject?.trim() || '',
            message: message.trim(),
        });
        return res.redirect('/contact?success=' + encodeURIComponent('Thank you! We received your message.'));
    } catch (err) {
        return res.redirect('/contact?error=' + encodeURIComponent(err.message || 'Could not send message.'));
    }
});

module.exports = router;

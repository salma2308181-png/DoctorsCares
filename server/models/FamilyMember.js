const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema(
    {
        accountHolder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        fullName: { type: String, required: true, trim: true },
        relationship: {
            type: String,
            enum: ['father', 'mother', 'child', 'spouse', 'other'],
            required: true,
        },
        gender: { type: String, enum: ['Male', 'Female', ''], default: '' },
        dateOfBirth: { type: Date },
        bloodType: { type: String, default: '' },
        primaryCondition: { type: String, default: '' },
    },
    { timestamps: true }
);

familyMemberSchema.index({ accountHolder: 1 });

module.exports = mongoose.model('FamilyMember', familyMemberSchema);

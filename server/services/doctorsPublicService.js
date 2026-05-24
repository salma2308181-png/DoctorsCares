const { Doctor, User } = require('../models');

function doctorAvatarUrl(name, size = 128) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Doctor')}&background=2563eb&color=fff&size=${size}`;
}

async function getPublicDoctors() {
    const doctors = await Doctor.find({ verified: true, suspended: { $ne: true } })
        .populate('user', 'fullName isActive')
        .lean();

    return doctors
        .filter((d) => d.user?.isActive !== false)
        .map((d) => {
            const years = d.yearsExperience || 0;
            return {
                id: d.user._id.toString(),
                name: d.user.fullName,
                title: d.title || 'Specialist',
                specialty: d.specialty,
                gender: d.gender || '',
                price: d.consultationPrice || d.inClinicFee || 600,
                location: d.location || '',
                rate: Math.round(d.rating || 5),
                reviewCount: d.reviewCount || 0,
                img: doctorAvatarUrl(d.user.fullName, 200),
                experience: years ? `${years} yrs exp` : 'Experienced',
                available: true,
            };
        });
}

module.exports = { getPublicDoctors };

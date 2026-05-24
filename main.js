const doctors = [
    {
        name: "Dr. Hassan Mahmoud", title: "Professor", specialty: "Cardiology",
        gender: "Male", price: 600, location: "New Cairo", rate: 5,
        img: "https://randomuser.me/api/portraits/men/32.jpg",
        experience: "18 yrs exp", available: true
    },
    {
        name: "Dr. Layla Zaki", title: "Consultant", specialty: "Dermatology",
        gender: "Female", price: 450, location: "Maadi", rate: 4,
        img: "https://randomuser.me/api/portraits/women/44.jpg",
        experience: "12 yrs exp", available: true
    },
    {
        name: "Dr. Sherif Omar", title: "Specialist", specialty: "Orthopedics",
        gender: "Male", price: 300, location: "Nasr City", rate: 5,
        img: "https://randomuser.me/api/portraits/men/85.jpg",
        experience: "9 yrs exp", available: false
    },
    {
        name: "Dr. Nour El-Din", title: "Professor", specialty: "Neurology",
        gender: "Male", price: 850, location: "Zamalek", rate: 5,
        img: "https://randomuser.me/api/portraits/men/22.jpg",
        experience: "22 yrs exp", available: true
    },
    {
        name: "Dr. Sara Ahmed", title: "Consultant", specialty: "Pediatrics",
        gender: "Female", price: 400, location: "Heliopolis", rate: 5,
        img: "https://randomuser.me/api/portraits/women/26.jpg",
        experience: "14 yrs exp", available: true
    },
    {
        name: "Dr. Tarek Saleh", title: "Specialist", specialty: "Ophthalmology",
        gender: "Male", price: 350, location: "6th of October", rate: 4,
        img: "https://randomuser.me/api/portraits/men/67.jpg",
        experience: "7 yrs exp", available: true
    }
];

$(document).ready(function () {

    // ─── Header scroll effect ───────────────────────────────
    $(window).on('scroll', function () {
        if ($(this).scrollTop() > 60) {
            $('#main-header').addClass('scrolled');
        } else {
            $('#main-header').removeClass('scrolled');
        }
    });

    // ─── Render Doctor Cards ─────────────────────────────────
    function renderStars(rate) {
        return '★'.repeat(rate) + '☆'.repeat(5 - rate);
    }

    function displayDoctors(data) {
        $('#results-count').text(`Showing ${data.length} specialist${data.length !== 1 ? 's' : ''}`);
        if (!data.length) {
            $('#doctor-list').html(`
                <div style="grid-column:1/-1; text-align:center; padding:6rem 2rem;">
                    <i class="fas fa-user-md" style="font-size:5rem; color:#cbd5e1; margin-bottom:2rem; display:block;"></i>
                    <p style="font-size:1.8rem; color:#94a3b8; font-weight:500;">No doctors match your filters.</p>
                    <p style="font-size:1.5rem; color:#cbd5e1; margin-top:0.8rem;">Try adjusting or clearing the filters.</p>
                </div>
            `);
            return;
        }
        let cards = '';
        data.forEach(dr => {
            cards += `
            <div class="dr-card" data-name="${dr.name}" data-specialty="${dr.specialty}" data-price="${dr.price}">
                ${dr.available ? `<div class="dr-badge">Available</div>` : `<div class="dr-badge" style="background:#fef3c7;color:#92400e;">Busy</div>`}
                <div class="dr-top">
                    <div class="dr-avatar">
                        <img src="${dr.img}" alt="${dr.name}" loading="lazy">
                        ${dr.available ? `<span class="dr-online"></span>` : ''}
                    </div>
                    <div>
                        <h3 class="dr-name">${dr.name}</h3>
                        <p class="dr-specialty">${dr.specialty}</p>
                        <div class="dr-rating">
                            <span class="stars">${renderStars(dr.rate)}</span>
                            <span>${dr.rate}.0 (${Math.floor(Math.random() * 900 + 100)} reviews)</span>
                        </div>
                    </div>
                </div>
                <div class="dr-divider"></div>
                <div class="dr-details">
                    <p><i class="fas fa-certificate"></i> ${dr.title}</p>
                    <p><i class="fas fa-briefcase-medical"></i> ${dr.experience}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${dr.location}</p>
                    <p><i class="fas fa-${dr.gender === 'Male' ? 'mars' : 'venus'}"></i> ${dr.gender}</p>
                </div>
                <div class="dr-footer">
                    <div class="dr-price-wrap">
                        <div class="dr-price-label">Consultation</div>
                        <div class="dr-price">${dr.price} <span>EGP</span></div>
                    </div>
                    <button class="btn-book book-btn" 
                        data-name="${dr.name}" 
                        data-specialty="${dr.specialty}" 
                        data-price="${dr.price}"
                        data-img="${dr.img}"
                        ${!dr.available ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
                        <i class="fas fa-calendar-check"></i> Book
                    </button>
                </div>
            </div>`;
        });
        $('#doctor-list').html(cards);

        // Animate cards in
        $('.dr-card').each(function (i) {
            $(this).css({ opacity: 0, transform: 'translateY(20px)' });
            setTimeout(() => {
                $(this).css({ opacity: 1, transform: 'translateY(0)', transition: 'all 0.4s ease' });
            }, i * 80);
        });
    }

    displayDoctors(doctors);

    // ─── Filtering Logic ─────────────────────────────────────
    function getFilters() {
        return {
            title: $('#filter-title').val(),
            gender: $('input[name="gender"]:checked').val(),
            price: parseInt($('#filter-price').val()),
            rating: parseInt($('.star-btn.active').data('rating')) || 0,
            search: $('#search-input').val().toLowerCase().trim()
        };
    }

    function applyFilters() {
        const f = getFilters();
        const filtered = doctors.filter(dr => {
            return (
                (f.title === 'all' || dr.title === f.title) &&
                (f.gender === 'all' || dr.gender === f.gender) &&
                (dr.price <= f.price) &&
                (dr.rate >= f.rating) &&
                (!f.search || dr.name.toLowerCase().includes(f.search) || dr.specialty.toLowerCase().includes(f.search))
            );
        });
        displayDoctors(filtered);
    }

    // Debounce search
    let searchTimer;
    $('#search-input').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(applyFilters, 300);
    });

    $('#filter-price').on('input', function () {
        $('#price-value').text($(this).val() + ' EGP');
        applyFilters();
    });

    $('#filter-title').on('change', applyFilters);
    $('input[name="gender"]').on('change', applyFilters);

    $('.star-btn').on('click', function () {
        $('.star-btn').removeClass('active');
        $(this).addClass('active');
        applyFilters();
    });

    $('#reset-filters').on('click', function () {
        $('#filter-title').val('all');
        $('input[name="gender"][value="all"]').prop('checked', true);
        $('#filter-price').val(1000);
        $('#price-value').text('1000 EGP');
        $('#search-input').val('');
        $('.star-btn').removeClass('active');
        $('.star-btn[data-rating="0"]').addClass('active');
        displayDoctors(doctors);
    });

    // ─── Booking Modal ───────────────────────────────────────
    $(document).on('click', '.book-btn', function () {
        const name = $(this).data('name');
        const specialty = $(this).data('specialty');
        const price = $(this).data('price');
        const img = $(this).data('img');

        $('#modal-doctor-info').html(`
            <img src="${img}" alt="${name}">
            <div>
                <strong style="font-size:1.6rem">${name}</strong>
                <span style="display:block;color:var(--primary);font-weight:700;font-size:1.3rem">${specialty}</span>
                <span style="font-size:1.3rem;color:var(--text-muted)">Fee: ${price} EGP</span>
            </div>
        `);

        // Set min date to today
        const today = new Date().toISOString().split('T')[0];
        $('.modal-form input[type="date"]').attr('min', today);

        $('#booking-modal').addClass('active');
        $('body').css('overflow', 'hidden');
    });

    $('#close-modal, .modal-overlay').on('click', function (e) {
        if ($(e.target).is('.modal-overlay') || $(e.target).is('#close-modal') || $(e.target).closest('#close-modal').length) {
            closeModal();
        }
    });

    $('.modal').on('click', function (e) { e.stopPropagation(); });

    function closeModal() {
        $('#booking-modal').removeClass('active');
        $('body').css('overflow', '');
    }

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });

    // ─── Modal Form Submit ───────────────────────────────────
    $('.modal-form').on('submit', function (e) {
        e.preventDefault();
        const btn = $(this).find('button[type="submit"]');
        btn.html('<i class="fas fa-spinner fa-spin"></i> Booking...').prop('disabled', true);
        setTimeout(() => {
            closeModal();
            showToast('Appointment booked successfully! You will receive a confirmation shortly.', 'success');
            btn.html('<i class="fas fa-check-circle"></i> Confirm Booking').prop('disabled', false);
        }, 1800);
    });

    // ─── Contact Form Submit ─────────────────────────────────
    $('.contact-form').on('submit', function (e) {
        e.preventDefault();
        const btn = $(this).find('button[type="submit"]');
        btn.html('<i class="fas fa-spinner fa-spin"></i> Sending...').prop('disabled', true);
        setTimeout(() => {
            showToast('Message sent! We\'ll get back to you within 24 hours.', 'success');
            this.reset();
            btn.html('<i class="fas fa-paper-plane"></i> Send Message').prop('disabled', false);
        }, 1500);
    });

    // ─── Toast Notification ──────────────────────────────────
    function showToast(msg, type = 'success') {
        const toast = $(`
            <div style="
                position:fixed; bottom:3rem; right:3rem; z-index:99999;
                background:${type === 'success' ? '#10b981' : '#ef4444'};
                color:#fff; padding:1.8rem 2.5rem;
                border-radius:1.2rem;
                box-shadow:0 10px 40px rgba(0,0,0,0.2);
                font-size:1.5rem; font-weight:600;
                display:flex; align-items:center; gap:1.2rem;
                max-width:40rem; font-family:'DM Sans',sans-serif;
                transform:translateX(120%); transition:transform 0.4s cubic-bezier(0.4,0,0.2,1);
            ">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}" style="font-size:2rem;"></i>
                ${msg}
            </div>
        `);
        $('body').append(toast);
        setTimeout(() => toast.css('transform', 'translateX(0)'), 50);
        setTimeout(() => {
            toast.css('transform', 'translateX(120%)');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    // ─── Auth Toggles ────────────────────────────────────────
    $('#to-signup').on('click', function (e) {
        e.preventDefault();
        $('.login-form').fadeOut(200, function () { $('.signup-form').fadeIn(200); });
    });
    $('#to-login').on('click', function (e) {
        e.preventDefault();
        $('.signup-form').fadeOut(200, function () { $('.login-form').fadeIn(200); });
    });

    // ─── Mobile Menu ─────────────────────────────────────────
    $('#menu-btn').on('click', function () {
        $('.navbar').toggleClass('active');
    });
    $('.navbar a').on('click', function () {
        $('.navbar').removeClass('active');
    });

    // ─── Scroll Reveal ───────────────────────────────────────
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.service-card, .testimonial-card, .blog-card, .check-list li').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
     const fullName = document.getElementById("fullName");
    const mobile = document.getElementById("mobile");

    // Full Name validation message
    if (fullName) {
        fullName.addEventListener("invalid", function () {
            if (fullName.validity.valueMissing) {
                fullName.setCustomValidity("Please fill in this field.");
            } else if (fullName.validity.patternMismatch) {
                fullName.setCustomValidity("Only letters are allowed.");
            }
        });
        fullName.addEventListener("input", function () {
            fullName.setCustomValidity("");
        });
    }

    // Mobile validation
    if (mobile) {
        mobile.addEventListener("invalid", function () {
            if (mobile.validity.valueMissing) {
                mobile.setCustomValidity("Please fill in this field.");
            } else if (mobile.validity.patternMismatch) {
                mobile.setCustomValidity("Only numbers are allowed.");
            }
        });
        mobile.addEventListener("input", function () {
            mobile.setCustomValidity("");
        });
    } 
});

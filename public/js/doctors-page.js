/* Find Doctors page — filters client-side; data from server (window.__DOCTORS__) */

(function () {
    const doctors = window.__DOCTORS__ || [];

    function renderStars(rate) {
        const r = Math.min(5, Math.max(0, rate));
        return '★'.repeat(r) + '☆'.repeat(5 - r);
    }

    function displayDoctors(data) {
        const $list = $('#doctor-list');
        const $count = $('#results-count');
        $count.text(`Showing ${data.length} specialist${data.length !== 1 ? 's' : ''}`);

        if (!data.length) {
            $list.html(`
                <div style="grid-column:1/-1;text-align:center;padding:6rem 2rem;">
                    <i class="fas fa-user-md" style="font-size:5rem;color:#cbd5e1;margin-bottom:2rem;display:block;"></i>
                    <p style="font-size:1.8rem;color:#94a3b8;">No doctors match your filters.</p>
                </div>
            `);
            return;
        }

        let cards = '';
        data.forEach((dr) => {
            cards += `
            <div class="dr-card">
                <div class="dr-badge">Available</div>
                <div class="dr-top">
                    <div class="dr-avatar">
                        <img src="${dr.img}" alt="${dr.name}" loading="lazy">
                        <span class="dr-online"></span>
                    </div>
                    <div>
                        <h3 class="dr-name">${dr.name}</h3>
                        <p class="dr-specialty">${dr.specialty}</p>
                        <div class="dr-rating">
                            <span class="stars">${renderStars(dr.rate)}</span>
                            <span>${dr.rate}.0 (${dr.reviewCount} reviews)</span>
                        </div>
                    </div>
                </div>
                <div class="dr-divider"></div>
                <div class="dr-details">
                    <p><i class="fas fa-certificate"></i> ${dr.title}</p>
                    <p><i class="fas fa-briefcase-medical"></i> ${dr.experience}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${dr.location}</p>
                    ${dr.gender ? `<p><i class="fas fa-${dr.gender === 'Male' ? 'mars' : 'venus'}"></i> ${dr.gender}</p>` : ''}
                </div>
                <div class="dr-footer">
                    <div class="dr-price-wrap">
                        <div class="dr-price-label">Consultation</div>
                        <div class="dr-price">${dr.price} <span>EGP</span></div>
                    </div>
                    <button type="button" class="btn-book book-btn"
                        data-id="${dr.id}"
                        data-name="${dr.name}"
                        data-specialty="${dr.specialty}"
                        data-price="${dr.price}"
                        data-img="${dr.img}">
                        <i class="fas fa-calendar-check"></i> Book
                    </button>
                </div>
            </div>`;
        });
        $list.html(cards);
    }

    function getFilters() {
        return {
            title: $('#filter-title').val(),
            gender: $('input[name="gender"]:checked').val(),
            price: parseInt($('#filter-price').val(), 10),
            rating: parseInt($('.star-btn.active').data('rating'), 10) || 0,
            search: $('#search-input').val().toLowerCase().trim(),
        };
    }

    function applyFilters() {
        const f = getFilters();
        const filtered = doctors.filter((dr) => {
            return (
                (f.title === 'all' || dr.title === f.title) &&
                (f.gender === 'all' || dr.gender === f.gender) &&
                dr.price <= f.price &&
                dr.rate >= f.rating &&
                (!f.search ||
                    dr.name.toLowerCase().includes(f.search) ||
                    dr.specialty.toLowerCase().includes(f.search))
            );
        });
        displayDoctors(filtered);
    }

    $(document).ready(function () {
        displayDoctors(doctors);

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

        $(document).on('click', '.book-btn', function () {
            const id = $(this).data('id');
            const cfg = window.__BOOKING__ || {};
            if (!cfg.isPatient) {
                window.location.href = '/auth/login?next=' + encodeURIComponent('/doctors');
                return;
            }
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
            $('#book-doctor-id').val(id);
            const today = new Date().toISOString().split('T')[0];
            $('#book-date').attr('min', today).val(today);
            $('#booking-modal').addClass('active');
            $('body').css('overflow', 'hidden');
        });

        $('#close-modal, #booking-modal').on('click', function (e) {
            if ($(e.target).is('#booking-modal') || $(e.target).is('#close-modal') || $(e.target).closest('#close-modal').length) {
                $('#booking-modal').removeClass('active');
                $('body').css('overflow', '');
            }
        });
        $('.modal').on('click', function (e) {
            e.stopPropagation();
        });
    });
})();

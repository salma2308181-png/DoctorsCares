/* Patient dashboard — UI only; data from server */

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const dateEl = document.getElementById('today-date');
    if (dateEl) {
        dateEl.textContent = today.toLocaleDateString('en-EG', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    const greetingEl = document.getElementById('greeting-text');
    if (greetingEl) {
        const hour = today.getHours();
        const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
        const name = greetingEl.textContent.replace(/^Welcome,\s*/i, '').trim();
        greetingEl.textContent = `Good ${period}, ${name}`;
    }

    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
        document.getElementById('dash-sidebar')?.classList.toggle('open');
    });

    document.querySelectorAll('.appt-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.appt-tab').forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.dataset.filter;
            document.querySelectorAll('.appt-panel').forEach((p) => {
                p.style.display = 'none';
            });
            const panel = document.getElementById(`appt-panel-${filter}`);
            if (panel) panel.style.display = '';

            const url = new URL(window.location.href);
            url.searchParams.set('apptTab', filter);
            window.history.replaceState({}, '', url);
        });
    });

    const scrollToBook = () => {
        document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });
    };

    document.getElementById('btn-open-book')?.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        scrollToBook();
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('focus') === 'book' || window.__SCROLL_TO_BOOK__) {
        scrollToBook();
    }

    const apptTab = params.get('apptTab');
    if (apptTab) {
        document.querySelector(`.appt-tab[data-filter="${apptTab}"]`)?.click();
    }

    document.querySelectorAll('.dash-flash').forEach((flash) => {
        setTimeout(() => {
            flash.style.transition = 'opacity 0.4s';
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 400);
        }, 5000);
    });
});

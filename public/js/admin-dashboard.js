/* Admin dashboard — multi-page (sidebar links). Tabs, search, mobile sidebar only. */

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

const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('dash-sidebar');
if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        const root = btn.closest('.admin-page-content') || document;
        root.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        root.querySelectorAll('.tab-content').forEach((t) => t.classList.remove('active'));
        btn.classList.add('active');
        const tab = document.getElementById('tab-' + tabId);
        if (tab) tab.classList.add('active');
    });
});

document.querySelectorAll('.table-search').forEach((input) => {
    input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        const table = input.closest('.dash-card')?.querySelector('.admin-table tbody');
        if (!table) return;
        table.querySelectorAll('tr').forEach((row) => {
            const text = row.textContent.toLowerCase();
            row.style.display = !q || text.includes(q) ? '' : 'none';
        });
    });
});

const flash = document.querySelector('.dash-flash');
if (flash) {
    setTimeout(() => {
        flash.style.transition = 'opacity 0.4s';
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 400);
    }, 5000);
}

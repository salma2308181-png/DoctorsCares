/* Doctor dashboard — UI only; data comes from server-rendered HTML */

$(document).ready(function () {
    const now = new Date();
    $('#today-date').text(
        now.toLocaleDateString('en-EG', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
    );

    const hour = now.getHours();
    const greet = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    const name = $('#sidebar-name').text().replace(/^Dr\.?\s*/i, '');
    $('#greeting-text').text(`${greet}, ${name.startsWith('Dr') ? name : 'Dr. ' + name.split(' ')[0]}`);

    $('#sidebar-toggle').on('click', function () {
        $('#dash-sidebar').toggleClass('open');
    });

    $(document).on('click', '.appt-tab', function () {
        $('.appt-tab').removeClass('active');
        $(this).addClass('active');
        const filter = $(this).data('filter');
        $('.appt-panel').hide();
        $(`#appt-panel-${filter}`).show();
        const url = new URL(window.location.href);
        url.searchParams.set('apptTab', filter);
        window.history.replaceState({}, '', url);
    });

    $(document).on('click', '.period-tab', function () {
        $('.period-tab').removeClass('active');
        $(this).addClass('active');
        const period = $(this).data('period');
        $('.earnings-panel').hide();
        $(`#earn-panel-${period}`).show();
    });

    $(document).on('click', '.ptab', function () {
        const tab = $(this).data('ptab');
        $('.ptab').removeClass('active');
        $(this).addClass('active');
        $('.ptab-content').removeClass('active');
        $(`#ptab-${tab}`).addClass('active');
    });

    $(document).on('input', '#patient-search', function () {
        const q = $(this).val().toLowerCase();
        $('.patient-card').each(function () {
            const match = ($(this).data('search') || '').includes(q);
            $(this).toggle(match);
        });
    });

    const patients = JSON.parse($('#patients-json').text() || '[]');

    $(document).on('click', '.btn-patient-detail', function () {
        const id = $(this).data('patient-id');
        const p = patients.find((pt) => pt.id === id);
        if (!p) return;
        openPatientPanel(p);
    });

    $(document).on('click', '.btn-patient-note', function () {
        const id = $(this).data('patient-id');
        const name = $(this).data('patient-name');
        openNotesForm(`/doctor/patients/${id}/notes`, name);
    });

    $(document).on('click', '.btn-patient-history', function () {
        const id = $(this).data('patient-id');
        const name = $(this).data('patient-name');
        openHistoryForm(`/doctor/patients/${id}/history`, name);
    });

    $(document).on('click', '.btn-reschedule', function () {
        const id = $(this).data('appt-id');
        const patient = $(this).data('patient');
        const time = $(this).data('time');
        const slots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
        $('#appt-modal-content').html(`
            <div class="modal-header"><i class="fas fa-calendar-alt"></i><h2>Reschedule Appointment</h2></div>
            <form action="/doctor/appointments/${id}/reschedule" method="post">
                <p style="margin:1.5rem 0;"><strong>Patient:</strong> ${patient}</p>
                <div class="form-field-dash"><label>New Date</label><input type="date" name="newDate" class="dash-input" required></div>
                <div class="form-field-dash"><label>New Time</label>
                    <select name="newTime" class="dash-input">${slots.map((t) => `<option ${t === time ? 'selected' : ''}>${t}</option>`).join('')}</select>
                </div>
                <button type="submit" class="btn-primary-dash" style="width:100%;margin-top:1.5rem;justify-content:center;"><i class="fas fa-save"></i> Confirm Reschedule</button>
            </form>
        `);
        $('#appt-action-modal').addClass('active');
    });

    $(document).on('click', '.btn-open-notes', function () {
        const id = $(this).data('appt-id');
        const patient = $(this).data('patient');
        openNotesForm(`/doctor/appointments/${id}/notes`, patient);
    });

    $('#appt-modal-close, #appt-action-modal').on('click', function (e) {
        if (e.target === this) $('#appt-action-modal').removeClass('active');
    });
    $('#notes-modal-close, #notes-modal').on('click', function (e) {
        if (e.target === this) $('#notes-modal').removeClass('active');
    });
    $('#panel-close, #patient-detail-overlay').on('click', function (e) {
        if (e.target === this || $(e.target).closest('#panel-close').length) {
            $('#patient-detail-overlay').removeClass('open');
        }
    });

    $(document).on('change', '.day-active-cb', function () {
        const row = $(this).closest('.day-row');
        row.toggleClass('active', this.checked);
        $(this).siblings('.day-toggle').toggleClass('on', this.checked);
    });

    if ($('.dash-flash').length) {
        setTimeout(() => $('.dash-flash').fadeOut(400), 5000);
    }

    const params = new URLSearchParams(window.location.search);
    const apptTab = params.get('apptTab');
    if (apptTab && $(`.appt-tab[data-filter="${apptTab}"]`).length) {
        $(`.appt-tab[data-filter="${apptTab}"]`).trigger('click');
    }
});

function openHistoryForm(action, patientName) {
    $('#notes-modal-content').html(`
        <div class="modal-header"><i class="fas fa-route"></i><h2>Add Medical History</h2></div>
        <form action="${action}" method="post">
            <p style="margin:1.5rem 0;color:#64748b;">Patient: <strong>${patientName}</strong></p>
            <div class="form-field-dash"><label>Title</label><input type="text" name="title" class="dash-input" required placeholder="e.g. Blood test, Follow-up visit..."></div>
            <div class="form-field-dash"><label>Category</label>
                <select name="category" class="dash-input">
                    <option value="visit">Visit</option>
                    <option value="test">Test</option>
                    <option value="checkup">Checkup</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="procedure">Procedure</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="form-field-dash"><label>Date</label><input type="date" name="eventDate" class="dash-input" required></div>
            <div class="form-field-dash"><label>Provider (optional)</label><input type="text" name="provider" class="dash-input" placeholder="Clinic or doctor name"></div>
            <div class="form-field-dash"><label>Notes (optional)</label><textarea name="notes" class="dash-input" rows="4" placeholder="Additional details..."></textarea></div>
            <button type="submit" class="btn-primary-dash" style="width:100%;margin-top:1.5rem;justify-content:center;"><i class="fas fa-save"></i> Save History Entry</button>
        </form>
    `);
    $('#notes-modal').addClass('active');
}

function openNotesForm(action, patientName) {
    $('#notes-modal-content').html(`
        <div class="modal-header"><i class="fas fa-notes-medical"></i><h2>Clinical Notes</h2></div>
        <form action="${action}" method="post">
            <p style="margin:1.5rem 0;color:#64748b;">Patient: <strong>${patientName}</strong></p>
            <div class="form-field-dash"><label>Diagnosis / Assessment</label><input type="text" name="diagnosis" class="dash-input" required placeholder="e.g. Stable Angina..."></div>
            <div class="form-field-dash"><label>Clinical Notes</label><textarea name="notes" class="dash-input" rows="5" placeholder="Observations and recommendations..."></textarea></div>
            <div class="form-field-dash" style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;">
                <input type="checkbox" name="abnormalResult" id="abnormalResult" value="on">
                <label for="abnormalResult" style="margin:0;">Flag abnormal test result (high priority)</label>
            </div>
            <button type="submit" class="btn-primary-dash" style="width:100%;margin-top:1.5rem;justify-content:center;"><i class="fas fa-save"></i> Save Notes</button>
        </form>
    `);
    $('#notes-modal').addClass('active');
}

function openPatientPanel(p) {
    const historyHtml = (p.history || [])
        .map(
            (h) => `
        <div class="visit-history-item">
            <div class="visit-date"><i class="fas fa-calendar-alt"></i> ${h.date}</div>
            <div class="visit-diagnosis">${h.diagnosis}</div>
            <div class="visit-notes">${h.notes}</div>
        </div>`
        )
        .join('');

    $('#patient-detail-content').html(`
        <div class="patient-detail-header">
            <img src="${p.avatar}" alt="${p.name}" class="patient-detail-avatar">
            <div>
                <div class="patient-detail-name">${p.name}</div>
                <div class="patient-detail-sub">${p.age ? p.age + ' yrs · ' : ''}${p.gender} · Blood: ${p.blood}</div>
                <div class="patient-detail-sub"><i class="fas fa-phone"></i> ${p.phone || '—'}</div>
            </div>
        </div>
        <div class="patient-detail-section">
            <h4>Current Condition</h4>
            <div style="background:#f0f7ff;border-radius:1rem;padding:1.2rem;font-weight:600;color:#2563eb;">${p.condition}</div>
        </div>
        ${p.notes ? `<div class="patient-detail-section"><h4>Latest Notes</h4><p>${p.notes}</p></div>` : ''}
        <div class="patient-detail-section">
            <h4>Visit History (${(p.history || []).length})</h4>
            ${historyHtml || '<p style="color:#94a3b8;">No visit notes yet.</p>'}
        </div>
        <button type="button" class="btn-primary-dash btn-patient-note" data-patient-id="${p.id}" data-patient-name="${p.name}" style="width:100%;margin-top:1rem;justify-content:center;">
            <i class="fas fa-plus"></i> Add Visit Note
        </button>
        <button type="button" class="btn-outline-dash btn-patient-history" data-patient-id="${p.id}" data-patient-name="${p.name}" style="width:100%;margin-top:0.75rem;justify-content:center;">
            <i class="fas fa-route"></i> Add Medical History
        </button>
    `);
    $('#patient-detail-overlay').addClass('open');
}

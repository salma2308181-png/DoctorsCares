const CHRONIC_KEYWORDS = [
    'hypertension',
    'diabetes',
    'asthma',
    'heart',
    'cancer',
    'arthritis',
    'copd',
    'epilepsy',
    'kidney',
    'liver',
    'chronic',
];

function isChronicCondition(condition) {
    if (!condition || condition === 'General') return false;
    const c = condition.toLowerCase();
    return CHRONIC_KEYWORDS.some((k) => c.includes(k));
}

function daysSince(date) {
    if (!date) return 999;
    return Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000));
}

function computePatientPriority({ patientId, name, avatar, condition, appointments, visitNotes, familyConditions }) {
    const reasons = [];
    let score = 0;

    const completedAppts = appointments.filter(
        (a) => a.patient.toString() === patientId && a.status === 'completed'
    );
    const lastCompleted = completedAppts.sort(
        (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)
    )[0];
    const lastVisitDays = daysSince(lastCompleted?.appointmentDate);

    const patientNotes = visitNotes.filter((n) => n.patient.toString() === patientId);
    const hasAbnormal = patientNotes.some((n) => n.abnormalResult);
    const flaggedAppt = appointments.some(
        (a) => a.patient.toString() === patientId && a.flagged
    );

    const chronic =
        isChronicCondition(condition) ||
        (familyConditions || []).some((c) => isChronicCondition(c));

    if (chronic) {
        reasons.push('Chronic disease');
        score += 40;
    }
    if (lastVisitDays > 90 && completedAppts.length > 0) {
        reasons.push(`Missed follow-up (${lastVisitDays} days)`);
        score += 35;
    } else if (lastVisitDays > 60 && chronic) {
        reasons.push('Follow-up due soon');
        score += 20;
    }
    if (hasAbnormal || flaggedAppt) {
        reasons.push('Abnormal test result');
        score += 45;
    }

    const pendingCount = appointments.filter(
        (a) => a.patient.toString() === patientId && a.status === 'pending'
    ).length;
    if (pendingCount > 0 && score < 30) {
        reasons.push('Pending appointment request');
        score += 15;
    }

    let level = 'medium';
    let levelLabel = 'Medium Priority';
    if (score >= 45) {
        level = 'high';
        levelLabel = 'High Priority';
    } else if (score < 20) {
        level = 'low';
        levelLabel = 'Routine visit';
    }

    if (!reasons.length) {
        reasons.push('Routine check-up');
    }

    return {
        patientId,
        name,
        avatar,
        level,
        levelLabel,
        score,
        reasons,
        lastVisitDays: lastCompleted ? lastVisitDays : null,
        condition: condition || 'General',
    };
}

function rankPatients(patients, appointments, visitNotes, patientProfiles) {
    const ranked = patients.map((p) => {
        const profile = patientProfiles[p.id];
        return computePatientPriority({
            patientId: p.id,
            name: p.name,
            avatar: p.avatar,
            condition: profile?.primaryCondition || p.condition,
            appointments,
            visitNotes,
            familyConditions: [],
        });
    });

    ranked.sort((a, b) => b.score - a.score);

    return {
        highPriority: ranked.filter((p) => p.level === 'high'),
        mediumPriority: ranked.filter((p) => p.level === 'medium'),
        routine: ranked.filter((p) => p.level === 'low'),
        all: ranked,
    };
}

module.exports = { rankPatients, computePatientPriority, isChronicCondition };

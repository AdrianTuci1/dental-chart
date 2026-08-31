/**
 * Presentation helpers for the patient list. The API stores raw ISO strings and a
 * placeholder 'N/A' for exams that never happened, so every column formats through
 * here instead of printing storage values directly.
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EMPTY_EXAM_VALUES = new Set(['', 'n/a', 'na', 'null', 'undefined', 'no value']);

/**
 * ISO dates are parsed as local midnight so the printed day never shifts by a
 * timezone offset, which is what matters for a date of birth.
 */
export const parseIsoDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? '').trim());
    if (!match) {
        return null;
    }

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
};

export const formatIsoDate = (value) => {
    const date = parseIsoDate(value);
    if (!date) {
        return null;
    }

    return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
};

/** Whole years between the date of birth and today; null when the DOB is missing. */
export const getAgeFromBirthDate = (value, reference = new Date()) => {
    const date = parseIsoDate(value);
    if (!date || date.getTime() > reference.getTime()) {
        return null;
    }

    let age = reference.getFullYear() - date.getFullYear();
    const birthdayThisYear = new Date(reference.getFullYear(), date.getMonth(), date.getDate());

    if (birthdayThisYear > reference) {
        age -= 1;
    }

    return age >= 0 ? age : null;
};

/** Under two years reads better in months, which is the case that matters in paediatrics. */
export const describeAge = (value, reference = new Date()) => {
    const date = parseIsoDate(value);
    const years = getAgeFromBirthDate(value, reference);

    if (date === null || years === null) {
        return null;
    }

    if (years < 2) {
        const months = Math.max(0, (reference.getFullYear() - date.getFullYear()) * 12 + (reference.getMonth() - date.getMonth()));
        return months <= 1 ? 'under 1 month' : `${months} months`;
    }

    return `${years} yr`;
};

export const hasExamRecord = (value) => {
    const trimmed = String(value ?? '').trim();

    if (!trimmed || EMPTY_EXAM_VALUES.has(trimmed.toLowerCase())) {
        return false;
    }

    return parseIsoDate(trimmed) !== null;
};

/** "3 months ago" / "last month" / "today" - how stale the most recent exam is. */
export const describeTimeSince = (value, reference = new Date()) => {
    const date = parseIsoDate(value);
    if (!date) {
        return null;
    }

    const days = Math.round((reference.getTime() - date.getTime()) / 86400000);

    if (days < 0) {
        return 'scheduled';
    }

    if (days === 0) {
        return 'today';
    }

    if (days === 1) {
        return 'yesterday';
    }

    if (days < 31) {
        return `${days} days ago`;
    }

    const months = Math.round(days / 30.44);

    if (months < 12) {
        return months === 1 ? 'last month' : `${months} months ago`;
    }

    const years = months / 12;

    if (years < 1.5) {
        return 'last year';
    }

    return `${Math.round(years)} years ago`;
};

/**
 * Treatment plan items arrive as a plain array or wrapped in `{ items: [] }`
 * depending on where the patient was loaded from.
 */
export const getPlanItems = (patient) => {
    const plan = patient?.treatmentPlan;

    if (Array.isArray(plan)) {
        return plan;
    }

    return Array.isArray(plan?.items) ? plan.items : [];
};

/**
 * Replaces the status badge that used to say "Active" for every patient: what is
 * actually open on this patient's plan.
 */
export const getPlanSummary = (patient) => {
    const items = getPlanItems(patient);
    const planned = items.filter((item) => item?.status === 'planned').length;
    const monitoring = items.filter((item) => item?.status === 'monitoring').length;

    return { planned, monitoring, open: planned + monitoring };
};

export const describeGender = (value) => {
    const label = String(value ?? '').trim();
    return label ? label : null;
};

/** Sortable keys for the list; unknown dates sort last instead of jumping around. */
export const getSortValue = (patient, sortKey) => {
    if (sortKey === 'lastExam') {
        const date = parseIsoDate(patient?.lastExamDate);
        return date ? date.getTime() : -Infinity;
    }

    if (sortKey === 'plan') {
        return getPlanSummary(patient).open;
    }

    return String(patient?.name ?? '').trim().toLowerCase();
};

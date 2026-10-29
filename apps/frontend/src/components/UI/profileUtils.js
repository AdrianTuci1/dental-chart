export const getInitials = (name, email) => {
    const source = (name || '').trim();
    if (source) {
        const parts = source.split(/\s+/).filter(Boolean);
        return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'NV';
    }

    if (email) {
        return email.slice(0, 2).toUpperCase();
    }

    return 'NV';
};

export const getAvatarColor = (seed = '') => {
    const palette = ['#0ea5e9', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#14b8a6'];
    const input = String(seed || '');
    const hash = Array.from(input).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return palette[hash % palette.length];
};

export const getDisplayValue = (value) => {
    if (value === null || value === undefined) {
        return 'no value';
    }

    const normalized = String(value).trim();
    return normalized ? normalized : 'no value';
};

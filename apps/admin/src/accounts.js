export const accountStats = (accounts = []) => ({
    total: accounts.length,
    active: accounts.filter((account) => account.status !== 'disabled').length,
    disabled: accounts.filter((account) => account.status === 'disabled').length,
});

export const filterAccounts = (accounts = [], { search = '', status = 'all' } = {}) => {
    const term = search.trim().toLowerCase();

    return accounts.filter((account) => {
        if (status !== 'all' && account.status !== status) {
            return false;
        }

        if (!term) {
            return true;
        }

        return account.name?.toLowerCase().includes(term)
            || account.email?.toLowerCase().includes(term);
    });
};

export const formatDate = (value) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
};

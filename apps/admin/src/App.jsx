import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from './api';
import { accountStats, filterAccounts, formatDate } from './accounts';

const SESSION_KEY = 'pixtooth.admin.session';

const readSession = () => {
    try {
        return JSON.parse(window.localStorage.getItem(SESSION_KEY));
    } catch {
        return null;
    }
};

const persistSession = (session) => {
    if (session) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
        window.localStorage.removeItem(SESSION_KEY);
    }
};

const LoginScreen = ({ onSignedIn }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const result = await adminApi.login(email.trim(), password);
            onSignedIn({
                token: result.token,
                refreshToken: result.refreshToken,
                email: result.email,
                name: result.name,
            });
        } catch (loginError) {
            setError(loginError.message || 'Sign-in failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="login-shell">
            <section className="login-card">
                <div className="brand">
                    <span className="brand-mark">P</span>
                    <div>
                        <p className="brand-name">Pixtooth</p>
                        <p className="brand-subtitle">Platform administration</p>
                    </div>
                </div>

                <h1>Sign in to manage accounts</h1>
                <p className="muted">
                    Use the same credentials as the clinic app. Access requires an address
                    listed in <code>PLATFORM_ADMIN_EMAILS</code>.
                </p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="admin-email">E-mail</label>
                    <input
                        id="admin-email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />

                    <label htmlFor="admin-password">Password</label>
                    <input
                        id="admin-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />

                    {error ? <p className="form-error" role="alert">{error}</p> : null}

                    <button type="submit" className="primary" disabled={submitting}>
                        {submitting ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>

                <p className="login-footnote">
                    This application is separate from the clinic app and is never indexed
                    by search engines.
                </p>
            </section>
        </main>
    );
};

const StatCard = ({ label, value, tone }) => (
    <div className={`stat-card ${tone || ''}`}>
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
    </div>
);

const AccountsPanel = ({ session, onSignOut, onSessionChange }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [busyId, setBusyId] = useState(null);

    const callWithSession = useCallback(async (operation) => {
        try {
            return await operation(session.token);
        } catch (requestError) {
            if (requestError.status !== 401 || !session.refreshToken) {
                throw requestError;
            }

            const refreshed = await adminApi.refresh(session.refreshToken);
            const next = {
                ...session,
                token: refreshed.token,
                refreshToken: refreshed.refreshToken,
            };

            onSessionChange(next);
            return operation(refreshed.token);
        }
    }, [session, onSessionChange]);

    const loadAccounts = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            setAccounts(await callWithSession((token) => adminApi.listAccounts(token)));
        } catch (loadError) {
            if (loadError.status === 401) {
                onSignOut();
                return;
            }

            if (loadError.status === 403) {
                setError('This account is not a platform administrator. Add its e-mail to PLATFORM_ADMIN_EMAILS and restart the API.');
            } else {
                setError(loadError.message || 'Could not load accounts.');
            }
        } finally {
            setLoading(false);
        }
    }, [callWithSession, onSignOut]);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    const stats = useMemo(() => accountStats(accounts), [accounts]);
    const visibleAccounts = useMemo(
        () => filterAccounts(accounts, { search, status }),
        [accounts, search, status]
    );

    const replaceAccount = (updated) => {
        setAccounts((current) => current.map((account) => (
            account.id === updated.id ? updated : account
        )));
    };

    const handleToggle = async (account) => {
        const nextStatus = account.status === 'disabled' ? 'active' : 'disabled';

        if (nextStatus === 'disabled' && !window.confirm(`Disable ${account.email}? Existing sessions are revoked.`)) {
            return;
        }

        setBusyId(account.id);
        setError('');
        setMessage('');

        try {
            const updated = await callWithSession(
                (token) => adminApi.setStatus(token, account.id, nextStatus)
            );
            replaceAccount(updated);
            setMessage(`${updated.email} is now ${updated.status}.`);
        } catch (actionError) {
            setError(actionError.message || 'Could not update the account.');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (account) => {
        const confirmed = window.confirm(
            `Delete ${account.email}? This removes the account, its patients and its clinic memberships. This cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        setBusyId(account.id);
        setError('');
        setMessage('');

        try {
            await callWithSession((token) => adminApi.deleteAccount(token, account.id));
            setAccounts((current) => current.filter((entry) => entry.id !== account.id));
            setMessage(`${account.email} was deleted.`);
        } catch (actionError) {
            setError(actionError.message || 'Could not delete the account.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="admin-shell">
            <header className="topbar">
                <div className="brand">
                    <span className="brand-mark">P</span>
                    <div>
                        <p className="brand-name">Pixtooth</p>
                        <p className="brand-subtitle">Platform administration</p>
                    </div>
                </div>

                <div className="topbar-account">
                    <span>{session.name || session.email}</span>
                    <button type="button" className="ghost" onClick={onSignOut}>Sign out</button>
                </div>
            </header>

            <main className="admin-main">
                <div className="page-heading">
                    <div>
                        <h1>Accounts</h1>
                        <p className="muted">Every account created in this deployment.</p>
                    </div>
                    <button type="button" className="ghost" onClick={loadAccounts} disabled={loading}>
                        {loading ? 'Refreshing…' : 'Refresh'}
                    </button>
                </div>

                <section className="stats" aria-label="Account summary">
                    <StatCard label="Accounts" value={stats.total} />
                    <StatCard label="Active" value={stats.active} tone="is-positive" />
                    <StatCard label="Disabled" value={stats.disabled} tone="is-muted" />
                </section>

                <section className="panel">
                    <div className="toolbar">
                        <input
                            type="search"
                            placeholder="Search by name or e-mail"
                            aria-label="Search accounts"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        <select
                            aria-label="Filter by status"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="all">All statuses</option>
                            <option value="active">Active</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </div>

                    {error ? <p className="form-error" role="alert">{error}</p> : null}
                    {message ? <p className="form-success" role="status">{message}</p> : null}

                    {loading ? (
                        <p className="empty-state">Loading accounts…</p>
                    ) : visibleAccounts.length === 0 ? (
                        <p className="empty-state">No account matches the current filters.</p>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Account</th>
                                        <th>Status</th>
                                        <th>Plan</th>
                                        <th>Created</th>
                                        <th className="actions-column">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleAccounts.map((account) => (
                                        <tr key={account.id}>
                                            <td>
                                                <span className="account-name">{account.name}</span>
                                                <span className="account-email">{account.email}</span>
                                            </td>
                                            <td data-label="Status">
                                                <span className={`status ${account.status === 'disabled' ? 'is-disabled' : 'is-active'}`}>
                                                    {account.status === 'disabled' ? 'Disabled' : 'Active'}
                                                </span>
                                            </td>
                                            <td data-label="Plan">{account.subscriptionPlan || 'free'}</td>
                                            <td data-label="Created">{formatDate(account.createdAt)}</td>
                                            <td className="actions-column" data-label="Actions">
                                                <button
                                                    type="button"
                                                    className="ghost"
                                                    disabled={busyId === account.id}
                                                    onClick={() => handleToggle(account)}
                                                >
                                                    {account.status === 'disabled' ? 'Enable' : 'Disable'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="danger"
                                                    disabled={busyId === account.id}
                                                    onClick={() => handleDelete(account)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

const App = () => {
    const [session, setSession] = useState(readSession);

    const saveSession = (next) => {
        persistSession(next);
        setSession(next);
    };

    const signOut = useCallback(() => {
        saveSession(null);
    }, []);

    if (!session) {
        return <LoginScreen onSignedIn={saveSession} />;
    }

    return (
        <AccountsPanel
            session={session}
            onSignOut={signOut}
            onSessionChange={saveSession}
        />
    );
};

export default App;

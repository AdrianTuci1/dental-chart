
import { useAppStore } from '../../core/store/appStore';
import './History.css';
import React from 'react';

const History = ({ history }) => {
    const historicalDate = useAppStore(state => state.historicalDate);
    const allItems = history?.completedItems || [];

    const items = allItems.filter(item => {
        // Exclude periodontal measurement updates from history list
        if (item.type === 'periodontal') return false;

        if (!historicalDate) return true; // Show all to current date
        if (!item.date) return true;

        return new Date(item.date) <= new Date(historicalDate);
    });


    if (items.length === 0) {
        return (
            <div className="history-card">
                <p className="text-sm text-gray-500">No history available.</p>
            </div>
        );
    }

    // Group history by tooth and date
    const groupedHistory = items.reduce((acc, item) => {
        const toothKey = item.tooth || 'General';
        const dateKey = item.date || 'No Date';
        const compositeKey = `${toothKey}-${dateKey}`;

        if (!acc[compositeKey]) {
            acc[compositeKey] = {
                tooth: toothKey,
                date: dateKey,
                procedures: []
            };
        }
        acc[compositeKey].procedures.push(item);
        return acc;
    }, {});

    return (
        <div className="history-card">
            <div className="history-list">
                {Object.values(groupedHistory).sort((a, b) => new Date(b.date) - new Date(a.date)).map((group, index) => (
                    <div key={index} className="history-item">
                        <p className="history-description">
                            <span className="history-tooth-label">{group.tooth}, </span>
                            {group.procedures.map((p, idx) => (
                                <React.Fragment key={idx}>
                                    {p.description || p.procedure}
                                    {idx < group.procedures.length - 1 ? ', ' : ''}
                                </React.Fragment>
                            ))}
                        </p>
                        <p className="history-date">{group.date}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default History;

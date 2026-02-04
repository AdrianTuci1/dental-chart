
import './History.css';


import './History.css';

const History = ({ history }) => {
    const items = history?.completedItems || [];

    if (items.length === 0) {
        return (
            <div className="history-card">
                <p className="text-sm text-gray-500">No history available.</p>
            </div>
        );
    }

    return (
        <div className="history-card">
            <div className="history-list">
                {items.map((item, index) => (
                    <div key={index} className="history-item">
                        <p className="history-description">
                            {item.description || item.procedure}{item.date ? `, ${item.date}` : ''}
                        </p>
                        <p className="history-provider">{item.provider}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default History;

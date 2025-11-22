

import './TreatmentPlan.css';

const TreatmentPlan = ({ plan }) => {
    const treatments = plan?.items || [];

    const totalCost = treatments.reduce((sum, item) => item.status !== 'completed' ? sum + (item.cost || 0) : sum, 0);

    const getPriorityClass = (priority) => {
        switch (priority) {
            case 'urgent': return 'priority-urgent';
            case 'high': return 'priority-high';
            case 'medium': return 'priority-medium';
            default: return 'priority-low';
        }
    };

    return (
        <div className="treatment-plan-card">
            <div className="plan-header">
                <h3 className="plan-title">Treatment Plan</h3>
                <span className="plan-total">Total Proposed: ${totalCost}</span>
            </div>

            <div className="plan-list">
                {treatments.map((item) => (
                    <div key={item.id} className="plan-item">
                        <div className="item-details">
                            <div className={`priority-indicator ${getPriorityClass(item.priority)}`} />
                            <div>
                                <p className="item-text">
                                    {item.tooth ? `Tooth #${item.tooth} - ` : ''}{item.procedure}
                                </p>
                                <p className="item-status">{item.status}</p>
                            </div>
                        </div>
                        <div className="item-cost">
                            <p>${item.cost}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button className="add-procedure-btn">
                + Add Procedure
            </button>
        </div>
    );
};

export default TreatmentPlan;

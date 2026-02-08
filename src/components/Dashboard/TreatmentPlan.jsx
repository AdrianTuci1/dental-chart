

import { useNavigate, useParams } from 'react-router-dom';
import './TreatmentPlan.css';

const TreatmentPlan = ({ plan }) => {
    const navigate = useNavigate();
    const { patientId } = useParams();
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

    // Group treatments by tooth
    const groupedTreatments = treatments.reduce((acc, item) => {
        const toothKey = item.tooth || 'General';
        if (!acc[toothKey]) {
            acc[toothKey] = [];
        }
        acc[toothKey].push(item);
        return acc;
    }, {});

    return (
        <div className="treatment-plan-card">
            <div className="plan-list">
                {Object.entries(groupedTreatments).map(([tooth, items]) => (
                    <div
                        key={tooth}
                        className={`plan-item-grouped`}
                        onClick={() => {
                            if (tooth !== 'General') {
                                navigate(`/patients/${patientId}/tooth/${tooth}/restoration`);
                            }
                        }}
                    >
                        <div className="item-details">
                            <p className="item-text">
                                <span className="tooth-number-label">{tooth}, </span>
                                {items.map((item, index) => (
                                    <span key={item.id} className={`procedure-item ${item.status}`}>
                                        {item.procedure}
                                        {index < items.length - 1 ? ', ' : ''}
                                    </span>
                                ))}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TreatmentPlan;

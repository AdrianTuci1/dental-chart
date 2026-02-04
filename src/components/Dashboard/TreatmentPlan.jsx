

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

    return (
        <div className="treatment-plan-card">

            <div className="plan-list">
                {treatments.map((item) => (
                    <div
                        key={item.id}
                        className={`plan-item ${item.status}`}
                        onClick={() => {
                            if (item.tooth) {
                                navigate(`/patients/${patientId}/tooth/${item.tooth}/restoration`);
                            }
                        }}
                    >
                        <div className="item-details">
                            <p className="item-text">
                                {item.procedure}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default TreatmentPlan;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

const PeriodontalSection = () => {
    const navigate = useNavigate();

    return (
        <div className="section-card">
            <div className="section-header">
                <h2>Periodontal</h2>
                <button
                    onClick={() => navigate('periodontal')}
                    className="probing-btn"
                >
                    <PlusCircle size={16} /> PROBING
                </button>
            </div>
            <div className="perio-grid">
                {/* Mock Data for Periodontal - In real app, map from tooth.periodontal.sites */}
                {[
                    { label: 'Disto Lingual', val: 2, sub: 0, route: 'disto-lingual' },
                    { label: 'Lingual', val: 2, sub: 0, route: 'lingual' },
                    { label: 'Mesio Lingual', val: 1, sub: 0, route: 'mesio-lingual' },
                    { label: 'Disto Buccal', val: 1, sub: 0, route: 'disto-buccal' },
                    { label: 'Buccal', val: 1, sub: 0, route: 'buccal' },
                    { label: 'Mesio Buccal', val: 1, sub: 0, route: 'mesio-buccal' },
                ].map((site, idx) => (
                    <div
                        key={idx}
                        className="perio-card"
                        onClick={() => navigate(`periodontal/${site.route}`)}
                    >
                        <div className="perio-value">{site.val}</div>
                        <div className="perio-sub">{site.sub}</div>
                        <div className="perio-label">{site.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PeriodontalSection;

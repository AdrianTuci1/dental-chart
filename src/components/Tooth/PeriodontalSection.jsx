import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

const PeriodontalSection = () => {
    const navigate = useNavigate();
    const { tooth } = useOutletContext();

    // Map sites exactly as they were in the mock, but using real values
    const periodontalMap = [
        { key: 'distoLingual', label: 'Disto Lingual', route: 'disto-lingual' },
        { key: 'lingual', label: 'Lingual', route: 'lingual' },
        { key: 'mesioLingual', label: 'Mesio Lingual', route: 'mesio-lingual' },
        { key: 'distoBuccal', label: 'Disto Buccal', route: 'disto-buccal' },
        { key: 'buccal', label: 'Buccal', route: 'buccal' },
        { key: 'mesioBuccal', label: 'Mesio Buccal', route: 'mesio-buccal' },
    ];

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
                {periodontalMap.map((siteInfo, idx) => {
                    const siteData = tooth?.periodontal?.sites?.[siteInfo.key] || {};
                    const val = siteData.probingDepth !== undefined ? siteData.probingDepth : '-';
                    const sub = siteData.gingivalMargin !== undefined ? siteData.gingivalMargin : '-';

                    return (
                        <div
                            key={idx}
                            className="perio-card"
                            onClick={() => navigate(`periodontal/${siteInfo.route}`)}
                        >
                            <div className="perio-value">{val}</div>
                            <div className="perio-sub">{sub}</div>
                            <div className="perio-label">{siteInfo.label}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PeriodontalSection;

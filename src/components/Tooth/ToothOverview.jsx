import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { ChevronLeft, PlusCircle, RefreshCw, XCircle, Snowflake, Gavel, Hand, Flame, Zap } from 'lucide-react';
import useChartStore from '../../store/chartStore';
import './ToothOverview.css';

const ToothOverview = () => {
    const { tooth } = useOutletContext();
    const navigate = useNavigate();

    const getIcon = (test) => {
        switch (test) {
            case 'Cold': return <Snowflake size={16} className="endo-icon text-blue-400" />;
            case 'Percussion': return <Gavel size={16} className="endo-icon text-gray-500" />;
            case 'Palpation': return <Hand size={16} className="endo-icon text-orange-400" />;
            case 'Heat': return <Flame size={16} className="endo-icon text-red-500" />;
            case 'Electricity': return <Zap size={16} className="endo-icon text-yellow-500" />;
            default: return <Zap size={16} className="endo-icon" />;
        }
    };

    return (
        <div className="tooth-overview-container">
            {/* Top Half: Header & Status */}
            <div className="top-section">
                <div className="header-row">
                    <div className="header-left">
                        <h1 className="page-title">Dental</h1>
                    </div>
                    <div className="header-actions">
                        <button className="action-btn">
                            <RefreshCw size={16} /> RESET
                        </button>
                        <button className="action-btn">
                            <XCircle size={16} /> MISSING
                        </button>
                        <button className="action-btn">
                            <PlusCircle size={16} /> PATHOLOGY
                        </button>
                        <button className="action-btn">
                            <PlusCircle size={16} /> RESTORATION
                        </button>
                    </div>
                </div>

                <div className="status-message">
                    Currently there are no treatments pending
                </div>
            </div>

            {/* Bottom Half: Content Grid */}
            <div className="content-grid">
                {/* Endodontic Section (Left) */}
                <div className="section-card">
                    <div className="section-header">
                        <h2>Endodontic</h2>
                    </div>
                    <div className="endo-list">
                        {['Cold', 'Percussion', 'Palpation', 'Heat', 'Electricity'].map(test => (
                            <div key={test} className="endo-item">
                                <div className="endo-label">
                                    {getIcon(test)} {test}
                                </div>
                                <div className="endo-action">
                                    Test <ChevronLeft size={16} className="rotate-180 ml-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Periodontal Section (Right) */}
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
            </div>
        </div>
    );
};

export default ToothOverview;

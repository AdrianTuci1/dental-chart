import React, { useState, useRef, useEffect } from 'react';
import NormalView from './NormalView';
import { Upload, X } from 'lucide-react';
import DetectionsPanel from './DetectionsPanel';
import './ScanView.css';

const ScanView = ({ teeth, onToothClick, selectedTeeth, activeTooth }) => {
    const [scanImage, setScanImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Dynamic scaling logic
    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;

            const CHART_NATURAL_WIDTH = 1300;
            const CHART_NATURAL_HEIGHT = 700;

            const availableWidth = containerRef.current.clientWidth - 10;
            const availableHeight = containerRef.current.clientHeight - 10;

            const scaleX = availableWidth / CHART_NATURAL_WIDTH;
            const scaleY = availableHeight / CHART_NATURAL_HEIGHT;

            const newScale = Math.min(scaleX, scaleY, 1.8);
            setScale(Math.max(newScale, 0.7));
        };

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateScale);
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        updateScale();

        return () => resizeObserver.disconnect();
    }, [scanImage]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setIsProcessing(true);
                setProgress(0);

                // Simulate AI processing updates
                let currentProgress = 0;
                const interval = setInterval(() => {
                    currentProgress += Math.random() * 15;
                    if (currentProgress >= 100) {
                        currentProgress = 100;
                        clearInterval(interval);
                        setTimeout(() => {
                            setScanImage(event.target.result);
                            setIsProcessing(false);
                            setProgress(0);
                        }, 500);
                    }
                    setProgress(currentProgress);
                }, 200);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveImage = (e) => {
        e.stopPropagation();
        setScanImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const patientInfo = {
        name: "John Doe",
        dob: "15.05.1985",
        scans: [
            { id: 1, date: "03.02.2026", type: "Panoramic" },
            { id: 2, date: "15.11.2025", type: "Periapical" },
            { id: 3, date: "10.06.2025", type: "Panoramic" }
        ]
    };

    return (
        <div className="scan-view-container">
            {/* Topbar Section */}
            <div className="scan-view-topbar">
                <div className="patient-info">
                    <div className="info-group">
                        <span className="label">Patient</span>
                        <span className="value">{patientInfo.name}</span>
                    </div>
                    <div className="info-divider"></div>
                    <div className="info-group">
                        <span className="label">Born</span>
                        <span className="value">{patientInfo.dob}</span>
                    </div>
                </div>

                <div className="scan-selection">
                    <span className="label">Scan Date</span>
                    <select className="scan-date-select">
                        {patientInfo.scans.map(scan => (
                            <option key={scan.id} value={scan.id}>
                                {scan.date} ({scan.type})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="scan-view-main-layout">
                <div className="scan-view-content">
                    {/* Top Section: Scan Area */}
                    <div className={`scan-area ${!scanImage && !isProcessing ? 'scan-area-empty' : ''}`}>
                        {isProcessing ? (
                            <div className="scan-processing-state">
                                <div className="processing-content">
                                    <h3>Analyzing Scan...</h3>
                                    <div className="progress-container">
                                        <div
                                            className="progress-bar"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">{Math.round(progress)}% Complete</span>
                                </div>
                            </div>
                        ) : scanImage ? (
                            <div className="scan-image-container">
                                <img src={scanImage} alt="Dental Scan" className="scan-image" />
                                <button
                                    className="scan-remove-btn"
                                    onClick={handleRemoveImage}
                                    title="Remove scan"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="scan-upload-placeholder" onClick={handleUploadClick}>
                                <div className="scan-upload-icon-wrapper">
                                    <Upload size={32} />
                                </div>
                                <div className="upload-text">
                                    <h3>Upload Dental Scan</h3>
                                    <p>Select a panoramic or periapical X-ray</p>
                                </div>
                                <button className="btn-secondary">Choose File</button>
                            </div>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Bottom Section: NormalView without Occlusal */}
                    <div className="normal-view-container" ref={containerRef}>
                        <div
                            className="normal-view-scaler"
                            style={{
                                transform: `scale(${scale})`,
                                width: '1200px',
                            }}
                        >
                            <NormalView
                                teeth={teeth}
                                onToothClick={onToothClick}
                                selectedTeeth={selectedTeeth}
                                activeTooth={activeTooth}
                                upperJawViews={['number', 'frontal']}
                                lowerJawViews={['frontal', 'number']}
                                showWaves={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                {scanImage && (
                    <div className="scan-view-sidebar">
                        <DetectionsPanel />
                    </div>
                )}
            </div>

            {/* Footer Section - Full Width */}
            {scanImage && (
                <div className="scan-view-footer">
                    <div className="footer-left">
                        <button className="btn-secondary">Hide detections</button>
                    </div>

                    <div className="footer-center">
                        <label className="filter-checkbox">
                            <input type="checkbox" defaultChecked />
                            <span>Caries</span>
                        </label>
                        <label className="filter-checkbox">
                            <input type="checkbox" defaultChecked />
                            <span>Periapical radiolucency</span>
                        </label>
                        <label className="filter-checkbox">
                            <input type="checkbox" defaultChecked />
                            <span>Other detections</span>
                        </label>
                        <div className="filter-divider"></div>
                        <label className="filter-switch">
                            <span>Mandibular canal</span>
                            <div className="switch-track">
                                <div className="switch-thumb"></div>
                            </div>
                        </label>
                    </div>

                    <div className="footer-right">
                        <button className="btn-text">Save</button>
                        <button className="btn-primary">Confirm and generate report</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScanView;

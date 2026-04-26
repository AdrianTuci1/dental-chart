import React, { useRef, useEffect } from 'react';
import NormalView from './NormalView';
import { Upload, X, ChevronDown, Move, RotateCcw, RotateCw, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import DetectionsPanel from './DetectionsPanel';
import UnlockOverlay from '../../UI/UnlockOverlay';
import IndustrialSlider from '../../UI/IndustrialSlider';
import { useAppStore } from '../../../core/store/appStore';

import { AppFacade } from '../../../core/AppFacade';
import './ScanView.css';

const ScanView = ({ resolvedTeeth, onToothClick, selectedTeeth, activeTooth }) => {
    const {
        scanImage,
        detections,
        isProcessing,
        progress,
        overlayOpacity,
        isEditMode,
        isDragging,
        imageTransform
    } = useAppStore();

    const containerRef = useRef(null);
    const fileInputRef = useRef(null);
    const [chartScale, setChartScale] = React.useState(1);
    const [selectedScanId, setSelectedScanId] = React.useState(1);
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [showUnlockOverlay, setShowUnlockOverlay] = React.useState(() => {
        return localStorage.getItem('unlock_overlay_shown') !== 'true';
    });

    const handleCloseOverlay = () => {
        setShowUnlockOverlay(false);
        localStorage.setItem('unlock_overlay_shown', 'true');
    };
    const [showDetections, setShowDetections] = React.useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
    const [imageSize, setImageSize] = React.useState({ width: 0, height: 0 });
    const imgRef = useRef(null);

    // Scaling logic for the chart
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
            setChartScale(Math.max(newScale, 0.7));
        };

        const resizeObserver = new ResizeObserver(() => requestAnimationFrame(updateScale));
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        updateScale();
        return () => resizeObserver.disconnect();
    }, [scanImage]);

    // Global listeners for fluid dragging using Facade
    useEffect(() => {
        if (!isDragging || !isEditMode) return;

        const onMove = (e) => {
            const isTouch = e.type.startsWith('touch');
            const target = isTouch ? e.touches : e;
            if (isTouch && e.touches.length === 2) {
                AppFacade.scan.updateTouch(e.touches);
            } else {
                const clientX = isTouch ? e.touches[0].clientX : e.clientX;
                const clientY = isTouch ? e.touches[0].clientY : e.clientY;
                AppFacade.scan.updateDragging(clientX, clientY);
            }
        };

        const onEnd = () => AppFacade.scan.stopDragging();

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
        };
    }, [isDragging, isEditMode]);

    // Load real detections from JSON if image is loaded
    useEffect(() => {
        if (scanImage) {
            AppFacade.scan.loadDetections();
        }
    }, [scanImage]);

    const onImageLoad = (e) => {
        setImageSize({
            width: e.target.naturalWidth,
            height: e.target.naturalHeight
        });
    };

    const getLabelColor = (label) => {
        const colors = {
            'Filling': '#4DEEEA',     // Cyan
            'Fillings': '#4DEEEA',
            'Caries': '#FF3D00',      // Red
            'Cavity': '#FF3D00',
            'Crown': '#FFD700',       // Gold
            'Implant': '#7449FF',     // Purple
            'Missing teeth': '#94A3B8', // Grey/Slate
            'Root Canal Treatment': '#FF8A00', // Orange
            'impacted tooth': '#E8175D', // Crimson
            'Root Piece': '#363636',  // Dark Grey
            'Detection': '#4ADE80'    // Green (fallback)
        };
        // Standardize labels if they are capitalization-sensitive
        return colors[label] || colors['Detection'];
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                AppFacade.scan.startProcessing();
                let currentProgress = 0;
                const interval = setInterval(() => {
                    currentProgress += Math.random() * 15;
                    if (currentProgress >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            AppFacade.scan.setScanImage(event.target.result);
                            AppFacade.scan.stopProcessing();
                        }, 500);
                    }
                    AppFacade.scan.updateProgress(currentProgress);
                }, 200);
            };
            reader.readAsDataURL(file);
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

    const selectedScan = patientInfo.scans.find(s => s.id === selectedScanId);

    return (
        <div className="scan-view-container">
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
                    <div className="info-divider"></div>
                    <div className={`info-group scan-selection-group ${isDropdownOpen ? 'is-active' : ''}`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        <span className="label">Scan Date</span>
                        <div className="scan-value-container">
                            <span className="value">{selectedScan.date}</span>
                            <ChevronDown size={14} className={`dropdown-arrow ${isDropdownOpen ? 'is-open' : ''}`} />
                        </div>
                        {isDropdownOpen && (
                            <div className="scan-custom-dropdown">
                                {patientInfo.scans.map(scan => (
                                    <div key={scan.id} className={`scan-dropdown-item ${selectedScanId === scan.id ? 'is-selected' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setSelectedScanId(scan.id); setIsDropdownOpen(false); }}>
                                        <div className="item-main">
                                            <span className="item-date">{scan.date}</span>
                                            {selectedScanId === scan.id && <div className="selected-dot"></div>}
                                        </div>
                                        <span className="item-type">{scan.type}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="topbar-actions">
                    <button className="btn-request-access">Request access</button>
                </div>
            </div>

            <div className="scan-view-main-wrapper">
                <div className="scan-view-workspace">
                    {scanImage && (
                        <div className="scan-view-toolbar">
                            <button type="button" className="scan-upload-trigger" onClick={() => fileInputRef.current?.click()}>
                                <Upload size={16} />
                                <span>Replace scan</span>
                            </button>
                            <button type="button" className="scan-remove-trigger" onClick={() => AppFacade.scan.setScanImage(null)}>
                                <X size={16} />
                                <span>Remove</span>
                            </button>
                        </div>
                    )}

                    <div className="scan-view-main-layout">
                        {scanImage && (
                            <IndustrialSlider
                                value={overlayOpacity}
                                onChange={AppFacade.scan.setOpacity}
                                label="Scan Opacity"
                                className="scan-opacity-control"
                            />
                        )}

                        <div className="scan-view-content">
                            <div className={`scan-stage ${isProcessing ? 'is-processing' : ''} ${isEditMode ? 'is-in-edit-mode' : ''}`} ref={containerRef}>
                                {isEditMode && <div className="scan-canvas-grid"></div>}
                                <div className="scan-stage-chart">
                                    <div className="normal-view-scaler" style={{ transform: `scale(${chartScale})`, width: '1200px' }}>
                                        <NormalView
                                            resolvedTeeth={resolvedTeeth || {}}
                                            onToothClick={onToothClick}
                                            selectedTeeth={selectedTeeth}
                                            activeTooth={activeTooth}
                                            upperJawViews={['number', 'frontal']}
                                            lowerJawViews={['frontal', 'number']}
                                            showWaves={false}
                                        />
                                    </div>
                                </div>

                                {!scanImage && !isProcessing && (
                                    <button type="button" className="scan-upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                                        <div className="scan-upload-icon-wrapper"><Upload size={32} /></div>
                                        <div className="upload-text">
                                            <h3>Upload Dental Scan</h3>
                                            <p>Select a panoramic or periapical X-ray</p>
                                        </div>
                                        <span className="scan-upload-cta">Choose file</span>
                                    </button>
                                )}

                                {scanImage && (
                                    <>
                                        <div className={`scan-stage-image ${isEditMode ? 'is-editable' : ''}`}
                                            style={{
                                                opacity: overlayOpacity / 100,
                                                transform: `translate(${imageTransform.x}px, ${imageTransform.y}px) rotate(${imageTransform.rotate}deg) scale(${imageTransform.scale})`,
                                                cursor: isDragging ? 'grabbing' : (isEditMode ? 'grab' : 'default')
                                            }}
                                            onWheel={(e) => AppFacade.scan.zoom(e.deltaY)}
                                            onTouchStart={(e) => AppFacade.scan.startTouch(e.touches)}
                                        >
                                            <img
                                                ref={imgRef}
                                                src={scanImage}
                                                alt="Dental Scan"
                                                className="scan-image"
                                                onLoad={onImageLoad}
                                            />

                                            {showDetections && imageSize.width > 0 && detections && detections.length > 0 && (
                                                <svg
                                                    className="scan-detections-overlay"
                                                    viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                                                    preserveAspectRatio="xMidYMid meet"
                                                    style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        pointerEvents: 'none',
                                                        zIndex: 3
                                                    }}
                                                >
                                                    {detections.map((det, idx) => {
                                                        if (!det.contour) return null;
                                                        const points = det.contour.map(p => `${p[0]},${p[1]}`).join(' ');
                                                        const color = getLabelColor(det.label);

                                                        return (
                                                            <g key={det.id || idx} className="detection-group">
                                                                <polygon
                                                                    points={points}
                                                                    fill={color}
                                                                    fillOpacity="0.4"
                                                                    stroke={color}
                                                                    strokeWidth="2"
                                                                    className="detection-polygon"
                                                                />
                                                            </g>
                                                        );
                                                    })}
                                                </svg>
                                            )}
                                        </div>

                                        {isEditMode && (
                                            <div className="scan-interaction-layer"
                                                onMouseDown={(e) => AppFacade.scan.startDragging(e.clientX, e.clientY)}
                                                onTouchStart={(e) => AppFacade.scan.startTouch(e.touches)}
                                                onWheel={(e) => AppFacade.scan.zoom(e.deltaY)}
                                            />
                                        )}

                                        <div className="image-manipulation-controls">
                                            {isEditMode && (
                                                <>
                                                    <button className="edit-control-btn" onClick={AppFacade.scan.reset} title="Reset Position">
                                                        <RefreshCw size={18} />
                                                    </button>
                                                    <button className="edit-control-btn" onClick={() => AppFacade.scan.rotate('ccw')} title="Rotate Left">
                                                        <RotateCcw size={18} />
                                                    </button>
                                                    <button className="edit-control-btn" onClick={() => AppFacade.scan.rotate('cw')} title="Rotate Right">
                                                        <RotateCw size={18} />
                                                    </button>
                                                </>
                                            )}
                                            <button className={`edit-control-btn ${isEditMode ? 'is-active' : ''}`}
                                                onClick={() => AppFacade.scan.setIsEditMode(!isEditMode)}
                                                title={isEditMode ? "Finish transform" : "Reposition & Rotate"}>
                                                <Move size={18} />
                                            </button>
                                        </div>
                                    </>
                                )}

                                {isProcessing && (
                                    <div className="scan-processing-state">
                                        <div className="processing-content">
                                            <h3>Analyzing Scan...</h3>
                                            <div className="progress-container">
                                                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                                            </div>
                                            <span className="progress-text">{Math.round(progress)}% Complete</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                        </div>
                    </div>
                </div>

                {scanImage && (
                    <div className={`scan-view-sidebar ${isSidebarCollapsed ? 'is-collapsed' : ''}`}>
                        <button
                            className="sidebar-toggle-btn"
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            title={isSidebarCollapsed ? "Expand panel" : "Collapse panel"}
                        >
                            {isSidebarCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                        </button>
                        <DetectionsPanel detections={detections} onDelete={AppFacade.scan.deleteDetection} />
                    </div>
                )}
            </div>

            {scanImage && (
                <div className="scan-view-footer">
                    <div className="footer-left">
                        <button className="btn-secondary" onClick={() => setShowDetections(!showDetections)}>
                            {showDetections ? 'Hide detections' : 'Show detections'}
                        </button>
                    </div>
                    <div className="footer-center">
                        <label className="filter-checkbox"><input type="checkbox" defaultChecked /><span>Caries</span></label>
                        <label className="filter-checkbox"><input type="checkbox" defaultChecked /><span>Restorations (Crown/Filling)</span></label>
                        <label className="filter-checkbox"><input type="checkbox" defaultChecked /><span>Missing / Impacted</span></label>
                        <div className="filter-divider"></div>
                        <label className="filter-switch"><span>Mandibular canal</span><div className="switch-track"><div className="switch-thumb"></div></div></label>
                    </div>
                    <div className="footer-right"><button className="btn-primary">Confirm</button></div>
                </div>
            )}
            {showUnlockOverlay && <UnlockOverlay onClose={handleCloseOverlay} />}
        </div>
    );
};

export default ScanView;

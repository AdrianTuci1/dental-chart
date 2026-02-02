import React, { useState, useRef, useEffect } from 'react';
import NormalView from './NormalView';
import { Upload, X } from 'lucide-react';
import './ScanView.css';

const ScanView = ({ teeth, onToothClick, selectedTeeth, activeTooth }) => {
    const [scanImage, setScanImage] = useState(null);
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Dynamic scaling logic
    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();

            // Layout constants for the dental chart
            // NormalView width is typically constrained by max-width: 1200px in its CSS (or jaw-box)
            // But we treat 1200px as the "natural" width to fit comfortably.
            // Height without occlusal views will be significantly less.
            // Approximate height: 
            // - Upper Jaw (Frontal + Number) ~ 160px + 20px
            // - Lower Jaw (Number + Frontal) ~ 20px + 160px
            // - Gap/Padding ~ 20-40px
            // Total ~ 400px? Let's use 500 as safe base.
            const CHART_NATURAL_WIDTH = 1200;
            const CHART_NATURAL_HEIGHT = 500;

            const availableWidth = containerRect.width - 32; // minus padding
            const availableHeight = containerRect.height - 32;

            const scaleX = availableWidth / CHART_NATURAL_WIDTH;
            const scaleY = availableHeight / CHART_NATURAL_HEIGHT;

            // Use the smaller scale
            // Allow slightly larger max scale since we removed rows
            const newScale = Math.min(scaleX, scaleY, 1.3);

            setScale(Math.max(newScale, 0.4));
        };

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateScale);
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        updateScale();

        return () => resizeObserver.disconnect();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setScanImage(event.target.result);
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

    return (
        <div className="scan-view-container">
            {/* Top Section: Scan Area */}
            <div className="scan-area">
                {!scanImage ? (
                    <div
                        className="scan-placeholder"
                        onClick={handleUploadClick}
                    >
                        <div className="scan-upload-icon-wrapper">
                            <Upload size={32} />
                        </div>
                        <h3 className="scan-title">Upload Dental Scan</h3>
                        <p className="scan-subtitle">Click to browse or drag and drop</p>
                    </div>
                ) : (
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
                )}

                {/* Hidden File Input */}
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
                        width: '1200px', // Force natural width for scaling context
                    }}
                >
                    <NormalView
                        teeth={teeth}
                        onToothClick={onToothClick}
                        selectedTeeth={selectedTeeth}
                        activeTooth={activeTooth}
                        // Omit 'topview' to save space
                        upperJawViews={['frontal', 'number']}
                        lowerJawViews={['number', 'frontal']}
                    />
                </div>
            </div>
        </div>
    );
};

export default ScanView;

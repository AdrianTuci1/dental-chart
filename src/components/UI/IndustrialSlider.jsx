import React from 'react';
import './IndustrialSlider.css';

const IndustrialSlider = ({
    value,
    onChange,
    min = 0,
    max = 100,
    label = "Opacity",
    className = ""
}) => {
    const containerRef = React.useRef(null);
    const [sliderHeight, setSliderHeight] = React.useState(0);

    React.useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                setSliderHeight(containerRef.current.offsetHeight);
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    const progress = ((value - min) / (max - min)) * 100;

    return (
        <div
            ref={containerRef}
            className={`industrial-slider-container ${className}`}
            style={{ '--progress': `${progress}%` }}
        >
            <div className="industrial-slider-track-wrapper">
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="industrial-slider-input"
                    style={{ width: sliderHeight }}
                    aria-label={label}
                />
                <div className="industrial-slider-value-display">
                    {Math.round(progress)}%
                </div>
            </div>
        </div>
    );
};

export default IndustrialSlider;

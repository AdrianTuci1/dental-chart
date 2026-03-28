import React, { useRef, useEffect, useState, useSyncExternalStore } from 'react';
import './WaveInteractiveView.css';
import { WaveRenderer } from './WaveRenderer';
import { WaveInteractionModel } from '../../models/WaveInteractionModel';

const WaveInteractiveView = ({ children, direction = 'down', alignment = 'center', model: externalModel, topOffset = 0, bottomOffset = 0, ...props }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const rendererRef = useRef(new WaveRenderer());

    // Use external model if provided, otherwise create a default internal one (fallback)
    const [internalModel] = useState(() => new WaveInteractionModel({
        gm: [3, 3, 3], // Red Line (Gingival Margin)
        pd: [5, 5, 5]  // Blue Line (Probing Depth)
    }));

    const model = externalModel || internalModel;

    // Sync React state with Model state
    const values = useSyncExternalStore(model.subscribe, model.getSnapshot);

    const draw = React.useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const renderer = rendererRef.current;

        if (!canvas || !container || !renderer) return;

        const { width, height } = container.getBoundingClientRect();

        renderer.setCanvas(canvas);
        const verticalOffset = (topOffset || 0) + (bottomOffset || 0);
        renderer.update({ width, height, direction, values, verticalOffset });
        renderer.draw();
    }, [direction, values, topOffset, bottomOffset]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Draw initially
        draw();

        // Use ResizeObserver to handle all layout changes (view switches, animations)
        const resizeObserver = new ResizeObserver(() => {
            draw();
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [values, direction, topOffset, bottomOffset, draw]);




    return (
        <div className="wave-interactive-wrapper" ref={containerRef} {...props}>
            <div
                className="wave-content"
                style={{ alignItems: alignment }}
            >
                {children}
            </div>
            <canvas
                ref={canvasRef}
                className="wave-canvas"
            />
        </div>
    );
};

export default WaveInteractiveView;

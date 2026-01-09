import React, { useRef, useEffect, useState, useSyncExternalStore } from 'react';
import './WaveInteractiveView.css';
import { WaveRenderer } from './WaveRenderer';
import { WaveInteractionModel } from '../../models/WaveInteractionModel';

const WaveInteractiveView = ({ children, viewType, direction = 'down', alignment = 'center', model: externalModel }) => {
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

    const [dragging, setDragging] = useState(null); // { type: 'gm'|'pd', index: 0|1|2 }

    const draw = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const renderer = rendererRef.current;

        if (!canvas || !container || !renderer) return;

        const { width, height } = container.getBoundingClientRect();

        renderer.setCanvas(canvas);
        renderer.update({ width, height, direction, values });
        renderer.draw();
    };

    useEffect(() => {
        draw();
        window.addEventListener('resize', draw);
        return () => window.removeEventListener('resize', draw);
    }, [values, direction]);


    // Interaction
    const handleMouseDown = (e) => {
        const renderer = rendererRef.current;
        if (!renderer) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Ensure renderer has latest geometric data just in case
        const hit = renderer.getHit(x, y);
        if (hit) setDragging(hit);
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        const renderer = rendererRef.current;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;

        const newLevel = renderer.getLevelFromY(y);

        // Delegate state updates and business logic to the Model
        model.updatePoint(dragging.type, dragging.index, newLevel);
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    return (
        <div className="wave-interactive-wrapper" ref={containerRef}>
            <div
                className="wave-content"
                style={{ alignItems: alignment }}
            >
                {children}
            </div>
            <canvas
                ref={canvasRef}
                className="wave-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
        </div>
    );
};

export default WaveInteractiveView;

import React from 'react';
import { useLocation } from 'react-router-dom';
import { Monitor, Smartphone } from 'lucide-react';
import './OrientationGuard.css';

const OrientationGuard = () => {
    const [dimensions, setDimensions] = React.useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const location = useLocation();

    React.useEffect(() => {
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isHomeOrSignup = ['/', '/signup'].includes(location.pathname);
    const isInvalid = (dimensions.width / dimensions.height < 4 / 3) || (dimensions.width < 1280);

    if (isInvalid && !isHomeOrSignup) {
        return (
            <div className="orientation-guard-overlay">
                <div className="guard-content">
                    <div className="guard-icon-wrapper">
                        <Monitor className="monitor-icon" size={48} />
                        <div className="status-indicator error">
                            <Smartphone size={20} />
                        </div>
                    </div>
                    <h2>Resolution / Orientation</h2>
                    <p>Our app is designed to be used on a tablet in portrait mode or on a desktop computer.</p>

                </div>
            </div>
        );
    }

    return null;
};

export default OrientationGuard;

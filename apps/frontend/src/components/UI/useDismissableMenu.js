import { useEffect } from 'react';

/**
 * Closes an anchored dropdown when the user clicks outside of it or presses Escape.
 */
export const useDismissableMenu = (isOpen, onClose, containerRef) => {
    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, containerRef]);
};

export default useDismissableMenu;

import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from './DrawerHeader.module.css';

const DrawerHeader = ({ toothNumber, onNext, onPrevious, onClose }) => {
    return (
        <div className={styles.drawerHeader}>
            <div className={styles.drawerNav}>
                <span className={styles.navArrow} onClick={onPrevious}><ChevronLeft size={24} /></span>
                <span className={styles.toothTitle}>TOOTH {toothNumber}</span>
                <span className={styles.navArrow} onClick={onNext}><ChevronRight size={24} /></span>
            </div>
            <div className={styles.drawerActions}>
                <span className={styles.actionIcon} onClick={onClose}><X size={24} /></span>
            </div>
        </div>
    );
};

export default DrawerHeader;

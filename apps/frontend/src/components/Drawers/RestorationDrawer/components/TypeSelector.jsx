import React from 'react';
import styles from './TypeSelector.module.css';

const TypeSelector = ({ restorationTypes, onTypeSelect }) => {
    return (
        <div className={styles.typeSelectorList}>
            {restorationTypes.map(type => (
                <button key={type.id} className={styles.typeBtn} onClick={() => onTypeSelect(type.id)}>
                    {type.label}
                </button>
            ))}
        </div>
    );
};

export default TypeSelector;

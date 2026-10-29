import React from 'react';

const ToothIcon = ({
    type = 'full',
    size = 24,
    color = 'currentColor',
    className = '',
    style = {},
    showOutline = true
}) => {
    const upperPaths = (
        <>
            {showOutline && <path d="M.75 6.75v-3.5A1.5 1.5 0 0 1 1.8 1.819C3.188 1.376 6.185.75 12 .75s8.812.626 10.2 1.069a1.5 1.5 0 0 1 1.045 1.43v3.5" />}
            <path d="M5.25 6.75a2.25 2.25 0 1 0-4.5 0v1.5a1.5 1.5 0 0 0 1.5 1.5h1.5a1.5 1.5 0 0 0 1.5-1.5zm4.5 0a2.25 2.25 0 1 0-4.5 0v1.5a1.5 1.5 0 0 0 1.5 1.5h1.5a1.5 1.5 0 0 0 1.5-1.5zm4.5 0a2.25 2.25 0 0 0-4.5 0v1.5a1.5 1.5 0 0 0 1.5 1.5h1.5a1.5 1.5 0 0 0 1.5-1.5zm4.5 0a2.25 2.25 0 0 0-4.5 0v1.5a1.5 1.5 0 0 0 1.5 1.5h1.5a1.5 1.5 0 0 0 1.5-1.5zm4.5 0a2.25 2.25 0 0 0-4.5 0v1.5a1.5 1.5 0 0 0 1.5 1.5h1.5a1.5 1.5 0 0 0 1.5-1.5z" />
        </>
    );

    const lowerPaths = (
        <>
            {showOutline && <path d="M.75 17.25v3.5a1.5 1.5 0 0 0 1.05 1.431c1.388.443 4.385 1.069 10.2 1.069s8.812-.626 10.2-1.069a1.5 1.5 0 0 0 1.045-1.43v-3.5" />}
            <path d="M5.25 17.25a2.25 2.25 0 0 1-4.5 0v-1.5a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5zm4.5 0a2.25 2.25 0 0 1-4.5 0v-1.5a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5zm4.5 0a2.25 2.25 0 0 1-4.5 0v-1.5a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5zm4.5 0a2.25 2.25 0 0 1-4.5 0v-1.5a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5zm4.5 0a2.25 2.25 0 0 1-4.5 0v-1.5a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5z" />
        </>
    );

    let viewBox = "0 0 24 24";
    let content = null;

    if (type === 'upper') {
        viewBox = "0 0 24 10";
        content = upperPaths;
    } else if (type === 'lower') {
        viewBox = "0 14 24 10";
        content = lowerPaths;
    } else {
        content = (
            <>
                {upperPaths}
                {lowerPaths}
            </>
        );
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={viewBox}
            width={size}
            height={type === 'full' ? size : size * (10 / 24)}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={style}
        >
            {content}
        </svg>
    );
};

export default ToothIcon;

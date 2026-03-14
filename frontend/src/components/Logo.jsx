import React from 'react';
import './Logo.css';

const Logo = ({ animated = true, style = {}, className = '' }) => {
    return (
        <div className={`logo-wrapper ${animated ? 'animated' : ''} ${className}`} style={style}>
            <img
                src="/logo-rep.png"
                alt="REP Calisthenics Academy Logo"
                className="gym-logo dark-logo"
            />
            <img
                src="/logo-negro-rep.png"
                alt="REP Calisthenics Academy Logo"
                className="gym-logo light-logo"
            />
        </div>
    );
};

export default Logo;

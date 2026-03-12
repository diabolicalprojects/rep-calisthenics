import React from 'react';
import './Logo.css';

const Logo = ({ animated = true }) => {
    return (
        <div className={`logo-wrapper ${animated ? 'animated' : ''}`}>
            <img
                src="/logo-rep.png"
                alt="REP Calisthenics Academy Logo"
                className="gym-logo"
            />
        </div>
    );
};

export default Logo;

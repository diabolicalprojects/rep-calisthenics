import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './Logo.css';

const Logo = ({ animated = true, style = {}, className = '' }) => {
    const { settings } = useTheme();

    return (
        <div className={`logo-wrapper ${animated ? 'animated' : ''} ${className}`} style={{ ...style, display: 'flex', alignItems: 'center' }}>
            {settings.logo ? (
                <img
                    src={settings.logo}
                    alt={`${settings.brandName} Logo`}
                    className="gym-logo"
                    style={{ maxHeight: '100%', width: 'auto' }}
                />
            ) : (
                <span style={{ 
                    fontFamily: settings.font, 
                    fontWeight: 900, 
                    fontSize: '22px', 
                    letterSpacing: '1px',
                    color: 'var(--color-accent)',
                    whiteSpace: 'nowrap'
                }}>
                    {settings.brandName.toUpperCase()}
                </span>
            )}
        </div>
    );
};

export default Logo;

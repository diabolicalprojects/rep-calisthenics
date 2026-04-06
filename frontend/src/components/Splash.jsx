import React, { useEffect, useState } from 'react';
import Logo from './Logo';
import './Splash.css';
import { useTheme } from '../context/ThemeContext';

const Splash = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [step, setStep] = useState(0);
    
    const { settings } = useTheme();
    const messages = React.useMemo(() => [
        "BIENVENIDO",
        "TU EVOLUCIÓN EMPIEZA AQUÍ",
        "SISTEMA LISTO",
        `${(settings?.brandName || 'SISTEMA').toUpperCase()}`
    ], [settings]);

    useEffect(() => {
        const messageInterval = setInterval(() => {
            setStep(prev => (prev < messages.length - 1 ? prev + 1 : prev));
        }, 700);

        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 800); 
        }, 3200);

        return () => {
            clearTimeout(timer);
            clearInterval(messageInterval);
        };
    }, [onComplete, messages.length]);

    return (
        <div className={`splash-container ${!isVisible ? 'fade-out' : ''}`}>
            <div className="splash-background-glow"></div>
            
            <div className="splash-content">
                <div className="splash-logo-wrapper">
                    <Logo animated={true} className="splash-logo-svg" />
                </div>
                
                <div className="status-sequence">
                    <p key={step} className="status-text">
                        {messages[step]}
                    </p>
                    <div className="loading-dot-bar">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Splash;

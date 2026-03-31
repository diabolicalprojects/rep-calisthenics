import React, { useEffect, useState } from 'react';
import Logo from './Logo';
import './Splash.css';
import { useTheme } from '../context/ThemeContext';

const Splash = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [step, setStep] = useState(0);
    
    const { settings } = useTheme();
    const messages = [
        "INITIALIZING CORE...",
        "AUTHENTICATING PROTOCOLS...",
        "LOADING DATABASE...",
        `${settings.brandName.toUpperCase()} ONLINE`
    ];

    useEffect(() => {
        // Ciclo de mensajes cada 500ms
        const messageInterval = setInterval(() => {
            setStep(prev => (prev < messages.length - 1 ? prev + 1 : prev));
        }, 600);

        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 800); 
        }, 3000);

        return () => {
            clearTimeout(timer);
            clearInterval(messageInterval);
        };
    }, [onComplete, messages.length]);

    return (
        <div className={`splash-container ${!isVisible ? 'fade-out' : ''}`}>
            {/* Escáner Cyberpunk */}
            <div className="scanning-line"></div>
            
            <div className="splash-content">
                <div className="splash-logo-wrapper">
                    <Logo animated={true} className="splash-logo-svg" />
                </div>
                
                <div className="initialization-sequence">
                    <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${((step + 1) / messages.length) * 100}%` }}></div>
                    </div>
                    <p className="init-text mono-font">
                        <span className="cursor-blink">&gt;</span> {messages[step]}
                    </p>
                </div>
            </div>
            
            <div className="vignette-overlay"></div>
        </div>
    );
};

export default Splash;

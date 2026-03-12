import React, { useEffect, useState } from 'react';
import Logo from './Logo';
import './Splash.css';

const Splash = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // La animación dura 2 segundos, luego se desvanece
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500); // Esperar a que termine fade out
        }, 2000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className={`splash-container ${!isVisible ? 'fade-out' : ''}`}>
            <div className="splash-logo splash-pulse">
                <Logo animated={true} />
            </div>
        </div>
    );
};

export default Splash;

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const PRESETS = {
    modern: {
        name: 'Modern Glass (Default)',
        accentColor: '#f48c25',
        borderRadius: '12px',
        font: "'Lexend', sans-serif",
        glassiness: '0.03',
        borderOpacity: '0.08',
        shadow: '0 10px 15px rgba(0, 0, 0, 0.5)'
    },
    cyber: {
        name: 'Cyberpunk Red',
        accentColor: '#ff003c',
        borderRadius: '2px',
        font: "'Space Grotesk', sans-serif",
        glassiness: '0.1',
        borderOpacity: '0.2',
        shadow: '0 0 20px rgba(255, 0, 60, 0.3)'
    },
    minimal: {
        name: 'Minimal Soft',
        accentColor: '#0070f3',
        borderRadius: '24px',
        font: "'Inter', sans-serif",
        glassiness: '0.01',
        borderOpacity: '0.05',
        shadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }
};

export const ThemeProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('gym_theme_settings');
        return saved ? JSON.parse(saved) : {
            accentColor: '#f48c25',
            borderRadius: '12px',
            font: "'Lexend', sans-serif",
            logo: null,
            brandName: 'Gym Manager',
            glassiness: '0.03',
            borderOpacity: '0.08',
            shadow: '0 10px 15px rgba(0, 0, 0, 0.5)',
            themeName: 'modern'
        };
    });

    useEffect(() => {
        localStorage.setItem('gym_theme_settings', JSON.stringify(settings));
        applyTheme(settings);
    }, [settings]);

    const applyTheme = (s) => {
        const root = document.documentElement;
        root.style.setProperty('--color-accent', s.accentColor);
        root.style.setProperty('--color-accent-hover', `${s.accentColor}dd`); // Subtle transparency for hover
        root.style.setProperty('--color-accent-glass', `${s.accentColor}20`); // Glass effect fallback
        
        // Dynamic Radius
        const baseRadius = parseInt(s.borderRadius) || 0;
        root.style.setProperty('--radius-sm', `${baseRadius * 0.7}px`);
        root.style.setProperty('--radius-md', `${baseRadius}px`);
        root.style.setProperty('--radius-lg', `${baseRadius * 1.5}px`);
        root.style.setProperty('--radius-xl', `${baseRadius * 2}px`);
        
        root.style.setProperty('--font-heading', s.font);
        
        // Handle transparency based on color mode if needed, 
        // but the 'glassiness' and 'borderOpacity' are sliders in the UI.
        const isDark = document.body.getAttribute('data-theme') !== 'light';
        const glassBase = isDark ? '255, 255, 255' : '0, 0, 0';
        
        root.style.setProperty('--color-glass', `rgba(${glassBase}, ${s.glassiness})`);
        root.style.setProperty('--color-glass-border', `rgba(${glassBase}, ${s.borderOpacity})`);
        root.style.setProperty('--shadow-md', s.shadow || '0 10px 15px rgba(0, 0, 0, 0.5)');
    };

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const applyPreset = (presetKey) => {
        const preset = PRESETS[presetKey];
        if (preset) {
            updateSettings({
                ...preset,
                themeName: presetKey
            });
        }
    };

    return (
        <ThemeContext.Provider value={{ settings, updateSettings, applyPreset, presets: PRESETS }}>
            {children}
        </ThemeContext.Provider>
    );
};

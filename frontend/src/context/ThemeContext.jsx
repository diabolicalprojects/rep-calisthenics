import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const PRESETS = {
    modern: {
        accentColor: '#f48c25',
        borderRadius: '12px',
        font: "'Lexend', sans-serif",
        glassiness: '0.03',
        borderOpacity: '0.08',
        shadow: '0 10px 15px rgba(0, 0, 0, 0.5)'
    },
    cyber: {
        accentColor: '#00f2ff',
        borderRadius: '0px',
        font: "'JetBrains Mono', monospace",
        glassiness: '0.05',
        borderOpacity: '0.15',
        shadow: '0 0 20px rgba(0, 242, 255, 0.2)'
    },
    sport: {
        accentColor: '#ccff00',
        borderRadius: '18px',
        font: "'Bebas Neue', sans-serif",
        glassiness: '0.02',
        borderOpacity: '0.05',
        shadow: '0 15px 30px rgba(0, 0, 0, 0.4)'
    }
};

const DEFAULTS = {
    accentColor: '#f48c25',
    borderRadius: '12px',
    font: "'Lexend', sans-serif",
    logo: null,
    brandName: 'REP CONTROL',
    glassiness: '0.03',
    borderOpacity: '0.08',
    shadow: '0 10px 15px rgba(0, 0, 0, 0.5)',
    themeName: 'modern'
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        return { 
            settings: DEFAULTS, 
            updateSettings: () => {}, 
            applyPreset: () => {}, 
            presets: PRESETS 
        };
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('theme-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...DEFAULTS, ...parsed };
            }
        } catch (e) {
            console.error("Error loading theme settings:", e);
        }
        return DEFAULTS;
    });

    useEffect(() => {
        localStorage.setItem('theme-settings', JSON.stringify(settings));
        applyTheme(settings);
    }, [settings]);

    const applyTheme = (s) => {
        const root = document.documentElement;
        root.style.setProperty('--color-accent', s.accentColor);
        root.style.setProperty('--color-accent-glass', `${s.accentColor}22`);
        root.style.setProperty('--border-radius-main', s.borderRadius);
        root.style.setProperty('--main-font', s.font);
        root.style.setProperty('--glass-bg-opacity', s.glassiness);
        root.style.setProperty('--glass-border-opacity', s.borderOpacity);
        root.style.setProperty('--main-shadow', s.shadow);
    };

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const applyPreset = (presetName) => {
        const preset = PRESETS[presetName];
        if (!preset) return;
        const newSettings = { ...settings, ...preset, themeName: presetName };
        setSettings(newSettings);
        localStorage.setItem('theme-settings', JSON.stringify(newSettings));
    };

    return (
        <ThemeContext.Provider value={{ settings, updateSettings, applyPreset, presets: PRESETS }}>
            {children}
        </ThemeContext.Provider>
    );
};

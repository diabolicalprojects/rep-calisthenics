import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

const ThemeToggle = () => {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        // Check if there's a saved theme in localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <button
            className={`theme-toggle ${theme}`}
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title="Toggle Theme"
        >
            <div className="toggle-track">
                <div className="toggle-thumb">
                    {theme === 'light' ? <Sun size={12} className="toggle-icon sun" /> : <Moon size={12} className="toggle-icon moon" />}
                </div>
            </div>
        </button>
    );
};

export default ThemeToggle;

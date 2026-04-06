import React, { useState } from 'react';
import Logo from '../components/Logo';
import { LogIn, AlertCircle, ShieldCheck, Lock, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
    const { login } = useAuth();
    const { settings } = useTheme();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await api.login({ identifier: username, password });
            login(response.user, response.token);
            // After login, AuthContext state changes, App.jsx will re-render and show Dashboard
        } catch (err) {
            console.error('Login Error:', err);
            setError(err.message || 'Credenciales inválidas. Acceso denegado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-bg-overlay"></div>
            
            <main className="login-container animate-fade-in">
                <div className="login-glass-card shadow-glow">
                    
                    <header className="login-header">
                        <div className="login-logo-container">
                            <Logo style={{ width: '80px', filter: 'drop-shadow(0 0 15px rgba(255,115,0,0.4))' }} />
                        </div>
                        <h1 className="display-font login-title">REP CONTROL</h1>
                        <p className="login-subtitle">SISTEMA CENTRAL DE GESTIÓN</p>
                    </header>

                    {error && (
                        <div className="login-error-box animate-shake">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="login-form-cyber">
                        <div className="cyber-input-group">
                            <label className="cyber-label">
                                <UserIcon size={14} /> USER / EMAIL
                            </label>
                            <div className="cyber-input-wrapper">
                                <input
                                    type="text"
                                    required
                                    className="cyber-input"
                                    placeholder="IDENTIFICADOR"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="cyber-input-group">
                            <label className="cyber-label">
                                <Lock size={14} /> ENCRYPTED KEY
                            </label>
                            <div className="cyber-input-wrapper">
                                <input
                                    type="password"
                                    required
                                    className="cyber-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="cyber-btn-primary"
                            disabled={loading}
                            style={{ borderRadius: settings?.borderRadius || '12px' }}
                        >
                            {loading ? (
                                <span className="loading-dots">AUTENTICANDO</span>
                            ) : (
                                <>
                                    <ShieldCheck size={20} /> INICIAR SESIÓN
                                </>
                            )}
                        </button>
                    </form>

                    <footer className="login-footer-minimal">
                        <div className="footer-line"></div>
                        <p className="v-tag">VERSION PROTOCOL 1.1.2</p>
                        <p className="copy-tag">© {new Date().getFullYear()} {(settings?.brandName || 'REP CONTROL').toUpperCase()}</p>
                    </footer>
                </div>
            </main>

            <style>{`
                .login-page-wrapper {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #000;
                    position: relative;
                    overflow: hidden;
                    font-family: 'Inter', sans-serif;
                }

                .login-bg-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(20,20,20,0.7) 100%), 
                                url('/calisthenics_gym_premium_background_1773480690654.png');
                    background-size: cover;
                    background-position: center;
                    filter: saturate(0.8) contrast(1.1);
                    z-index: 1;
                }

                .login-container {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 420px;
                    padding: 20px;
                }

                .login-glass-card {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 115, 0, 0.15);
                    border-radius: 30px;
                    padding: 50px 40px;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.8), 
                                inset 0 0 20px rgba(255,115,0,0.05);
                    position: relative;
                }

                .login-glass-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 60%;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .login-logo-container {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 25px;
                }

                .login-title {
                    font-size: 32px;
                    font-weight: 900;
                    letter-spacing: 4px;
                    margin-bottom: 5px;
                    background: linear-gradient(180deg, #fff 0%, #aaa 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .login-subtitle {
                    font-size: 10px;
                    letter-spacing: 3px;
                    color: var(--color-accent);
                    font-weight: 800;
                    opacity: 0.8;
                }

                .cyber-input-group {
                    margin-bottom: 25px;
                }

                .cyber-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    color: rgba(255,255,255,0.4);
                    margin-bottom: 10px;
                    text-transform: uppercase;
                }

                .cyber-input-wrapper {
                    position: relative;
                }

                .cyber-input {
                    width: 100%;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    padding: 16px 20px;
                    border-radius: 14px;
                    color: white;
                    font-size: 15px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                }

                .cyber-input:focus {
                    background: rgba(255,255,255,0.07);
                    border-color: var(--color-accent);
                    box-shadow: 0 0 20px rgba(255, 115, 0, 0.1);
                    transform: translateY(-1px);
                }

                .cyber-btn-primary {
                    width: 100%;
                    height: 60px;
                    background: var(--color-accent);
                    color: black;
                    border: none;
                    border-radius: 16px;
                    font-weight: 900;
                    font-size: 14px;
                    letter-spacing: 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    margin-top: 10px;
                    box-shadow: 0 15px 30px -10px rgba(255, 115, 0, 0.5);
                }

                .cyber-btn-primary:hover {
                    transform: scale(1.02) translateY(-3px);
                    box-shadow: 0 20px 40px -10px rgba(255, 115, 0, 0.7);
                }

                .cyber-btn-primary:active {
                    transform: scale(0.98);
                }

                .login-error-box {
                    background: rgba(220, 38, 38, 0.1);
                    border: 1px solid rgba(220, 38, 38, 0.3);
                    padding: 15px;
                    border-radius: 12px;
                    color: #ef4444;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 30px;
                }

                .login-footer-minimal {
                    margin-top: 50px;
                    text-align: center;
                }

                .footer-line {
                    height: 1px;
                    width: 40px;
                    background: rgba(255,255,255,0.1);
                    margin: 0 auto 20px;
                }

                .v-tag {
                    font-size: 9px;
                    letter-spacing: 2px;
                    color: rgba(255,255,255,0.2);
                    margin-bottom: 5px;
                    font-weight: 700;
                }

                .copy-tag {
                    font-size: 8px;
                    letter-spacing: 1px;
                    color: rgba(255,255,255,0.15);
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }

                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }

                @media (max-width: 480px) {
                    .login-glass-card {
                        padding: 40px 25px;
                        background: transparent;
                        border: none;
                        box-shadow: none;
                        backdrop-filter: none;
                    }
                    .login-page-wrapper {
                        background: #000;
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;

import React, { useState } from 'react';
import Logo from '../components/Logo';
import { LogIn, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Using email as username for consistency with typical backend logins
            // We'll normalize 'admin' to 'admin@gym.com' for the example admin if needed
            const loginEmail = username.includes('@') ? username : 'admin@gym.com';
            
            const response = await api.login({ email: loginEmail, password });
            
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            // Reload page to re-trigger App.jsx useEffect and catch new user state
            window.location.reload();
        } catch (err) {
            console.error('Login Error:', err);
            setError(err.message || 'Error de acceso. Verifica tus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="glass-panel login-card animate-fade-in">
                <div className="login-logo">
                    <Logo animated={true} />
                </div>

                <div className="login-header" style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '28px', color: 'var(--color-accent-orange)' }}>REP Control Panel</h2>
                    <p className="text-muted" style={{ fontSize: '14px' }}>Inicia sesión para gestionar el gimnasio</p>
                </div>

                {error && (
                    <div className="error-box" style={{ marginBottom: '32px' }}>
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label>Usuario</label>
                        <input
                            type="text"
                            required
                            className="form-input"
                            placeholder="Admin"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.05)', height: '50px' }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            required
                            className="form-input"
                            placeholder="••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.05)', height: '50px' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary login-btn"
                        disabled={loading}
                        style={{ height: '54px', marginTop: '20px', fontSize: '16px', fontWeight: 'bold' }}
                    >
                        {loading ? 'Validando...' : (
                            <>
                                <LogIn size={18} /> Acceder al Sistema
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--color-glass-border)' }}>
                    <p style={{ fontSize: '11px', opacity: 0.6 }}>REP Calisthenics Academy - Sistema de Gestión v1.0</p>
                </div>
            </div>
        </div>
    );
};

export default Login;

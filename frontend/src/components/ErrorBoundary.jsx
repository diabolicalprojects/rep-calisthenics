import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-bg-main, #0f0f11)',
                    color: 'var(--color-text-main, #ffffff)',
                    fontFamily: 'var(--main-font, sans-serif)',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <h1 style={{ color: 'var(--color-danger, #ff4444)', marginBottom: '16px' }}>
                        Algo salió mal en la interfaz.
                    </h1>
                    <p style={{ color: 'var(--color-text-muted, #888)', marginBottom: '24px', maxWidth: '500px' }}>
                        El equipo de soporte ha sido notificado. Puedes intentar recargar la página para solucionar el problema.
                    </p>
                    <button 
                        onClick={() => window.location.reload(true)}
                        style={{
                            padding: '12px 24px',
                            background: 'var(--color-accent, #f48c25)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        RECARGAR PÁGINA
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <details style={{ whiteSpace: 'pre-wrap', marginTop: '30px', textAlign: 'left', background: 'rgba(255,0,0,0.1)', padding: '15px', borderRadius: '8px', maxWidth: '800px', overflowX: 'auto' }}>
                            {this.state.error && this.state.error.toString()}
                            <br />
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

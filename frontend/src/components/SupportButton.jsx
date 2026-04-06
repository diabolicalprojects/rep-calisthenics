import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SUPPORT_PHONE = '5214491245952';

const SupportButton = () => {
    const { settings = {} } = useTheme();
    
    const openSupport = () => {
        const msg = `Hola! Necesito soporte técnico para el Control Panel de ${settings?.brandName || 'mi cuenta'}.`;
        window.open(`https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <button
            onClick={openSupport}
            aria-label="Contactar soporte por WhatsApp"
            className="whatsapp-floating-btn"
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 9999,
                background: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '12px 24px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                cursor: 'pointer'
            }}
        >
            <MessageCircle size={20} aria-hidden="true" />
            <span style={{ fontSize: '14px' }}>Soporte WhatsApp</span>
        </button>
    );
};

export default SupportButton;

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, BookOpen } from 'lucide-react';
import { createPortal } from 'react-dom';

const HelpTooltip = ({ title, content, videoUrl }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);

    const open = (e) => {
        e.stopPropagation();
        const rect = btnRef.current.getBoundingClientRect();
        const left = Math.min(rect.left, window.innerWidth - 300);
        setPos({ top: rect.bottom + 8, left: Math.max(8, left) });
        setIsOpen(true);
    };

    useEffect(() => {
        const close = () => setIsOpen(false);
        if (isOpen) {
            document.addEventListener('click', close);
            return () => document.removeEventListener('click', close);
        }
    }, [isOpen]);

    return (
        <>
            <button
                ref={btnRef}
                className="btn-ghost"
                style={{ padding: '2px 6px', marginLeft: '8px', color: 'var(--color-accent-orange)', minHeight: 'unset', border: 'none', background: 'transparent', lineHeight: 1 }}
                onClick={open}
                title="Ayuda / Tutorial"
            >
                <HelpCircle size={16} />
            </button>

            {isOpen && createPortal(
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: pos.top,
                        left: pos.left,
                        width: '300px',
                        background: 'var(--color-bg-secondary, #1a1a1a)',
                        border: '1px solid var(--color-accent-orange)',
                        borderRadius: '12px',
                        padding: '18px',
                        zIndex: 2147483647,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                        animation: 'fade-in 0.15s ease-out',
                        color: 'var(--color-text-main, #fff)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <BookOpen size={15} color="var(--color-accent-orange)" />
                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--color-accent-orange)', flex: 1 }}>{title}</h4>
                        <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-text-muted, #888)', lineHeight: 1 }}
                            onClick={() => setIsOpen(false)}
                        >
                            <X size={15} />
                        </button>
                    </div>
                    <p style={{ margin: '0', fontSize: '13px', color: 'var(--color-text-muted, #aaa)', lineHeight: '1.5' }}>
                        {content}
                    </p>
                </div>,
                document.body
            )}
        </>
    );
};

export default HelpTooltip;

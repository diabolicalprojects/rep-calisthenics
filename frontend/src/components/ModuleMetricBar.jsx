import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, TrendingDown, RefreshCw, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * ModuleMetricBar — reusable metric strip to embed in any module's header.
 * Props:
 *   stats: Array<{ label, value, color?, trend? }>
 *   moduleName: string  (for "full analytics" link)
 */
const ModuleMetricBar = ({ stats = [], moduleName = '' }) => {
    return (
        <div style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            background: 'var(--color-glass)',
            border: '1px solid var(--color-glass-border)',
            borderRadius: 12,
            padding: '14px 20px',
            marginBottom: 28,
            alignItems: 'center',
        }}>
            {stats.map((s, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 'min(100px, 45%)', flex: 1 }}>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: s.color || 'var(--color-accent)', lineHeight: 1 }}>{s.value}</span>
                    {s.trend !== undefined && (
                        <span style={{ fontSize: 10, color: s.trend >= 0 ? 'var(--color-success)' : 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 2 }}>
                            {s.trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {s.trend >= 0 ? '+' : ''}{s.trend}%
                        </span>
                    )}
                </div>
            ))}

            {/* Link to full analytics */}
            <a href="/analytics" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-accent)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <BarChart2 size={12} /> Ver Analytics <ArrowUpRight size={11} />
            </a>
        </div>
    );
};

export default ModuleMetricBar;

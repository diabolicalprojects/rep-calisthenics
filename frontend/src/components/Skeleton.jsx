import React from 'react';

const Skeleton = ({ width, height, borderRadius = '12px', className = '' }) => {
    return (
        <div 
            className={`skeleton-base ${className}`}
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius: borderRadius,
                background: 'linear-gradient(90deg, var(--color-glass) 25%, var(--color-glass-border) 50%, var(--color-glass) 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-loading 1.5s infinite ease-in-out',
                opacity: 0.6
            }}
        />
    );
};

export const MetricSkeleton = () => (
    <div className="glass-panel" style={{ padding: '24px', minHeight: '140px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Skeleton width="40%" height="16px" />
            <Skeleton width="24px" height="24px" borderRadius="6px" />
        </div>
        <Skeleton width="60%" height="32px" style={{ marginBottom: '12px' }} />
        <Skeleton width="30%" height="12px" />
    </div>
);

export const TableRowSkeleton = ({ columns = 4 }) => (
    <div style={{ display: 'flex', gap: '15px', padding: '15px 20px', borderBottom: '1px solid var(--color-glass-border)' }}>
        {Array(columns).fill(0).map((_, i) => (
            <Skeleton key={i} width={`${100/columns}%`} height="18px" />
        ))}
    </div>
);

export default Skeleton;

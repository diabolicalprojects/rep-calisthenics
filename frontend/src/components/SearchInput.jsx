import React from 'react';
    import { Search } from 'lucide-react';

    const SearchInput = ({ value, onChange, placeholder = 'Buscar...', style = {}, ...props }) => (
        <div style={{ position: 'relative', flex: 1, ...style }}>
            <Search
                size={16}
                style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                    pointerEvents: 'none'
                }}
            />
            <input
                type="text"
                className="form-input"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                style={{ paddingLeft: 42, width: '100%' }}
                {...props}
            />
        </div>
    );

    export default SearchInput;
    

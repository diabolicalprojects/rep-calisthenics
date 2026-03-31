import React, { useState } from 'react';
import { 
    Palette, Type, Layout, Image as ImageIcon, 
    Check, RotateCcw, Save, Smartphone, 
    Monitor, CornerUpLeft, Settings as SettingsIcon,
    Moon, Sun, LayoutPanelTop
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import HelpTooltip from '../components/HelpTooltip';

const BrandingSettings = () => {
    const { settings, updateSettings, applyPreset, presets } = useTheme();
    const [localSettings, setLocalSettings] = useState(settings);
    const [previewMode, setPreviewMode] = useState('desktop');

    const handleSave = () => {
        updateSettings(localSettings);
        alert('Configuración guardada correctamente.');
    };

    const handleReset = () => {
        if (window.confirm('¿Estás seguro de restablecer al diseño original?')) {
            applyPreset('modern');
            setLocalSettings(presets.modern);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalSettings({ ...localSettings, logo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1 flex-responsive">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 className="page-title">Personalización de Marca</h1>
                        <HelpTooltip title="Marca Blanca" content="Modifica la identidad visual del sistema. Cambia colores, logos, fuentes y estilos globales." />
                    </div>
                    <p className="page-subtitle text-muted">Ajustes visuales y sistema de diseño</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-ghost" onClick={handleReset}>
                        <RotateCcw size={18} /> RESTABLECER
                    </button>
                    <button className="btn-primary" onClick={handleSave}>
                        <Save size={18} /> GUARDAR CAMBIOS
                    </button>
                </div>
            </header>

            <div className="dashboard-grid-main" style={{ marginTop: 32 }}>
                {/* Editor Panel */}
                <div className="glass-panel stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    
                    {/* Identity Section */}
                    <section>
                        <h3 style={{ fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <SettingsIcon size={18} className="text-orange" /> Identidad Básica
                        </h3>
                        <div className="form-group">
                            <label>Nombre del Gimnasio / Negocio</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                value={localSettings.brandName} 
                                onChange={e => setLocalSettings({...localSettings, brandName: e.target.value})}
                                placeholder="Ej. Zen Fitness Center"
                            />
                        </div>
                        <div className="form-group">
                            <label>Logo (PNG / SVG sugerido)</label>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                <div style={{ 
                                    width: 64, 
                                    height: 64, 
                                    borderRadius: 12, 
                                    background: 'var(--color-glass)', 
                                    border: '1px dashed var(--color-glass-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}>
                                    {localSettings.logo ? (
                                        <img src={localSettings.logo} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                    ) : (
                                        <ImageIcon size={24} style={{ opacity: 0.2 }} />
                                    )}
                                </div>
                                <label className="btn-ghost" style={{ cursor: 'pointer', fontSize: 12 }}>
                                    SUBIR LOGO
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Presets Section */}
                    <section>
                        <h3 style={{ fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <LayoutPanelTop size={18} className="text-orange" /> Estilos Predeterminados
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            {Object.entries(presets).map(([id, p]) => (
                                <button 
                                    key={id}
                                    className={`glass-panel ${localSettings.themeName === id ? 'active-border' : ''}`}
                                    style={{ 
                                        padding: 16, 
                                        textAlign: 'center', 
                                        cursor: 'pointer',
                                        border: localSettings.themeName === id ? '1px solid var(--color-accent-orange)' : '1px solid var(--color-glass-border)',
                                        background: localSettings.themeName === id ? 'var(--color-accent-orange-glass)' : 'transparent'
                                    }}
                                    onClick={() => {
                                        setLocalSettings({ ...localSettings, ...presets[id], themeName: id });
                                    }}
                                >
                                    <div style={{ 
                                        width: 24, 
                                        height: 24, 
                                        borderRadius: p.borderRadius === '0px' ? '0' : '50%', 
                                        background: p.accentColor,
                                        margin: '0 auto 12px'
                                    }} />
                                    <div style={{ fontSize: 11, fontWeight: 700 }}>{p.name.toUpperCase()}</div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Detailed Tools */}
                    <section>
                        <h3 style={{ fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Palette size={18} className="text-orange" /> Ajustes de Diseño
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="form-group">
                                <label>Color de Acento</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input 
                                        type="color" 
                                        style={{ width: 44, height: 44, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                                        value={localSettings.accentColor}
                                        onChange={e => setLocalSettings({...localSettings, accentColor: e.target.value, themeName: 'custom'})}
                                    />
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={localSettings.accentColor} 
                                        onChange={e => setLocalSettings({...localSettings, accentColor: e.target.value, themeName: 'custom'})}
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Redondez de Esquinas</label>
                                <select 
                                    className="form-input" 
                                    value={localSettings.borderRadius} 
                                    onChange={e => setLocalSettings({...localSettings, borderRadius: e.target.value, themeName: 'custom'})}
                                >
                                    <option value="0px">Sin redondez (Cuadrado)</option>
                                    <option value="8px">Pequeño (8px)</option>
                                    <option value="12px">Estándar (12px)</option>
                                    <option value="24px">Suave (24px)</option>
                                    <option value="50px">Cápsula (50px)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Fuente de Títulos</label>
                                <select 
                                    className="form-input" 
                                    value={localSettings.font} 
                                    onChange={e => setLocalSettings({...localSettings, font: e.target.value, themeName: 'custom'})}
                                >
                                    <option value="'Lexend', sans-serif">Lexend (Moderno)</option>
                                    <option value="'Inter', sans-serif">Inter (Profesional)</option>
                                    <option value="'Space Grotesk', sans-serif">Space Grotesk (Técnico)</option>
                                    <option value="'Outfit', sans-serif">Outfit (Agradable)</option>
                                    <option value="'Bebas Neue', sans-serif">Bebas Neue (Deportivo)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Intensidad del Cristal (Glassiness: {Math.round(localSettings.glassiness * 100)}%)</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="0.2" 
                                    step="0.01" 
                                    className="form-input" 
                                    value={localSettings.glassiness} 
                                    onChange={e => setLocalSettings({...localSettings, glassiness: parseFloat(e.target.value), themeName: 'custom'})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Opacidad del Borde ({Math.round(localSettings.borderOpacity * 100)}%)</label>
                                <input 
                                    type="range" 
                                    min="0.01" 
                                    max="0.5" 
                                    step="0.01" 
                                    className="form-input" 
                                    value={localSettings.borderOpacity} 
                                    onChange={e => setLocalSettings({...localSettings, borderOpacity: parseFloat(e.target.value), themeName: 'custom'})}
                                />
                            </div>
                        </div>
                    </section>

                </div>

                {/* Preview Panel */}
                <div className="glass-panel stagger-3" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>PREVISUALIZACIÓN EN VIVO</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                                className="btn-ghost" 
                                style={{ padding: 6, background: previewMode === 'desktop' ? 'var(--color-glass)' : 'transparent' }}
                                onClick={() => setPreviewMode('desktop')}
                            >
                                <Monitor size={16} />
                            </button>
                            <button 
                                className="btn-ghost" 
                                style={{ padding: 6, background: previewMode === 'mobile' ? 'var(--color-glass)' : 'transparent' }}
                                onClick={() => setPreviewMode('mobile')}
                            >
                                <Smartphone size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ 
                        flex: 1, 
                        background: '#050505', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        padding: 32,
                        minHeight: 400
                    }}>
                        {/* Mock UI */}
                        <div style={{ 
                            width: previewMode === 'mobile' ? '280px' : '100%',
                            transition: 'all 0.5s ease',
                            background: '#000',
                            borderRadius: localSettings.borderRadius,
                            border: '1px solid var(--color-glass-border)',
                            padding: 24,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                        }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                {localSettings.logo ? (
                                    <img src={localSettings.logo} alt="Mock Logo" style={{ height: 24 }} />
                                ) : (
                                    <span style={{ fontWeight: 900, fontSize: 18, color: localSettings.accentColor }}>{localSettings.brandName.toUpperCase()}</span>
                                )}
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-glass)' }} />
                             </div>

                             <h2 style={{ fontFamily: localSettings.font, fontSize: 24, marginBottom: 8 }}>Bienvenido Atleta</h2>
                             <p className="text-muted" style={{ fontSize: 12, marginBottom: 24 }}>Tu última sesión fue ayer.</p>

                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                                <div className="glass-panel" style={{ height: 80, borderRadius: localSettings.borderRadius, background: `rgba(255,255,255,${localSettings.glassiness})`, border: `1px solid rgba(255,255,255,${localSettings.borderOpacity})` }} />
                                <div className="glass-panel" style={{ height: 80, borderRadius: localSettings.borderRadius, background: `rgba(255,255,255,${localSettings.glassiness})`, border: `1px solid rgba(255,255,255,${localSettings.borderOpacity})` }} />
                             </div>

                             <button className="btn-primary" style={{ width: '100%', background: localSettings.accentColor, borderRadius: localSettings.borderRadius, border: 'none', padding: '12px', color: '#000', fontWeight: 900 }}>
                                COMENZAR SESIÓN
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandingSettings;

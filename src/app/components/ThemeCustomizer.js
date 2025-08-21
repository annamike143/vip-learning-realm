// --- src/app/components/ThemeCustomizer.js (Command Center Theme Management) ---
'use client';
import React, { useState } from 'react';
import { ref, set, push } from 'firebase/database';
import { database } from '../lib/firebase';
import { useTheme, THEME_PRESETS } from './ThemeProvider';
import './ThemeCustomizer.css';

export default function ThemeCustomizer({ courseId, onClose }) {
    const { currentTheme, customBranding, themePresets } = useTheme();
    const [activeTab, setActiveTab] = useState('presets');
    const [customColors, setCustomColors] = useState(currentTheme);
    const [branding, setBranding] = useState(customBranding);
    const [saving, setSaving] = useState(false);

    const handlePresetSelect = async (presetKey) => {
        setSaving(true);
        try {
            const themeRef = ref(database, `courses/${courseId}/theme`);
            await set(themeRef, {
                preset: presetKey,
                updatedAt: new Date().toISOString()
            });
            
            // Show success feedback
            alert('Theme updated successfully!');
        } catch (error) {
            console.error('Error updating theme:', error);
            alert('Error updating theme. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCustomColorSave = async () => {
        setSaving(true);
        try {
            const themeRef = ref(database, `courses/${courseId}/theme`);
            await set(themeRef, {
                preset: 'custom',
                customColors: customColors,
                updatedAt: new Date().toISOString()
            });
            
            alert('Custom theme saved successfully!');
        } catch (error) {
            console.error('Error saving custom theme:', error);
            alert('Error saving custom theme. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleBrandingSave = async () => {
        setSaving(true);
        try {
            const brandingRef = ref(database, `courses/${courseId}/branding`);
            await set(brandingRef, {
                ...branding,
                updatedAt: new Date().toISOString()
            });
            
            alert('Branding updated successfully!');
        } catch (error) {
            console.error('Error updating branding:', error);
            alert('Error updating branding. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const ColorPicker = ({ label, value, onChange }) => (
        <div className="color-picker-group">
            <label className="color-label">{label}</label>
            <div className="color-input-group">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="color-input"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="color-text-input"
                    placeholder="#000000"
                />
            </div>
        </div>
    );

    return (
        <div className="theme-customizer-overlay">
            <div className="theme-customizer">
                <div className="customizer-header">
                    <h2>🎨 Course Theme & Branding</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="customizer-tabs">
                    <button 
                        className={`tab ${activeTab === 'presets' ? 'active' : ''}`}
                        onClick={() => setActiveTab('presets')}
                    >
                        Theme Presets
                    </button>
                    <button 
                        className={`tab ${activeTab === 'custom' ? 'active' : ''}`}
                        onClick={() => setActiveTab('custom')}
                    >
                        Custom Colors
                    </button>
                    <button 
                        className={`tab ${activeTab === 'branding' ? 'active' : ''}`}
                        onClick={() => setActiveTab('branding')}
                    >
                        Branding
                    </button>
                </div>

                <div className="customizer-content">
                    {activeTab === 'presets' && (
                        <div className="presets-section">
                            <h3>Choose a Theme Preset</h3>
                            <div className="preset-grid">
                                {Object.entries(themePresets).map(([key, preset]) => (
                                    <div key={key} className="preset-card">
                                        <div 
                                            className="preset-preview"
                                            style={{
                                                background: preset.gradient,
                                                border: `2px solid ${preset.border}`
                                            }}
                                        >
                                            <div className="preview-header" style={{ background: preset.surface }}>
                                                <div className="preview-logo" style={{ background: preset.logoBackground }}></div>
                                                <div className="preview-text" style={{ background: preset.primary }}></div>
                                            </div>
                                            <div className="preview-content" style={{ background: preset.background }}>
                                                <div className="preview-line" style={{ background: preset.text }}></div>
                                                <div className="preview-line" style={{ background: preset.textSecondary }}></div>
                                            </div>
                                        </div>
                                        <h4>{preset.name}</h4>
                                        <button 
                                            className="apply-preset-btn"
                                            onClick={() => handlePresetSelect(key)}
                                            disabled={saving}
                                            style={{ background: preset.primary }}
                                        >
                                            Apply Theme
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'custom' && (
                        <div className="custom-colors-section">
                            <h3>Custom Color Scheme</h3>
                            <div className="color-grid">
                                <ColorPicker
                                    label="Primary Color"
                                    value={customColors.primary}
                                    onChange={(value) => setCustomColors(prev => ({ ...prev, primary: value }))}
                                />
                                <ColorPicker
                                    label="Primary Hover"
                                    value={customColors.primaryHover}
                                    onChange={(value) => setCustomColors(prev => ({ ...prev, primaryHover: value }))}
                                />
                                <ColorPicker
                                    label="Background"
                                    value={customColors.background}
                                    onChange={(value) => setCustomColors(prev => ({ ...prev, background: value }))}
                                />
                                <ColorPicker
                                    label="Surface"
                                    value={customColors.surface}
                                    onChange={(value) => setCustomColors(prev => ({ ...prev, surface: value }))}
                                />
                                <ColorPicker
                                    label="Text Color"
                                    value={customColors.text}
                                    onChange={(value) => setCustomColors(prev => ({ ...prev, text: value }))}
                                />
                                <ColorPicker
                                    label="Accent Color"
                                    value={customColors.accent}
                                    onChange={(value) => setCustomColors(prev => ({ ...prev, accent: value }))}
                                />
                            </div>
                            <button 
                                className="save-custom-btn"
                                onClick={handleCustomColorSave}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Custom Theme'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'branding' && (
                        <div className="branding-section">
                            <h3>Course Branding</h3>
                            <div className="branding-form">
                                <div className="form-group">
                                    <label>Academy Name</label>
                                    <input
                                        type="text"
                                        value={branding.academyName}
                                        onChange={(e) => setBranding(prev => ({ ...prev, academyName: e.target.value }))}
                                        placeholder="Your Academy Name"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Logo Text (if no logo image)</label>
                                    <input
                                        type="text"
                                        value={branding.logoText}
                                        onChange={(e) => setBranding(prev => ({ ...prev, logoText: e.target.value }))}
                                        placeholder="MS"
                                        maxLength="3"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Logo Image URL</label>
                                    <input
                                        type="url"
                                        value={branding.logoUrl || ''}
                                        onChange={(e) => setBranding(prev => ({ ...prev, logoUrl: e.target.value }))}
                                        placeholder="https://example.com/logo.png"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Instructor Welcome Message</label>
                                    <textarea
                                        value={branding.instructorMessage || ''}
                                        onChange={(e) => setBranding(prev => ({ ...prev, instructorMessage: e.target.value }))}
                                        placeholder="Welcome message for students..."
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Social Links</label>
                                    <div className="social-inputs">
                                        <input
                                            type="url"
                                            value={branding.socialLinks?.twitter || ''}
                                            onChange={(e) => setBranding(prev => ({ 
                                                ...prev, 
                                                socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                                            }))}
                                            placeholder="Twitter URL"
                                        />
                                        <input
                                            type="url"
                                            value={branding.socialLinks?.linkedin || ''}
                                            onChange={(e) => setBranding(prev => ({ 
                                                ...prev, 
                                                socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                                            }))}
                                            placeholder="LinkedIn URL"
                                        />
                                        <input
                                            type="url"
                                            value={branding.socialLinks?.website || ''}
                                            onChange={(e) => setBranding(prev => ({ 
                                                ...prev, 
                                                socialLinks: { ...prev.socialLinks, website: e.target.value }
                                            }))}
                                            placeholder="Website URL"
                                        />
                                    </div>
                                </div>

                                <button 
                                    className="save-branding-btn"
                                    onClick={handleBrandingSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Branding'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

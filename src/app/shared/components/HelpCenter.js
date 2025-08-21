// --- Professional Help Center Component ---
'use client';

import React, { useState, useEffect } from 'react';
import { trackUserInteraction } from '../analytics/analytics';

const HelpCenter = ({ onClose }) => {
    const [activeSection, setActiveSection] = useState('faq');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredFAQs, setFilteredFAQs] = useState([]);

    const helpSections = {
        faq: '❓ Frequently Asked Questions',
        getting_started: '🚀 Getting Started',
        courses: '📚 Courses & Lessons',
        ai_assistant: '🤖 AI Assistant',
        technical: '🔧 Technical Support',
        billing: '💳 Billing & Account'
    };

    const faqData = [
        {
            id: 1,
            category: 'getting_started',
            question: 'How do I access my VIP courses?',
            answer: 'After logging in, you\'ll see your dashboard with all available courses. Click on any course to start learning. Your progress is automatically saved.'
        },
        {
            id: 2,
            category: 'courses',
            question: 'How do I unlock new lessons?',
            answer: 'Lessons unlock automatically as you complete previous ones. Some lessons require an unlock code that will be provided by your instructor.'
        },
        {
            id: 3,
            category: 'ai_assistant',
            question: 'How does the AI assistant work?',
            answer: 'The AI assistant provides personalized help, explanations, and recitation practice. Click the chat icon in any lesson to start a conversation.'
        },
        {
            id: 4,
            category: 'technical',
            question: 'The video won\'t play. What should I do?',
            answer: 'Try refreshing the page, checking your internet connection, or switching browsers. If the problem persists, contact support.'
        },
        {
            id: 5,
            category: 'courses',
            question: 'Can I download lessons for offline viewing?',
            answer: 'Currently, lessons are available for online viewing only. This ensures you always have access to the latest content and AI features.'
        },
        {
            id: 6,
            category: 'billing',
            question: 'How do I update my payment information?',
            answer: 'Go to your account settings and select "Billing" to update your payment method or view your subscription details.'
        },
        {
            id: 7,
            category: 'ai_assistant',
            question: 'Can the AI assistant help with homework?',
            answer: 'Yes! The AI assistant can explain concepts, provide practice problems, and help you understand difficult topics. It\'s designed to enhance your learning.'
        },
        {
            id: 8,
            category: 'technical',
            question: 'I forgot my password. How do I reset it?',
            answer: 'Click "Forgot Password" on the login page and enter your email. You\'ll receive a reset link within a few minutes.'
        },
        {
            id: 9,
            category: 'courses',
            question: 'How long do I have access to courses?',
            answer: 'Your VIP membership includes unlimited access to all courses for the duration of your subscription.'
        },
        {
            id: 10,
            category: 'getting_started',
            question: 'What browsers are supported?',
            answer: 'We support the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience, we recommend Chrome.'
        }
    ];

    const gettingStartedGuide = [
        {
            step: 1,
            title: 'Welcome to VIP Learning',
            content: 'Your exclusive access to premium educational content with AI-powered assistance.'
        },
        {
            step: 2,
            title: 'Navigate Your Dashboard',
            content: 'Your dashboard shows all available courses, your progress, and recent activity.'
        },
        {
            step: 3,
            title: 'Start Your First Course',
            content: 'Click on any course tile to begin. Lessons unlock progressively as you complete them.'
        },
        {
            step: 4,
            title: 'Use the AI Assistant',
            content: 'Click the chat icon in any lesson to get personalized help and explanations.'
        },
        {
            step: 5,
            title: 'Track Your Progress',
            content: 'Your progress is automatically saved. Use the navigation to jump between completed lessons.'
        }
    ];

    const technicalTips = [
        {
            icon: '🌐',
            title: 'Browser Requirements',
            description: 'Use the latest version of Chrome, Firefox, Safari, or Edge for optimal performance.'
        },
        {
            icon: '📶',
            title: 'Internet Connection',
            description: 'A stable broadband connection is recommended for video content and AI interactions.'
        },
        {
            icon: '🔊',
            title: 'Audio Settings',
            description: 'Ensure your speakers or headphones are working for the best learning experience.'
        },
        {
            icon: '📱',
            title: 'Mobile Support',
            description: 'The platform works on tablets and phones, though desktop is recommended for courses.'
        }
    ];

    // Filter FAQs based on search and section
    useEffect(() => {
        let filtered = faqData;
        
        if (activeSection !== 'faq') {
            filtered = faqData.filter(faq => faq.category === activeSection);
        }
        
        if (searchQuery) {
            filtered = filtered.filter(faq => 
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        setFilteredFAQs(filtered);
    }, [activeSection, searchQuery]);

    const handleSectionChange = (section) => {
        setActiveSection(section);
        trackUserInteraction('help_section_viewed', 'help_center', section);
    };

    const FAQItem = ({ faq }) => {
        const [isOpen, setIsOpen] = useState(false);
        
        return (
            <div className="faq-item">
                <button
                    className="faq-question"
                    onClick={() => {
                        setIsOpen(!isOpen);
                        if (!isOpen) {
                            trackUserInteraction('faq_opened', 'help_center', faq.id);
                        }
                    }}
                >
                    <span>{faq.question}</span>
                    <span className={`faq-toggle ${isOpen ? 'open' : ''}`}>▼</span>
                </button>
                {isOpen && (
                    <div className="faq-answer">
                        <p>{faq.answer}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="help-center-overlay">
            <div className="help-center">
                {/* Header */}
                <div className="help-header">
                    <h2>🎓 VIP Help Center</h2>
                    <button className="close-help" onClick={onClose}>✕</button>
                </div>

                {/* Search */}
                <div className="help-search">
                    <input
                        type="text"
                        placeholder="Search for help..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="search-icon">🔍</span>
                </div>

                <div className="help-content">
                    {/* Sidebar */}
                    <div className="help-sidebar">
                        <nav className="help-nav">
                            {Object.entries(helpSections).map(([key, label]) => (
                                <button
                                    key={key}
                                    className={`nav-item ${activeSection === key ? 'active' : ''}`}
                                    onClick={() => handleSectionChange(key)}
                                >
                                    {label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="help-main">
                        {/* FAQ Sections */}
                        {(activeSection === 'faq' || Object.keys(helpSections).includes(activeSection)) && (
                            <div className="faq-section">
                                <h3>
                                    {activeSection === 'faq' 
                                        ? 'Frequently Asked Questions' 
                                        : helpSections[activeSection]
                                    }
                                </h3>
                                
                                {filteredFAQs.length === 0 ? (
                                    <div className="no-results">
                                        <p>No articles found. Try adjusting your search or browse different categories.</p>
                                    </div>
                                ) : (
                                    <div className="faq-list">
                                        {filteredFAQs.map(faq => (
                                            <FAQItem key={faq.id} faq={faq} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Getting Started Guide */}
                        {activeSection === 'getting_started' && !searchQuery && (
                            <div className="getting-started">
                                <h3>🚀 Getting Started Guide</h3>
                                <div className="guide-steps">
                                    {gettingStartedGuide.map(step => (
                                        <div key={step.step} className="guide-step">
                                            <div className="step-number">{step.step}</div>
                                            <div className="step-content">
                                                <h4>{step.title}</h4>
                                                <p>{step.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Technical Support */}
                        {activeSection === 'technical' && !searchQuery && (
                            <div className="technical-section">
                                <h3>🔧 Technical Requirements</h3>
                                <div className="tech-tips">
                                    {technicalTips.map((tip, index) => (
                                        <div key={index} className="tech-tip">
                                            <div className="tip-icon">{tip.icon}</div>
                                            <div className="tip-content">
                                                <h4>{tip.title}</h4>
                                                <p>{tip.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="help-footer">
                    <p>Still need help? <button className="contact-support">Contact Support</button></p>
                </div>
            </div>

            <style jsx>{`
                .help-center-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1002;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                
                .help-center {
                    background: var(--color-surface, white);
                    border-radius: 12px;
                    width: 100%;
                    max-width: 900px;
                    height: 80vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }
                
                .help-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--color-border, #e0e0e0);
                    background: var(--color-primary, #00A9E0);
                    color: white;
                    border-radius: 12px 12px 0 0;
                }
                
                .help-header h2 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                }
                
                .close-help {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                }
                
                .close-help:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .help-search {
                    position: relative;
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--color-border, #e0e0e0);
                }
                
                .help-search input {
                    width: 100%;
                    padding: 12px 40px 12px 16px;
                    border: 1px solid var(--color-border, #ddd);
                    border-radius: 8px;
                    font-size: 16px;
                    outline: none;
                }
                
                .help-search input:focus {
                    border-color: var(--color-primary, #00A9E0);
                    box-shadow: 0 0 0 2px rgba(0, 169, 224, 0.1);
                }
                
                .search-icon {
                    position: absolute;
                    right: 36px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 18px;
                    color: var(--color-textSecondary, #666);
                }
                
                .help-content {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                }
                
                .help-sidebar {
                    width: 250px;
                    border-right: 1px solid var(--color-border, #e0e0e0);
                    background: var(--color-surface-variant, #f9f9f9);
                }
                
                .help-nav {
                    padding: 16px 0;
                }
                
                .nav-item {
                    width: 100%;
                    padding: 12px 24px;
                    background: none;
                    border: none;
                    text-align: left;
                    font-size: 14px;
                    color: var(--color-text, #333);
                    cursor: pointer;
                    transition: background-color 0.2s;
                    border-left: 3px solid transparent;
                }
                
                .nav-item:hover {
                    background: rgba(0, 169, 224, 0.1);
                }
                
                .nav-item.active {
                    background: rgba(0, 169, 224, 0.1);
                    border-left-color: var(--color-primary, #00A9E0);
                    color: var(--color-primary, #00A9E0);
                    font-weight: 500;
                }
                
                .help-main {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                }
                
                .help-main h3 {
                    margin: 0 0 20px 0;
                    font-size: 18px;
                    color: var(--color-text, #333);
                }
                
                .faq-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .faq-item {
                    border: 1px solid var(--color-border, #e0e0e0);
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .faq-question {
                    width: 100%;
                    padding: 16px;
                    background: none;
                    border: none;
                    text-align: left;
                    font-size: 15px;
                    font-weight: 500;
                    color: var(--color-text, #333);
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background-color 0.2s;
                }
                
                .faq-question:hover {
                    background: var(--color-surface-variant, #f5f5f5);
                }
                
                .faq-toggle {
                    transition: transform 0.2s;
                    font-size: 12px;
                    color: var(--color-textSecondary, #666);
                }
                
                .faq-toggle.open {
                    transform: rotate(180deg);
                }
                
                .faq-answer {
                    padding: 16px;
                    border-top: 1px solid var(--color-border, #e0e0e0);
                    background: var(--color-surface-variant, #f9f9f9);
                }
                
                .faq-answer p {
                    margin: 0;
                    color: var(--color-textSecondary, #666);
                    line-height: 1.5;
                }
                
                .guide-steps {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .guide-step {
                    display: flex;
                    gap: 16px;
                    padding: 16px;
                    border: 1px solid var(--color-border, #e0e0e0);
                    border-radius: 8px;
                }
                
                .step-number {
                    width: 32px;
                    height: 32px;
                    background: var(--color-primary, #00A9E0);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    flex-shrink: 0;
                }
                
                .step-content h4 {
                    margin: 0 0 8px 0;
                    color: var(--color-text, #333);
                }
                
                .step-content p {
                    margin: 0;
                    color: var(--color-textSecondary, #666);
                    line-height: 1.5;
                }
                
                .tech-tips {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 16px;
                }
                
                .tech-tip {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                    border: 1px solid var(--color-border, #e0e0e0);
                    border-radius: 8px;
                }
                
                .tip-icon {
                    font-size: 24px;
                    flex-shrink: 0;
                }
                
                .tip-content h4 {
                    margin: 0 0 8px 0;
                    color: var(--color-text, #333);
                    font-size: 14px;
                }
                
                .tip-content p {
                    margin: 0;
                    color: var(--color-textSecondary, #666);
                    font-size: 13px;
                    line-height: 1.4;
                }
                
                .no-results {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--color-textSecondary, #666);
                }
                
                .help-footer {
                    padding: 16px 24px;
                    border-top: 1px solid var(--color-border, #e0e0e0);
                    text-align: center;
                    background: var(--color-surface-variant, #f9f9f9);
                }
                
                .help-footer p {
                    margin: 0;
                    color: var(--color-textSecondary, #666);
                    font-size: 14px;
                }
                
                .contact-support {
                    background: none;
                    border: none;
                    color: var(--color-primary, #00A9E0);
                    text-decoration: underline;
                    cursor: pointer;
                    font-size: 14px;
                }
                
                .contact-support:hover {
                    color: var(--color-primary-dark, #0088b3);
                }
            `}</style>
        </div>
    );
};

export default HelpCenter;

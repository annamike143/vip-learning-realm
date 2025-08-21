// --- Enhanced AI-Powered User Onboarding ---
'use client';
import React, { useState, useEffect } from 'react';
import { aiPersonalization } from '../lib/aiPersonalization';
import './SmartOnboarding.css';

export default function SmartOnboarding({ user, onComplete }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [userData, setUserData] = useState({
        // Basic Info
        firstName: user?.displayName?.split(' ')[0] || '',
        lastName: user?.displayName?.split(' ')[1] || '',
        email: user?.email || '',
        
        // Career Profile
        currentRole: '',
        industryInterest: '',
        experienceYears: 0,
        careerGoals: [],
        skillLevel: 'beginner',
        
        // Learning Preferences
        learningMotivation: '',
        timeCommitment: '',
        preferredSchedule: [],
        
        // Goals & Aspirations
        targetSalary: '',
        dreamJob: '',
        learningObjectives: []
    });
    
    const [isGenerating, setIsGenerating] = useState(false);

    const steps = [
        { id: 1, title: 'Welcome', subtitle: 'Let\'s get to know you' },
        { id: 2, title: 'Career Profile', subtitle: 'Your professional background' },
        { id: 3, title: 'Learning Style', subtitle: 'How you prefer to learn' },
        { id: 4, title: 'Goals & Vision', subtitle: 'Where you want to go' },
        { id: 5, title: 'AI Personalization', subtitle: 'Creating your profile' }
    ];

    const industries = [
        'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing',
        'Sales', 'Design', 'Engineering', 'Consulting', 'Entrepreneurship',
        'Real Estate', 'Media', 'Non-Profit', 'Government', 'Other'
    ];

    const careerGoalOptions = [
        'Get promoted in current role',
        'Switch to a new career',
        'Start my own business',
        'Increase my salary significantly',
        'Develop technical skills',
        'Improve leadership abilities',
        'Build a personal brand',
        'Network with industry professionals',
        'Achieve work-life balance',
        'Become an expert in my field'
    ];

    const learningMotivations = [
        'Career advancement',
        'Personal growth',
        'Financial improvement',
        'Skill development',
        'Industry change',
        'Entrepreneurship',
        'Knowledge for knowledge sake'
    ];

    const timeCommitments = [
        { value: '30min', label: '30 minutes/day' },
        { value: '1hour', label: '1 hour/day' },
        { value: '2hours', label: '2 hours/day' },
        { value: 'weekend', label: 'Weekends only' },
        { value: 'flexible', label: 'Flexible schedule' }
    ];

    const scheduleOptions = [
        'Early morning (6-9 AM)',
        'Mid-morning (9-12 PM)',
        'Afternoon (12-5 PM)',
        'Evening (5-8 PM)',
        'Night (8-11 PM)',
        'Late night (11+ PM)'
    ];

    const handleInputChange = (field, value) => {
        setUserData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleArrayToggle = (field, value) => {
        setUserData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };

    const nextStep = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        } else {
            completeOnboarding();
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const completeOnboarding = async () => {
        setIsGenerating(true);
        
        try {
            // Use AI to enrich the user profile
            const enrichedProfile = await aiPersonalization.enrichUserProfile(user.uid, userData);
            
            // Generate personalized welcome message
            const welcomeMessage = await aiPersonalization.generatePersonalizedContent(
                user.uid, 
                'welcome_message'
            );
            
            // Complete onboarding
            onComplete({
                profile: enrichedProfile,
                welcomeMessage,
                isNewUser: true
            });
            
        } catch (error) {
            console.error('Error completing onboarding:', error);
            onComplete({ profile: userData, isNewUser: true });
        } finally {
            setIsGenerating(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="onboarding-step">
                        <div className="step-header">
                            <h2>Welcome to Your Learning Journey! 🎯</h2>
                            <p>Let's create a personalized experience that helps you achieve your goals faster.</p>
                        </div>
                        
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                value={userData.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                placeholder="Your first name"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                value={userData.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                placeholder="Your last name"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>What should we call you? (Optional nickname)</label>
                            <input
                                type="text"
                                value={userData.preferredName || ''}
                                onChange={(e) => handleInputChange('preferredName', e.target.value)}
                                placeholder="Nickname or preferred name"
                            />
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="onboarding-step">
                        <div className="step-header">
                            <h2>Your Professional Background 💼</h2>
                            <p>Help us understand your career context to provide relevant learning paths.</p>
                        </div>
                        
                        <div className="form-group">
                            <label>Current Role/Position</label>
                            <input
                                type="text"
                                value={userData.currentRole}
                                onChange={(e) => handleInputChange('currentRole', e.target.value)}
                                placeholder="e.g., Marketing Manager, Student, Entrepreneur"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Industry of Interest</label>
                            <select
                                value={userData.industryInterest}
                                onChange={(e) => handleInputChange('industryInterest', e.target.value)}
                            >
                                <option value="">Select an industry</option>
                                {industries.map(industry => (
                                    <option key={industry} value={industry}>{industry}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Years of Professional Experience</label>
                            <select
                                value={userData.experienceYears}
                                onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value))}
                            >
                                <option value={0}>New to workforce</option>
                                <option value={1}>1-2 years</option>
                                <option value={3}>3-5 years</option>
                                <option value={6}>6-10 years</option>
                                <option value={11}>10+ years</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Current Skill Level</label>
                            <div className="radio-group">
                                {['beginner', 'intermediate', 'advanced', 'expert'].map(level => (
                                    <label key={level} className="radio-label">
                                        <input
                                            type="radio"
                                            name="skillLevel"
                                            value={level}
                                            checked={userData.skillLevel === level}
                                            onChange={(e) => handleInputChange('skillLevel', e.target.value)}
                                        />
                                        <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="onboarding-step">
                        <div className="step-header">
                            <h2>Learning Preferences 📚</h2>
                            <p>Let's optimize your learning experience based on your style and schedule.</p>
                        </div>
                        
                        <div className="form-group">
                            <label>What motivates you to learn?</label>
                            <select
                                value={userData.learningMotivation}
                                onChange={(e) => handleInputChange('learningMotivation', e.target.value)}
                            >
                                <option value="">Select your primary motivation</option>
                                {learningMotivations.map(motivation => (
                                    <option key={motivation} value={motivation}>{motivation}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>How much time can you dedicate to learning?</label>
                            <div className="radio-group">
                                {timeCommitments.map(option => (
                                    <label key={option.value} className="radio-label">
                                        <input
                                            type="radio"
                                            name="timeCommitment"
                                            value={option.value}
                                            checked={userData.timeCommitment === option.value}
                                            onChange={(e) => handleInputChange('timeCommitment', e.target.value)}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Best learning times for you (select all that apply)</label>
                            <div className="checkbox-group">
                                {scheduleOptions.map(option => (
                                    <label key={option} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={userData.preferredSchedule.includes(option)}
                                            onChange={() => handleArrayToggle('preferredSchedule', option)}
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="onboarding-step">
                        <div className="step-header">
                            <h2>Your Goals & Vision 🎯</h2>
                            <p>Define your aspirations so we can create the perfect learning path.</p>
                        </div>
                        
                        <div className="form-group">
                            <label>Career Goals (select all that apply)</label>
                            <div className="checkbox-group">
                                {careerGoalOptions.map(goal => (
                                    <label key={goal} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={userData.careerGoals.includes(goal)}
                                            onChange={() => handleArrayToggle('careerGoals', goal)}
                                        />
                                        <span>{goal}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Dream Job/Role (Optional)</label>
                            <input
                                type="text"
                                value={userData.dreamJob}
                                onChange={(e) => handleInputChange('dreamJob', e.target.value)}
                                placeholder="e.g., CEO, Tech Lead, Creative Director"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Target Salary Range (Optional)</label>
                            <select
                                value={userData.targetSalary}
                                onChange={(e) => handleInputChange('targetSalary', e.target.value)}
                            >
                                <option value="">Prefer not to say</option>
                                <option value="<50k">Under $50k</option>
                                <option value="50k-75k">$50k - $75k</option>
                                <option value="75k-100k">$75k - $100k</option>
                                <option value="100k-150k">$100k - $150k</option>
                                <option value="150k+">$150k+</option>
                            </select>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="onboarding-step">
                        <div className="step-header">
                            <h2>Creating Your AI-Powered Profile 🤖</h2>
                            <p>Our AI is analyzing your inputs to create a personalized learning experience...</p>
                        </div>
                        
                        {isGenerating ? (
                            <div className="ai-generation">
                                <div className="loading-animation">
                                    <div className="ai-brain">🧠</div>
                                    <div className="loading-text">
                                        <p>Analyzing your learning style...</p>
                                        <p>Customizing content recommendations...</p>
                                        <p>Setting up your personal dashboard...</p>
                                        <p>Almost ready! 🚀</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="profile-summary">
                                <h3>Profile Summary</h3>
                                <div className="summary-card">
                                    <p><strong>Name:</strong> {userData.firstName} {userData.lastName}</p>
                                    <p><strong>Role:</strong> {userData.currentRole || 'Not specified'}</p>
                                    <p><strong>Industry:</strong> {userData.industryInterest || 'Not specified'}</p>
                                    <p><strong>Experience:</strong> {userData.experienceYears} years</p>
                                    <p><strong>Goals:</strong> {userData.careerGoals.length} selected</p>
                                    <p><strong>Learning Time:</strong> {userData.timeCommitment}</p>
                                </div>
                                
                                <button 
                                    className="complete-btn"
                                    onClick={completeOnboarding}
                                    disabled={isGenerating}
                                >
                                    Complete Setup & Start Learning! 🎯
                                </button>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="smart-onboarding-overlay">
            <div className="smart-onboarding">
                {/* Progress Bar */}
                <div className="progress-bar">
                    <div className="progress-steps">
                        {steps.map(step => (
                            <div 
                                key={step.id}
                                className={`progress-step ${currentStep >= step.id ? 'completed' : ''} ${currentStep === step.id ? 'active' : ''}`}
                            >
                                <div className="step-number">{step.id}</div>
                                <div className="step-info">
                                    <span className="step-title">{step.title}</span>
                                    <span className="step-subtitle">{step.subtitle}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div 
                        className="progress-fill"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    ></div>
                </div>

                {/* Step Content */}
                <div className="step-content">
                    {renderStep()}
                </div>

                {/* Navigation */}
                {currentStep < 5 && (
                    <div className="step-navigation">
                        {currentStep > 1 && (
                            <button className="nav-btn prev-btn" onClick={prevStep}>
                                ← Previous
                            </button>
                        )}
                        <button 
                            className="nav-btn next-btn"
                            onClick={nextStep}
                            disabled={currentStep === 1 && (!userData.firstName || !userData.lastName)}
                        >
                            {currentStep === 4 ? 'Create My Profile →' : 'Next →'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

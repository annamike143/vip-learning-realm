// --- src/app/components/InteractiveTabs.js ---
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './InteractiveTabs.css';

const InteractiveTabs = ({ tabs }) => {
    const [activeTab, setActiveTab] = useState(0);

    // Filter out any tabs that shouldn't be rendered (like Resources if it's empty)
    const visibleTabs = tabs.filter(tab => tab.shouldRender);

    return (
        <div className="interactive-tabs-container">
            <nav className="tabs-nav">
                {visibleTabs.map((tab, index) => (
                    <button
                        key={index}
                        className={`tab-button ${index === activeTab ? 'active' : ''}`}
                        onClick={() => setActiveTab(index)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
            <div className="tabs-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {visibleTabs[activeTab]?.content}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default InteractiveTabs;
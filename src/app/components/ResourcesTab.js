// --- src/app/components/ResourcesTab.js ---
'use client';

import React from 'react';
import { FaFilePdf, FaFileArchive } from 'react-icons/fa'; // Example icons
import './ResourcesTab.css';

const ResourcesTab = ({ lessonData }) => {
    const resources = lessonData.resources || {};
    const resourceKeys = Object.keys(resources);

    return (
        <div className="resources-container">
            <h3>Downloads & Resources</h3>
            {resourceKeys.length > 0 ? (
                <ul className="resources-list">
                    {resourceKeys.map(key => {
                        const resource = resources[key];
                        // A simple logic to pick an icon based on file type
                        const isPdf = resource.url.toLowerCase().includes('.pdf');
                        return (
                            <li key={key}>
                                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                                    <span className="resource-icon">{isPdf ? <FaFilePdf /> : <FaFileArchive />}</span>
                                    <span className="resource-title">{resource.title}</span>
                                </a>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p>There are no resources available for this lesson.</p>
            )}
        </div>
    );
};

export default ResourcesTab;
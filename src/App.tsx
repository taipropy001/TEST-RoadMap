import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard/Dashboard';
import { JiraSetup } from './components/Setup/JiraSetup';

function App() {
  const [hasJiraSetup, setHasJiraSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Jira configuration exists in localStorage
    const jiraConfig = localStorage.getItem('jira_config');
    setHasJiraSetup(!!jiraConfig);
    setLoading(false);
  }, []);

  const handleJiraSetupComplete = () => {
    setHasJiraSetup(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasJiraSetup) {
    return <JiraSetup onComplete={handleJiraSetupComplete} />;
  }

  return <Dashboard />;
}

export default App;
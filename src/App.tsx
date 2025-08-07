import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard/Dashboard';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Jira configuration exists in localStorage
    setLoading(false);
  }, []);

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

  return (<div className='overflow-hidden' style={{ height: '100vh' }}>
    <Dashboard />
  </div>);
}

export default App;
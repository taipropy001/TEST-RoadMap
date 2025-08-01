import React, { useState, useEffect } from 'react';
import { Settings, ExternalLink, Check, AlertCircle } from 'lucide-react';

interface JiraSetupProps {
  onComplete: () => void;
}

export const JiraSetup: React.FC<JiraSetupProps> = ({ onComplete }) => {
  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraApiToken, setJiraApiToken] = useState('');
  const [jiraProjects, setJiraProjects] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {

    try {
      const savedConfig = localStorage.getItem('jira_config');
      if (savedConfig) {
        const data = JSON.parse(savedConfig);
        setJiraUrl(data.jira_url || '');
        setJiraEmail(data.jira_username || data.jira_email || ''); // Support both old and new format
        setJiraApiToken(data.jira_api_token || '');
        setJiraProjects(data.jira_projects || '');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setError('');
    setSuccess('');

    try {
      // Clean URL - remove trailing slash
      const cleanUrl = jiraUrl.replace(/\/$/, '');
      
      // Test with /rest/api/2/myself endpoint using GET method
      const testUrl = `${cleanUrl}/rest/api/2/myself`;
      const auth = btoa(`${jiraEmail}:${jiraApiToken}`);

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Connection successful! Connected as: ${result.displayName || result.name || 'User'}`);
      } else {
        let errorMessage = 'Failed to connect to Jira';
        
        if (response.status === 401) {
          errorMessage = 'Invalid credentials. Please check your username and password.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Please check your Jira permissions.';
        } else if (response.status === 404) {
          errorMessage = 'Jira server not found. Please check your URL.';
        } else if (response.status === 0) {
          errorMessage = 'Network error. Check if Jira server is accessible and CORS is configured.';
        }
        
        setError(`${errorMessage} (Status: ${response.status})`);
      }
    } catch (err) {
      console.error('Connection test error:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error: Cannot reach Jira server. Please check the URL and ensure the server is accessible.');
      } else {
        setError(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const profileData = {
        jira_url: jiraUrl,
        jira_username: jiraEmail, // Using jiraEmail variable for username
        jira_api_token: jiraApiToken,
        jira_projects: jiraProjects,
      };

      // Save to localStorage instead of server
      localStorage.setItem('jira_config', JSON.stringify(profileData));

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Connect to Jira</h1>
          <p className="text-gray-600 mt-2">
            Set up your Jira Cloud connection to start visualizing your roadmaps
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Jira Authentication Setup:</h3>
              <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                <li>Enter your complete Jira server URL (including http:// or https://)</li>
                <li>Use your Jira username (not email for on-premise)</li>
                <li>Use your password or Personal Access Token</li>
                <li>Ensure your Jira server allows API access and CORS if needed</li>
                <li>Test connection before saving to verify credentials</li>
                <li>Data will be loaded directly from Jira in real-time</li>
              </ol>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="jiraUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Jira Server URL
            </label>
            <input
              id="jiraUrl"
              type="url"
              value={jiraUrl}
              onChange={(e) => setJiraUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="http://jira.yourcompany.com or https://jira.yourcompany.com"
              required
            />
          </div>

          <div>
            <label htmlFor="jiraEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="jiraUsername"
              type="text"
              value={jiraEmail}
              onChange={(e) => setJiraEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="your.username"
              required
            />
          </div>

          <div>
            <label htmlFor="jiraProjects" className="block text-sm font-medium text-gray-700 mb-2">
              Jira Projects (Optional)
            </label>
            <input
              id="jiraProjects"
              type="text"
              value={jiraProjects}
              onChange={(e) => setJiraProjects(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="PROJECT1, PROJECT2, PROJECT3 (leave empty for all projects)"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter project keys separated by commas. Leave empty to access all projects you have permission to view.
            </p>
          </div>

          <div>
            <label htmlFor="jiraApiToken" className="block text-sm font-medium text-gray-700 mb-2">
              Password / Personal Access Token
            </label>
            <input
              id="jiraApiToken"
              type="password"
              value={jiraApiToken}
              onChange={(e) => setJiraApiToken(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Your password or Personal Access Token"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center space-x-2">
              <Check className="w-5 h-5 text-emerald-600" />
              <p className="text-emerald-600 text-sm">{success}</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={testConnection}
              disabled={testing || !jiraUrl || !jiraEmail || !jiraApiToken}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
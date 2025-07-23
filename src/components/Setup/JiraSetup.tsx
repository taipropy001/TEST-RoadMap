import React, { useState, useEffect } from 'react';
import { Settings, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface JiraSetupProps {
  onComplete: () => void;
}

export const JiraSetup: React.FC<JiraSetupProps> = ({ onComplete }) => {
  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraApiToken, setJiraApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setProfile(data);
          setJiraUrl(data.jira_url || '');
          setJiraEmail(data.jira_email || '');
          setJiraApiToken(data.jira_api_token || '');
        }
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
      const response = await fetch(`${API_URL}/jira/test-connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseUrl: jiraUrl,
          email: jiraEmail,
          apiToken: jiraApiToken,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Connection successful! Your Jira credentials are valid.');
      } else {
        setError(result.error || 'Failed to connect to Jira');
      }
    } catch (err) {
      setError('Failed to test connection');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user) return;

    try {
      const profileData = {
        jira_url: jiraUrl,
        jira_email: jiraEmail,
        jira_api_token: jiraApiToken,
      };

      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

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
              <h3 className="font-medium text-blue-900">How to get your API token:</h3>
              <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                <li>Go to your Atlassian account settings</li>
                <li>Navigate to Security → API tokens</li>
                <li>Create a new API token and copy it</li>
              </ol>
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mt-2 text-sm font-medium"
              >
                Open Atlassian API tokens <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="jiraUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Jira Cloud URL
            </label>
            <input
              id="jiraUrl"
              type="url"
              value={jiraUrl}
              onChange={(e) => setJiraUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="https://yourcompany.atlassian.net"
              required
            />
          </div>

          <div>
            <label htmlFor="jiraEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="jiraEmail"
              type="email"
              value={jiraEmail}
              onChange={(e) => setJiraEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="jiraApiToken" className="block text-sm font-medium text-gray-700 mb-2">
              API Token
            </label>
            <input
              id="jiraApiToken"
              type="password"
              value={jiraApiToken}
              onChange={(e) => setJiraApiToken(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Your Jira API token"
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
              {loading ? 'Saving...' : profile ? 'Update Configuration' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
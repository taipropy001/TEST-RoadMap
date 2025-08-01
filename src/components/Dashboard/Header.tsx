import React from 'react';
import { Settings, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onRefresh, loading }) => {

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">JR</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Jira Roadmap</h1>
            <p className="text-sm text-gray-500">Visualize your project timelines</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">
              {loading ? 'Loading...' : 'Refresh'}
            </span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
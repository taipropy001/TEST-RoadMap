import React from 'react';
import { LogOut, User, Settings, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onSync: () => void;
  syncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onSync, syncing }) => {
  const { user, signOut } = useAuth();

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
            onClick={onSync}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">
              {syncing ? 'Syncing...' : 'Sync'}
            </span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Settings</span>
          </button>

          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user?.email?.split('@')[0]}
              </span>
            </div>
            
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
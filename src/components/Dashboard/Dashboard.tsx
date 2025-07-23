import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { FilterPanel } from './FilterPanel';
import { Timeline } from './Timeline';
import { JiraSetup } from '../Setup/JiraSetup';
import { JiraTicket, RoadmapFilters, Roadmap } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const Dashboard: React.FC = () => {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<JiraTicket[]>([]);
  const [filters, setFilters] = useState<RoadmapFilters>({});
  const [savedRoadmaps, setSavedRoadmaps] = useState<Roadmap[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [hasJiraSetup, setHasJiraSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkJiraSetup();
      loadTickets();
      loadSavedRoadmaps();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [tickets, filters]);

  const checkJiraSetup = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasJiraSetup(!!(data && data.jira_api_token));
      } else {
        setHasJiraSetup(false);
      }
    } catch (error) {
      console.error('Failed to check Jira setup:', error);
      setHasJiraSetup(false);
    }
    setLoading(false);
  };

  const loadTickets = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data || []);
      } else {
        console.error('Failed to load tickets');
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const loadSavedRoadmaps = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/roadmaps`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedRoadmaps(data || []);
      } else {
        console.error('Failed to load roadmaps');
      }
    } catch (error) {
      console.error('Failed to load roadmaps:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    if (filters.labels && filters.labels.length > 0) {
      filtered = filtered.filter(ticket => 
        filters.labels!.some(label => ticket.labels.includes(label))
      );
    }

    if (filters.assignees && filters.assignees.length > 0) {
      filtered = filtered.filter(ticket => 
        ticket.assignee && filters.assignees!.includes(ticket.assignee)
      );
    }

    if (filters.statuses && filters.statuses.length > 0) {
      filtered = filtered.filter(ticket => 
        filters.statuses!.includes(ticket.status)
      );
    }

    if (filters.date_range) {
      const { start, end } = filters.date_range;
      if (start) {
        filtered = filtered.filter(ticket => 
          new Date(ticket.created_date) >= new Date(start)
        );
      }
      if (end) {
        filtered = filtered.filter(ticket => 
          new Date(ticket.created_date) <= new Date(end)
        );
      }
    }

    setFilteredTickets(filtered);
  };

  const syncJiraData = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      const response = await fetch(`${API_URL}/jira/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await loadTickets();
      } else {
        console.error('Failed to sync Jira data');
      }
    } catch (error) {
      console.error('Failed to sync Jira data:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleJiraSetupComplete = () => {
    setHasJiraSetup(true);
    setShowSettings(false);
    syncJiraData();
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

  if (!hasJiraSetup || showSettings) {
    return <JiraSetup onComplete={handleJiraSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header
        onOpenSettings={() => setShowSettings(true)}
        onSync={syncJiraData}
        syncing={syncing}
      />
      
      <div className="flex-1 flex">
        <FilterPanel
          tickets={tickets}
          filters={filters}
          onFiltersChange={setFilters}
          savedRoadmaps={savedRoadmaps}
          onRoadmapsChange={loadSavedRoadmaps}
        />
        
        <Timeline tickets={filteredTickets} />
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { FilterPanel } from './FilterPanel';
import { Timeline } from './Timeline';
import { JiraSetup } from '../Setup/JiraSetup';
import { JiraTicket, RoadmapFilters, Roadmap } from '../../types';

export const Dashboard: React.FC = () => {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<JiraTicket[]>([]);
  const [filters, setFilters] = useState<RoadmapFilters>({});
  const [savedRoadmaps, setSavedRoadmaps] = useState<Roadmap[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [hasJiraSetup, setHasJiraSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkJiraSetup();
    loadTickets();
    loadSavedRoadmaps();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, filters]);

  const checkJiraSetup = async () => {
    try {
      const jiraConfig = localStorage.getItem('jira_config');
      setHasJiraSetup(!!jiraConfig);
    } catch (error) {
      console.error('Failed to check Jira setup:', error);
      setHasJiraSetup(false);
    }
    setLoading(false);
  };

  const loadTickets = async () => {
    try {
      const savedTickets = localStorage.getItem('jira_tickets');
      if (savedTickets) {
        const data = JSON.parse(savedTickets);
        setTickets(data || []);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const loadSavedRoadmaps = async () => {
    try {
      const savedRoadmaps = localStorage.getItem('saved_roadmaps');
      if (savedRoadmaps) {
        const data = JSON.parse(savedRoadmaps);
        setSavedRoadmaps(data || []);
      }
    } catch (error) {
      console.error('Failed to load roadmaps:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    if (filters.projects && filters.projects.length > 0) {
      filtered = filtered.filter(ticket => 
        filters.projects!.includes(ticket.project_key)
      );
    }

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
    const jiraConfig = localStorage.getItem('jira_config');
    if (!jiraConfig) {
      console.error('No Jira configuration found');
      return;
    }

    setSyncing(true);
    try {
      const config = JSON.parse(jiraConfig);
      const { jira_url, jira_username, jira_api_token, jira_projects } = config;
      
      // Clean URL
      const cleanUrl = jira_url.replace(/\/$/, '');
      
      // Build JQL query with project filtering
      let jqlQuery = '';
      if (jira_projects && jira_projects.trim()) {
        const projectKeys = jira_projects.split(',').map((p: string) => p.trim()).filter(Boolean);
        if (projectKeys.length > 0) {
          const projectFilter = projectKeys.map((key: string) => `project = "${key}"`).join(' OR ');
          jqlQuery = `(${projectFilter}) ORDER BY created DESC`;
        } else {
          jqlQuery = 'ORDER BY created DESC';
        }
      } else {
        jqlQuery = 'ORDER BY created DESC';
      }
      
      const jiraApiUrl = `${cleanUrl}/rest/api/2/search?jql=${jqlQuery}&maxResults=1000&fields=summary,status,assignee,labels,created,updated,duedate,customfield_10015,customfield_10020,issuelinks,customfield_10014,customfield_10016,sprint,parent`;
      
      const auth = btoa(`${jira_username}:${jira_api_token}`);
      
      const response = await fetch(jiraApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const jiraData = await response.json();
        const issues = jiraData.issues || [];
        
        // Transform Jira issues to our ticket format
        const transformedTickets = issues.map((issue: any) => {
          // Extract project key from the issue
          const projectKey = issue.fields.project?.key || 'UNKNOWN';
          
          // Extract dependencies from issue links
          const dependencies = (issue.fields.issuelinks || [])
            .filter((link: any) => link.type.name === 'Blocks' || link.type.name === 'Dependency')
            .map((link: any) => link.inwardIssue?.key || link.outwardIssue?.key)
            .filter(Boolean);

          // Determine start date from multiple possible fields
          const startDate = (() => {
            const candidates = [
              issue.fields.customfield_10015, // Start date custom field
              issue.fields.customfield_10020, // Another possible start date field
              issue.fields.created // Fallback to created date
            ];
            
            for (const candidate of candidates) {
              if (typeof candidate === 'string' && candidate.trim()) {
                try {
                  const parsed = new Date(candidate);
                  if (!isNaN(parsed.getTime())) {
                    return candidate;
                  }
                } catch {
                  continue;
                }
              }
            }
            
            return issue.fields.created; // Default fallback
          })();

          // Extract sprint name safely
          const sprintName = (() => {
            const sprint = issue.fields.customfield_10016; // Sprint field
            if (Array.isArray(sprint) && sprint.length > 0) {
              return sprint[0].name || null;
            }
            return null;
          })();

          return {
            id: issue.id,
            jira_id: issue.id,
            key: issue.key,
            project_key: projectKey,
            summary: issue.fields.summary,
            status: issue.fields.status.name,
            assignee: issue.fields.assignee?.displayName || null,
            labels: issue.fields.labels || [],
            start_date: startDate,
            created_date: issue.fields.created,
            updated_date: issue.fields.updated,
            due_date: issue.fields.duedate || null,
            dependencies,
            epic_link: issue.fields.customfield_10014 || null, // Epic Link
            sprint: sprintName,
            parent_issue_key: issue.fields.parent?.key || null,
          };
        });
        
        // Save to localStorage
        localStorage.setItem('jira_tickets', JSON.stringify(transformedTickets));
        setTickets(transformedTickets);
      } else {
        throw new Error('Failed to fetch data from Jira');
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
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
  const [loading, setLoading] = useState(false);
  const [hasJiraSetup, setHasJiraSetup] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkJiraSetup();
    loadSavedRoadmaps();
  }, []);

  useEffect(() => {
    if (hasJiraSetup) {
      loadJiraData();
    }
  }, [hasJiraSetup]);

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
    setInitialLoading(false);
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

  const loadJiraData = async () => {
    const jiraConfig = localStorage.getItem('jira_config');
    if (!jiraConfig) {
      console.error('No Jira configuration found');
      return;
    }

    setLoading(true);
    setError('');
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
      
      const jiraApiUrl = `${cleanUrl}/rest/api/2/search?jql=${encodeURIComponent(jqlQuery)}&maxResults=1000&fields=summary,status,assignee,labels,created,updated,duedate,customfield_10015,customfield_10020,issuelinks,customfield_10014,customfield_10016,sprint,parent,project&expand=changelog`;
      
      const auth = btoa(`${jira_username}:${jira_api_token}`);
      
      const response = await fetch(jiraApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
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

          // Find start date from changelog when status changed to "In Progress"
          const startDate = (() => {
            // First try to find from changelog when status changed to "In Progress"
            if (issue.changelog && issue.changelog.histories) {
              for (const history of issue.changelog.histories) {
                for (const item of history.items || []) {
                  if (item.field === 'status' && 
                      (item.toString === 'In Progress' || 
                       item.toString === 'In Development' ||
                       item.toString === 'Development' ||
                       item.toString === 'Doing')) {
                    return history.created;
                  }
                }
              }
            }
            
            // If currently in progress but no changelog found, use current status date
            const currentStatus = issue.fields.status.name;
            if (currentStatus === 'In Progress' || 
                currentStatus === 'In Development' ||
                currentStatus === 'Development' ||
                currentStatus === 'Doing') {
              // Try custom fields as fallback
              const candidates = [
                issue.fields.customfield_10015, // Start date custom field
                issue.fields.customfield_10020, // Another possible start date field
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
            }
            
            // For tickets not yet started or completed, return null
            // This will hide them from timeline unless they have due dates
            return null;
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
        
        // Set tickets directly without saving to localStorage
        setTickets(transformedTickets);
      } else {
        const errorText = await response.text();
        console.error('Jira API Error:', response.status, errorText);
        setError(`Failed to fetch data from Jira (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to sync Jira data:', error);
      setError(`Load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJiraSetupComplete = () => {
    setHasJiraSetup(true);
    setShowSettings(false);
    loadJiraData();
  };

  if (initialLoading) {
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
        onRefresh={loadJiraData}
        loading={loading}
      />
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex">
        <FilterPanel
          tickets={tickets}
          filters={filters}
          onFiltersChange={setFilters}
          savedRoadmaps={savedRoadmaps}
          onRoadmapsChange={loadSavedRoadmaps}
        />
        
        <Timeline tickets={filteredTickets} loading={loading} />
      </div>
    </div>
  );
};
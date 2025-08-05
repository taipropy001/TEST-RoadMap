import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { FilterPanel } from './FilterPanel';
import { Timeline } from './Timeline';
import { JiraSetup } from '../Setup/JiraSetup';
import { JiraTicket, RoadmapFilters, Roadmap } from '../../types';

export const Dashboard: React.FC = () => {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
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
      loadJiraData(filters);
    }
  }, [hasJiraSetup, filters]);

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

  const buildJQLQuery = (filters: RoadmapFilters, jiraProjects?: string) => {
    const conditions: string[] = [];
    
    // Project filtering from config or filters
    if (filters.projects && filters.projects.length > 0) {
      const projectFilter = filters.projects.map(key => `project = "${key}"`).join(' OR ');
      conditions.push(`(${projectFilter})`);
    } else if (jiraProjects && jiraProjects.trim()) {
      const projectKeys = jiraProjects.split(',').map((p: string) => p.trim()).filter(Boolean);
      if (projectKeys.length > 0) {
        const projectFilter = projectKeys.map((key: string) => `project = "${key}"`).join(' OR ');
        conditions.push(`(${projectFilter})`);
      }
    }
    
    // Status filtering
    if (filters.statuses && filters.statuses.length > 0) {
      const statusFilter = filters.statuses.map(status => `status = "${status}"`).join(' OR ');
      conditions.push(`(${statusFilter})`);
    }
    
    // Assignee filtering
    if (filters.assignees && filters.assignees.length > 0) {
      const assigneeFilter = filters.assignees.map(assignee => `assignee = "${assignee}"`).join(' OR ');
      conditions.push(`(${assigneeFilter})`);
    }
    
    // Label filtering
    if (filters.labels && filters.labels.length > 0) {
      const labelConditions = filters.labels.map(label => `labels = "${label}"`);
      conditions.push(...labelConditions);
    }
    
    // Date range filtering
    if (filters.date_range) {
      if (filters.date_range.start) {
        conditions.push(`created >= "${filters.date_range.start}"`);
      }
      if (filters.date_range.end) {
        conditions.push(`created <= "${filters.date_range.end}"`);
      }
    }
    
    // Combine all conditions
    let jqlQuery = conditions.length > 0 ? conditions.join(' AND ') : '';
    jqlQuery += ' ORDER BY created DESC';
    
    return jqlQuery;
  };

  const loadJiraData = async (currentFilters: RoadmapFilters = {}) => {
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
      
      // Build JQL query with all filters
      const jqlQuery = buildJQLQuery(currentFilters, jira_projects);
      
      const jiraApiUrl = `http://localhost:8000/jira/issues?jql=${encodeURIComponent(jqlQuery)}&maxResults=100&fields=summary,status,assignee,creator,priority,labels,created,updated,duedate,customfield_10015,customfield_10020,issuelinks,parent,project&expand=changelog`;
      
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


          return {
            id: issue.id,
            jira_id: issue.id,
            key: issue.key,
            project_key: projectKey,
            summary: issue.fields.summary,
            status: issue.fields.status.name,
            assignee: issue.fields.assignee?.displayName || null,
            creator: issue.fields.creator?.displayName || null,
            priority: issue.fields.priority?.name || null,
            labels: issue.fields.labels || [],
            start_date: startDate,
            created_date: issue.fields.created,
            updated_date: issue.fields.updated,
            due_date: issue.fields.duedate || null,
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
    loadJiraData(filters);
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
        onRefresh={() => loadJiraData(filters)}
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
        
        <div className="flex-1 min-w-0">
          <Timeline tickets={tickets} loading={loading} />
        </div>
      </div>
    </div>
  );
};
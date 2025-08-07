import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { FilterPanel } from './FilterPanel';
import { Timeline } from './Timeline';
import { JiraTicket, RoadmapFilters, Roadmap } from '../../types';

export const Dashboard: React.FC = () => {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [filters, setFilters] = useState<RoadmapFilters>({});
  const [savedRoadmaps, setSavedRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadJiraData(filters);
    loadSavedRoadmaps();
  }, []);

  useEffect(() => {
      loadJiraData(filters);
  }, [filters]);

  

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
      // Build JQL query with all filters
      const jiraApiUrl = `http://localhost:8000/issues/filter`;
      const response = await fetch(jiraApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          currentFilters
        })
      });

      if (response.ok) {
        const jiraData = await response.json();
        
        // Transform Jira issues to our ticket format
        const transformedTickets = jiraData.map((issue: any) => {

          return {
            id: issue.Id,
            key: issue.IssueKey,
            project_key: issue.ProjectKey,
            summary: issue.Summary,
            status: issue.Status,
            assignee: issue.Assignee,
            creator: issue.Creator,
            priority: issue.Priority,
            labels: issue.Labels ? issue.Labels.split(',').map((label: string) => label.trim()) : [],
            start_date: issue.StartDate,
            created_date: issue.CreatedDate,
            updated_date: issue.UpdatedDate,
            due_date: issue.DueDate,
            parent_issue_key: issue.ParentIssueKey,
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


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header
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
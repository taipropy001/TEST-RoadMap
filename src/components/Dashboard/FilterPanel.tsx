import React, { useState, useEffect } from 'react';
import { Filter, Save, Plus, X } from 'lucide-react';
import { JiraTicket, RoadmapFilters, Roadmap } from '../../types';

interface FilterPanelProps {
  tickets: JiraTicket[];
  filters: RoadmapFilters;
  onFiltersChange: (filters: RoadmapFilters) => void;
  savedRoadmaps: Roadmap[];
  onRoadmapsChange: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  tickets,
  filters,
  onFiltersChange,
  savedRoadmaps,
  onRoadmapsChange,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [roadmapName, setRoadmapName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [allAssignees, setAllAssignees] = useState<string[]>([]);
  const [allLabels, setAllLabels] = useState<string[]>([]);

  // Extract unique values from tickets
  const uniqueLabels = Array.from(new Set(tickets.flatMap(t => t.labels))).sort();
  const uniqueAssignees = Array.from(new Set(tickets.map(t => t.assignee).filter(Boolean))).sort();
  const uniqueStatuses = Array.from(new Set(tickets.map(t => t.status))).sort();
  const uniqueProjects = Array.from(new Set(tickets.map(t => t.project_key))).sort();

  useEffect(() => {
    loadJiraOptions();
  }, []);

  const loadJiraOptions = async () => {
    const jiraConfig = localStorage.getItem('jira_config');
    if (!jiraConfig) return;

    setLoadingOptions(true);
    try {
      const config = JSON.parse(jiraConfig);
      const { jira_url, jira_username, jira_api_token, jira_projects } = config;
      const cleanUrl = jira_url.replace(/\/$/, '');
      const auth = btoa(`${jira_username}:${jira_api_token}`);

      // Build project filter for queries
      let projectFilter = '';
      if (jira_projects && jira_projects.trim()) {
        const projectKeys = jira_projects.split(',').map((p: string) => p.trim()).filter(Boolean);
        if (projectKeys.length > 0) {
          projectFilter = projectKeys.map((key: string) => `project = "${key}"`).join(' OR ');
        }
      }

      // Query for all assignees
      const assigneesQuery = projectFilter 
        ? `${projectFilter} AND assignee is not EMPTY`
        : 'assignee is not EMPTY';
      
      const assigneesUrl = `${cleanUrl}/rest/api/2/search?jql=${encodeURIComponent(assigneesQuery)}&maxResults=1000&fields=assignee`;
      
      const assigneesResponse = await fetch(assigneesUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      });

      if (assigneesResponse.ok) {
        const assigneesData = await assigneesResponse.json();
        const assigneeSet = new Set<string>();
        assigneesData.issues?.forEach((issue: any) => {
          if (issue.fields.assignee?.displayName) {
            assigneeSet.add(issue.fields.assignee.displayName);
          }
        });
        setAllAssignees(Array.from(assigneeSet).sort());
      }

      // Query for all labels
      const labelsQuery = projectFilter 
        ? `${projectFilter} AND labels is not EMPTY`
        : 'labels is not EMPTY';
      
      const labelsUrl = `${cleanUrl}/rest/api/2/search?jql=${encodeURIComponent(labelsQuery)}&maxResults=1000&fields=labels`;
      
      const labelsResponse = await fetch(labelsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      });

      if (labelsResponse.ok) {
        const labelsData = await labelsResponse.json();
        const labelSet = new Set<string>();
        labelsData.issues?.forEach((issue: any) => {
          issue.fields.labels?.forEach((label: string) => {
            labelSet.add(label);
          });
        });
        setAllLabels(Array.from(labelSet).sort());
      }

    } catch (error) {
      console.error('Failed to load Jira options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };
  const saveRoadmap = async () => {
    if (!roadmapName.trim()) return;

    setSaving(true);
    try {
      const newRoadmap = {
        id: Date.now().toString(), // Simple ID generation
        name: roadmapName.trim(),
        filters,
      };
      
      const existingRoadmaps = JSON.parse(localStorage.getItem('saved_roadmaps') || '[]');
      const updatedRoadmaps = [...existingRoadmaps, newRoadmap];
      localStorage.setItem('saved_roadmaps', JSON.stringify(updatedRoadmaps));

      setShowSaveModal(false);
      setRoadmapName('');
      onRoadmapsChange();
    } catch (err) {
      console.error('Failed to save roadmap:', err);
    } finally {
      setSaving(false);
    }
  };

  const loadRoadmap = (roadmap: Roadmap) => {
    onFiltersChange(roadmap.filters);
  };

  const deleteRoadmap = async (id: string) => {
    try {
      const existingRoadmaps = JSON.parse(localStorage.getItem('saved_roadmaps') || '[]');
      const updatedRoadmaps = existingRoadmaps.filter((roadmap: any) => roadmap.id !== id);
      localStorage.setItem('saved_roadmaps', JSON.stringify(updatedRoadmaps));

      onRoadmapsChange();
    } catch (err) {
      console.error('Failed to delete roadmap:', err);
    }
  };

  return (
    <div className="bg-white border-r border-gray-200 w-80 min-w-80 max-w-80 flex-shrink-0 overflow-y-auto">
      <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Saved Roadmaps */}
        {savedRoadmaps.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Saved Roadmaps</h3>
            <div className="space-y-2">
              {savedRoadmaps.map((roadmap) => (
                <div key={roadmap.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <button
                    onClick={() => loadRoadmap(roadmap)}
                    className="text-sm text-gray-700 hover:text-gray-900 flex-1 text-left truncate pr-2"
                    title={roadmap.name}
                  >
                    {roadmap.name}
                  </button>
                  <button
                    onClick={() => deleteRoadmap(roadmap.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Projects</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {uniqueProjects.map((project) => (
              <label key={project} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.projects?.includes(project) || false}
                  onChange={(e) => {
                    const newProjects = e.target.checked
                      ? [...(filters.projects || []), project]
                      : (filters.projects || []).filter(p => p !== project);
                    onFiltersChange({ ...filters, projects: newProjects });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 font-mono truncate" title={project}>{project}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Labels Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Labels</h3>
          {loadingOptions && (
            <div className="text-xs text-gray-500 mb-2">Loading labels...</div>
          )}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {allLabels.map((label) => (
              <label key={label} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.labels?.includes(label) || false}
                  onChange={(e) => {
                    const newLabels = e.target.checked
                      ? [...(filters.labels || []), label]
                      : (filters.labels || []).filter(l => l !== label);
                    onFiltersChange({ ...filters, labels: newLabels });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 truncate" title={label}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Assignees Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Assignees</h3>
          {loadingOptions && (
            <div className="text-xs text-gray-500 mb-2">Loading assignees...</div>
          )}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {allAssignees.map((assignee) => (
              <label key={assignee} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.assignees?.includes(assignee) || false}
                  onChange={(e) => {
                    const newAssignees = e.target.checked
                      ? [...(filters.assignees || []), assignee]
                      : (filters.assignees || []).filter(a => a !== assignee);
                    onFiltersChange({ ...filters, assignees: newAssignees });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 truncate" title={assignee}>{assignee}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Status</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {uniqueStatuses.map((status) => (
              <label key={status} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.statuses?.includes(status) || false}
                  onChange={(e) => {
                    const newStatuses = e.target.checked
                      ? [...(filters.statuses || []), status]
                      : (filters.statuses || []).filter(s => s !== status);
                    onFiltersChange({ ...filters, statuses: newStatuses });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 truncate" title={status}>{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Date Range</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.date_range?.start || ''}
                onChange={(e) => {
                  onFiltersChange({
                    ...filters,
                    date_range: {
                      start: e.target.value,
                      end: filters.date_range?.end || '',
                    }
                  });
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={filters.date_range?.end || ''}
                onChange={(e) => {
                  onFiltersChange({
                    ...filters,
                    date_range: {
                      start: filters.date_range?.start || '',
                      end: e.target.value,
                    }
                  });
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => onFiltersChange({})}
          className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Roadmap</h3>
            <input
              type="text"
              value={roadmapName}
              onChange={(e) => setRoadmapName(e.target.value)}
              placeholder="Enter roadmap name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveRoadmap}
                disabled={saving || !roadmapName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
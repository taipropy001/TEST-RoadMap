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
    // Mock data for preview - remove this when connecting to real Jira
    const mockTickets = [
      // 2020 Projects
      {
        id: '1',
        key: 'PROJ-100',
        project_key: 'PROJ',
        summary: 'Setup initial project infrastructure',
        status: 'Done',
        assignee: 'Alice Brown',
        creator: 'John Smith',
        priority: 'High',
        labels: ['infrastructure', 'setup', 'backend'],
        start_date: '2020-01-15',
        created_date: '2020-01-10',
        updated_date: '2020-03-20',
        due_date: '2020-03-15',
        parent_issue_key: null,
      },
      {
        id: '2',
        key: 'PROJ-101',
        project_key: 'PROJ',
        summary: 'Database schema design',
        status: 'Done',
        assignee: 'Bob Wilson',
        creator: 'Alice Brown',
        priority: 'High',
        labels: ['database', 'schema', 'design'],
        start_date: '2020-02-01',
        created_date: '2020-01-25',
        updated_date: '2020-04-10',
        due_date: '2020-04-05',
        parent_issue_key: null,
      },
      {
        id: '3',
        key: 'PROJ-102',
        project_key: 'PROJ',
        summary: 'API authentication system',
        status: 'Done',
        assignee: 'Charlie Davis',
        creator: 'Bob Wilson',
        priority: 'Medium',
        labels: ['api', 'authentication', 'security'],
        start_date: '2020-03-15',
        created_date: '2020-03-10',
        updated_date: '2020-06-20',
        due_date: '2020-06-15',
        parent_issue_key: null,
      },
      
      // 2021 Projects
      {
        id: '4',
        key: 'PROJ-200',
        project_key: 'PROJ',
        summary: 'Frontend React application',
        status: 'Done',
        assignee: 'Diana Miller',
        creator: 'Charlie Davis',
        priority: 'High',
        labels: ['frontend', 'react', 'ui'],
        start_date: '2021-01-10',
        created_date: '2021-01-05',
        updated_date: '2021-05-30',
        due_date: '2021-05-25',
        parent_issue_key: null,
      },
      {
        id: '5',
        key: 'PROJ-201',
        project_key: 'PROJ',
        summary: 'User management system',
        status: 'Done',
        assignee: 'Eve Anderson',
        creator: 'Diana Miller',
        priority: 'Medium',
        labels: ['user', 'management', 'admin'],
        start_date: '2021-03-01',
        created_date: '2021-02-25',
        updated_date: '2021-07-15',
        due_date: '2021-07-10',
        parent_issue_key: null,
      },
      {
        id: '6',
        key: 'PROJ-202',
        project_key: 'PROJ',
        summary: 'Payment integration',
        status: 'Done',
        assignee: 'Frank Thompson',
        creator: 'Eve Anderson',
        priority: 'High',
        labels: ['payment', 'integration', 'stripe'],
        start_date: '2021-06-01',
        created_date: '2021-05-28',
        updated_date: '2021-09-20',
        due_date: '2021-09-15',
        parent_issue_key: null,
      },
      
      // 2022 Projects
      {
        id: '7',
        key: 'PROJ-300',
        project_key: 'PROJ',
        summary: 'Mobile application development',
        status: 'Done',
        assignee: 'Alice Brown',
        creator: 'Frank Thompson',
        priority: 'High',
        labels: ['mobile', 'react-native', 'ios', 'android'],
        start_date: '2022-01-15',
        created_date: '2022-01-10',
        updated_date: '2022-08-30',
        due_date: '2022-08-25',
        parent_issue_key: null,
      },
      {
        id: '8',
        key: 'PROJ-301',
        project_key: 'PROJ',
        summary: 'Performance optimization',
        status: 'Done',
        assignee: 'Bob Wilson',
        creator: 'Alice Brown',
        priority: 'Medium',
        labels: ['performance', 'optimization', 'caching'],
        start_date: '2022-04-01',
        created_date: '2022-03-28',
        updated_date: '2022-10-15',
        due_date: '2022-10-10',
        parent_issue_key: null,
      },
      {
        id: '9',
        key: 'PROJ-302',
        project_key: 'PROJ',
        summary: 'Analytics and reporting',
        status: 'Done',
        assignee: 'Charlie Davis',
        creator: 'Bob Wilson',
        priority: 'Medium',
        labels: ['analytics', 'reporting', 'dashboard'],
        start_date: '2022-07-01',
        created_date: '2022-06-25',
        updated_date: '2022-12-20',
        due_date: '2022-12-15',
        parent_issue_key: null,
      },
      
      // 2023 Projects
      {
        id: '10',
        key: 'PROJ-400',
        project_key: 'PROJ',
        summary: 'AI/ML integration',
        status: 'In Progress',
        assignee: 'Diana Miller',
        creator: 'Charlie Davis',
        priority: 'High',
        labels: ['ai', 'ml', 'integration', 'python'],
        start_date: '2023-02-01',
        created_date: '2023-01-25',
        updated_date: '2023-11-30',
        due_date: '2023-12-31',
        parent_issue_key: null,
      },
      {
        id: '11',
        key: 'PROJ-401',
        project_key: 'PROJ',
        summary: 'Microservices architecture',
        status: 'In Progress',
        assignee: 'Eve Anderson',
        creator: 'Diana Miller',
        priority: 'High',
        labels: ['microservices', 'architecture', 'docker', 'kubernetes'],
        start_date: '2023-05-15',
        created_date: '2023-05-10',
        updated_date: '2024-01-15',
        due_date: '2024-03-31',
        parent_issue_key: null,
      },
      {
        id: '12',
        key: 'PROJ-402',
        project_key: 'PROJ',
        summary: 'Security audit and improvements',
        status: 'In Review',
        assignee: 'Frank Thompson',
        creator: 'Eve Anderson',
        priority: 'High',
        labels: ['security', 'audit', 'compliance'],
        start_date: '2023-08-01',
        created_date: '2023-07-28',
        updated_date: '2024-02-20',
        due_date: '2024-04-30',
        parent_issue_key: null,
      },
      
      // 2024 Projects with Sub-tasks
      {
        id: '13',
        key: 'PROJ-500',
        project_key: 'PROJ',
        summary: 'Next-gen platform development',
        status: 'In Progress',
        assignee: 'Alice Brown',
        creator: 'Frank Thompson',
        priority: 'High',
        labels: ['platform', 'nextgen', 'architecture'],
        start_date: '2024-01-15',
        created_date: '2024-01-10',
        updated_date: '2024-12-01',
        due_date: '2024-12-31',
        parent_issue_key: null,
      },
      {
        id: '14',
        key: 'PROJ-501',
        project_key: 'PROJ',
        summary: 'Frontend redesign',
        status: 'In Progress',
        assignee: 'Bob Wilson',
        creator: 'Alice Brown',
        priority: 'Medium',
        labels: ['frontend', 'redesign', 'ui/ux'],
        start_date: '2024-02-01',
        created_date: '2024-01-28',
        updated_date: '2024-08-15',
        due_date: '2024-08-31',
        parent_issue_key: 'PROJ-500',
      },
      {
        id: '15',
        key: 'PROJ-502',
        project_key: 'PROJ',
        summary: 'Backend API v2',
        status: 'In Progress',
        assignee: 'Charlie Davis',
        creator: 'Alice Brown',
        priority: 'High',
        labels: ['backend', 'api', 'v2'],
        start_date: '2024-03-01',
        created_date: '2024-02-25',
        updated_date: '2024-09-30',
        due_date: '2024-10-31',
        parent_issue_key: 'PROJ-500',
      },
      {
        id: '16',
        key: 'PROJ-503',
        project_key: 'PROJ',
        summary: 'Database migration',
        status: 'To Do',
        assignee: 'Diana Miller',
        creator: 'Charlie Davis',
        priority: 'Medium',
        labels: ['database', 'migration', 'postgresql'],
        start_date: '2024-06-01',
        created_date: '2024-05-28',
        updated_date: '2024-06-01',
        due_date: '2024-11-30',
        parent_issue_key: 'PROJ-500',
      },
      
      // 2025 Future Projects
      {
        id: '17',
        key: 'PROJ-600',
        project_key: 'PROJ',
        summary: 'Global expansion initiative',
        status: 'To Do',
        assignee: 'Eve Anderson',
        creator: 'Diana Miller',
        priority: 'High',
        labels: ['expansion', 'global', 'localization'],
        start_date: '2025-01-15',
        created_date: '2024-12-01',
        updated_date: '2024-12-01',
        due_date: '2025-12-31',
        parent_issue_key: null,
      },
      {
        id: '18',
        key: 'PROJ-601',
        project_key: 'PROJ',
        summary: 'Multi-language support',
        status: 'To Do',
        assignee: 'Frank Thompson',
        creator: 'Eve Anderson',
        priority: 'Medium',
        labels: ['i18n', 'localization', 'translation'],
        start_date: '2025-02-01',
        created_date: '2024-12-15',
        updated_date: '2024-12-15',
        due_date: '2025-06-30',
        parent_issue_key: 'PROJ-600',
      },
      {
        id: '19',
        key: 'PROJ-602',
        project_key: 'PROJ',
        summary: 'Regional compliance',
        status: 'To Do',
        assignee: 'Alice Brown',
        creator: 'Frank Thompson',
        priority: 'High',
        labels: ['compliance', 'gdpr', 'legal'],
        start_date: '2025-03-01',
        created_date: '2024-12-20',
        updated_date: '2024-12-20',
        due_date: '2025-08-31',
        parent_issue_key: 'PROJ-600',
      },
      
      // Additional variety projects
      {
        id: '20',
        key: 'INFRA-100',
        project_key: 'INFRA',
        summary: 'Cloud infrastructure upgrade',
        status: 'In Progress',
        assignee: 'Bob Wilson',
        creator: 'Alice Brown',
        priority: 'High',
        labels: ['infrastructure', 'cloud', 'aws', 'upgrade'],
        start_date: '2024-04-01',
        created_date: '2024-03-25',
        updated_date: '2024-10-15',
        due_date: '2024-12-31',
        parent_issue_key: null,
      },
      {
        id: '21',
        key: 'INFRA-101',
        project_key: 'INFRA',
        summary: 'Monitoring and alerting',
        status: 'Done',
        assignee: 'Charlie Davis',
        creator: 'Bob Wilson',
        priority: 'Medium',
        labels: ['monitoring', 'alerting', 'observability'],
        start_date: '2024-01-01',
        created_date: '2023-12-28',
        updated_date: '2024-05-30',
        due_date: '2024-05-31',
        parent_issue_key: null,
      },
    ];

    setLoading(true);
    setError('');
    try {
      // Apply filters to mock data
      let filteredTickets = mockTickets;
      
      if (currentFilters.labels && currentFilters.labels.length > 0) {
        filteredTickets = filteredTickets.filter(ticket =>
          currentFilters.labels!.some(label => ticket.labels.includes(label))
        );
      }
      
      if (currentFilters.assignees && currentFilters.assignees.length > 0) {
        filteredTickets = filteredTickets.filter(ticket =>
          currentFilters.assignees!.includes(ticket.assignee || '')
        );
      }
      
      if (currentFilters.statuses && currentFilters.statuses.length > 0) {
        filteredTickets = filteredTickets.filter(ticket =>
          currentFilters.statuses!.includes(ticket.status)
        );
      }
      
      if (currentFilters.projects && currentFilters.projects.length > 0) {
        filteredTickets = filteredTickets.filter(ticket =>
          currentFilters.projects!.includes(ticket.project_key)
        );
      }
      
      if (currentFilters.date_range) {
        if (currentFilters.date_range.start) {
          filteredTickets = filteredTickets.filter(ticket =>
            ticket.created_date >= currentFilters.date_range!.start!
          );
        }
        if (currentFilters.date_range.end) {
          filteredTickets = filteredTickets.filter(ticket =>
            ticket.created_date <= currentFilters.date_range!.end!
          );
        }
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTickets(filteredTickets);
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
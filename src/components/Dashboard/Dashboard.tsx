import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { FilterPanel } from './FilterPanel';
import { Timeline } from './Timeline';
import { JiraTicket, RoadmapFilters, Roadmap } from '../../types';

// Mock data
const mockTickets: JiraTicket[] = [
  {
    id: '1',
    key: 'PROJ-100',
    project_key: 'PROJ',
    summary: 'Setup initial project infrastructure',
    status: 'Done',
    assignee: 'john.doe@company.com',
    creator: 'jane.smith@company.com',
    priority: 'High',
    labels: ['infrastructure', 'setup', 'backend'],
    start_date: '2024-01-15T09:00:00Z',
    created_date: '2024-01-10T10:00:00Z',
    updated_date: '2024-02-15T16:30:00Z',
    due_date: '2024-02-28T17:00:00Z',
    parent_issue_key: null
  },
  {
    id: '2',
    key: 'PROJ-101',
    project_key: 'PROJ',
    summary: 'Database schema design',
    status: 'Done',
    assignee: 'alice.johnson@company.com',
    creator: 'john.doe@company.com',
    priority: 'High',
    labels: ['database', 'schema', 'design'],
    start_date: '2024-02-01T09:00:00Z',
    created_date: '2024-01-25T14:00:00Z',
    updated_date: '2024-03-10T11:20:00Z',
    due_date: '2024-03-15T17:00:00Z',
    parent_issue_key: null
  },
  {
    id: '3',
    key: 'PROJ-102',
    project_key: 'PROJ',
    summary: 'API authentication system',
    status: 'In Progress',
    assignee: 'bob.wilson@company.com',
    creator: 'alice.johnson@company.com',
    priority: 'Medium',
    labels: ['api', 'authentication', 'security'],
    start_date: '2024-03-01T09:00:00Z',
    created_date: '2024-02-20T09:30:00Z',
    updated_date: '2024-04-05T14:45:00Z',
    due_date: '2024-04-30T17:00:00Z',
    parent_issue_key: null
  },
  {
    id: '4',
    key: 'PROJ-200',
    project_key: 'PROJ',
    summary: 'Frontend React application',
    status: 'In Progress',
    assignee: 'sarah.davis@company.com',
    creator: 'john.doe@company.com',
    priority: 'High',
    labels: ['frontend', 'react', 'ui'],
    start_date: '2024-03-15T09:00:00Z',
    created_date: '2024-03-01T11:00:00Z',
    updated_date: '2024-04-10T16:00:00Z',
    due_date: '2024-05-31T17:00:00Z',
    parent_issue_key: null
  },
  {
    id: '5',
    key: 'PROJ-201',
    project_key: 'PROJ',
    summary: 'User management system',
    status: 'To Do',
    assignee: 'mike.brown@company.com',
    creator: 'sarah.davis@company.com',
    priority: 'Medium',
    labels: ['user', 'management', 'admin'],
    start_date: '2024-04-01T09:00:00Z',
    created_date: '2024-03-20T13:15:00Z',
    updated_date: '2024-03-25T10:30:00Z',
    due_date: '2024-06-15T17:00:00Z',
    parent_issue_key: null
  },
  {
    id: '6',
    key: 'PROJ-202',
    project_key: 'PROJ',
    summary: 'Payment integration',
    status: 'To Do',
    assignee: 'lisa.garcia@company.com',
    creator: 'mike.brown@company.com',
    priority: 'High',
    labels: ['payment', 'integration', 'stripe'],
    start_date: '2024-05-01T09:00:00Z',
    created_date: '2024-04-15T15:45:00Z',
    updated_date: '2024-04-20T09:20:00Z',
    due_date: '2024-07-31T17:00:00Z',
    parent_issue_key: null
  },
  {
    id: '7',
    key: 'PROJ-300',
    project_key: 'PROJ',
    summary: 'Mobile application development',
    status: 'To Do',
    assignee: 'david.lee@company.com',
    creator: 'lisa.garcia@company.com',
    priority: 'Medium',
    labels: ['mobile', 'react-native', 'ios', 'android'],
    start_date: '2024-06-01T09:00:00Z',
    created_date: '2024-05-10T12:00:00Z',
    updated_date: '2024-05-15T14:30:00Z',
    due_date: '2024-09-30T17:00:00Z',
    parent_issue_key: null
  },
  // Sub-tasks
  {
    id: '8',
    key: 'PROJ-103',
    project_key: 'PROJ',
    summary: 'Setup Docker containers',
    status: 'Done',
    assignee: 'john.doe@company.com',
    creator: 'john.doe@company.com',
    priority: 'High',
    labels: ['docker', 'containers', 'devops'],
    start_date: '2024-01-16T09:00:00Z',
    created_date: '2024-01-15T10:30:00Z',
    updated_date: '2024-01-25T16:00:00Z',
    due_date: '2024-02-01T17:00:00Z',
    parent_issue_key: 'PROJ-100'
  },
  {
    id: '9',
    key: 'PROJ-104',
    project_key: 'PROJ',
    summary: 'Configure CI/CD pipeline',
    status: 'Done',
    assignee: 'alice.johnson@company.com',
    creator: 'john.doe@company.com',
    priority: 'Medium',
    labels: ['cicd', 'pipeline', 'automation'],
    start_date: '2024-01-20T09:00:00Z',
    created_date: '2024-01-18T11:00:00Z',
    updated_date: '2024-02-10T15:30:00Z',
    due_date: '2024-02-15T17:00:00Z',
    parent_issue_key: 'PROJ-100'
  },
  {
    id: '10',
    key: 'PROJ-105',
    project_key: 'PROJ',
    summary: 'Setup monitoring and logging',
    status: 'In Progress',
    assignee: 'bob.wilson@company.com',
    creator: 'alice.johnson@company.com',
    priority: 'Low',
    labels: ['monitoring', 'logging', 'observability'],
    start_date: '2024-02-01T09:00:00Z',
    created_date: '2024-01-28T14:20:00Z',
    updated_date: '2024-02-20T12:45:00Z',
    due_date: '2024-02-28T17:00:00Z',
    parent_issue_key: 'PROJ-100'
  },
  {
    id: '11',
    key: 'PROJ-203',
    project_key: 'PROJ',
    summary: 'Design component library',
    status: 'In Progress',
    assignee: 'sarah.davis@company.com',
    creator: 'sarah.davis@company.com',
    priority: 'High',
    labels: ['design', 'components', 'ui-library'],
    start_date: '2024-03-16T09:00:00Z',
    created_date: '2024-03-15T10:00:00Z',
    updated_date: '2024-04-01T13:20:00Z',
    due_date: '2024-04-15T17:00:00Z',
    parent_issue_key: 'PROJ-200'
  },
  {
    id: '12',
    key: 'PROJ-204',
    project_key: 'PROJ',
    summary: 'Implement routing system',
    status: 'To Do',
    assignee: 'mike.brown@company.com',
    creator: 'sarah.davis@company.com',
    priority: 'Medium',
    labels: ['routing', 'navigation', 'react-router'],
    start_date: '2024-04-15T09:00:00Z',
    created_date: '2024-04-01T11:30:00Z',
    updated_date: '2024-04-05T16:15:00Z',
    due_date: '2024-05-01T17:00:00Z',
    parent_issue_key: 'PROJ-200'
  },
  {
    id: '13',
    key: 'PROJ-205',
    project_key: 'PROJ',
    summary: 'State management setup',
    status: 'To Do',
    assignee: 'lisa.garcia@company.com',
    creator: 'sarah.davis@company.com',
    priority: 'Medium',
    labels: ['state-management', 'redux', 'context'],
    start_date: '2024-05-01T09:00:00Z',
    created_date: '2024-04-20T09:45:00Z',
    updated_date: '2024-04-25T14:00:00Z',
    due_date: '2024-05-31T17:00:00Z',
    parent_issue_key: 'PROJ-200'
  }
  // Additional 2025-2026 tickets
  {
    id: '14',
    key: 'PROJ-400',
    project_key: 'PROJ',
    summary: 'AI/ML Integration Platform',
    status: 'To Do',
    assignee: 'emma.wilson@company.com',
    creator: 'david.lee@company.com',
    priority: 'High',
    labels: ['ai', 'machine-learning', 'platform', 'integration'],
    start_date: '2024-08-01T09:00:00Z',
    created_date: '2024-07-15T10:00:00Z',
    updated_date: '2024-07-20T14:30:00Z',
    due_date: '2025-02-28T17:00:00Z',
    parent_issue_key: null
  },
  {
    id: '15',
    key: 'PROJ-401',
    project_key: 'PROJ',
    summary: 'Data Analytics Dashboard',
    status: 'To Do',
    assignee: 'james.taylor@company.com',
    creator: 'emma.wilson@company.com',
    priority: 'Medium',
    labels: ['analytics', 'dashboard', 'data-visualization', 'reporting'],
    start_date: '2025-01-15T09:00:00Z',
    created_date: '2024-12-01T11:00:00Z',
    updated_date: '2024-12-05T16:45:00Z',
    due_date: '2025-06-30T17:00:00Z',
    parent_issue_key: null
  },
  {
    id: '16',
    key: 'PROJ-500',
    project_key: 'PROJ',
    summary: 'Cloud Migration Phase 2',
    status: 'To Do',
    assignee: 'sophia.martinez@company.com',
    creator: 'james.taylor@company.com',
    priority: 'High',
    labels: ['cloud', 'migration', 'aws', 'infrastructure'],
    start_date: '2025-03-01T09:00:00Z',
    created_date: '2025-01-10T09:30:00Z',
    updated_date: '2025-01-15T13:20:00Z',
    due_date: '2025-09-30T17:00:00Z',
    parent_issue_key: null
  },
  {
    id: '17',
    key: 'PROJ-600',
    project_key: 'PROJ',
    summary: 'Advanced Security Framework',
    status: 'To Do',
    assignee: 'ryan.anderson@company.com',
    creator: 'sophia.martinez@company.com',
    priority: 'Critical',
    labels: ['security', 'framework', 'compliance', 'encryption'],
    start_date: '2025-06-01T09:00:00Z',
    created_date: '2025-04-15T14:00:00Z',
    updated_date: '2025-04-20T10:30:00Z',
    due_date: '2026-01-31T17:00:00Z',
    parent_issue_key: null
  },
  {
    id: '18',
    key: 'PROJ-700',
    project_key: 'PROJ',
    summary: 'Next-Gen User Experience',
    status: 'To Do',
    assignee: 'olivia.chen@company.com',
    creator: 'ryan.anderson@company.com',
    priority: 'High',
    labels: ['ux', 'design-system', 'accessibility', 'performance'],
    start_date: '2025-09-01T09:00:00Z',
    created_date: '2025-07-01T12:00:00Z',
    updated_date: '2025-07-10T15:45:00Z',
    due_date: '2026-04-30T17:00:00Z',
    parent_issue_key: null
  },
  {
    id: '19',
    key: 'PROJ-800',
    project_key: 'PROJ',
    summary: 'Global Expansion Platform',
    status: 'To Do',
    assignee: 'lucas.rodriguez@company.com',
    creator: 'olivia.chen@company.com',
    priority: 'Medium',
    labels: ['internationalization', 'localization', 'scaling', 'multi-region'],
    start_date: '2026-01-01T09:00:00Z',
    created_date: '2025-10-15T10:30:00Z',
    updated_date: '2025-10-20T14:15:00Z',
    due_date: '2026-08-31T17:00:00Z',
    parent_issue_key: null
  },
  {
    id: '20',
    key: 'PROJ-900',
    project_key: 'PROJ',
    summary: 'Quantum Computing Research',
    status: 'To Do',
    assignee: 'maya.patel@company.com',
    creator: 'lucas.rodriguez@company.com',
    priority: 'Low',
    labels: ['quantum', 'research', 'experimental', 'future-tech'],
    start_date: '2026-03-01T09:00:00Z',
    created_date: '2025-12-01T11:00:00Z',
    updated_date: '2025-12-05T16:30:00Z',
    due_date: '2026-12-31T17:00:00Z',
    parent_issue_key: null
  },
  // Sub-tasks for AI/ML Platform
  {
    id: '21',
    key: 'PROJ-402',
    project_key: 'PROJ',
    summary: 'ML Model Training Pipeline',
    status: 'To Do',
    assignee: 'emma.wilson@company.com',
    creator: 'emma.wilson@company.com',
    priority: 'High',
    labels: ['ml', 'training', 'pipeline', 'automation'],
    start_date: '2024-08-15T09:00:00Z',
    created_date: '2024-08-01T10:00:00Z',
    updated_date: '2024-08-05T14:20:00Z',
    due_date: '2024-12-31T17:00:00Z',
    parent_issue_key: 'PROJ-400'
  },
  {
    id: '22',
    key: 'PROJ-403',
    project_key: 'PROJ',
    summary: 'AI Model Deployment System',
    status: 'To Do',
    assignee: 'james.taylor@company.com',
    creator: 'emma.wilson@company.com',
    priority: 'High',
    labels: ['ai', 'deployment', 'containerization', 'kubernetes'],
    start_date: '2025-01-01T09:00:00Z',
    created_date: '2024-12-15T11:30:00Z',
    updated_date: '2024-12-20T16:45:00Z',
    due_date: '2025-02-28T17:00:00Z',
    parent_issue_key: 'PROJ-400'
  },
  // Sub-tasks for Security Framework
  {
    id: '23',
    key: 'PROJ-601',
    project_key: 'PROJ',
    summary: 'Zero Trust Architecture Implementation',
    status: 'To Do',
    assignee: 'ryan.anderson@company.com',
    creator: 'ryan.anderson@company.com',
    priority: 'Critical',
    labels: ['zero-trust', 'architecture', 'security', 'network'],
    start_date: '2025-06-15T09:00:00Z',
    created_date: '2025-06-01T10:00:00Z',
    updated_date: '2025-06-05T13:30:00Z',
    due_date: '2025-10-31T17:00:00Z',
    parent_issue_key: 'PROJ-600'
  },
  {
    id: '24',
    key: 'PROJ-602',
    project_key: 'PROJ',
    summary: 'Advanced Threat Detection',
    status: 'To Do',
    assignee: 'sophia.martinez@company.com',
    creator: 'ryan.anderson@company.com',
    priority: 'High',
    labels: ['threat-detection', 'ai-security', 'monitoring', 'alerts'],
    start_date: '2025-08-01T09:00:00Z',
    created_date: '2025-07-15T14:00:00Z',
    updated_date: '2025-07-20T11:45:00Z',
    due_date: '2026-01-31T17:00:00Z',
    parent_issue_key: 'PROJ-600'
  },
  // Sub-tasks for Global Expansion
  {
    id: '25',
    key: 'PROJ-801',
    project_key: 'PROJ',
    summary: 'Multi-language Support System',
    status: 'To Do',
    assignee: 'olivia.chen@company.com',
    creator: 'lucas.rodriguez@company.com',
    priority: 'Medium',
    labels: ['i18n', 'localization', 'translation', 'ui'],
    start_date: '2026-01-15T09:00:00Z',
    created_date: '2025-12-01T10:30:00Z',
    updated_date: '2025-12-05T15:20:00Z',
    due_date: '2026-05-31T17:00:00Z',
    parent_issue_key: 'PROJ-800'
  },
  {
    id: '26',
    key: 'PROJ-802',
    project_key: 'PROJ',
    summary: 'Regional Data Compliance',
    status: 'To Do',
    assignee: 'maya.patel@company.com',
    creator: 'lucas.rodriguez@company.com',
    priority: 'High',
    labels: ['compliance', 'gdpr', 'data-protection', 'legal'],
    start_date: '2026-03-01T09:00:00Z',
    created_date: '2026-01-15T11:00:00Z',
    updated_date: '2026-01-20T14:30:00Z',
    due_date: '2026-08-31T17:00:00Z',
    parent_issue_key: 'PROJ-800'
  }
];

const mockStatuses = [
  'To Do',
  'In Progress', 
  'In Review',
  'Done',
  'Blocked',
  'Resolved',
  'Closed'
];

const mockAssignees = [
  'john.doe@company.com',
  'jane.smith@company.com',
  'alice.johnson@company.com',
  'bob.wilson@company.com',
  'sarah.davis@company.com',
  'mike.brown@company.com',
  'lisa.garcia@company.com',
  'david.lee@company.com',
  'emma.wilson@company.com',
  'james.taylor@company.com',
  'sophia.martinez@company.com',
  'ryan.anderson@company.com',
  'olivia.chen@company.com',
  'lucas.rodriguez@company.com',
  'maya.patel@company.com'
];

const mockLabels = [
  'infrastructure',
  'setup',
  'backend',
  'database',
  'schema',
  'design',
  'api',
  'authentication',
  'security',
  'frontend',
  'react',
  'ui',
  'user',
  'management',
  'admin',
  'payment',
  'integration',
  'stripe',
  'mobile',
  'react-native',
  'ios',
  'android',
  'docker',
  'containers',
  'devops',
  'cicd',
  'pipeline',
  'automation',
  'monitoring',
  'logging',
  'observability',
  'components',
  'ui-library',
  'routing',
  'navigation',
  'react-router',
  'state-management',
  'redux',
  'context',
  'ai',
  'machine-learning',
  'platform',
  'integration',
  'analytics',
  'data-visualization',
  'reporting',
  'cloud',
  'migration',
  'aws',
  'infrastructure',
  'security',
  'framework',
  'compliance',
  'encryption',
  'ux',
  'design-system',
  'accessibility',
  'performance',
  'internationalization',
  'localization',
  'scaling',
  'multi-region',
  'quantum',
  'research',
  'experimental',
  'future-tech',
  'ml',
  'training',
  'pipeline',
  'automation',
  'deployment',
  'containerization',
  'kubernetes',
  'zero-trust',
  'architecture',
  'network',
  'threat-detection',
  'ai-security',
  'monitoring',
  'alerts',
  'i18n',
  'translation',
  'ui',
  'gdpr',
  'data-protection',
  'legal'
];

export const Dashboard: React.FC = () => {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [filters, setFilters] = useState<RoadmapFilters>({});
  const [savedRoadmaps, setSavedRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadMockData(filters);
    loadSavedRoadmaps();
  }, []);

  useEffect(() => {
      loadMockData(filters);
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

  const loadMockData = async (currentFilters: RoadmapFilters = {}) => {
    setLoading(true);
    setError('');
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock data based on current filters
      let filteredTickets = [...mockTickets];
      
      if (currentFilters.labels && currentFilters.labels.length > 0) {
        filteredTickets = filteredTickets.filter(ticket => 
          currentFilters.labels!.some(label => 
            ticket.labels.includes(label)
          )
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
          const startDate = new Date(currentFilters.date_range.start);
          filteredTickets = filteredTickets.filter(ticket => 
            new Date(ticket.created_date) >= startDate
          );
        }
        if (currentFilters.date_range.end) {
          const endDate = new Date(currentFilters.date_range.end);
          filteredTickets = filteredTickets.filter(ticket => 
            new Date(ticket.created_date) <= endDate
          );
        }
      }
      
      setTickets(filteredTickets);
    } catch (error) {
      console.error('Failed to load mock data:', error);
      setError(`Load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getMockOptions = () => {
    return {
      statuses: mockStatuses,
      assignees: mockAssignees,
      labels: mockLabels
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header
        onRefresh={() => loadMockData(filters)}
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
          mockOptions={getMockOptions()}
        />
        
        <div className="flex-1 min-w-0">
          <Timeline tickets={tickets} loading={loading} />
        </div>
      </div>
    </div>
  );
};
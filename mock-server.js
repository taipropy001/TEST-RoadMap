const express = require('express');
const cors = require('cors');
const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

// Mock data
const mockTickets = [
  {
    Id: '1',
    IssueKey: 'PROJ-100',
    ProjectKey: 'PROJ',
    Summary: 'Setup initial project infrastructure',
    Status: 'Done',
    Assignee: 'john.doe@company.com',
    Creator: 'jane.smith@company.com',
    Priority: 'High',
    Labels: 'infrastructure,setup,backend',
    StartDate: '2024-01-15T09:00:00Z',
    CreatedDate: '2024-01-10T10:00:00Z',
    UpdatedDate: '2024-02-15T16:30:00Z',
    DueDate: '2024-02-28T17:00:00Z',
    ParentIssueKey: null
  },
  {
    Id: '2',
    IssueKey: 'PROJ-101',
    ProjectKey: 'PROJ',
    Summary: 'Database schema design',
    Status: 'Done',
    Assignee: 'alice.johnson@company.com',
    Creator: 'john.doe@company.com',
    Priority: 'High',
    Labels: 'database,schema,design',
    StartDate: '2024-02-01T09:00:00Z',
    CreatedDate: '2024-01-25T14:00:00Z',
    UpdatedDate: '2024-03-10T11:20:00Z',
    DueDate: '2024-03-15T17:00:00Z',
    ParentIssueKey: null
  },
  {
    Id: '3',
    IssueKey: 'PROJ-102',
    ProjectKey: 'PROJ',
    Summary: 'API authentication system',
    Status: 'In Progress',
    Assignee: 'bob.wilson@company.com',
    Creator: 'alice.johnson@company.com',
    Priority: 'Medium',
    Labels: 'api,authentication,security',
    StartDate: '2024-03-01T09:00:00Z',
    CreatedDate: '2024-02-20T09:30:00Z',
    UpdatedDate: '2024-04-05T14:45:00Z',
    DueDate: '2024-04-30T17:00:00Z',
    ParentIssueKey: null
  },
  {
    Id: '4',
    IssueKey: 'PROJ-200',
    ProjectKey: 'PROJ',
    Summary: 'Frontend React application',
    Status: 'In Progress',
    Assignee: 'sarah.davis@company.com',
    Creator: 'john.doe@company.com',
    Priority: 'High',
    Labels: 'frontend,react,ui',
    StartDate: '2024-03-15T09:00:00Z',
    CreatedDate: '2024-03-01T11:00:00Z',
    UpdatedDate: '2024-04-10T16:00:00Z',
    DueDate: '2024-05-31T17:00:00Z',
    ParentIssueKey: null
  },
  {
    Id: '5',
    IssueKey: 'PROJ-201',
    ProjectKey: 'PROJ',
    Summary: 'User management system',
    Status: 'To Do',
    Assignee: 'mike.brown@company.com',
    Creator: 'sarah.davis@company.com',
    Priority: 'Medium',
    Labels: 'user,management,admin',
    StartDate: '2024-04-01T09:00:00Z',
    CreatedDate: '2024-03-20T13:15:00Z',
    UpdatedDate: '2024-03-25T10:30:00Z',
    DueDate: '2024-06-15T17:00:00Z',
    ParentIssueKey: null
  },
  {
    Id: '6',
    IssueKey: 'PROJ-202',
    ProjectKey: 'PROJ',
    Summary: 'Payment integration',
    Status: 'To Do',
    Assignee: 'lisa.garcia@company.com',
    Creator: 'mike.brown@company.com',
    Priority: 'High',
    Labels: 'payment,integration,stripe',
    StartDate: '2024-05-01T09:00:00Z',
    CreatedDate: '2024-04-15T15:45:00Z',
    UpdatedDate: '2024-04-20T09:20:00Z',
    DueDate: '2024-07-31T17:00:00Z',
    ParentIssueKey: null
  },
  {
    Id: '7',
    IssueKey: 'PROJ-300',
    ProjectKey: 'PROJ',
    Summary: 'Mobile application development',
    Status: 'To Do',
    Assignee: 'david.lee@company.com',
    Creator: 'lisa.garcia@company.com',
    Priority: 'Medium',
    Labels: 'mobile,react-native,ios,android',
    StartDate: '2024-06-01T09:00:00Z',
    CreatedDate: '2024-05-10T12:00:00Z',
    UpdatedDate: '2024-05-15T14:30:00Z',
    DueDate: '2024-09-30T17:00:00Z',
    ParentIssueKey: null
  },
  // Sub-tasks
  {
    Id: '8',
    IssueKey: 'PROJ-103',
    ProjectKey: 'PROJ',
    Summary: 'Setup Docker containers',
    Status: 'Done',
    Assignee: 'john.doe@company.com',
    Creator: 'john.doe@company.com',
    Priority: 'High',
    Labels: 'docker,containers,devops',
    StartDate: '2024-01-16T09:00:00Z',
    CreatedDate: '2024-01-15T10:30:00Z',
    UpdatedDate: '2024-01-25T16:00:00Z',
    DueDate: '2024-02-01T17:00:00Z',
    ParentIssueKey: 'PROJ-100'
  },
  {
    Id: '9',
    IssueKey: 'PROJ-104',
    ProjectKey: 'PROJ',
    Summary: 'Configure CI/CD pipeline',
    Status: 'Done',
    Assignee: 'alice.johnson@company.com',
    Creator: 'john.doe@company.com',
    Priority: 'Medium',
    Labels: 'cicd,pipeline,automation',
    StartDate: '2024-01-20T09:00:00Z',
    CreatedDate: '2024-01-18T11:00:00Z',
    UpdatedDate: '2024-02-10T15:30:00Z',
    DueDate: '2024-02-15T17:00:00Z',
    ParentIssueKey: 'PROJ-100'
  },
  {
    Id: '10',
    IssueKey: 'PROJ-105',
    ProjectKey: 'PROJ',
    Summary: 'Setup monitoring and logging',
    Status: 'In Progress',
    Assignee: 'bob.wilson@company.com',
    Creator: 'alice.johnson@company.com',
    Priority: 'Low',
    Labels: 'monitoring,logging,observability',
    StartDate: '2024-02-01T09:00:00Z',
    CreatedDate: '2024-01-28T14:20:00Z',
    UpdatedDate: '2024-02-20T12:45:00Z',
    DueDate: '2024-02-28T17:00:00Z',
    ParentIssueKey: 'PROJ-100'
  },
  {
    Id: '11',
    IssueKey: 'PROJ-203',
    ProjectKey: 'PROJ',
    Summary: 'Design component library',
    Status: 'In Progress',
    Assignee: 'sarah.davis@company.com',
    Creator: 'sarah.davis@company.com',
    Priority: 'High',
    Labels: 'design,components,ui-library',
    StartDate: '2024-03-16T09:00:00Z',
    CreatedDate: '2024-03-15T10:00:00Z',
    UpdatedDate: '2024-04-01T13:20:00Z',
    DueDate: '2024-04-15T17:00:00Z',
    ParentIssueKey: 'PROJ-200'
  },
  {
    Id: '12',
    IssueKey: 'PROJ-204',
    ProjectKey: 'PROJ',
    Summary: 'Implement routing system',
    Status: 'To Do',
    Assignee: 'mike.brown@company.com',
    Creator: 'sarah.davis@company.com',
    Priority: 'Medium',
    Labels: 'routing,navigation,react-router',
    StartDate: '2024-04-15T09:00:00Z',
    CreatedDate: '2024-04-01T11:30:00Z',
    UpdatedDate: '2024-04-05T16:15:00Z',
    DueDate: '2024-05-01T17:00:00Z',
    ParentIssueKey: 'PROJ-200'
  },
  {
    Id: '13',
    IssueKey: 'PROJ-205',
    ProjectKey: 'PROJ',
    Summary: 'State management setup',
    Status: 'To Do',
    Assignee: 'lisa.garcia@company.com',
    Creator: 'sarah.davis@company.com',
    Priority: 'Medium',
    Labels: 'state-management,redux,context',
    StartDate: '2024-05-01T09:00:00Z',
    CreatedDate: '2024-04-20T09:45:00Z',
    UpdatedDate: '2024-04-25T14:00:00Z',
    DueDate: '2024-05-31T17:00:00Z',
    ParentIssueKey: 'PROJ-200'
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
  'david.lee@company.com'
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
  'context'
];

// Routes
app.get('/statuses', (req, res) => {
  res.json(mockStatuses);
});

app.get('/assignees', (req, res) => {
  res.json(mockAssignees);
});

app.get('/labels', (req, res) => {
  res.json(mockLabels);
});

app.post('/issues/filter', (req, res) => {
  let filteredTickets = [...mockTickets];
  const { currentFilters } = req.body;

  if (currentFilters) {
    // Filter by labels
    if (currentFilters.labels && currentFilters.labels.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        currentFilters.labels.some(label => 
          ticket.Labels.toLowerCase().includes(label.toLowerCase())
        )
      );
    }

    // Filter by assignees
    if (currentFilters.assignees && currentFilters.assignees.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        currentFilters.assignees.includes(ticket.Assignee)
      );
    }

    // Filter by statuses
    if (currentFilters.statuses && currentFilters.statuses.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        currentFilters.statuses.includes(ticket.Status)
      );
    }

    // Filter by projects
    if (currentFilters.projects && currentFilters.projects.length > 0) {
      filteredTickets = filteredTickets.filter(ticket => 
        currentFilters.projects.includes(ticket.ProjectKey)
      );
    }

    // Filter by date range
    if (currentFilters.date_range) {
      if (currentFilters.date_range.start) {
        const startDate = new Date(currentFilters.date_range.start);
        filteredTickets = filteredTickets.filter(ticket => 
          new Date(ticket.CreatedDate) >= startDate
        );
      }
      if (currentFilters.date_range.end) {
        const endDate = new Date(currentFilters.date_range.end);
        filteredTickets = filteredTickets.filter(ticket => 
          new Date(ticket.CreatedDate) <= endDate
        );
      }
    }
  }

  res.json(filteredTickets);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mock Jira API Server is running' });
});

app.listen(port, () => {
  console.log(`Mock Jira API Server running at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  GET  /health - Health check');
  console.log('  GET  /statuses - Get all statuses');
  console.log('  GET  /assignees - Get all assignees');
  console.log('  GET  /labels - Get all labels');
  console.log('  POST /issues/filter - Get filtered issues');
});
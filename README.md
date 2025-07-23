# Jira Roadmap Visualization App

## Features
A modern web application for visualizing Jira project roadmaps with timeline views, filtering capabilities, and export features.

- **Jira Integration**: Connect to your Jira on-premise server
- **Timeline Visualization**: Interactive Gantt-style timeline view
- **Advanced Filtering**: Filter by labels, assignees, status, and date ranges
- **Roadmap Management**: Save and manage multiple roadmap configurations
- **Export Capabilities**: Export timelines as PNG images or shareable links
- **Hierarchical View**: Support for epics, stories, and sub-tasks
- **No Authentication Required**: Simple setup without user accounts

## Technology Stack

## Prerequisites

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application
```bash
npm run dev
```

### 3. Configure Jira Connection
1. Open the application in your browser
2. Enter your Jira server details:
   - **Jira Server URL**: Your on-premise Jira URL (e.g., `http://jira.company.com`)
   - **Username**: Your Jira username
   - **Password/Token**: Your password or Personal Access Token

### 4. Sync and Visualize
1. Test your connection to ensure credentials are correct
2. Save the configuration
3. Click "Sync" to import your Jira tickets
4. Use filters to create custom roadmap views
5. Export or share your roadmaps as needed

## Jira On-Premise Configuration

### Authentication Options
1. **Username/Password**: Use your regular Jira login credentials
2. **Personal Access Token**: Create a PAT in Jira for enhanced security

### API Endpoints Used
- `/rest/api/2/myself` - Test connection and validate credentials
- `/rest/api/2/search` - Fetch issues with JQL queries

### Custom Fields
The application attempts to extract start dates from common custom fields:
- `customfield_10015` - Start Date
- `customfield_10020` - Alternative Start Date
- `customfield_10014` - Epic Link
- `customfield_10016` - Sprint

You may need to adjust these field IDs based on your Jira configuration.

## Usage

1. **First Setup**: Configure your Jira server connection
2. **Sync Data**: Import tickets from your Jira instance
3. **Create Views**: Use filters to focus on specific projects, teams, or timeframes
4. **Save Roadmaps**: Save frequently used filter combinations
5. **Export**: Generate PNG images or shareable links of your roadmaps

## Data Storage

All data is stored locally in your browser:
- **Jira Configuration**: Stored in localStorage as `jira_config`
- **Synced Tickets**: Stored in localStorage as `jira_tickets`
- **Saved Roadmaps**: Stored in localStorage as `saved_roadmaps`

No data is sent to external servers except for direct communication with your Jira instance.

## Development

### Project Structure
```
├── src/
│   ├── components/     # React components
│   ├── types/         # TypeScript type definitions
│   └── lib/           # Utility libraries
└── public/           # Static assets
```

### Building for Production
```bash
npm run build
```

## Troubleshooting

### Connection Issues
- Verify your Jira server URL is accessible
- Check that your username/password are correct
- Ensure your Jira instance allows API access
- Try using a Personal Access Token instead of password

### Custom Fields
If start dates or other fields aren't displaying correctly:
1. Check your Jira custom field configuration
2. Update the custom field IDs in the sync logic
3. Contact your Jira administrator for field mappings

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License
This project is licensed under the MIT License.
# Jira Roadmap Visualization App

## Features
A modern web application for visualizing Jira project roadmaps with timeline views, filtering capabilities, and export features.
- **Jira Integration**: Connect to your Jira Cloud instance
- **Timeline Visualization**: Interactive Gantt-style timeline view
- **Advanced Filtering**: Filter by labels, assignees, status, and date ranges
- **Roadmap Management**: Save and manage multiple roadmap configurations
- **Export Capabilities**: Export timelines as PNG images or shareable links
- **Hierarchical View**: Support for epics, stories, and sub-tasks
## Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, SQL Server
- **Authentication**: JWT-based authentication
- **Database**: Microsoft SQL Server
- **Icons**: Lucide React
## Prerequisites
- Node.js 18+ and npm
- Microsoft SQL Server (local or remote instance)
- Jira Cloud instance with API access
## Setup Instructions
### 1. Database Setup
Create a SQL Server database named `jira_roadmap`. The application will automatically create the required tables on first run.
### 2. Environment Configuration
Copy `.env.example` to `.env` and configure your settings:
```bash
# SQL Server Configuration
SQL_SERVER_HOST=localhost
SQL_SERVER_PORT=1433
SQL_SERVER_DATABASE=jira_roadmap
SQL_SERVER_USER=sa
SQL_SERVER_PASSWORD=your_password
SQL_SERVER_ENCRYPT=false
SQL_SERVER_TRUST_CERT=true

# JWT Secret for authentication
JWT_SECRET=your-jwt-secret-key

# Server port
PORT=3001

# Frontend API URL
VITE_API_URL=http://localhost:3001/api
```
### 3. Install Dependencies
```bash
npm install
```
### 4. Start the Application
Run both the backend server and frontend development server:
```bash
npm run dev:full
```
Or run them separately:
```bash
# Terminal 1 - Backend server
npm run server
# Terminal 2 - Frontend development server
npm run dev
```
### 5. Jira API Setup
1. Go to your Atlassian account settings
2. Navigate to Security → API tokens
3. Create a new API token
4. Use your Jira Cloud URL (e.g., `https://yourcompany.atlassian.net`)
5. Configure these in the application's Jira setup page
## Usage
1. **Sign Up/Sign In**: Create an account or sign in to an existing one
2. **Configure Jira**: Enter your Jira Cloud URL, email, and API token
3. **Sync Data**: Click the sync button to import your Jira tickets
4. **Create Roadmaps**: Use filters to create custom roadmap views
5. **Export**: Share or export your roadmaps as needed
## API Endpoints
### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in user

### User Profile
- `GET /api/user/profile` - Get user's Jira configuration
- `POST /api/user/profile` - Save/update Jira configuration

### Tickets
- `GET /api/tickets` - Get user's synced tickets

### Roadmaps
- `GET /api/roadmaps` - Get saved roadmaps
- `POST /api/roadmaps` - Create new roadmap
- `DELETE /api/roadmaps/:id` - Delete roadmap

### Jira Integration
- `POST /api/jira/test-connection` - Test Jira API connection
- `POST /api/jira/sync` - Sync tickets from Jira

## Database Schema
The application uses the following main tables:
- `users` - User accounts and authentication
- `user_profiles` - Jira configuration per user
- `tickets` - Synced Jira ticket data
- `roadmaps` - Saved roadmap configurations
## Development
### Project Structure
```
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts (Auth)
│   ├── lib/           # Utility libraries
│   └── types/         # TypeScript type definitions
├── server/            # Node.js backend server
└── public/           # Static assets
```
### Building for Production
```bash
npm run build
```
## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
## License
This project is licensed under the MIT License.
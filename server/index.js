const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// SQL Server configuration
const config = {
  server: process.env.SQL_SERVER_HOST || 'localhost',
  port: parseInt(process.env.SQL_SERVER_PORT || '1433'),
  database: process.env.SQL_SERVER_DATABASE || 'jira_roadmap',
  user: process.env.SQL_SERVER_USER || 'sa',
  password: process.env.SQL_SERVER_PASSWORD || '',
  options: {
    encrypt: process.env.SQL_SERVER_ENCRYPT === 'true',
    trustServerCertificate: process.env.SQL_SERVER_TRUST_CERT === 'true',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool;

// Initialize database connection
const initDatabase = async () => {
  try {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('Connected to SQL Server');
    
    // Create tables if they don't exist
    await createTables();
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Create database tables
const createTables = async () => {
  try {
    const request = pool.request();
    
    // Create users table
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        email NVARCHAR(255) UNIQUE NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Create user_profiles table
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_profiles' AND xtype='U')
      CREATE TABLE user_profiles (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        jira_url NVARCHAR(500),
        jira_email NVARCHAR(255),
        jira_api_token NVARCHAR(500),
        created_at DATETIME2 DEFAULT GETDATE(),
        UNIQUE(user_id)
      )
    `);

    // Create tickets table
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tickets' AND xtype='U')
      CREATE TABLE tickets (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        jira_id NVARCHAR(100) NOT NULL,
        [key] NVARCHAR(100) NOT NULL,
        summary NVARCHAR(MAX) NOT NULL,
        status NVARCHAR(100) NOT NULL DEFAULT 'To Do',
        assignee NVARCHAR(255),
        labels NVARCHAR(MAX), -- JSON string
        start_date DATETIME2,
        created_date DATETIME2 NOT NULL,
        updated_date DATETIME2 NOT NULL,
        due_date DATETIME2,
        dependencies NVARCHAR(MAX), -- JSON string
        epic_link NVARCHAR(100),
        sprint NVARCHAR(255),
        parent_issue_key NVARCHAR(100),
        created_at DATETIME2 DEFAULT GETDATE(),
        UNIQUE(user_id, jira_id)
      )
    `);

    // Create roadmaps table
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='roadmaps' AND xtype='U')
      CREATE TABLE roadmaps (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        name NVARCHAR(255) NOT NULL,
        filters NVARCHAR(MAX) NOT NULL, -- JSON string
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const request = pool.request();
    
    // Check if user already exists
    const existingUser = await request
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM users WHERE email = @email');

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    
    const result = await request
      .input('email2', sql.NVarChar, email)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query('INSERT INTO users (email, password_hash) OUTPUT INSERTED.id, INSERTED.email, INSERTED.created_at VALUES (@email2, @passwordHash)');

    const user = result.recordset[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const request = pool.request();
    const result = await request
      .input('email', sql.NVarChar, email)
      .query('SELECT id, email, password_hash, created_at FROM users WHERE email = @email');

    if (result.recordset.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.recordset[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User profile routes
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const request = pool.request();
    const result = await request
      .input('userId', sql.UniqueIdentifier, req.user.userId)
      .query('SELECT * FROM user_profiles WHERE user_id = @userId');

    res.json(result.recordset[0] || null);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { jira_url, jira_email, jira_api_token } = req.body;
    const request = pool.request();

    // Check if profile exists
    const existing = await request
      .input('userId', sql.UniqueIdentifier, req.user.userId)
      .query('SELECT id FROM user_profiles WHERE user_id = @userId');

    if (existing.recordset.length > 0) {
      // Update existing profile
      await request
        .input('userId2', sql.UniqueIdentifier, req.user.userId)
        .input('jiraUrl', sql.NVarChar, jira_url)
        .input('jiraEmail', sql.NVarChar, jira_email)
        .input('jiraApiToken', sql.NVarChar, jira_api_token)
        .query('UPDATE user_profiles SET jira_url = @jiraUrl, jira_email = @jiraEmail, jira_api_token = @jiraApiToken WHERE user_id = @userId2');
    } else {
      // Create new profile
      await request
        .input('userId3', sql.UniqueIdentifier, req.user.userId)
        .input('jiraUrl2', sql.NVarChar, jira_url)
        .input('jiraEmail2', sql.NVarChar, jira_email)
        .input('jiraApiToken2', sql.NVarChar, jira_api_token)
        .query('INSERT INTO user_profiles (user_id, jira_url, jira_email, jira_api_token) VALUES (@userId3, @jiraUrl2, @jiraEmail2, @jiraApiToken2)');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Save profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tickets routes
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const request = pool.request();
    const result = await request
      .input('userId', sql.UniqueIdentifier, req.user.userId)
      .query('SELECT * FROM tickets WHERE user_id = @userId ORDER BY created_date ASC');

    // Parse JSON fields
    const tickets = result.recordset.map(ticket => ({
      ...ticket,
      labels: ticket.labels ? JSON.parse(ticket.labels) : [],
      dependencies: ticket.dependencies ? JSON.parse(ticket.dependencies) : [],
    }));

    res.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Roadmaps routes
app.get('/api/roadmaps', authenticateToken, async (req, res) => {
  try {
    const request = pool.request();
    const result = await request
      .input('userId', sql.UniqueIdentifier, req.user.userId)
      .query('SELECT * FROM roadmaps WHERE user_id = @userId ORDER BY created_at DESC');

    // Parse JSON fields
    const roadmaps = result.recordset.map(roadmap => ({
      ...roadmap,
      filters: JSON.parse(roadmap.filters),
    }));

    res.json(roadmaps);
  } catch (error) {
    console.error('Get roadmaps error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/roadmaps', authenticateToken, async (req, res) => {
  try {
    const { name, filters } = req.body;
    const request = pool.request();

    await request
      .input('userId', sql.UniqueIdentifier, req.user.userId)
      .input('name', sql.NVarChar, name)
      .input('filters', sql.NVarChar, JSON.stringify(filters))
      .query('INSERT INTO roadmaps (user_id, name, filters) VALUES (@userId, @name, @filters)');

    res.json({ success: true });
  } catch (error) {
    console.error('Create roadmap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/roadmaps/:id', authenticateToken, async (req, res) => {
  try {
    const request = pool.request();
    await request
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('userId', sql.UniqueIdentifier, req.user.userId)
      .query('DELETE FROM roadmaps WHERE id = @id AND user_id = @userId');

    res.json({ success: true });
  } catch (error) {
    console.error('Delete roadmap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Jira sync routes
app.post('/api/jira/test-connection', authenticateToken, async (req, res) => {
  try {
    const { baseUrl, email, apiToken } = req.body;

    if (!baseUrl || !email || !apiToken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Clean and validate URL
    const cleanUrl = baseUrl.replace(/\/$/, '');
    if (!cleanUrl.includes('atlassian.net')) {
      return res.status(400).json({ error: 'Invalid Jira Cloud URL format' });
    }

    // Test connection by getting user info
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const testUrl = `${cleanUrl}/rest/api/3/myself`;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to connect to Jira';
      
      if (response.status === 401) {
        errorMessage = 'Invalid credentials. Please check your email and API token.';
      } else if (response.status === 403) {
        errorMessage = 'Access denied. Please check your Jira permissions.';
      } else if (response.status === 404) {
        errorMessage = 'Jira instance not found. Please check your URL.';
      }

      return res.status(400).json({ error: errorMessage });
    }

    const userData = await response.json();

    res.json({
      success: true,
      user: {
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
        accountId: userData.accountId,
      },
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/jira/sync', authenticateToken, async (req, res) => {
  try {
    const request = pool.request();
    
    // Get user's Jira credentials
    const profileResult = await request
      .input('userId', sql.UniqueIdentifier, req.user.userId)
      .query('SELECT jira_url, jira_email, jira_api_token FROM user_profiles WHERE user_id = @userId');

    if (profileResult.recordset.length === 0 || !profileResult.recordset[0].jira_api_token) {
      return res.status(400).json({ error: 'Jira credentials not found' });
    }

    const { jira_url, jira_email, jira_api_token } = profileResult.recordset[0];
    const auth = Buffer.from(`${jira_email}:${jira_api_token}`).toString('base64');

    // Fetch issues from Jira
    const jqlQuery = encodeURIComponent('order by created DESC');
    const jiraApiUrl = `${jira_url}/rest/api/3/search?jql=${jqlQuery}&maxResults=1000&fields=summary,status,assignee,labels,created,updated,duedate,startdate,customfield_10015,customfield_10020,issuelinks,customfield_10014,customfield_10016,sprint,parent`;

    const jiraResponse = await fetch(jiraApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!jiraResponse.ok) {
      return res.status(400).json({ error: 'Failed to fetch data from Jira' });
    }

    const jiraData = await jiraResponse.json();
    const issues = jiraData.issues || [];

    // Delete existing tickets for this user
    await request
      .input('userId2', sql.UniqueIdentifier, req.user.userId)
      .query('DELETE FROM tickets WHERE user_id = @userId2');

    // Transform and insert tickets
    for (const issue of issues) {
      // Extract dependencies from issue links
      const dependencies = issue.fields.issuelinks
        .filter(link => link.type.name === 'Blocks' || link.type.name === 'Dependency')
        .map(link => link.inwardIssue?.key || link.outwardIssue?.key)
        .filter(Boolean);

      // Determine start date from multiple possible fields
      const startDate = (() => {
        const candidates = [
          issue.fields.startdate,
          issue.fields.customfield_10015,
          issue.fields.customfield_10020
        ];
        
        for (const candidate of candidates) {
          if (typeof candidate === 'string' && !candidate.startsWith('[') && !candidate.startsWith('{')) {
            try {
              const parsed = new Date(candidate);
              if (!isNaN(parsed.getTime())) {
                return parsed;
              }
            } catch {
              continue;
            }
          }
        }
        
        return null;
      })();

      // Parse dates safely
      const createdDate = new Date(issue.fields.created);
      const updatedDate = new Date(issue.fields.updated);
      const dueDate = issue.fields.duedate ? new Date(issue.fields.duedate) : null;

      await request
        .input('userId3', sql.UniqueIdentifier, req.user.userId)
        .input('jiraId', sql.NVarChar, issue.id)
        .input('key', sql.NVarChar, issue.key)
        .input('summary', sql.NVarChar, issue.fields.summary)
        .input('status', sql.NVarChar, issue.fields.status.name)
        .input('assignee', sql.NVarChar, issue.fields.assignee?.displayName || null)
        .input('labels', sql.NVarChar, JSON.stringify(issue.fields.labels || []))
        .input('startDate', sql.DateTime2, startDate)
        .input('createdDate', sql.DateTime2, createdDate)
        .input('updatedDate', sql.DateTime2, updatedDate)
        .input('dueDate', sql.DateTime2, dueDate)
        .input('dependencies', sql.NVarChar, JSON.stringify(dependencies))
        .input('epicLink', sql.NVarChar, issue.fields.customfield_10014 || null)
        .input('sprint', sql.NVarChar, issue.fields.sprint && Array.isArray(issue.fields.sprint) && issue.fields.sprint.length > 0 ? issue.fields.sprint[0].name : null)
        .input('parentIssueKey', sql.NVarChar, issue.fields.parent?.key || null)
        .query(`
          INSERT INTO tickets (
            user_id, jira_id, [key], summary, status, assignee, labels,
            start_date, created_date, updated_date, due_date, dependencies,
            epic_link, sprint, parent_issue_key
          ) VALUES (
            @userId3, @jiraId, @key, @summary, @status, @assignee, @labels,
            @startDate, @createdDate, @updatedDate, @dueDate, @dependencies,
            @epicLink, @sprint, @parentIssueKey
          )
        `);
    }

    res.json({
      success: true,
      ticketsProcessed: issues.length,
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (pool) {
    await pool.close();
  }
  process.exit(0);
});
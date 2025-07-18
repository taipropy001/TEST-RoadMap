export interface JiraTicket {
  id: string;
  user_id: string;
  jira_id: string;
  key: string;
  summary: string;
  status: string;
  assignee: string | null;
  labels: string[];
  start_date: string | null;
  created_date: string;
  updated_date: string;
  due_date: string | null;
  dependencies: string[];
  epic_link: string | null;
  sprint: string | null;
  parent_issue_key: string | null;
  created_at: string;
}

export interface RoadmapFilters {
  labels?: string[];
  assignees?: string[];
  statuses?: string[];
  date_range?: { start: string; end: string };
}

export interface Roadmap {
  id: string;
  user_id: string;
  name: string;
  filters: RoadmapFilters;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  jira_url: string | null;
  jira_email: string | null;
  jira_api_token: string | null;
  created_at: string;
}
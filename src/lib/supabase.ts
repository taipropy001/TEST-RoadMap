import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          jira_url: string | null;
          jira_email: string | null;
          jira_api_token: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          jira_url?: string | null;
          jira_email?: string | null;
          jira_api_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          jira_url?: string | null;
          jira_email?: string | null;
          jira_api_token?: string | null;
          created_at?: string;
        };
      };
      tickets: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          jira_id: string;
          key: string;
          summary: string;
          status: string;
          assignee?: string | null;
          labels?: string[];
          start_date?: string | null;
          created_date: string;
          updated_date: string;
          due_date?: string | null;
          dependencies?: string[];
          epic_link?: string | null;
          sprint?: string | null;
          parent_issue_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          jira_id?: string;
          key?: string;
          summary?: string;
          status?: string;
          assignee?: string | null;
          labels?: string[];
          start_date?: string | null;
          created_date?: string;
          updated_date?: string;
          due_date?: string | null;
          dependencies?: string[];
          epic_link?: string | null;
          sprint?: string | null;
          parent_issue_key?: string | null;
          created_at?: string;
        };
      };
      roadmaps: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          filters: {
            labels?: string[];
            assignees?: string[];
            statuses?: string[];
            date_range?: { start: string; end: string };
          };
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          filters: {
            labels?: string[];
            assignees?: string[];
            statuses?: string[];
            date_range?: { start: string; end: string };
          };
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          filters?: {
            labels?: string[];
            assignees?: string[];
            statuses?: string[];
            date_range?: { start: string; end: string };
          };
          created_at?: string;
        };
      };
    };
  };
};
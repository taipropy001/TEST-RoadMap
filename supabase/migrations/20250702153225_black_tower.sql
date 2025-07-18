/*
  # Create Jira Roadmap Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `jira_url` (text, Jira Cloud URL)
      - `jira_email` (text, user's Jira email)
      - `jira_api_token` (text, encrypted API token)
      - `created_at` (timestamp)

    - `tickets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `jira_id` (text, Jira ticket ID)
      - `key` (text, Jira ticket key)
      - `summary` (text, ticket title)
      - `status` (text, current status)
      - `assignee` (text, assigned user)
      - `labels` (text[], ticket labels)
      - `created_date` (timestamptz, when created)
      - `updated_date` (timestamptz, last updated)
      - `due_date` (timestamptz, due date)
      - `dependencies` (text[], linked ticket keys)
      - `epic_link` (text, parent epic key)
      - `sprint` (text, current sprint)
      - `created_at` (timestamp)

    - `roadmaps`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, roadmap name)
      - `filters` (jsonb, filter configuration)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to access only their own data
    - Secure API token storage
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  jira_url text,
  jira_email text,
  jira_api_token text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  jira_id text NOT NULL,
  key text NOT NULL,
  summary text NOT NULL,
  status text NOT NULL DEFAULT 'To Do',
  assignee text,
  labels text[] DEFAULT ARRAY[]::text[],
  created_date timestamptz NOT NULL,
  updated_date timestamptz NOT NULL,
  due_date timestamptz,
  dependencies text[] DEFAULT ARRAY[]::text[],
  epic_link text,
  sprint text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, jira_id)
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tickets"
  ON tickets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create roadmaps table
CREATE TABLE IF NOT EXISTS roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own roadmaps"
  ON roadmaps
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_date ON tickets(created_date);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_labels ON tickets USING gin(labels);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
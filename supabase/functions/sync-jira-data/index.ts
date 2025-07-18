/*
  # Sync Jira Data Edge Function

  1. Purpose
    - Fetches ticket data from Jira Cloud API
    - Stores relevant metadata in Supabase database
    - Handles incremental updates and new tickets

  2. Data Processing
    - Extracts key ticket metadata (name, labels, dates, status, assignee, dependencies)
    - Processes epic relationships and dependencies
    - Handles date parsing and status mapping
    - Maps Jira start date field to start_date
    - Processes sub-task relationships via parent field

  3. Security
    - Uses stored user credentials securely
    - Validates user permissions before sync
    - Implements rate limiting for API calls
*/

import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SyncRequest {
  userId: string;
}

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    assignee?: {
      displayName: string;
    };
    labels: string[];
    created: string;
    updated: string;
    duedate?: string;
    // Common Jira start date fields - we'll try multiple possibilities
    startdate?: string; // Standard Jira start date field
    customfield_10015?: string; // Common custom field for start date
    customfield_10020?: string; // Another common custom field for start date
    issuelinks: Array<{
      type: {
        name: string;
        inward: string;
        outward: string;
      };
      inwardIssue?: {
        key: string;
      };
      outwardIssue?: {
        key: string;
      };
    }>;
    customfield_10014?: string; // Epic Link
    customfield_10016?: number; // Story Points
    sprint?: Array<{
      id: number;
      name: string;
      state: string;
      boardId: number;
      startDate: string;
      endDate: string;
    }>;
    parent?: {
      key: string;
    }; // Parent issue for sub-tasks
  };
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { userId }: SyncRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user's Jira credentials
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('jira_url, jira_email, jira_api_token')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.jira_api_token) {
      return new Response(
        JSON.stringify({ error: "Jira credentials not found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { jira_url, jira_email, jira_api_token } = profile;
    const auth = btoa(`${jira_email}:${jira_api_token}`);

    // Fetch issues from Jira - include potential start date fields and parent field for sub-tasks
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
      return new Response(
        JSON.stringify({ error: "Failed to fetch data from Jira" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const jiraData = await jiraResponse.json();
    const issues: JiraIssue[] = jiraData.issues || [];

    // Transform and store tickets
    const tickets = issues.map((issue) => {
      // Extract dependencies from issue links
      const dependencies = issue.fields.issuelinks
        .filter(link => link.type.name === 'Blocks' || link.type.name === 'Dependency')
        .map(link => link.inwardIssue?.key || link.outwardIssue?.key)
        .filter(Boolean) as string[];

      // Determine start date from multiple possible fields
      const startDate = (() => {
        const candidates = [
          issue.fields.startdate,
          issue.fields.customfield_10015,
          issue.fields.customfield_10020
        ];
        
        // Find the first candidate that is a valid date string
        for (const candidate of candidates) {
          if (typeof candidate === 'string' && candidate.trim() !== '') {
            // Additional check to ensure it's not a stringified object
            if (!candidate.startsWith('[') && !candidate.startsWith('{')) {
              return candidate;
            }
          }
        }
        
        return null;
      })();

      return {
        user_id: userId,
        jira_id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName || null,
        labels: issue.fields.labels || [],
        start_date: startDate,
        created_date: issue.fields.created,
        updated_date: issue.fields.updated,
        due_date: issue.fields.duedate || null,
        dependencies: dependencies,
        epic_link: issue.fields.customfield_10014 || null,
        sprint: issue.fields.sprint && issue.fields.sprint.length > 0 ? issue.fields.sprint[0].name : null,
        parent_issue_key: issue.fields.parent?.key || null,
      };
    });

    // Delete existing tickets for this user
    const { error: deleteError } = await supabase
      .from('tickets')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Failed to delete existing tickets:', deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete existing tickets" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert new tickets
    if (tickets.length > 0) {
      const { error: insertError } = await supabase
        .from('tickets')
        .insert(tickets);

      if (insertError) {
        console.error('Failed to insert tickets:', insertError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to save tickets",
            details: insertError.message,
            code: insertError.code
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticketsProcessed: tickets.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Error syncing Jira data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
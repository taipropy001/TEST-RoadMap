/*
  # Test Jira Connection Edge Function

  1. Purpose
    - Validates Jira Cloud API credentials
    - Tests connectivity to user's Jira instance
    - Returns connection status and basic info

  2. Security
    - Uses provided credentials temporarily for testing
    - Does not store credentials permanently
    - Validates API token format and permissions
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface TestConnectionRequest {
  baseUrl: string;
  email: string;
  apiToken: string;
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

    const { baseUrl, email, apiToken }: TestConnectionRequest = await req.json();

    if (!baseUrl || !email || !apiToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Clean and validate URL
    const cleanUrl = baseUrl.replace(/\/$/, '');
    if (!cleanUrl.includes('atlassian.net')) {
      return new Response(
        JSON.stringify({ error: "Invalid Jira Cloud URL format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Test connection by getting user info
    const auth = btoa(`${email}:${apiToken}`);
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

      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userData = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          displayName: userData.displayName,
          emailAddress: userData.emailAddress,
          accountId: userData.accountId,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Error testing Jira connection:', error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
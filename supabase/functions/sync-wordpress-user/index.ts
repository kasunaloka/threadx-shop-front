
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WordPressUser {
  id: number;
  email: string;
  username: string;
  displayName: string;
  customerId?: number;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wpUser, supabaseUserId }: { wpUser: WordPressUser; supabaseUserId: string } = await req.json();

    // Update the profile with WordPress user data
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: supabaseUserId,
        email: wpUser.email,
        username: wpUser.username,
        display_name: wpUser.displayName,
        wc_customer_id: wpUser.customerId,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error syncing WordPress user to Supabase:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User synced successfully' }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in sync-wordpress-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

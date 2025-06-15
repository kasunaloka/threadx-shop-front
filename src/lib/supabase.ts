
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uzuwuvjhqzijcpgleddt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6dXd1dmpocXppamNwZ2xlZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTk4NjcsImV4cCI6MjA2NDc5NTg2N30.IbpRw5nRlApliNTl9YdPmx19evGExPhqZcA-_mr7Oqo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mxirjxvqlzxocntouygl.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aXJqeHZxbHp4b2NudG91eWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3MTM0MzAsImV4cCI6MjA1NDI4OTQzMH0.AghYDvV9DqYF7rnvnRBRUCSXUAlu5oIbbi1DeW13Bn4';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

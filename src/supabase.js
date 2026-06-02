import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zadynxqasghbufqzrgfy.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphZHlueHFhc2doYnVmcXpyZ2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzI1MDYsImV4cCI6MjA5NDA0ODUwNn0.Utn2e0DPRAlrzk8M5iKs0BS-UfVM6JIL3trH9PN0hKk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

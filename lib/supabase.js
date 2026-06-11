import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pnyfmdrtqmbepcjdbbfa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBueWZtZHJ0cW1iZXBjamRiYmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNTkzNDAsImV4cCI6MjA5NjczNTM0MH0.9NJEfyAtE9T7OJNrMO9-NCQD8gSTh6mFftM5QS1UPXE'

export const supabase = createClient(supabaseUrl, supabaseKey)

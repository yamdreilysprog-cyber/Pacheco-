const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '../../.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

module.exports = { supabase }

import { createClient } from '@supabase/supabase-js'

const url  = process.env.SUPABASE_URL!
const anon = process.env.SUPABASE_ANON_KEY!
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 클라이언트용 (읽기)
export const supabase = createClient(url, anon)

// 서버용 (쓰기)
export const supabaseAdmin = createClient(url, svc)

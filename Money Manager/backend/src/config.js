import 'dotenv/config'

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[config] Missing ${key} — set it in backend/.env`)
  }
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) || ['http://localhost:5173'],
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
}

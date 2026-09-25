export const appHost = process.env.ANNORA_HOST || process.env.HOST || '127.0.0.1';
export const appPort = Number(process.env.ANNORA_PORT || process.env.PORT || '3000');
export const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://${appHost}:${appPort}`;
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
export const isServerDatabaseReady = isSupabaseConfigured || Boolean(process.env.DATABASE_URL);

export const runtimeMode = isSupabaseConfigured ? 'external-server' : 'local-dev';

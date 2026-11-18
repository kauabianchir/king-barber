import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config';
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
export async function api(payload: Record<string, unknown>) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return Response.json({ error: 'Entre na sua conta para continuar.' }, { status: 401 });
  const { data, error } = await supabase.rpc('king_api', { payload });
  if (error)
    return Response.json(
      {
        error:
          error.code === '42501'
            ? 'Acesso não autorizado.'
            : error.message || 'Não foi possível consultar o sistema.',
      },
      { status: error.code === '42501' ? 403 : 400 }
    );
  return Response.json(data.body, { status: data.status });
}
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

const SUPABASE_JS_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.114.0/+esm";

export function runtimeConfig() {
  const raw = globalThis.__THEORY_TUTOR_CONFIG__ ?? {};
  return {
    buildVersion: String(raw.buildVersion ?? "v0.7"),
    supabaseUrl: String(raw.supabaseUrl ?? "").trim(),
    supabasePublishableKey: String(raw.supabasePublishableKey ?? "").trim(),
  };
}

export function hasSupabaseConfig(config = runtimeConfig()) {
  return Boolean(config.supabaseUrl && config.supabasePublishableKey);
}

export async function createSupabaseBrowserClient(config = runtimeConfig()) {
  if (!hasSupabaseConfig(config)) throw new Error("Supabase browser configuration is incomplete");
  // Safari/WebKit throws when Window.fetch is later stored and called without Window as its receiver.
  // Bind it once before the app's REST repository captures the function.
  if (typeof globalThis.fetch === "function") globalThis.fetch = globalThis.fetch.bind(globalThis);
  const { createClient } = await import(SUPABASE_JS_CDN);
  return createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export async function getSession(client) {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session ?? null;
}

export async function getAccessToken(client) {
  const session = await getSession(client);
  if (!session?.access_token) throw new Error("Your session expired. Sign in again.");
  return session.access_token;
}

export async function signInWithPassword(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session ?? null;
}

export function appBaseUrl(locationLike = globalThis.location) {
  if (!locationLike?.href) return undefined;
  return new URL(".", locationLike.href).href;
}

export async function signUpWithPassword(client, email, password) {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: appBaseUrl() },
  });
  if (error) throw error;
  return { session: data.session ?? null, user: data.user ?? null };
}

export async function signOut(client) {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export { SUPABASE_JS_CDN };

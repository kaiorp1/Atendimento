// ============================================================
// Config única do Supabase — Rio+ Saneamento / Atendimento
// Preencha os dois valores abaixo com os dados do SEU projeto
// (Supabase → Settings → API). São valores públicos por design,
// pode deixar direto no código do frontend.
// ============================================================
const SUPABASE_URL = "https://lbeygpdcpkhkulvmwlan.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiZXlncGRjcGtoa3Vsdm13bGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDEwMzYsImV4cCI6MjEwMTMxNzAzNn0.f_I6FNTZ4urGfTAXmblxeTjO5kdITrkXRXqEzqCdv0U";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

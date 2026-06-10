import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://wpdimxwwqxenoxwagcdi.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZGlteHd3cXhlbm94d2FnY2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzgyNDgsImV4cCI6MjA5NTAxNDI0OH0.oI75od6jbgNfcJmmlQXEl8yS4ptjYaJsYN_GscgrExk";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
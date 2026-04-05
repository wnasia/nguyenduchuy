
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create daily cron job to run reminder check at 8:00 AM UTC
SELECT cron.schedule(
  'daily-reminder-check',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://onihezlpgofqzutuxahv.supabase.co/functions/v1/reminder-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uaWhlemxwZ29mcXp1dHV4YWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NjIyNzAsImV4cCI6MjA2NDMzODI3MH0.AQ5_8AYJeUF9tu3gIdD6-HpbidFDwy_VoTM74f9y8ig"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) AS request_id;
  $$
);

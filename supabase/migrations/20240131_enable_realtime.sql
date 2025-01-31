-- Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- If the publication doesn't exist yet, create it
CREATE PUBLICATION IF NOT EXISTS supabase_realtime;

-- Enable realtime for profiles table (alternative method if the first one doesn't work)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
COMMIT; 
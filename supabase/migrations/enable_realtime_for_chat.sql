-- Enable Realtime for chat tables
-- This allows real-time synchronization of messages and conversations

-- Enable realtime replication for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime replication for conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable realtime replication for user_presence table
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Set replica identity to FULL for messages (allows UPDATE events to send full row data)
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Set replica identity to FULL for conversations
ALTER TABLE conversations REPLICA IDENTITY FULL;

-- Set replica identity to FULL for user_presence
ALTER TABLE user_presence REPLICA IDENTITY FULL;

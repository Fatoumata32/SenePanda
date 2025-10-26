-- Create storage buckets for chat media (images and voice messages)

-- Create bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for voice messages
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-voice',
  'chat-voice',
  true,
  10485760, -- 10MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/aac', 'audio/wav', 'audio/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Chat images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Voice messages are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own voice messages" ON storage.objects;

-- Storage policies for chat images
CREATE POLICY "Users can upload their own chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Chat images are publicly accessible"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-images');

CREATE POLICY "Users can delete their own chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policies for voice messages
CREATE POLICY "Users can upload their own voice messages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-voice' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Voice messages are publicly accessible"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-voice');

CREATE POLICY "Users can delete their own voice messages"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-voice' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow content to be NULL in messages table
-- This is needed because messages can be images or voice without text content

-- Remove NOT NULL constraint from content column
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;

-- Add a check constraint to ensure at least one type of content exists
-- A message must have either: content, image_url, voice_url, or offer_price
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_has_content_check;

ALTER TABLE messages ADD CONSTRAINT messages_has_content_check
CHECK (
  content IS NOT NULL OR
  image_url IS NOT NULL OR
  voice_url IS NOT NULL OR
  offer_price IS NOT NULL
);

-- Add comment for clarity
COMMENT ON COLUMN messages.content IS 'Text content of the message. Can be NULL for image/voice messages.';

-- Add missing offer_price and offer_status columns to messages table
-- These columns are needed for price negotiation feature

-- Add offer_price column if it doesn't exist
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS offer_price numeric;

-- Add offer_status column if it doesn't exist
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS offer_status text CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'expired'));

-- Create index for faster queries on offer status
CREATE INDEX IF NOT EXISTS idx_messages_offer_status ON messages(offer_status) WHERE offer_status IS NOT NULL;

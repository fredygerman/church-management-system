-- Migration: Add user settings table and update users table with profile fields
-- Created: 2024-01-16

-- Create preferred language enum
CREATE TYPE preferred_language AS ENUM ('EN', 'SW');

-- Add profile picture and preferred language to users table
ALTER TABLE users
ADD COLUMN profile_picture_url VARCHAR(500),
ADD COLUMN preferred_language preferred_language DEFAULT 'EN' NOT NULL;

-- Create user_settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Appearance settings
  dark_mode BOOLEAN DEFAULT false NOT NULL,

  -- Notification preferences
  push_notifications BOOLEAN DEFAULT true NOT NULL,
  email_alerts BOOLEAN DEFAULT true NOT NULL,
  sms_notifications BOOLEAN DEFAULT true NOT NULL,
  transaction_notifications BOOLEAN DEFAULT true NOT NULL,
  bill_payment_reminders BOOLEAN DEFAULT true NOT NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Add comment to table
COMMENT ON TABLE user_settings IS 'Stores user preferences and notification settings';

-- Add comments to columns
COMMENT ON COLUMN users.profile_picture_url IS 'S3 URL for user profile picture';
COMMENT ON COLUMN users.preferred_language IS 'User preferred language for app interface (EN=English, SW=Swahili)';

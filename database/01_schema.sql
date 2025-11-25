-- Toxic Intelligence Platform: Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS toxic;

-- Grant usage on schema
GRANT USAGE ON SCHEMA toxic TO postgres, anon, authenticated, service_role;

-- ============================================
-- Table: toxic.conversations
-- ============================================
CREATE TABLE IF NOT EXISTS toxic.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON toxic.conversations(user_id);

-- Index for ordering by created_at
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON toxic.conversations(created_at DESC);

-- ============================================
-- Table: toxic.messages
-- ============================================
CREATE TABLE IF NOT EXISTS toxic.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES toxic.conversations(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('SELF', 'OTHER', 'SYSTEM')),
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ,
    toxicity_score DOUBLE PRECISION,
    sentiment_score DOUBLE PRECISION,
    flags JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for conversation_id lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON toxic.messages(conversation_id);

-- Index for ordering by created_at
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON toxic.messages(created_at);

-- ============================================
-- Table: toxic.conversation_summary
-- ============================================
CREATE TABLE IF NOT EXISTS toxic.conversation_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES toxic.conversations(id) ON DELETE CASCADE,
    avg_toxicity_overall DOUBLE PRECISION NOT NULL DEFAULT 0,
    avg_toxicity_self DOUBLE PRECISION NOT NULL DEFAULT 0,
    avg_toxicity_other DOUBLE PRECISION NOT NULL DEFAULT 0,
    sentiment_overall DOUBLE PRECISION NOT NULL DEFAULT 0,
    conflict_days_count INTEGER NOT NULL DEFAULT 0,
    breakup_risk_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_conversation_summary UNIQUE (conversation_id)
);

-- Index for conversation_id lookups
CREATE INDEX IF NOT EXISTS idx_conversation_summary_conversation_id ON toxic.conversation_summary(conversation_id);

-- Grant permissions to roles
GRANT ALL ON toxic.conversations TO postgres, service_role;
GRANT ALL ON toxic.messages TO postgres, service_role;
GRANT ALL ON toxic.conversation_summary TO postgres, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON toxic.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON toxic.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON toxic.conversation_summary TO authenticated;

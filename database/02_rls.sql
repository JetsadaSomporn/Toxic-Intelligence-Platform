-- Toxic Intelligence Platform: Row Level Security Policies
-- Run this SQL in your Supabase SQL Editor AFTER 01_schema.sql

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE toxic.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE toxic.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE toxic.conversation_summary ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for toxic.conversations
-- ============================================

-- Policy: Users can only SELECT their own conversations
CREATE POLICY "Users can view own conversations"
    ON toxic.conversations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Users can only INSERT conversations for themselves
CREATE POLICY "Users can create own conversations"
    ON toxic.conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only UPDATE their own conversations
CREATE POLICY "Users can update own conversations"
    ON toxic.conversations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only DELETE their own conversations
CREATE POLICY "Users can delete own conversations"
    ON toxic.conversations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies for toxic.messages
-- ============================================

-- Policy: Users can SELECT messages only if they own the conversation
CREATE POLICY "Users can view messages of own conversations"
    ON toxic.messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM toxic.conversations c
            WHERE c.id = conversation_id
            AND c.user_id = auth.uid()
        )
    );

-- Policy: Users can INSERT messages only if they own the conversation
CREATE POLICY "Users can create messages in own conversations"
    ON toxic.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM toxic.conversations c
            WHERE c.id = conversation_id
            AND c.user_id = auth.uid()
        )
    );

-- Policy: Users can UPDATE messages only if they own the conversation
CREATE POLICY "Users can update messages in own conversations"
    ON toxic.messages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM toxic.conversations c
            WHERE c.id = conversation_id
            AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM toxic.conversations c
            WHERE c.id = conversation_id
            AND c.user_id = auth.uid()
        )
    );

-- Policy: Users can DELETE messages only if they own the conversation
CREATE POLICY "Users can delete messages in own conversations"
    ON toxic.messages
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM toxic.conversations c
            WHERE c.id = conversation_id
            AND c.user_id = auth.uid()
        )
    );

-- ============================================
-- RLS Policies for toxic.conversation_summary
-- ============================================

-- Policy: Users can SELECT summary only if they own the conversation
CREATE POLICY "Users can view summary of own conversations"
    ON toxic.conversation_summary
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM toxic.conversations c
            WHERE c.id = conversation_id
            AND c.user_id = auth.uid()
        )
    );

-- Policy: Users can INSERT summary only if they own the conversation
CREATE POLICY "Users can create summary for own conversations"
    ON toxic.conversation_summary
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM toxic.conversations c
            WHERE c.id = conversation_id
            AND c.user_id = auth.uid()
        )
    );

-- Policy: Users can UPDATE summary only if they own the conversation
CREATE POLICY "Users can update summary of own conversations"
    ON toxic.conversation_summary
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM toxic.conversations c
            WHERE c.id = conversation_id
            AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM toxic.conversations c
            WHERE c.id = conversation_id
            AND c.user_id = auth.uid()
        )
    );

-- Policy: Users can DELETE summary only if they own the conversation
CREATE POLICY "Users can delete summary of own conversations"
    ON toxic.conversation_summary
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM toxic.conversations c
            WHERE c.id = conversation_id
            AND c.user_id = auth.uid()
        )
    );

-- ============================================
-- Service role bypass (for server-side operations)
-- ============================================
-- Note: service_role key bypasses RLS by default in Supabase
-- No additional policies needed for service_role

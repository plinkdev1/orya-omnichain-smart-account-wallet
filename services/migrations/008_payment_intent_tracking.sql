-- MIGRATION: Payment Intent Tracking
-- Tracks Stripe payment intents and card payment history
-- Supports 3D Secure, card tokenization, and payment status management

-- ============================================================================
-- 1. PAYMENT INTENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    fiat_transaction_id UUID REFERENCES fiat_transactions(id) ON DELETE SET NULL,
    amount_cents INT NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD')),
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
        'created',
        'processing',
        'requires_action',
        'requires_confirmation',
        'requires_payment_method',
        'succeeded',
        'failed',
        'canceled'
    )),
    client_secret TEXT,
    requires_action BOOLEAN DEFAULT FALSE,
    requires_3d_secure BOOLEAN DEFAULT FALSE,
    authentication_status TEXT CHECK (authentication_status IN ('pending', 'passed', 'failed', 'not_required')),
    metadata JSONB DEFAULT '{}',
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status) WHERE status IN ('processing', 'requires_action', 'requires_confirmation');
CREATE INDEX IF NOT EXISTS idx_payment_intents_stripe_id ON payment_intents(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_created_at ON payment_intents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_requires_action ON payment_intents(requires_action) WHERE requires_action = TRUE;

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_intents_rls_policy ON payment_intents
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

COMMENT ON TABLE payment_intents IS 'Tracks Stripe payment intents with 3D Secure status';
COMMENT ON COLUMN payment_intents.stripe_payment_intent_id IS 'Stripe payment_intent ID';
COMMENT ON COLUMN payment_intents.requires_3d_secure IS 'Whether payment requires 3D Secure authentication';
COMMENT ON COLUMN payment_intents.authentication_status IS 'Status of 3D Secure authentication';

-- ============================================================================
-- 2. TOKENIZED CARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tokenized_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method_id UUID UNIQUE NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT UNIQUE NOT NULL,
    card_brand TEXT NOT NULL CHECK (card_brand IN ('visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb')),
    card_last4 TEXT NOT NULL,
    exp_month INT NOT NULL,
    exp_year INT NOT NULL,
    fingerprint TEXT,
    funding TEXT CHECK (funding IN ('credit', 'debit', 'prepaid', 'unknown')),
    is_default BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tokenized_cards_user_id ON tokenized_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_tokenized_cards_default ON tokenized_cards(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_tokenized_cards_stripe_id ON tokenized_cards(stripe_payment_method_id);

ALTER TABLE tokenized_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY tokenized_cards_rls_policy ON tokenized_cards
    USING (user_id IN (SELECT id FROM users WHERE privy_user_id = current_setting('app.current_user_id', true)));

COMMENT ON TABLE tokenized_cards IS 'Stores tokenized card information for recurring payments';
COMMENT ON COLUMN tokenized_cards.stripe_payment_method_id IS 'Stripe payment_method ID for this card';

-- ============================================================================
-- 3. PAYMENT EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id UUID NOT NULL REFERENCES payment_intents(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'payment_intent.created',
        'payment_intent.processing',
        'payment_intent.requires_action',
        'payment_intent.requires_confirmation',
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'payment_intent.canceled',
        'charge.succeeded',
        'charge.failed',
        'charge.refunded',
        '3d_secure.required',
        '3d_secure.passed',
        '3d_secure.failed'
    )),
    stripe_event_id TEXT UNIQUE,
    description TEXT,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment_intent_id ON payment_events(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_type ON payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON payment_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_events_stripe_id ON payment_events(stripe_event_id);

COMMENT ON TABLE payment_events IS 'Audit log for payment intent events and status changes';

-- ============================================================================
-- 4. PAYMENT RETRIES TABLE (for failed payment handling)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_retries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id UUID NOT NULL REFERENCES payment_intents(id) ON DELETE CASCADE,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    last_error TEXT,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'succeeded', 'failed', 'abandoned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_retries_payment_intent_id ON payment_retries(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_retries_status ON payment_retries(status);
CREATE INDEX IF NOT EXISTS idx_payment_retries_next_retry ON payment_retries(next_retry_at) WHERE status = 'pending';

COMMENT ON TABLE payment_retries IS 'Tracks retry attempts for failed payments';

-- ============================================================================
-- 5. TRIGGERS AND FUNCTIONS
-- ============================================================================

CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON payment_intents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tokenized_cards_updated_at BEFORE UPDATE ON tokenized_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_retries_updated_at BEFORE UPDATE ON payment_retries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. STORED PROCEDURES
-- ============================================================================

CREATE OR REPLACE FUNCTION record_payment_event(
    p_payment_intent_id UUID,
    p_event_type TEXT,
    p_stripe_event_id TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_data JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO payment_events (
        payment_intent_id,
        event_type,
        stripe_event_id,
        description,
        data
    ) VALUES (
        p_payment_intent_id,
        p_event_type,
        p_stripe_event_id,
        p_description,
        p_data
    ) RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_payment_intent_status(
    p_payment_intent_id UUID,
    p_new_status TEXT,
    p_error_code TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_old_status TEXT;
    v_completed BOOLEAN := FALSE;
BEGIN
    SELECT status INTO v_old_status FROM payment_intents WHERE id = p_payment_intent_id;

    UPDATE payment_intents SET
        status = p_new_status,
        error_code = p_error_code,
        error_message = p_error_message,
        completed_at = CASE WHEN p_new_status IN ('succeeded', 'failed', 'canceled') THEN CURRENT_TIMESTAMP ELSE completed_at END
    WHERE id = p_payment_intent_id;

    IF p_new_status IN ('succeeded', 'failed', 'canceled') THEN
        v_completed := TRUE;
    END IF;

    PERFORM record_payment_event(
        p_payment_intent_id,
        'payment_intent.' || LOWER(p_new_status),
        p_description := FORMAT('Status changed from %s to %s', v_old_status, p_new_status)
    );

    RETURN v_completed;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Migration complete
-- ============================================================================

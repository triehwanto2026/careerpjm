-- Update activation_codes to track status and completion
-- This allows marking codes as used/invalid when test is completed or time runs out

ALTER TABLE public.activation_codes
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'invalid')),
ADD COLUMN IF NOT EXISTS test_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_submitted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS test_started_at TIMESTAMPTZ;

COMMENT ON COLUMN activation_codes.status IS 'Status of activation code: active=available, completed=test finished, expired=past expiry date, invalid=deactivated';
COMMENT ON COLUMN activation_codes.test_completed_at IS 'Timestamp when test was completed';
COMMENT ON COLUMN activation_codes.auto_submitted IS 'Whether the test was auto-submitted due to timeout';
COMMENT ON COLUMN activation_codes.test_started_at IS 'Timestamp when the test was first started (for proper time tracking)';

-- Create index for quick status checks
CREATE INDEX IF NOT EXISTS idx_activation_codes_status ON public.activation_codes(status);

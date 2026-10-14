-- Enforces the expired meat inspection certificate safety invariant at the
-- final persistence boundary. Existing records are intentionally not changed.
--
-- The trigger name starts with `zz` so it runs after the existing
-- inspections_set_regulatory_compliance trigger. PostgreSQL fires same-event
-- BEFORE triggers in name order; this trigger must be the final safety write.

CREATE OR REPLACE FUNCTION public.enforce_expired_certificate_safety()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.meat_expiry_date IS NOT NULL
 AND NEW.meat_expiry_date < (timezone('UTC', now()))::date
  THEN
    NEW.classification := 'spoiled';
    NEW.manual_classification := 'spoiled';
    NEW.confidence_score := 100;

    IF NOT (
      'expired_meat_inspection_certificate' = ANY(
        COALESCE(NEW.flagged_deviations, ARRAY[]::text[])
      )
    )
    THEN
      NEW.flagged_deviations := array_append(
        COALESCE(NEW.flagged_deviations, ARRAY[]::text[]),
        'expired_meat_inspection_certificate'
      );
    END IF;

    NEW.explanation :=
      'Automatically classified as spoiled because the meat inspection certificate is expired. AI analysis was skipped.';
    NEW.inspection_decision_source := 'protocol_pre_scan';
    NEW.protocol_spoiled_reason := 'expired_meat_inspection_certificate';
    NEW.regulatory_compliance := FALSE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_inspections_enforce_expired_certificate_safety ON public.inspections;
CREATE TRIGGER zz_inspections_enforce_expired_certificate_safety
BEFORE INSERT OR UPDATE ON public.inspections
FOR EACH ROW
EXECUTE FUNCTION public.enforce_expired_certificate_safety();

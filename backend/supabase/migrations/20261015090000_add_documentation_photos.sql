CREATE TABLE public.documentation_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_submission_id UUID NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  location TEXT,
  location_latitude DOUBLE PRECISION,
  location_longitude DOUBLE PRECISION,
  stall_number TEXT,
  captured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX documentation_photos_user_captured_at_idx
  ON public.documentation_photos (user_id, captured_at DESC, id DESC);

ALTER TABLE public.documentation_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their documentation photos"
  ON public.documentation_photos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their documentation photos"
  ON public.documentation_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.documentation_photos TO authenticated;

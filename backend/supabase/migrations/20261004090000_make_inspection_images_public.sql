-- Browser PDF export uses the backend as a CORS-safe proxy for these objects.
-- Keep the bucket public because the stored image URLs are already public data.
insert into storage.buckets (id, name, public)
values ('inspection-images', 'inspection-images', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can view inspection images'
  ) then
    create policy "Public can view inspection images"
      on storage.objects
      for select
      to public
      using (bucket_id = 'inspection-images');
  end if;
end
$$;

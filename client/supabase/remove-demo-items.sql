-- Run this in Supabase SQL Editor to remove previously seeded demo/sample items.
-- Safe to run multiple times.

begin;

do $$
declare
  seeded_urls text[] := array[
    'https://images.unsplash.com/photo-1625656006822-0f81e8380331?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1583373351761-fa9e3a19c99d?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1746216845602-336ad3a744f7?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1606459387188-f50b5af76bc8?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1706892807280-f8648dda29ef?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1680039211156-66c721b87625?auto=format&fit=crop&w=1080&q=80',
    'https://images.unsplash.com/photo-1604846887565-640d2f52d564?auto=format&fit=crop&w=1080&q=80'
  ];
begin
  if to_regclass('public.items') is null then
    raise notice 'Table public.items does not exist; nothing to remove.';
    return;
  end if;

  if to_regclass('public.profile_received_items') is not null then
    delete from public.profile_received_items r
    using public.items i
    where i.item_id::text = r.item_id
      and i.url = any(seeded_urls);

    delete from public.profile_received_items
    where note = 'Seeded sample received item';
  end if;

  delete from public.items
  where url = any(seeded_urls);
end $$;

commit;

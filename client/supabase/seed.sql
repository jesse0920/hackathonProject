-- Seed script for current schema shown in Supabase UI.
-- profiles: id, avatar_url, name, wins, "totalBets"
-- items: item_id, name, "desc", price, url, category, condition, user_id
--
-- Run in Supabase SQL Editor.

begin;

-- Fill missing profile values without overwriting existing custom values.
update public.profiles
set
  name = coalesce(name, 'Player ' || left(id::text, 8)),
  wins = coalesce(wins, 0),
  "totalBets" = coalesce("totalBets", 0)
where name is null or wins is null or "totalBets" is null;

do $$
declare
  user_a uuid;
  user_b uuid;
  user_c uuid;
  sample_item_id text;
begin
  select id into user_a
  from public.profiles
  order by id
  limit 1;

  if user_a is null then
    raise notice 'No rows found in public.profiles. Create at least one account first, then run seed again.';
    return;
  end if;

  select id into user_b
  from public.profiles
  where id <> user_a
  order by id
  limit 1;
  if user_b is null then
    user_b := user_a;
  end if;

  select id into user_c
  from public.profiles
  where id not in (user_a, user_b)
  order by id
  limit 1;
  if user_c is null then
    user_c := user_a;
  end if;

  -- Insert only if same (name + user_id) doesn't already exist.
  insert into public.items (name, "desc", price, url, category, condition, user_id)
  select *
  from (
    values
      ('Vintage Road Bike', 'Classic road bike in great condition.', 250, 'https://images.unsplash.com/photo-1625656006822-0f81e8380331?auto=format&fit=crop&w=1080&q=80', 'Sports', 'Good', user_a),
      ('Wireless Headphones', 'Premium headphones with noise cancellation.', 180, 'https://images.unsplash.com/photo-1583373351761-fa9e3a19c99d?auto=format&fit=crop&w=1080&q=80', 'Electronics', 'Good', user_b),
      ('Designer Tee Bundle', 'Set of 5 lightly worn designer shirts.', 120, 'https://images.unsplash.com/photo-1746216845602-336ad3a744f7?auto=format&fit=crop&w=1080&q=80', 'Clothing', 'Like New', user_c),
      ('Skateboard Pro Deck', 'High-quality board, barely used.', 95, 'https://images.unsplash.com/photo-1606459387188-f50b5af76bc8?auto=format&fit=crop&w=1080&q=80', 'Sports', 'Like New', user_a),
      ('Vintage Watch', 'Classic watch with leather band.', 200, 'https://images.unsplash.com/photo-1706892807280-f8648dda29ef?auto=format&fit=crop&w=1080&q=80', 'Accessories', 'New', user_b),
      ('Hiking Backpack 40L', 'Excellent condition daypack.', 85, 'https://images.unsplash.com/photo-1680039211156-66c721b87625?auto=format&fit=crop&w=1080&q=80', 'Outdoor', 'Good', user_c),
      ('Gaming Console', 'Previous-gen console with controller.', 300, 'https://images.unsplash.com/photo-1604846887565-640d2f52d564?auto=format&fit=crop&w=1080&q=80', 'Electronics', 'Good', user_a)
  ) as seed_rows(name, "desc", price, url, category, condition, user_id)
  where not exists (
    select 1
    from public.items i
    where i.name = seed_rows.name
      and i.user_id = seed_rows.user_id
  );

  -- Optional sample received-item record (only if backend table exists).
  if to_regclass('public.profile_received_items') is not null then
    select i.item_id::text into sample_item_id
    from public.items i
    where i.user_id = user_a
    order by i.item_id
    limit 1;

    if sample_item_id is not null then
      insert into public.profile_received_items (receiver_id, item_id, sender_id, note)
      values (user_b, sample_item_id, user_a, 'Seeded sample received item')
      on conflict (receiver_id, item_id) do nothing;
    end if;
  end if;
end $$;

commit;

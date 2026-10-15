create table public.studio_settings(id boolean primary key default true check(id),config jsonb not null default '{}',secrets jsonb not null default '{}',revision integer not null default 1,updated_at timestamptz not null default now());
insert into public.studio_settings(id) values(true);
create table public.studio_settings_audit(id bigint generated always as identity primary key,actor uuid references auth.users,changed_keys text[] not null,created_at timestamptz not null default now());
create table public.credit_orders(id uuid primary key,user_id uuid not null references public.profiles(id),pack text not null,amount integer not null check(amount>=50000),credits integer not null check(credits>0),currency text not null default 'MNT' check(currency='MNT'),status text not null default 'pending' check(status in ('pending','paid')),provider_intent text unique,checkout_url text,created_at timestamptz not null default now(),paid_at timestamptz);
create index credit_orders_owner_created on public.credit_orders(user_id,created_at desc);
create table public.credit_payments_ledger(order_id uuid primary key references public.credit_orders(id),provider_intent text not null unique,credits integer not null,created_at timestamptz not null default now());
alter table public.studio_settings enable row level security;
alter table public.studio_settings_audit enable row level security;
alter table public.credit_orders enable row level security;
alter table public.credit_payments_ledger enable row level security;
revoke all on public.studio_settings,public.studio_settings_audit,public.credit_orders,public.credit_payments_ledger from public,anon,authenticated;
grant all on public.studio_settings,public.studio_settings_audit,public.credit_orders,public.credit_payments_ledger to service_role;
revoke all on sequence public.studio_settings_audit_id_seq from public,anon,authenticated;
grant usage,select on sequence public.studio_settings_audit_id_seq to service_role;
-- Internal provider costs stay server-side even through the direct Data API.
revoke select on public.generations from authenticated;
grant select(id,user_id,kind,project_type,project_subtype,style_preset,camera_motion,source_path,parent_id,model,credits_cost,status,output_url,output_path,created_at,refunded) on public.generations to authenticated;
create function public.set_studio_settings(p_actor uuid,p_revision integer,p_config jsonb,p_secrets jsonb,p_keys text[]) returns integer language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 update public.studio_settings set config=p_config,secrets=secrets||p_secrets,revision=revision+1,updated_at=now() where id=true and revision=p_revision returning revision into n;
 if n is null then raise exception 'Settings changed; reload'; end if;
 insert into public.studio_settings_audit(actor,changed_keys) values(p_actor,p_keys);
 return n;
end $$;
create function public.settle_credit_order(p_order uuid,p_intent text,p_amount integer,p_currency text) returns boolean language plpgsql security invoker set search_path='' as $$
declare o public.credit_orders;
begin
 select * into o from public.credit_orders where id=p_order for update;
 if not found or o.provider_intent is distinct from p_intent or o.amount is distinct from p_amount or o.currency is distinct from p_currency then raise exception 'Payment mismatch'; end if;
 if o.status='paid' then return false; end if;
 insert into public.credit_payments_ledger(order_id,provider_intent,credits) values(o.id,p_intent,o.credits);
 update public.profiles set credits=credits+o.credits where id=o.user_id;
 if not found then raise exception 'Account missing'; end if;
 update public.credit_orders set status='paid',paid_at=now() where id=o.id;
 return true;
end $$;
revoke all on function public.set_studio_settings(uuid,integer,jsonb,jsonb,text[]),public.settle_credit_order(uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.set_studio_settings(uuid,integer,jsonb,jsonb,text[]),public.settle_credit_order(uuid,text,integer,text) to service_role;

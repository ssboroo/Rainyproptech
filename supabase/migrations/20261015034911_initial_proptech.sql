create table public.profiles(id uuid primary key references auth.users on delete cascade, credits integer not null default 0 check(credits>=0));
create table public.generations(
 id uuid primary key, user_id uuid not null references public.profiles on delete cascade,
 kind text not null check(kind in ('image','video')),
 project_type text not null check(project_type in ('interior','exterior','master_plan')),
 project_subtype text not null check(project_subtype in ('interior','exterior_facade','master_plan','townhouse','commercial')),
 style_preset text not null, camera_motion text not null, prompt text not null,
 source_path text not null, parent_id uuid references public.generations,
 model text not null, provider_request_id text, output_url text, output_path text,
 status text not null default 'reserved' check(status in ('reserved','queued','processing','completed','failed')),
 credits_cost integer not null check(credits_cost in (2,6)), refunded boolean not null default false,
 created_at timestamptz not null default now()
);
create index generations_owner_created on public.generations(user_id,created_at desc);
alter table public.profiles enable row level security;
alter table public.generations enable row level security;
grant select on public.profiles,public.generations to authenticated;
grant all on public.profiles,public.generations to service_role;
create policy own_profile on public.profiles for select to authenticated using((select auth.uid())=id);
create policy own_generations on public.generations for select to authenticated using((select auth.uid())=user_id);
-- Only server-held service_role can reserve or refund credits. No browser writes.
create function public.reserve_generation(p_id uuid,p_user uuid,p_kind text,p_project text,p_subtype text,p_style text,p_motion text,p_prompt text,p_source text,p_parent uuid,p_model text)
returns public.generations language plpgsql security invoker set search_path='' as $$
declare g public.generations; c integer;
begin
 perform 1 from public.profiles where id=p_user for update;
 select * into g from public.generations where id=p_id;
 if found then
  if g.user_id<>p_user then raise exception 'Invalid request'; end if;
  return g;
 end if;
 c:=case when p_kind='video' then 6 else 2 end;
 update public.profiles set credits=credits-c where id=p_user and credits>=c;
 if not found then raise exception 'Insufficient credits'; end if;
 insert into public.generations(id,user_id,kind,project_type,project_subtype,style_preset,camera_motion,prompt,source_path,parent_id,model,credits_cost)
 values(p_id,p_user,p_kind,p_project,p_subtype,p_style,p_motion,p_prompt,p_source,p_parent,p_model,c) returning * into g;
 return g;
end $$;
create function public.fail_generation(p_id uuid,p_user uuid) returns void language plpgsql security invoker set search_path='' as $$
declare g public.generations;
begin
 select * into g from public.generations where id=p_id and user_id=p_user for update;
 if not found or g.status='completed' or g.refunded then return; end if;
 update public.generations set status='failed',refunded=true where id=p_id;
 update public.profiles set credits=credits+g.credits_cost where id=p_user;
end $$;
revoke all on function public.reserve_generation(uuid,uuid,text,text,text,text,text,text,text,uuid,text) from public,anon,authenticated;
revoke all on function public.fail_generation(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reserve_generation(uuid,uuid,text,text,text,text,text,text,text,uuid,text) to service_role;
grant execute on function public.fail_generation(uuid,uuid) to service_role;
-- Account rows are created by the server on first authenticated account access.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('sources','sources',false,15728640,array['image/png','image/jpeg','image/webp']);
create policy own_sources_read on storage.objects for select to authenticated using(bucket_id='sources' and (storage.foldername(name))[1]=(select auth.uid())::text);

insert into storage.buckets(id,name,public) values('outputs','outputs',false);
create policy own_outputs_read on storage.objects for select to authenticated using(bucket_id='outputs' and (storage.foldername(name))[1]=(select auth.uid())::text);

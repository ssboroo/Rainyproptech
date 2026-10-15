-- No accounts/balances existed at rollout. Credits now represent 100 MNT each.
-- Browser roles cannot mint, reserve, or refund credits.
alter table public.generations drop constraint generations_credits_cost_check;
alter table public.generations add constraint generations_credits_cost_check check(credits_cost between 1 and 100000);
alter table public.generations add column price_quote jsonb;
drop function public.reserve_generation(uuid,uuid,text,text,text,text,text,text,text,uuid,text);
create function public.reserve_generation(p_id uuid,p_user uuid,p_kind text,p_project text,p_subtype text,p_style text,p_motion text,p_prompt text,p_source text,p_parent uuid,p_model text,p_cost integer,p_quote jsonb)
returns public.generations language plpgsql security invoker set search_path='' as $$
declare g public.generations; c integer;
begin
 perform 1 from public.profiles where id=p_user for update;
 select * into g from public.generations where id=p_id;
 if found then
  if g.user_id<>p_user then raise exception 'Invalid request'; end if;
  return g;
 end if;
 if p_cost is null or p_cost<1 or p_cost>100000 or p_quote is null
   or (p_quote->>'credits')::integer is distinct from p_cost
   or p_quote->>'version' is null or p_quote->>'model' is distinct from p_model
   or coalesce((p_quote->>'apiUsd')::numeric,0)<=0 then raise exception 'Invalid price quote'; end if;
 c:=p_cost;
 update public.profiles set credits=credits-c where id=p_user and credits>=c;
 if not found then raise exception 'Insufficient credits'; end if;
 insert into public.generations(id,user_id,kind,project_type,project_subtype,style_preset,camera_motion,prompt,source_path,parent_id,model,credits_cost,price_quote)
 values(p_id,p_user,p_kind,p_project,p_subtype,p_style,p_motion,p_prompt,p_source,p_parent,p_model,c,p_quote) returning * into g;
 return g;
end $$;
revoke all on function public.reserve_generation(uuid,uuid,text,text,text,text,text,text,text,uuid,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_generation(uuid,uuid,text,text,text,text,text,text,text,uuid,text,integer,jsonb) to service_role;

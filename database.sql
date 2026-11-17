-- King Barber: private data, a bounded RPC, and verified Supabase Auth identities.
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
grant usage on schema private to authenticated;

create table private.admins(user_id uuid primary key references auth.users(id));
create table private.services(id text primary key,name text not null,minutes integer not null check(minutes between 30 and 780 and minutes%30=0),price integer not null check(price between 100 and 10000000),sunday integer not null default 0 check(sunday in (0,1)),active integer not null default 1 check(active in (0,1)));
create table private.bookings(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),name text not null,phone text not null,birth date not null,email text not null default '',service_id text not null references private.services(id),service_name text not null,start timestamptz not null,"end" timestamptz not null,price integer not null check(price>0),deposit integer not null check(deposit>0),status text not null check(status in ('pending','confirmed','completed','cancelled','expired','absent')),created timestamptz not null default now(),paid_at timestamptz);
create index bookings_user_start on private.bookings(user_id,start desc);
create index bookings_pending_expiry on private.bookings(start) where status='pending';
create table private.occupancy(slot timestamptz primary key,booking_id uuid not null references private.bookings(id));
create index occupancy_booking on private.occupancy(booking_id);
create table private.releases(slot timestamptz primary key);
create table private.expenses(id uuid primary key default gen_random_uuid(),day date not null,description text not null,amount integer not null check(amount between 1 and 100000000),deleted_at timestamptz,deleted_by uuid references auth.users(id));
create index expenses_day on private.expenses(day desc);
create table private.notifications(id text primary key,target text not null,kind text not null,title text not null,message text not null,created timestamptz not null default now(),read_at timestamptz);
create index notifications_target_created on private.notifications(target,created desc);
alter table private.admins enable row level security;
alter table private.services enable row level security;
alter table private.bookings enable row level security;
alter table private.occupancy enable row level security;
alter table private.releases enable row level security;
alter table private.expenses enable row level security;
alter table private.notifications enable row level security;
revoke all on all tables in schema private from public,anon,authenticated;

insert into private.services(id,name,minutes,price,sunday,active) values
 ('corte','Corte',60,5000,0,1),('combo','Corte e barba',90,7500,0,1),('noivo','Dia do Noivo',180,35000,1,1);

create function private.notify(event_id text,event_kind text,event_title text,event_message text,recipient uuid default null)
returns void language sql set search_path='' as $$
 insert into private.notifications(id,target,kind,title,message)
 select event_id||':'||t.target,t.target,event_kind,event_title,event_message
 from (select 'admin'::text as target union select recipient::text where recipient is not null and not exists(select 1 from private.admins where user_id=recipient))t
 on conflict(id) do nothing;
$$;

create function private.king_api(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); u record; is_admin boolean; op text:=coalesce(payload->>'action','data');
 s private.services%rowtype; b private.bookings%rowtype; next_status text;
 start_at timestamptz; end_at timestamptz; booking_day date; time_text text; minute integer;
 released boolean; urgent boolean; booked_id uuid; amount_value integer; description_value text;
 customer_name text; customer_phone text; customer_birth date; customer_email text;
 result jsonb; rows_json jsonb; services_json jsonb; expenses_json jsonb; notices_json jsonb; archived_expenses_json jsonb;
begin
 if uid is null then return jsonb_build_object('status',401,'body',jsonb_build_object('error','Entre na sua conta para continuar.')); end if;
 select id,email,email_confirmed_at,raw_user_meta_data into u from auth.users where id=uid;
 if not found or u.email_confirmed_at is null or coalesce(u.email,'')='' then
  return jsonb_build_object('status',401,'body',jsonb_build_object('error','Confirme seu e-mail para continuar.'));
 end if;
 select exists(select 1 from private.admins where user_id=uid) into is_admin;
 if octet_length(payload::text)>12000 then raise exception 'Requisição muito grande.'; end if;

 -- Expire on access, including the first access after all browsers were closed.
 insert into private.releases(slot) select o.slot from private.occupancy o join private.bookings bk on bk.id=o.booking_id where bk.status='pending' and bk.start<=now()+interval '2 hours' on conflict do nothing;
 delete from private.occupancy o using private.bookings bk where bk.id=o.booking_id and bk.status='pending' and bk.start<=now()+interval '2 hours';
 update private.bookings set status='expired' where status='pending' and start<=now()+interval '2 hours';
 delete from private.releases where slot<now();

 if op='data' then
  select coalesce(jsonb_agg(to_jsonb(q) order by q.price),'[]'::jsonb) into services_json from private.services q;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.start desc),'[]'::jsonb) into rows_json from (select * from private.bookings where is_admin or user_id=uid order by start desc limit 2000)q;
  if is_admin then select coalesce(jsonb_agg(to_jsonb(q) order by q.day desc),'[]'::jsonb) into expenses_json from (select * from private.expenses where deleted_at is null order by day desc limit 2000)q; else expenses_json:='[]'::jsonb; end if;
  if is_admin then select coalesce(jsonb_agg(to_jsonb(q) order by q.day desc),'[]'::jsonb) into archived_expenses_json from (select * from private.expenses where deleted_at is not null order by day desc limit 2000)q; else archived_expenses_json:='[]'::jsonb; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.created desc),'[]'::jsonb) into notices_json from (select * from private.notifications where target=uid::text or (is_admin and target='admin') order by created desc limit 50)q;
  return jsonb_build_object('status',200,'body',jsonb_build_object('user',jsonb_build_object('id',uid,'email',u.email,'name',coalesce(nullif(u.raw_user_meta_data->>'full_name',''),u.email),'admin',is_admin),'services',services_json,'bookings',rows_json,'expenses',expenses_json,'deletedExpenses',archived_expenses_json,'notifications',notices_json));
 end if;

 if op='readNotifications' then
  update private.notifications set read_at=now() where read_at is null and (payload->>'id' is null or id=payload->>'id') and (target=uid::text or (is_admin and target='admin'));
  return jsonb_build_object('status',200,'body',jsonb_build_object('message','Notificações atualizadas.'));
 end if;

 if op in ('slots','book') then
  select * into s from private.services where id=payload->>'service';
  if not found or s.active=0 then raise exception 'Serviço indisponível.'; end if;
  if coalesce(payload->>'day','')!~'^\d{4}-\d{2}-\d{2}$' then raise exception 'Data inválida.'; end if;
  booking_day:=(payload->>'day')::date;
  if op='slots' then
   result:='[]'::jsonb;
   if ((extract(isodow from booking_day)=7)<>(s.sunday=1)) then return jsonb_build_object('status',200,'body',jsonb_build_object('slots',result)); end if;
   for minute in 420..1170 by 30 loop
    start_at:=(booking_day+make_time(minute/60,minute%60,0)) at time zone 'America/Sao_Paulo';
    end_at:=start_at+make_interval(mins=>s.minutes);
    if start_at>=now() and start_at<=now()+interval '90 days'
     and end_at<=(booking_day+time '20:00') at time zone 'America/Sao_Paulo'
     and (start_at>=now()+interval '2 hours' or exists(select 1 from private.releases where slot=start_at))
     and not exists(select 1 from private.occupancy where slot>=start_at and slot<end_at) then
      result:=result||jsonb_build_array(jsonb_build_object('time',to_char(start_at at time zone 'America/Sao_Paulo','HH24:MI'),'start',start_at,'end',end_at,'urgent',start_at<now()+interval '2 hours'));
    end if;
   end loop;
   return jsonb_build_object('status',200,'body',jsonb_build_object('slots',result));
  end if;

  time_text:=payload->>'time';
  if coalesce(time_text,'')!~'^([01]\d|2[0-3]):(00|30)$' then raise exception 'Horário inválido.'; end if;
  start_at:=(booking_day+time_text::time) at time zone 'America/Sao_Paulo'; end_at:=start_at+make_interval(mins=>s.minutes);
  if ((extract(isodow from booking_day)=7)<>(s.sunday=1)) then raise exception 'Domingo é exclusivo para Dia do Noivo.'; end if;
  if start_at<(booking_day+time '07:00') at time zone 'America/Sao_Paulo' or end_at>(booking_day+time '20:00') at time zone 'America/Sao_Paulo' then raise exception 'O atendimento deve ocorrer entre 07h e 20h.'; end if;
  if start_at<now() then raise exception 'Este horário já passou.'; end if;
  if start_at>now()+interval '90 days' then raise exception 'Escolha uma data nos próximos 90 dias.'; end if;
  select exists(select 1 from private.releases where slot=start_at) into released;
  urgent:=start_at<now()+interval '2 hours';
  if urgent and not released then raise exception 'Reserve com pelo menos 2 horas de antecedência.'; end if;
  if urgent and not is_admin then raise exception 'Vaga de última hora: reserve com o barbeiro e confirme o sinal imediatamente.'; end if;
  customer_name:=trim(coalesce(payload->>'name',''));customer_phone:=regexp_replace(coalesce(payload->>'phone',''),'\D','','g');customer_email:=trim(coalesce(payload->>'email',''));
  if length(customer_name)<5 or length(customer_name)>100 or customer_name!~'\S+\s+.+' then raise exception 'Informe o nome completo.'; end if;
  if customer_phone!~'^\d{10,13}$' then raise exception 'Informe celular com DDD.'; end if;
  if coalesce(payload->>'birth','')!~'^\d{4}-\d{2}-\d{2}$' then raise exception 'Informe o nascimento.'; end if;
  customer_birth:=(payload->>'birth')::date;
  if customer_birth<date '1900-01-01' or customer_birth>(now() at time zone 'America/Sao_Paulo')::date then raise exception 'Nascimento inválido.'; end if;
  if length(customer_email)>150 or (customer_email<>'' and customer_email!~'^[^\s@]+@[^\s@]+\.[^\s@]+$') then raise exception 'E-mail inválido.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  if (select count(*) from private.bookings where user_id=uid and status in ('pending','confirmed'))>=10 then raise exception 'Limite de 10 agendamentos ativos.'; end if;
  booked_id:=gen_random_uuid();
  insert into private.bookings(id,user_id,name,phone,birth,email,service_id,service_name,start,"end",price,deposit,status,paid_at)
   values(booked_id,uid,customer_name,customer_phone,customer_birth,customer_email,s.id,s.name,start_at,end_at,s.price,round(s.price/4.0)::integer,case when urgent then 'confirmed' else 'pending' end,case when urgent then now() end);
  insert into private.occupancy(slot,booking_id) select x,booked_id from generate_series(start_at,end_at-interval '30 minutes',interval '30 minutes') x;
  perform private.notify(booked_id::text||':new','booking','Novo agendamento',customer_name||' solicitou '||s.name||'.',uid);
  return jsonb_build_object('status',201,'body',jsonb_build_object('id',booked_id,'message',case when urgent then 'Reserva e sinal confirmados.' else 'Reserva solicitada. Aguarde a confirmação manual do sinal.' end));
 end if;

 if op='status' then
  select * into b from private.bookings where id=(payload->>'id')::uuid for update;
  if not found then raise exception 'Agendamento não encontrado.'; end if;
  next_status:=payload->>'status';
  if not is_admin and (b.user_id<>uid or next_status<>'cancelled') then raise insufficient_privilege using message='Acesso negado.'; end if;
  if not ((next_status='cancelled' and b.status in ('pending','confirmed')) or (next_status='confirmed' and b.status='pending' and is_admin) or (next_status in ('completed','absent') and b.status='confirmed' and b.start<=now() and is_admin)) then raise exception 'Esta alteração não está disponível neste momento.'; end if;
  update private.bookings set status=next_status,paid_at=case when next_status='confirmed' then now() else paid_at end where id=b.id;
  if next_status='cancelled' then insert into private.releases select slot from private.occupancy where booking_id=b.id on conflict do nothing;delete from private.occupancy where booking_id=b.id;end if;
  perform private.notify(b.id::text||':'||next_status,case when next_status='confirmed' then 'confirmed' else 'booking' end,case next_status when 'confirmed' then 'Sinal confirmado' when 'cancelled' then 'Agendamento cancelado' when 'completed' then 'Atendimento concluído' else 'Falta registrada' end,b.name||' · '||b.service_name,b.user_id);
  return jsonb_build_object('status',200,'body',jsonb_build_object('message','Agendamento atualizado.'));
 end if;

 if not is_admin then raise insufficient_privilege using message='Acesso restrito à administração.'; end if;
 if op='expense' then
  amount_value:=(payload->>'amount')::integer;description_value:=trim(coalesce(payload->>'description',''));
  if amount_value not between 1 and 100000000 or length(description_value) not between 3 and 180 or coalesce(payload->>'day','')!~'^\d{4}-\d{2}-\d{2}$' then raise exception 'Confira a data, descrição e valor da despesa.'; end if;
  booked_id:=gen_random_uuid();insert into private.expenses(id,day,description,amount) values(booked_id,(payload->>'day')::date,description_value,amount_value);
  perform private.notify(booked_id::text,'expense','Despesa adicionada',description_value||' · R$ '||replace(to_char(amount_value/100.0,'FM999999990.00'),'.',','));
  return jsonb_build_object('status',201,'body',jsonb_build_object('message','Despesa registrada.'));
 end if;
 if op in ('deleteExpense','restoreExpense') then
  if op='deleteExpense' then
   update private.expenses set deleted_at=now(),deleted_by=uid where id=(payload->>'id')::uuid and deleted_at is null returning id,description into booked_id,description_value;
  else
   update private.expenses set deleted_at=null,deleted_by=null where id=(payload->>'id')::uuid and deleted_at is not null returning id,description into booked_id,description_value;
  end if;
  if not found then raise exception 'Despesa não encontrada ou já atualizada.'; end if;
  perform private.notify(gen_random_uuid()::text,'expense',case when op='deleteExpense' then 'Despesa excluída' else 'Despesa restaurada' end,description_value);
  return jsonb_build_object('status',200,'body',jsonb_build_object('message',case when op='deleteExpense' then 'Despesa excluída dos totais. Você pode restaurá-la em Despesas excluídas.' else 'Despesa restaurada nos totais.' end));
 end if;
 if op='service' then
  amount_value:=(payload->>'price')::integer;minute:=(payload->>'minutes')::integer;
  if amount_value not between 100 and 10000000 or minute not between 30 and 780 or minute%30<>0 or (payload->>'id'='corte' and minute<>60) or (payload->>'id'='combo' and minute<>90) then raise exception 'Confira preço e duração. Corte: 60 min; combo: 90 min.';end if;
  update private.services set price=amount_value,minutes=minute,active=case when (payload->>'active')::boolean then 1 else 0 end where id=payload->>'id';
  if not found then raise exception 'Serviço não encontrado.'; end if;
  return jsonb_build_object('status',200,'body',jsonb_build_object('message','Serviço atualizado.'));
 end if;
 raise exception 'Operação desconhecida.';
exception
 when unique_violation then return jsonb_build_object('status',409,'body',jsonb_build_object('error','Este horário acabou de ser reservado. Escolha outro.'));
 when insufficient_privilege then return jsonb_build_object('status',403,'body',jsonb_build_object('error','Acesso negado.'));
 when raise_exception then return jsonb_build_object('status',400,'body',jsonb_build_object('error',sqlerrm));
 when others then return jsonb_build_object('status',400,'body',jsonb_build_object('error','Confira os dados informados e tente novamente.'));
end;
$$;

-- Only this invoker wrapper is exposed through PostgREST. All privileged code
-- and all records remain in a non-exposed schema with explicit identity checks.
create function public.king_api(payload jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.king_api(payload); $$;
revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.king_api(jsonb) to authenticated;
revoke all on function public.king_api(jsonb) from public,anon,authenticated;
grant execute on function public.king_api(jsonb) to authenticated;

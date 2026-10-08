-- Entradas: cada butaca se valida por separado
alter table entrada
  add column if not exists validada_en timestamptz,
  add column if not exists validada_por uuid references auth.users(id);

-- Candy y combos: se entrega por cantidad
alter table compra_candy
  add column if not exists cantidad_entregada int not null default 0,
  add constraint compra_candy_entrega_valida check (cantidad_entregada between 0 and cantidad);

alter table compra_combo
  add column if not exists cantidad_entregada int not null default 0,
  add constraint compra_combo_entrega_valida check (cantidad_entregada between 0 and cantidad);

-- Lo que ya estaba validado con el esquema anterior queda como entregado por completo
update entrada e
set validada_en = c.validada_en, validada_por = c.validada_por
from compra c
where c.codigo_compra = e.codigo_compra and c.validada_en is not null and e.validada_en is null;

update compra_candy i
set cantidad_entregada = i.cantidad
from compra c
where c.codigo_compra = i.codigo_compra and c.candy_retirado_en is not null;

update compra_combo i
set cantidad_entregada = i.cantidad
from compra c
where c.codigo_compra = i.codigo_compra and c.candy_retirado_en is not null;


create or replace function validar_entradas(codigo_compra_param text, entrada_ids uuid[])
returns int
language plpgsqlgit
security definer
as $$
declare
  actualizadas int;
begin
  if coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') not in ('empleado', 'admin') then
    raise exception 'No tenés permiso para validar entradas.';
  end if;

  if exists (
    select 1 from compra
    where codigo_compra = codigo_compra_param and cancelada_en is not null
  ) then
    raise exception 'Esta compra fue cancelada.';
  end if;

  update entrada
  set validada_en = now(), validada_por = auth.uid()
  where codigo_compra = codigo_compra_param
    and id = any(entrada_ids)
    and estado = 'vendida'
    and validada_en is null;

  get diagnostics actualizadas = row_count;

  if actualizadas = 0 then
    raise exception 'Esas entradas ya fueron utilizadas o no existen.';
  end if;

  return actualizadas;
end;
$$;

grant execute on function validar_entradas(text, uuid[]) to authenticated;


create or replace function entregar_candy(item_id uuid, cantidad_param int)
returns void
language plpgsql
security definer
as $$
declare
  actualizadas int;
begin
  if coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') not in ('empleado', 'admin') then
    raise exception 'No tenés permiso para entregar candy.';
  end if;

  update compra_candy i
  set cantidad_entregada = i.cantidad_entregada + cantidad_param
  from compra c
  where i.id = item_id
    and c.codigo_compra = i.codigo_compra
    and c.cancelada_en is null
    and cantidad_param > 0
    and i.cantidad_entregada + cantidad_param <= i.cantidad;

  get diagnostics actualizadas = row_count;

  if actualizadas = 0 then
    raise exception 'No se puede entregar esa cantidad: ya se entregó, o la compra no existe o fue cancelada.';
  end if;
end;
$$;

grant execute on function entregar_candy(uuid, int) to authenticated;


create or replace function entregar_combo(item_id uuid, cantidad_param int)
returns void
language plpgsql
security definer
as $$
declare
  actualizadas int;
begin
  if coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') not in ('empleado', 'admin') then
    raise exception 'No tenés permiso para entregar combos.';
  end if;

  update compra_combo i
  set cantidad_entregada = i.cantidad_entregada + cantidad_param
  from compra c
  where i.id = item_id
    and c.codigo_compra = i.codigo_compra
    and c.cancelada_en is null
    and cantidad_param > 0
    and i.cantidad_entregada + cantidad_param <= i.cantidad;

  get diagnostics actualizadas = row_count;

  if actualizadas = 0 then
    raise exception 'No se puede entregar esa cantidad: ya se entregó, o la compra no existe o fue cancelada.';
  end if;
end;
$$;

grant execute on function entregar_combo(uuid, int) to authenticated;


-- No se cancela una compra si ya se usó alguna entrada o se entregó algo de candy
create or replace function cancelar_compra(codigo_compra_param text)
returns void
language plpgsql
security definer
as $$
declare
  compra_row compra;
begin
  select * into compra_row from compra
  where codigo_compra = codigo_compra_param and cancelada_en is null;

  if compra_row is null then
    raise exception 'Esta compra no existe o ya fue cancelada.';
  end if;

  if compra_row.cliente_id is distinct from auth.uid() then
    raise exception 'No podés cancelar una compra que no es tuya.';
  end if;

  if exists (
    select 1 from entrada
    where codigo_compra = codigo_compra_param and validada_en is not null
  ) then
    raise exception 'Ya no se puede cancelar: ya se usaron entradas de esta compra.';
  end if;

  if exists (
    select 1 from compra_candy
    where codigo_compra = codigo_compra_param and cantidad_entregada > 0
  ) or exists (
    select 1 from compra_combo
    where codigo_compra = codigo_compra_param and cantidad_entregada > 0
  ) then
    raise exception 'Ya no se puede cancelar: ya se entregó candy de esta compra.';
  end if;

  if exists (
    select 1 from funcion
    where id = compra_row.funcion_id
      and inicio - interval '2 hours' <= now()
  ) then
    raise exception 'Ya no se puede cancelar: faltan menos de 2 horas para la función.';
  end if;

  update compra set cancelada_en = now()
  where codigo_compra = codigo_compra_param and cancelada_en is null;

  delete from entrada where codigo_compra = codigo_compra_param;

  update cliente set credito = credito + compra_row.total
  where id = compra_row.cliente_id;

  insert into movimiento_credito (cliente_id, monto, motivo, codigo_compra)
  values (compra_row.cliente_id, compra_row.total, 'cancelacion', codigo_compra_param);
end;
$$;

grant execute on function cancelar_compra(text) to authenticated;

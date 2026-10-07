-- Confirmar una compra es una sola transacción: si cualquier paso falla
-- (butacas vencidas, cupón ya usado, puntos o crédito insuficientes) no queda nada a medias.
-- Reemplaza la secuencia de llamadas sueltas que hacía el cliente.

create or replace function confirmar_compra(
  codigo_param text,
  funcion_id_param uuid,
  butaca_ids uuid[],
  sesion_id_param text,
  email_param text,
  edad_declarada_param int,
  total_param numeric,
  descuento_cupon_param numeric,
  premio_id_param uuid,
  credito_param numeric,
  candy_param jsonb,
  combos_param jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  vendidas int;
begin
  if total_param < 0 or descuento_cupon_param < 0 or credito_param < 0 then
    raise exception 'Los montos de la compra no son válidos.';
  end if;

  if coalesce(cardinality(butaca_ids), 0) = 0 then
    raise exception 'Elegí al menos una butaca.';
  end if;

  if auth.uid() is null
    and (descuento_cupon_param > 0 or premio_id_param is not null or credito_param > 0) then
    raise exception 'Iniciá sesión para usar descuentos o crédito.';
  end if;

  begin
    update entrada
    set estado = 'vendida', codigo_compra = codigo_param, reservada_hasta = null
    where funcion_id = funcion_id_param
      and estado = 'reservada'
      and sesion_id = sesion_id_param
      and butaca_id = any(butaca_ids);

    get diagnostics vendidas = row_count;
  exception
    when unique_violation then
      raise exception 'Alguna de estas butacas ya fue comprada por otra persona. Volvé a elegir.';
  end;

  if vendidas <> cardinality(butaca_ids) then
    raise exception 'La reserva venció. Volvé a elegir las butacas.';
  end if;

  insert into compra (
    codigo_compra, funcion_id, cliente_id, email, edad_declarada, total, descuento_cupon
  )
  values (
    codigo_param, funcion_id_param, auth.uid(), email_param, edad_declarada_param,
    total_param, descuento_cupon_param
  );

  insert into compra_candy (codigo_compra, producto_candy_id, cantidad)
  select codigo_param, (item ->> 'producto_candy_id')::uuid, (item ->> 'cantidad')::int
  from jsonb_array_elements(coalesce(candy_param, '[]'::jsonb)) as item;

  insert into compra_combo (codigo_compra, combo_id, cantidad)
  select codigo_param, (item ->> 'combo_id')::uuid, (item ->> 'cantidad')::int
  from jsonb_array_elements(coalesce(combos_param, '[]'::jsonb)) as item;

  if descuento_cupon_param > 0 and not usar_cupon_bienvenida() then
    raise exception 'Tu cupón de bienvenida ya se había usado. Revisá el resumen y volvé a confirmar.';
  end if;

  if premio_id_param is not null then
    perform canjear_premio(premio_id_param);
  end if;

  if credito_param > 0 then
    perform usar_credito(codigo_param, credito_param);
  end if;

  if auth.uid() is not null then
    perform sumar_puntos_compra(total_param);
  end if;
end;
$$;

grant execute on function confirmar_compra(
  text, uuid, uuid[], text, text, int, numeric, numeric, uuid, numeric, jsonb, jsonb
) to anon, authenticated;

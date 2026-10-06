alter table compra
  add column if not exists candy_retirado_en timestamptz,
  add column if not exists candy_retirado_por uuid references auth.users(id);

-- Hasta ahora validar una compra consumía todo: las ya validadas no deben poder retirar candy de nuevo.
update compra
set candy_retirado_en = validada_en,
    candy_retirado_por = validada_por
where validada_en is not null and candy_retirado_en is null;

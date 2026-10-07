-- El precio de la butaca se define al crear la función, uno por tipo.
-- Las funciones existentes quedan con los valores que antes estaban fijos en el código.
alter table funcion
  add column if not exists precio_normal int not null default 4000 check (precio_normal > 0),
  add column if not exists precio_accesible int not null default 4000 check (precio_accesible > 0),
  add column if not exists precio_vip int not null default 6000 check (precio_vip > 0);

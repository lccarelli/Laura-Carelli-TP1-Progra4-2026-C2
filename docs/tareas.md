# Tareas — plan completo

---

## Pedidos agrupados en tareas del board

De los 61 Pedidos de `cine/docs/analisis-correos-consigna.md`.

| Tarea                                           | Pedidos que cubre                                     |
| ----------------------------------------------- | ----------------------------------------------------- |
| T006 \| ABM de películas                        | Pedido-08                                             |
| T007 \| Alta de salas                           | Pedido-03                                             |
| T008 \| Asignación automática de sala           | Pedido-05, Pedido-06, Pedido-07, Pedido-09, Pedido-31 |
| T010 \| Detalle de película                     | Pedido-08 (vía T006), Pedido-33                       |
| T013 \| Reserva y compra sin registro           | Pedido-01, Pedido-12                                  |
| T014 \| Confirmación con QR y PDF               | Pedido-02, Pedido-29                                  |
| T015 \| Registro de cliente                     | Pedido-10                                             |
| T016 \| Cupón de bienvenida                     | Pedido-11, Pedido-20                                  |
| T017 \| Cupones segmentados por edad            | Pedido-21                                             |
| T018 \| Preventa                                | Pedido-51                                             |
| T019 \| Acumulación de puntos                   | Pedido-42, Pedido-46                                  |
| T020 \| Canje de puntos                         | Pedido-43, Pedido-44                                  |
| T021 \| Perfil del cliente                      | Pedido-45                                             |
| T022 \| Catálogo de candy                       | Pedido-22                                             |
| T023 \| Candy en la compra                      | Pedido-23, Pedido-24                                  |
| T024 \| Combos                                  | Pedido-47, Pedido-48                                  |
| T025 \| Reseñas de películas                    | Pedido-13, Pedido-14, Pedido-15                       |
| T026 \| Rol empleado y escaneo de QR            | Pedido-27, Pedido-28                                  |
| T027 \| Ingreso manual del código               | Pedido-29 (constraint, ya contado en T014)            |
| T028 \| QR de un solo uso                       | Pedido-30                                             |
| T029 \| Butacas accesibles                      | Pedido-36, Pedido-38                                  |
| T030 \| Butacas VIP                             | Pedido-56, Pedido-57                                  |
| T031 \| Ocupación en tiempo real                | Pedido-37                                             |
| T032 \| Funciones recurrentes                   | Pedido-32                                             |
| T033 \| Cancelación de compra                   | Pedido-53                                             |
| T034 \| Crédito por cancelación                 | Pedido-54, Pedido-55                                  |
| T035 \| Restricción de edad aplicada            | Pedido-34, Pedido-35                                  |
| T036 \| Top 3 más vendidas                      | Pedido-16                                             |
| T037 \| Buscador y filtro por género            | Pedido-17, Pedido-18, Pedido-19                       |
| T038 \| Próximamente y alerta de disponibilidad | Pedido-49, Pedido-50                                  |
| T039 \| Mis películas                           | Pedido-52                                             |
| T040 \| Reporte de facturación                  | Pedido-41                                             |
| T041 \| Exportar reportes                       | Pedido-58                                             |
| T042 \| Gráficos y agregaciones                 | Pedido-59, Pedido-60                                  |
| T043 \| Log de actividad                        | Pedido-61                                             |

---

## etapa 0 - infraestructura

### T001 | Crear proyecto Angular

Milestone: etapa 0. Labels: `chore`, `docs`.

### T002 | Convenciones: lint, hooks y CI

Milestone: etapa 0. Label: `chore`.

### T003 | Conexión con Supabase

Milestone: etapa 0. Label: `chore`.

### T004 | Deploy inicial

Milestone: etapa 0. Label: `chore`.

### T005 | Bajada tecnica/funcional (dos)

Milestone: etapa 0. Labels: `docs`.

---

## etapa 1 - flujo administrador cine

### T006 | ABM de Peliculas

Milestone: etapa 1. Label: `feat`.

### T007 | Alta salas

Milestone: etapa 1. Label: `feat`.

### T008 | Crear funciones con asignación automática de sala

**Título sugerido del issue:** `T008 | Crear funciones con asignación automática de sala`

El admin elige película, fecha, hora, formato e idioma; el sistema calcula ocupación (`inicio + duración + 30 min`) y asigna la primera sala libre, o explica por qué ninguna puede.

**Criterios de aceptación**

- [ ] Dos funciones que se solapan terminan en salas distintas
- [ ] Si no hay sala libre, el sistema explica qué la ocupa
- [ ] Escribir en `Función` sin rol admin es rechazado por RLS

Milestone: etapa 1. Label sugerido: `feat`.

---

## etapa 2 - flujo usuario visitante

### T009 | Cartelera

**Título sugerido del issue:** `T009 | Cartelera`

Listado con póster y nombre, sólo películas con al menos una función futura.

**Criterios de aceptación**

- [ ] La cartelera muestra las películas de T-006 que ya tienen función

Milestone: etapa 2. Label sugerido: `feat`.

### T010 | Detalle de película

**Título sugerido del issue:** `T010 | Detalle de película`

Ficha completa: nombre, imagen, sinopsis, duración, géneros, restricción de edad mostrada (no aplicada todavía).

**Criterios de aceptación**

- [ ] La ficha muestra todos los campos cargados en T-006

Milestone: etapa 2. Label sugerido: `feat`.

### T011 | Funciones de una película

**Título sugerido del issue:** `T011 | Funciones de una película`

Listado de funciones disponibles con día, hora, formato e idioma.

**Criterios de aceptación**

- [ ] Elegir una función lleva al mapa de butacas correcto

Milestone: etapa 2. Label sugerido: `feat`.

### T012 | Mapa de butacas

**Título sugerido del issue:** `T012 | Mapa de butacas`

Mapa visual con los tres bloques y los dos pasillos, estado libre/vendida por butaca.

**Criterios de aceptación**

- [ ] Una butaca vendida en otra compra aparece ocupada al recargar

Milestone: etapa 2. Label sugerido: `feat`.

### T013 | Reserva y compra sin registro

**Título sugerido del issue:** `T013 | Reserva y compra sin registro`

Selección de butacas, entrada `'reservada'` con vencimiento, pago simulado, confirmación que pasa la entrada a `'vendida'` y crea la compra con su código.

**Criterios de aceptación**

- [ ] Comprar la misma butaca dos veces en simultáneo falla para una de las dos
- [ ] La restricción que lo garantiza está en la base, no sólo en el código

Milestone: etapa 2. Label sugerido: `feat`.

### T014 | Confirmación con QR y PDF

**Título sugerido del issue:** `T014 | Confirmación con QR y PDF`

Código corto sin ambigüedades, QR en pantalla, PDF generado en el cliente con el mismo código.

**Criterios de aceptación**

- [ ] El PDF descargado contiene el mismo código que se ve en pantalla

Milestone: etapa 2. Label sugerido: `feat`.

---

## etapa 3 - cuenta y fidelización

### T015 | Registro de cliente

**Título sugerido del issue:** `T015 | Registro de cliente`

Alta de cuenta con mail, nombre, apellido, fecha de nacimiento, tipo de sangre, color de ojos y días de vacaciones por año (Pedido-10).

**Criterios de aceptación**

- [ ] El registro guarda los siete campos
- [ ] La fecha de nacimiento queda disponible para validar edad y cupones

Milestone: etapa 3. Label sugerido: `feat`. Depende de: T003.

### T016 | Cupón de bienvenida

**Título sugerido del issue:** `T016 | Cupón de bienvenida`

Al registrarse, cupón de descuento configurable (Pedido-11, Pedido-20) aplicable una sola vez en la primera compra.

**Criterios de aceptación**

- [ ] El cupón se aplica una sola vez por cuenta
- [ ] El porcentaje es editable desde el panel de admin

Milestone: etapa 3. Label sugerido: `feat`. Depende de: T015.

### T017 | Cupones segmentados por edad

**Título sugerido del issue:** `T017 | Cupones segmentados por edad`

Cupones con una condición de edad mínima para aplicar (Pedido-21).

**Criterios de aceptación**

- [ ] Un cupón con condición de edad sólo se aplica si el cliente califica

Milestone: etapa 3. Label sugerido: `feat`. Depende de: T015.

### T018 | Preventa

**Título sugerido del issue:** `T018 | Preventa`

Precio especial configurable por película, activo desde N días antes del estreno (Pedido-51).

**Criterios de aceptación**

- [ ] Una entrada comprada en preventa mantiene su precio aunque después suba

Milestone: etapa 3. Label sugerido: `feat`. Depende de: T006.

### T019 | Acumulación de puntos

**Título sugerido del issue:** `T019 | Acumulación de puntos`

1 punto por peso gastado, sólo clientes registrados, sin transferencia entre cuentas (Pedido-42, Pedido-46).

**Criterios de aceptación**

- [ ] Confirmar una compra registrada suma puntos
- [ ] No existe ninguna operación de transferencia entre usuarios

Milestone: etapa 3. Label sugerido: `feat`. Depende de: T013, T015.

### T020 | Canje de puntos

**Título sugerido del issue:** `T020 | Canje de puntos`

Cambiar puntos por entradas o candy, con costo en puntos configurable por recompensa (Pedido-43, Pedido-44).

**Criterios de aceptación**

- [ ] No se puede canjear con saldo insuficiente
- [ ] El saldo queda consistente aunque haya dos canjes al mismo tiempo

Milestone: etapa 3. Label sugerido: `feat`. Depende de: T019.

### T021 | Perfil del cliente

**Título sugerido del issue:** `T021 | Perfil del cliente`

Sección con puntos acumulados e historial de canjes (Pedido-45).

**Criterios de aceptación**

- [ ] Se ve el saldo de puntos y la lista de canjes

Milestone: etapa 3. Label sugerido: `feat`. Depende de: T020.

---

## etapa 4 - candy y combos

### T022 | Catálogo de candy

**Título sugerido del issue:** `T022 | Catálogo de candy`

ABM de productos y categorías del candy bar (Pedido-22).

**Criterios de aceptación**

- [ ] Alta, edición y borrado de productos y categorías funcionan contra Supabase

Milestone: etapa 4. Label sugerido: `feat`. Depende de: T003.

### T023 | Candy en la compra

**Título sugerido del issue:** `T023 | Candy en la compra`

Entradas y candy en una sola operación y un solo pago; el mismo QR sirve para retirar la comida (Pedido-23, Pedido-24).

**Criterios de aceptación**

- [ ] Un solo pago cubre entradas y productos de candy
- [ ] El QR de la entrada también valida el retiro del candy

Milestone: etapa 4. Label sugerido: `feat`. Depende de: T013, T022.

### T024 | Combos

**Título sugerido del issue:** `T024 | Combos`

Entrada + productos a precio fijo configurable, destacados en el paso de compra (Pedido-47, Pedido-48).

**Criterios de aceptación**

- [ ] Un combo agrupa productos y una entrada con su propio precio
- [ ] Los combos aparecen destacados en el paso de candy

Milestone: etapa 4. Label sugerido: `feat`. Depende de: T022.

---

## etapa 5 - reseñas

### T025 · Reseñas de películas

**Título sugerido del issue:** `T025 | Reseñas de películas`

Puntaje de 1 a 5 y comentario corto, visibles en el detalle antes de comprar, con promedio (Pedido-13, Pedido-14, Pedido-15).

**Criterios de aceptación**

- [ ] Una reseña por cliente y película
- [ ] El promedio se ve en el listado y en el detalle

Milestone: etapa 5. Label sugerido: `feat`. Depende de: T010, T015.

---

## etapa 6 - roles y validación de empleado

### T026 | Rol empleado y escaneo de QR

**Título sugerido del issue:** `T026 | Rol empleado y escaneo de QR`

Rol con acceso sólo a validación; escanea un QR y el sistema responde si es válido, distinguiendo acceso de candy (Pedido-27, Pedido-28).

**Criterios de aceptación**

- [ ] Un empleado no puede entrar al panel de admin
- [ ] Escanear un QR válido confirma acceso o candy según corresponda

Milestone: etapa 6. Label sugerido: `feat`. Depende de: T003.

### T027 | Ingreso manual del código

**Título sugerido del issue:** `T027 | Ingreso manual del código`

Campo de texto alternativo al escáner, para cuando el lector no funciona (Pedido-29 — también condiciona que el código de T014 sea corto y sin caracteres ambiguos).

**Criterios de aceptación**

- [ ] Tipear el código a mano valida igual que escanearlo

Milestone: etapa 6. Label sugerido: `feat`. Depende de: T026, T014.

### T028 | QR de un solo uso

**Título sugerido del issue:** `T028 | QR de un solo uso`

El código se marca como usado y no se acepta de nuevo, con dos estados independientes para acceso y candy (Pedido-30).

**Criterios de aceptación**

- [ ] Validar la misma entrada dos veces falla la segunda
- [ ] Candy y acceso se consumen por separado

Milestone: etapa 6. Label sugerido: `feat`. Depende de: T026.

---

## etapa 7 - butacas avanzadas y tiempo real

### T029 | Butacas accesibles

**Título sugerido del issue:** `T029 | Butacas accesibles`

Filas centrales modificadas para butacas accesibles, resaltadas visualmente sin depender sólo del color (Pedido-36, Pedido-38).

**Criterios de aceptación**

- [ ] Las butacas accesibles se generan en la posición correcta
- [ ] Se distinguen visualmente sin depender sólo del color

Milestone: etapa 7. Label sugerido: `feat`. Depende de: T007.

### T030 | Butacas VIP

**Título sugerido del issue:** `T030 | Butacas VIP`

Últimas 3 filas con precio más alto, aviso explícito antes de pagar (Pedido-56, Pedido-57).

**Criterios de aceptación**

- [ ] Las butacas VIP cobran el precio distinto
- [ ] El resumen de compra avisa explícitamente si hay una butaca VIP

Milestone: etapa 7. Label sugerido: `feat`. Depende de: T007, T013.

### T031 | Ocupación en tiempo real

**Título sugerido del issue:** `T031 | Ocupación en tiempo real`

El mapa de butacas se actualiza solo mientras el usuario elige (Pedido-37).

**Criterios de aceptación**

- [ ] Una butaca tomada por otra compra aparece ocupada sin recargar la página

Milestone: etapa 7. Label sugerido: `feat`. Depende de: T012.

### T032 | Funciones recurrentes

**Título sugerido del issue:** `T032 | Funciones recurrentes`

El admin define días de la semana y una hora; el sistema crea una función por cada ocurrencia (Pedido-32).

**Criterios de aceptación**

- [ ] Cada ocurrencia se valida contra el mismo criterio de T008 (30 min de margen, sala libre)

Milestone: etapa 7. Label sugerido: `feat`. Depende de: T008.

---

## etapa 8 - cancelación y crédito

### T033 | Cancelación de compra

**Título sugerido del issue:** `T033 | Cancelación de compra`

Cancelar hasta 2 horas antes de la función, libera las butacas (Pedido-53).

**Criterios de aceptación**

- [ ] Después de la ventana de 2 horas el botón de cancelar no está disponible

Milestone: etapa 8. Label sugerido: `feat`. Depende de: T013.

### T034 | Crédito por cancelación

**Título sugerido del issue:** `T034 | Crédito por cancelación`

La cancelación da crédito, no dinero; el crédito se combina con otro medio de pago (Pedido-54, Pedido-55).

**Criterios de aceptación**

- [ ] Un anónimo no recibe crédito, porque no tiene cuenta
- [ ] El pago aplica primero el crédito disponible y el resto por otro medio

Milestone: etapa 8. Label sugerido: `feat`. Depende de: T033, T015.

### T035 | Restricción de edad aplicada

**Título sugerido del issue:** `T035 | Restricción de edad aplicada`

Bloquear la compra si el cliente es menor a la restricción de la película, avisando que debe ir acompañado de un adulto (Pedido-34, Pedido-35).

**Criterios de aceptación**

- [ ] Un cliente menor no puede completar la compra de una película restringida
- [ ] La entrada y el PDF muestran el aviso de "debe ir un adulto"

Milestone: etapa 8. Label sugerido: `feat`. Depende de: T013.

---

## etapa 9 - catálogo avanzado

### T036 | Top 3 más vendidas

**Título sugerido del issue:** `T036 | Top 3 más vendidas`

La home destaca las tres películas con más entradas vendidas, reemplaza a la curación manual descartada (Pedido-04) por Pedido-16.

**Criterios de aceptación**

- [ ] La home muestra las 3 películas con más entradas vendidas

Milestone: etapa 9. Label sugerido: `feat`. Depende de: T009.

### T037 | Buscador y filtro por género

**Título sugerido del issue:** `T037 | Buscador y filtro por género`

Búsqueda de texto sobre el listado, combinable con filtro por uno o varios géneros (Pedido-17, Pedido-18, Pedido-19).

**Criterios de aceptación**

- [ ] Buscar por texto y filtrar por género se pueden combinar
- [ ] Estado vacío visible cuando no hay resultados

Milestone: etapa 9. Label sugerido: `feat`. Depende de: T009.

### T038 | Próximamente y alerta de disponibilidad

**Título sugerido del issue:** `T038 | Próximamente y alerta de disponibilidad`

Sección de estrenos futuros; el cliente se suscribe y recibe aviso cuando se abre la venta (Pedido-49, Pedido-50).

**Criterios de aceptación**

- [ ] Una película sin funciones a la venta y con estreno futuro aparece en Próximamente
- [ ] Suscribirse dispara un aviso cuando se abre la venta

Milestone: etapa 9. Label sugerido: `feat`. Depende de: T009, T015.

### T039 | Mis películas

**Título sugerido del issue:** `T039 | Mis películas`

Historial visual de funciones a las que el cliente asistió — validadas, no sólo compradas (Pedido-52).

**Criterios de aceptación**

- [ ] Sólo aparecen funciones con entrada efectivamente validada, no cualquier compra

Milestone: etapa 9. Label sugerido: `feat`. Depende de: T015, T028.

---

## etapa 10 - administración avanzada

### T040 | Reporte de facturación

**Título sugerido del issue:** `T040 | Reporte de facturación`

Totales diarios de dinero y entradas vendidas (Pedido-41).

**Criterios de aceptación**

- [ ] El reporte muestra el total del día seleccionado

Milestone: etapa 10. Label sugerido: `feat`. Depende de: T013.

### T041 | Exportar reportes

**Título sugerido del issue:** `T041 | Exportar reportes`

Descarga del reporte de facturación en PDF y Excel/CSV (Pedido-58).

**Criterios de aceptación**

- [ ] El reporte se descarga en los dos formatos

Milestone: etapa 10. Label sugerido: `feat`. Depende de: T040.

### T042 | Gráficos y agregaciones

**Título sugerido del issue:** `T042 | Gráficos y agregaciones`

Gráfico de películas más vistas por semana y por mes; producto de candy más vendido (Pedido-59, Pedido-60).

**Criterios de aceptación**

- [ ] El gráfico muestra los dos períodos (semana y mes)
- [ ] Se ve cuál es el producto de candy más vendido

Milestone: etapa 10. Label sugerido: `feat`. Depende de: T040, T022.

### T043 | Log de actividad

**Título sugerido del issue:** `T043 | Log de actividad`

Registro de qué hizo cada administrador o empleado, con fecha y hora; sólo se agrega, nunca se edita ni se borra (Pedido-61).

**Criterios de aceptación**

- [ ] Cada acción relevante (crear función, modificar precio, validar QR) queda registrada
- [ ] El log no se puede editar ni borrar desde la aplicación

Milestone: etapa 10. Label sugerido: `feat`. Depende de: T003.

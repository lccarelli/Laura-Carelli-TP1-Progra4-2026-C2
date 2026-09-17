# Bajada técnica y funcional

Listado de todos los pedidos realizados en los correos.
El orden es cronológico, para no perder la trazabilidad.
Al final hay un índice.

## **Formato de cada entrada**

---

# Correo número - fecha

> La cita textual del cliente.

**Funcionalidad** - lo que tiene que hacer el sistema.
**Datos** - modelos de datos y campos que van surgiendo.
**Reglas** - reglas que tiene que cumplir una funcionalidad.
**Interfaz** - dónde y cómo se ve.
**A decidir** - cosas que no sé cómo hacer aún.

---

# Correo 1 - 01/01

## Pedido-01 | Venta de entradas online

> "Necesitamos hacer un sistema para nuestro cine (...) para sacar entradas."

**Funcionalidad:** Un usuario puede elegir una función, con selección de butacas, paga y obtiene entradas (PDF con QR de acceso, único para esas butacas).
**Datos**: `Función` `Butaca` `Compra` `Entradas`
**Reglas:** Una butaca no puede venderse dos veces para la misma función.
**Interfaz:** Es el recorrido central de toda la aplicación. Pantalla inicio, selección función, butaca, y elegir comprar.

## Pedido-02 | PDF de la entrada con QR

> "...les genere el pdf con los datos de la entrada y el QR que van a presentar para ver la película."

**Funcionalidad:** Terminada la compra, se genera un PDF descargable con los datos y un QR.
**Datos:** Un código QR por entrada + candy. El candy se retira con el mismo QR (Pedido-24). Un solo QR válido para ambos.
**Reglas:** El código debe ser indescifrable.
**Interfaz:** Pantalla que muestre la entrada comprada con el QR en pantalla además del PDF.
**A decidir:** Investigar cómo se implementa un QR. Y el código, quizás generar un hash.

## Pedido-03 | Plano fijo butacas de salas

> "La forma de nuestras salas es siempre la misma, 20 filas numeradas con letras y 3 columnas con 4, 20 y 4 butacas."

**Funcionalidad:** Todas las salas tienen el mismo plano: filas A a T, y en cada fila tres bloques de 4, 20 y 4 butacas. 28 por fila, 560 por sala. Cuando se crea una sala tiene que tener esta estructura.
**Datos:** `Sala` con nombre. `Butaca` con fila, número, bloque y tipo.
**Reglas:** Todas las salas iguales.
**Interfaz:** El mapa de butacas. Los tres bloques implican dos pasillos, y eso tiene que verse en la selección de butacas.
**A decidir:** si usamos siempre una plantilla fija, o lo dejamos dinámicos. Si es necesario escalar a futuro. ¿Hay un límite de salas?

## Pedido-04 | Elección de película para página principal

> "...poder elegir qué películas aparecen cuando se entra a la página."

**Funcionalidad:** Como Administrador quiero tener la selección de qué película se mostrará en la pantalla principal de usuario.
**Datos:** Marcar destacado una `Película`. Tenemos que guardar este dato.
**Interfaz:** ABM de películas para el admin; home para el visitante.

## Pedido-05 | Programación de horarios

> "...en qué horarios está cada película."

**Funcionalidad:** El administrador define horarios de las funciones de cada película.
**Datos:** `Función` con película, fecha, hora, sala, formato e idioma.
**Reglas:** Pedido-09 y Pedido-31 restringen qué combinaciones son válidas.
**Interfaz:** ABM de funciones.

## Pedido-06 | Formato de proyección

> "...si está en 2d, 3d, 4d o 5d."

**Funcionalidad:** Cada función tiene un formato.
**Datos:** Enumerado en `Función`, no en `Película`: la misma película puede darse en 2D y en 3D.
**Interfaz:** Visible al elegir función y en la entrada.

## Pedido-07 | Idioma de proyección

> "...si está en castellano o subtitulada."

**Funcionalidad:** Cada función es castellano o subtitulada.
**Datos:** Enumerado en `Función`.
**Interfaz:** Igual que el formato.

## Pedido-08 | Ficha de la película

> "Toda película tiene una duración, una imagen, un nombre y una sinopsis."

**Funcionalidad:** Mostrar información de la película.
**Datos:** `Película`: nombre, sinopsis, duración en minutos, imagen. Después se suman géneros (Pedido-19) y restricción de edad (Pedido-33).
**Reglas:** La duración es importante saberla, se usa Pedido-09.
**Interfaz:** Listado y detalle.
**A decidir.** Dónde se guardan las imágenes.

## Pedido-09 | Separación mínima entre funciones

> "La duración es importante, no puede haber funciones antes de que pase media hora de que terminó la función anterior en esa sala."

**Funcionalidad:** Al crear una función hay que verificar que en esa sala no haya otra que termine menos de 30 minutos antes.
**Datos:** Necesita hora de inicio y duración de la película para calcular el fin.
**Reglas:** `inicio(nueva) >= fin(anterior) + 30 min`, y simétricamente hacia adelante. El fin es `inicio + duración`.
**Interfaz:** Se valida al crear la función, con un mensaje que explique con qué función choca.
**A decidir:** Si los 30 minutos es configurable o queda fijo.

## Pedido-10 | Registro de usuarios

> "...solo mail, nombre, apellido, fecha de nacimiento, tipo de sangre, color de ojos y cantidad de días de vacaciones que tienen por año."

**Funcionalidad:** Alta de cuenta con esos siete campos.
**Datos:** `user.data` => `mail` `nombre` `apellido` `fecha nacimiento` `color ojos` `cantidad vacaciones x año`
**Reglas:** La fecha de nacimiento es el único campo con función real: Pedido-34 y Pedido-21.
**Interfaz:** Formulario de registro.

## Pedido-11 | Cupón de bienvenida

> "El beneficio que tienen por registrarse es un cupón de 20% de descuento en la primera compra."

**Funcionalidad.** Al registrarse, el cliente recibe un descuento aplicable una sola vez.
**Datos.** Marca de cupón consumido en el perfil, o un `Cupón` emitido con estado.
**Reglas.** Una sola vez por cuenta. El 20% es configurable por Pedido-20.
**Interfaz.** Se comunica en el registro y se aplica en el pago.
**A decidir.** Si "primera compra" es la primera de todas o la primera después de registrarse. Y si vence.

## Pedido-12 | Compra anónima

> "...pueden comprar siendo anónimos, siempre que paguen no hay problema."

**Funcionalidad:** Comprar sin cuenta, sin fricción.
**Datos:** La compra puede no tener cliente asociado. Hace falta algún contacto para entregar la entrada.
**Reglas:** El anónimo queda fuera de cupones, puntos, crédito e historial. Tiene que validar edad aunque sea anónimo.
**Interfaz:** Nunca se puede bloquear la compra pidiendo registro.

---

# Correo 2 - 16/01

## Pedido-13 | Reseñas

> "...un sistema de reseñas, donde cada persona puede calificar con estrellas cada película y dejar un comentario corto."

**Funcionalidad.** Un cliente puntúa de 1 a 5 y escribe un comentario.
**Datos.** `Reseña` con cliente, película, puntaje y texto.
**Reglas.** Una reseña por cliente y película.
**Interfaz.** En el detalle de la película.

## Pedido-14 | Reseñas visibles antes de comprar

> "Eso se debería poder ver antes de sacar las entradas."

**Funcionalmente.** Las reseñas están en el detalle de la función, antes del paso de compra.
**Interfaz.** Investigar cómo conviene mostrar esta sección.

## Pedido-15 | Puntuación promedio

> "...otra página mostraba la puntuación promedio de la película y lo queremos también."

**Funcionalidad.** Promedio de las reseñas, visible en listado y detalle.
**Datos.** `promedio` es un dato a calcular, investigar cómo conviene guardar esta info.

## Pedido-16 | Top 3 más vendidas

> "...en la página principal se muestren primero las 3 películas más vendidas."

**Funcionalidad.** La home destaca las tres con más entradas vendidas.
**Datos.** Requiere contar entradas por película.
**Reglas.** Hay que definir el período: ¿más vendidas de siempre, del mes, de la semana?
**A decidir.** Se descarta Pedido-04

## Pedido-17 | Buscador

> "...el listado de películas tenga incorporado un buscador."

**Funcionalidad.** Búsqueda por texto sobre el listado.
**A decidir.** Sobre qué campos busca: título solo, o también sinopsis y
director.

---

# Correo 3 - 16/01

## Pedido-18 | Filtro por género

> "¡El buscador tiene que poder filtrar por género de la película!"

**Funcionalidad.** Filtrar el listado por uno o varios géneros, combinable con el texto de Pedido-17.
**Interfaz.** Filtros visibles, y estado vacío cuando no hay resultados.

## Pedido-19 | Varios géneros por película

> "No te olvides que cada película puede tener varios géneros."

**Funcionalidad.** Relación de muchos a muchos entre película y género.
**Datos.** Tabla `Género`. No es un campo de texto. Se pueden crear tipos de género.
**Reglas.** Filtrar por un género trae las películas que tengan este género.

---

# Correo 4 — 30/01

## Pedido-20 | Porcentaje del cupón configurable

> "...el cupón de la primera compra quiero poder configurarlo, cambiar el porcentaje cuando yo quiera."

**Funcionalidad.** El 20% de Pedido-11 va a ser configurable.
**Datos.** Configuración del sistema, o un `Cupón` plantilla editable.

## Pedido-21 · Cupones segmentados por edad

> "...crear cupones que solo afecten a los usuarios que tengan más de 50 años."

**Funcionalidad.** Cupones que se puedan segmentar por edad del comprador.
**Datos.** `Cupón` con porcentaje y criterio de elegibilidad.
**Reglas.** La edad sale de la fecha de nacimiento (Pedido-10). Un anónimo también tiene que setear edad a la hora de la compra.
**A decidir.** Si construimos algo específico para edad, o crear algo dinámico que pueda tener diferentes grupos de segmentaciones.

## Pedido-22 | Catálogo del candy

> "Quiero poder crear todos los productos, ponerlos en categorías."

**Funcionalidad.** ABM de productos y de categorías.
**Datos.** `Producto` con nombre, precio, categoría e imagen. `Categoría`.

## Pedido-23 | Candy en la misma compra

> "...que lo puedan comprar junto con la entrada."

**Funcionalidad.** La compra incluye entradas y productos en una sola operación y un solo pago.
**Datos.** `Compra` constituye tanto entradas como productos de candy.
**Interfaz.** Un paso del flujo de compra, salteable.

## Pedido-24 | Retiro del candy con el mismo QR

> "Que con el mismo QR puedan retirar eso también."

**Funcionalidad.** El código de la compra sirve para entrar y para retirar la comida.
**Reglas.** Contradicción con Pedido-30.

## Pedido-25 | Mapa del cine

> "Estamos pensando en agregar una pantalla con un mapa de todo el cine que indique cuál es la sala (...) pero no tenemos luz verde aún."

**Fuera de alcance.** ¿Entender si se va a desarrollar o no?

---

# Correo 5 - 06/02

## Pedido-26 | Rol administrador

> "...un usuario que pueda controlar todo lo relacionado a las salas, las funciones, la distribución de las butacas, los productos, etc."

**Funcionalidad.** Un rol con acceso a toda la configuración.
**Datos.** Rol en el perfil del usuario.
**Reglas.** Rol con políticas de seguridad, y entrada distinta a otros flujos, sólo este rol puede entrar a configurar.
**Interfaz.** Panel de administración, con guards de ruta.

## Pedido-27 | Rol empleado

> "...usuarios que usen los empleados para poder escanear los QRs."

**Funcionalidad.** Rol con acceso sólo a la validación.
**Interfaz.** Este rol tiene que poder validar de forma simple un QR tanto en entrada como entrega de candy, con opción de que se pueda ingresar el código manualmente de forma simple.

## Pedido-28 | Validación por escaneo

> "...escanear los QRs para validar las entradas, tanto para el cine como para el Candy bar."

**Funcionalidad.** El empleado escanea y el sistema responde si es válido.
**Reglas.** Dos operaciones distintas sobre el mismo código: validar acceso y entregar candy.
**A decidir.** Si se usa la cámara del dispositivo. Requiere permisos y HTTPS, que la PWA ya tiene.

## Pedido-29 | Ingreso manual del código

> "...que se pueda poner el código a mano por si el lector no funciona ese día."

**Funcionalidad.** Además del escáner, un campo de texto.
**Reglas.** El código tiene que ser tipeable: corto y sin caracteres ambiguos. Esto condiciona el diseño del código de Pedido-02.

## Pedido-30 | QR de un solo uso

> "...una vez que una entrada se valida o se entrega la comida, el QR deja de funcionar."

**Funcionalidad.** El código se marca como usado y no se acepta de nuevo.
**Datos.** Estado y momento de validación.
**Reglas.** Un QR sólo puede ser válido una vez por candy y una vez por entrada.
**A decidir.** Acá tenemos que ver de qué forma validamos el consumo del QR.

## Pedido-31 | Asignación automática de sala

> "...queremos que la asignación de salas sea automática y que bajo ningún término dos funciones sean en la misma sala al mismo tiempo."

**Funcionalidad.** El administrador no elige sala: elige película, días y hora, y el sistema busca una sala libre.
**Reglas.** Combina con Pedido-09: la sala está libre si ninguna función se solapa **y** hay 30 minutos de margen antes y después.
**Interfaz.** Al crear la función, mostrar qué sala se asignó.
**A decidir.** Qué hacer si ninguna sala está libre: rechazar con un mensaje, mostrar horarios alternativos. ¿Con qué criterio elegir cuando hay varias salas libres, cómo ordenarlas para mostrar?

## Pedido-32 | Funciones recurrentes

> "...yo quiero que una película se proyecte los lunes, martes y viernes a las 18hs."

**Funcionalidad.** El administrador define días de la semana y una hora, y el sistema crea las funciones.
**Datos.** Cada ocurrencia es la creación de una `Función`.
**Reglas.** Cada ocurrencia se valida por separado contra Pedido-09 y Pedido-31. Puede pasar que el lunes haya sala y el martes no.
**A decidir.** ¿Mostrar calendario para fijar desde y hasta?

---

# Correo 6 - 12/02

## Pedido-33 | Restricción de edad

> "Algunas películas tienen restricción de edad, algunos 18 años, otras 13 y otras no tienen."

**Datos.** Campo opcional en `Película` con valores 13, 18 o ninguno.
**Interfaz.** Visible en listado y detalle, antes de elegir butacas.

## Pedido-34 | Bloqueo de compra por edad

> "A los usuarios menores de 18 o 13 años no se les dejará comprar esas entradas."

**Funcionalidad.** Si el cliente es menor que la restricción, no puede comprar.
**Reglas.** La edad se calcula contra la fecha de la función, no contra hoy.
**A decidir.** Un usuario anónimo, no sabemos su edad. Pero para realizar la compra esa validación la va a tener que pasar entregando su fecha. La otra alternativa sería que se pueda solo dar al usuario anónimo solo ninguna restricción. Y las que tienen restricción meter edad sí o sí.

## Pedido-35 | Aviso de acompañante adulto

> "...cualquier entrada comprada a esas películas debe aclarar que debe ir un adulto."

**Funcionalidad.** La entrada y el PDF llevan el mensaje que avisa lo de ir con un adulto.
**Interfaz.** También mostrarla antes de pagar por la pantalla.

## Pedido-36 | Butacas accesibles

> "Las dos filas de butacas del medio se quitaron (filas J y K) para dar espacio a una fila de butacas para personas con discapacidad. En cada columna quedaron 2, 10 y 2 butacas de ese estilo."

**Funcionalidad.** Modifica la ubicación de butacas y orden de Pedido-03.
**Datos.** Tipo de butaca accesible.
**A decidir.** Revisar cómo quedaría para entender un poco.

## Pedido-37 | Ocupación en tiempo real

> "...cuando un usuario está seleccionando butacas, debe ver cuáles ya están ocupadas por otra compra en ese mismo momento."

**Funcionalidad.** El mapa se actualiza solo mientras el usuario elige.
**Datos.** Consulta realtime sobre la tabla de entradas.
**Reglas.** Aparece el problema de la reserva: entre elegir y pagar, otro puede
comprar la misma butaca. Hay que decidir si se bloquea temporalmente o si se
resuelve al confirmar.
**A decidir.** Es el requerimiento con más complejidad. Merece un diagrama de secuencia propio. ¿Cuando uno selecciona, el otro las ve ocupadas? Ni bien haces click se debería guardar la nueva selección.

## Pedido-38 | Resalte visual de accesibles

> "Las butacas accesibles (...) deben resaltarse visualmente de forma diferente."

**Interfaz.** ¿Sólo las butacas accesible (no ocupadas) mostrarlas como blanco/verde?

---

# Correo 7 - 28/02

## Pedido-39 | Usabilidad

> "...que las interfaces sean fáciles de navegar y de entender tanto para los clientes como los empleados."

**Interfaz.** Cada pantalla y flujo será evaluado y probado, para entender su usabilidad y ajustar de ser necesario.

## Pedido-40 | Selector de fecha y hora

> "Que haya una mejor forma de ingresar fechas y horas que no implique tanto tiempo de búsqueda. Demasiado scroll nos hace doler la cabeza."

**Funcionalidad.** Elegir fecha y hora tiene que ser rápido y visible.
**Interfaz.** Aparece en dos pantallas el calendario: el cliente elige entre funciones, el administrador programa funciones.

## Pedido-41 | Reporte de facturación

> "...un reporte que me diga cuánto facturamos por día y cuántas entradas se vendieron."

**Funcionalidad.** Totales diarios de dinero y de entradas.
**Datos.** Agregación sobre compras. Conviene resolverlo con una vista o una función en la base. Algo que se vaya calculando y esté disponible y actualizado cuando se consulte.

---

# Correo 8 - 03/03

## Pedido-42 | Acumulación de puntos

> "...cada vez que un usuario registrado hace una compra, acumule puntos (...) por cada peso gastado gane 1 punto."

**Funcionalidad.** Al confirmar una compra, el cliente suma puntos igual al monto. 1 peso = 1 punto
**Reglas.** Sólo clientes registrados.

## Pedido-43 | Canje de puntos

> "Los puntos deben poder canjearse por entradas gratis o por productos del candy bar."

**Funcionalidad.** El cliente cambia puntos por una recompensa.
**Datos.** `Canje` con cliente, recompensa, puntos gastados y fecha.
**Reglas.** No se puede canjear con saldo insuficiente. El saldo tiene que
quedar consistente aunque haya dos canjes al mismo tiempo.

## Pedido-44 | Costo en puntos configurable

> "Yo como admin quiero poder configurar cuántos puntos cuesta cada recompensa."

**Datos.** `Recompensa` con su costo en puntos, editable.

## Pedido-45 | Puntos e historial en el perfil

> "El usuario debe ver en su perfil cuántos puntos tiene acumulados y el historial de canjes."

**Interfaz.** Sección del perfil con saldo y lista de canjes.

## Pedido-46 | Puntos no transferibles

> "Los puntos no se pueden transferir entre usuarios."

**Reglas.** No existe la operación de transferencia.

## Pedido-47 | Combos

> "...combos especiales: entrada + pochoclos + bebida a un precio fijo que yo pueda configurar desde el panel de admin."

**Funcionalidad.** Un combo agrupa productos y una entrada a un precio propio.
**Datos.** `Combo` con sus componentes y su precio.
**A decidir.** Un nuevo tipo `modelo` que agrupa conjunto de productos para una compra con descuento aplicado. (Entender mejor)

## Pedido-48 | Combos destacados

> "Estos combos deben aparecer destacados en la página de compra."

**Interfaz.** En el paso de candy, arriba y diferenciados.

---

# Correo 9 - 08/03

## Pedido-49 | Sección Próximamente

> "...donde mostremos las películas que se estrenan en las próximas semanas."

**Datos.** Fecha de estreno en `Película`. Una película sin funciones a la venta y con estreno futuro está en próximamente.
**Interfaz.** Sección propia, separada de la cartelera.

## Pedido-50 | Alerta de disponibilidad

> "Los usuarios deben poder activar una alerta para recibir una notificación cuando las entradas de esa película estén disponibles."

**Funcionalidad.** El cliente se suscribe y recibe aviso cuando se abre la venta.
**Datos.** `Alerta` con cliente, película y estado.
**A decidir.** Qué es "notificación": correo, push

## Pedido-51 | Preventa

> "...abrir la venta de entradas 7 días antes del estreno con un precio especial de preventa. Una vez que pase la fecha de preventa, el precio vuelve al normal. Esto debe ser configurable película por película."

**Datos.** Por película: si tiene preventa, desde cuándo y a qué precio.
**Reglas.** El precio depende de cuándo se compra, no de cuándo es la función. Una entrada comprada en preventa mantiene su precio.
**A decidir.** Los 7 días, ¿son fijos o configurables? Dice "configurable película por película", pero la cantidad de días también variable.

## Pedido-52 | Mis películas

> "...donde el usuario vea un historial visual de todo lo que vio, con pósters, fechas y su propia calificación."

**Funcionalidad.** Historial de funciones a las que el cliente asistió.
**Reglas.** Lo que vio es lo que compró.
**Interfaz.** Visual, con pósters, no una tabla.

---

# Correo 10 - 10/03

## Pedido-53 | Cancelación hasta 2 horas antes

> "Necesitamos que los usuarios puedan cancelar una compra hasta 2 horas antes de la función."

**Funcionalidad.** El cliente cancela y las butacas se liberan.
**Reglas.** `ahora <= inicio(función) - 2h`. Después, el botón no está.
**A decidir.** Todo incluido. Entrada más candy.

## Pedido-54 | Devolución como crédito

> "No queremos devolver dinero, sino darles crédito en su cuenta para futuras compras."

**Datos.** Saldo de crédito en el perfil, con su historial de movimientos.
**Reglas.** El crédito no se retira. Anónimo no se le reintegra, sin cuenta.

## Pedido-55 | Crédito combinable

> "El crédito debe aparecer en su perfil y poder usarse junto con otros métodos de pago."

**Funcionalidad.** En el pago se aplica primero el crédito y el resto va por otro medio.
**Interfaz.** El desglose tiene que ser claro antes de confirmar.

## Pedido-56 | Butacas VIP

> "...butacas VIP en las últimas 3 filas de cada sala (filas R, S y T). Estas butacas deben tener un precio más alto."

**Datos.** Tipo de butaca VIP con su precio.
**Reglas.** Modifica la geometría de Pedido-03 por tercera vez, junto con Pedido-36.

## Pedido-57 | Aviso de VIP antes de pagar

> "El usuario debe saber claramente que está comprando una butaca VIP antes de pagar."

**Interfaz.** Diferenciación en el mapa más un aviso explícito en el resumen.

## Pedido-58 | Exportación de reportes

> "...necesito poder exportar el reporte de facturación a PDF y a Excel."

**Funcionalidad.** Dos formatos de descarga del reporte de Pedido-41.
**A decidir.** "Excel" puede ser `.xlsx` real o un `.csv` que Excel abre.

## Pedido-59 | Gráficos de más vistas

> "...un gráfico de las películas más vistas por semana y por mes."

**Funcionalidad.** Visualización con dos períodos.
**Datos.** Agregación por película y por rango de fechas.

## Pedido-60 | Producto de candy más vendido

> "...cuál es el producto del candy bar que más se vende."

**Datos.** Agregación sobre las líneas de producto.

## Pedido-61 | Log de actividad

> "...quién creó qué función, quién modificó un precio, quién validó un QR. Todo debe quedar registrado con fecha y hora."

**Funcionalidad.** Registro de acciones de administradores y empleados.
**Datos.** `Log` con usuario, acción, entidad afectada, fecha y hora.

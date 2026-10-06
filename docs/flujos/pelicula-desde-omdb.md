# Película desde OMDb, tráiler y traducción

El administrador da de alta o edita una película sin tipear los datos: la busca en [OMDb](https://www.omdbapi.com/), la elige y el formulario se completa. También puede buscar el tráiler en YouTube y traducir la sinopsis al español sin salir de la pantalla.

El público no consulta OMDb: lo que se elige queda guardado en la tabla `pelicula` y se lee de ahí.

## Alta de una película

Desde **Gestión → Películas**, con el botón `+`.

### 1. Buscar en OMDb

Se escribe el título en el buscador. Espera un momento después de dejar de escribir, y con menos de 3 letras no busca. OMDb busca por título en inglés: se encuentra "The Lion King", no "El Rey León".

También se puede pegar el link de IMDb de la película (por ejemplo `https://www.imdb.com/title/tt0114148/`): en ese caso no muestra lista y trae la película directo.

![Buscar en OMDb](img/01-buscar-omdb.png)

### 2. Elegir la película

Al elegir un resultado se completan el nombre, la sinopsis, la duración y el póster. Debajo aparecen el director, los actores y el género que informa OMDb. El nombre es el título local y se puede cambiar. Falta completar a mano la restricción de edad, la fecha de estreno y los géneros.

![Datos precargados](img/02-datos-precargados.png)

Si la película ya estaba cargada, avisa y ofrece editarla en lugar de duplicarla.

![Película ya cargada](img/03-pelicula-duplicada.png)

### 3. Traducir la sinopsis

El botón **Traducir sinopsis al español** traduce el texto del campo con el traductor de Chrome, en la propia computadora. La primera vez Chrome descarga el idioma. El botón sólo aparece en navegadores que lo soportan.

![Traducir la sinopsis](img/04-traducir-sinopsis.png)

### 4. Buscar el tráiler

Debajo del campo del tráiler, **Buscar tráiler** propone una búsqueda con el nombre, el año y "trailer oficial", que se puede editar. Muestra 5 videos de YouTube. El elegido queda marcado y se ve una vista previa. Su link se guarda en el campo.

![Buscar el tráiler](img/05-buscar-trailer.png)

### 5. Guardar

**Crear película** guarda los datos y, junto con ellos, el identificador de IMDb, los puntajes de Rotten Tomatoes, Metacritic e IMDb y la respuesta completa de OMDb.

## Edición

Al editar una película cargada desde OMDb se ve "Vinculada a OMDb". El buscador está disponible también acá: al elegir otro resultado se actualizan sinopsis, duración e imagen, pero **el nombre no cambia**. Si no se toca el buscador, los datos de OMDb que ya tenía quedan como estaban.

![Edición de una película vinculada](img/06-edicion-vinculada.png)

## Lo que ve el público

El detalle de la película muestra los puntajes: 🍅 si Rotten Tomatoes es 60 o más y 🤢 si es menor, más Metacritic e IMDb. Si un puntaje no existe, no se muestra. Debajo, el tráiler embebido.

![Detalle público con puntajes y tráiler](img/07-detalle-publico.png)

## Configuración

En el `.env` (y en las variables de Vercel): `OMDB_KEY`. La key se pide gratis en [omdbapi.com](https://www.omdbapi.com/apikey.aspx).

Para el tráiler, la función `buscar-trailer` necesita el secret `YOUTUBE_API_KEY` en Supabase.

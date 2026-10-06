# Cartelera

Es la pantalla de inicio. La ve cualquier persona, tenga o no cuenta. Muestra las películas destacadas y las que tienen funciones por venir, con buscador y filtros.

## Destacadas

Arriba hay un carrusel con hasta 3 películas. Si la película tiene tráiler, se reproduce sin sonido. Quién aparece lo define el administrador desde **Gestión → Configuración**:

- **Manual**: las películas marcadas como destacadas.
- **Automático**: las 3 más vendidas del último mes.

![Cartelera con carrusel y grilla](img/cartelera-01-inicio.png)

## Película en la grilla

Cada tarjeta muestra el póster, el nombre y unas insignias: el promedio de estrellas, **Estreno** (los primeros 7 días desde el estreno), **Preventa** (cuando falta poco para el estreno y tiene descuento), la restricción de edad y los géneros. Al tocarla se abre el detalle de la película.

Una película sólo aparece si está activa y tiene al menos una función por venir.

## Buscar y filtrar

Se pueden combinar tres filtros:

- **Título**: escribir parte del nombre.
- **Género**: tocar uno o varios géneros. Aparecen las películas que tengan alguno de ellos.
- **Día**: tocar uno de los próximos 14 días. Aparecen las películas con función ese día. Tocar el mismo día otra vez lo quita.

Al cambiar un filtro la pantalla baja sola hasta la grilla.

![Filtros por título, género y día](img/cartelera-02-filtros.png)

Si ninguna película cumple, se ve "No encontramos películas con esos filtros."

![Sin resultados](img/cartelera-03-sin-resultados.png)

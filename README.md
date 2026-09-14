# 🎬 Trabajo Practico Cine

**Sistema de venta de entradas de cine**

TP1 de Programación IV.
**UTN FRA | División 341 | 2026 C2**

**Profesores**

- Agustín Friadenrich
- Natalia Diez

![Angular](https://img.shields.io/badge/Angular-22.1-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Tailwind_CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white)
![Node](https://img.shields.io/badge/Node-24_LTS-339933?logo=node.js&logoColor=white)

---

## Indice

- [Características técnicas](#características-técnicas)
- [Cómo correr el proyecto](#cómo-correr-el-proyecto)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Manejo de branches y merges](#manejo-de-branches-y-merges)
- [Documentacion](#docs) -> `docs/` (Trabajando)

---

## Características técnicas

| Pieza        | Versión                  |
| ------------ | ------------------------ |
| Angular      | 22.1.x                   |
| Node         | 24 (LTS)                 |
| TypeScript   | 6.0                      |
| Tailwind CSS | 4.1.x                    |
| ESLint       | 10 + `angular-eslint` 22 |
| Prettier     | 3.9                      |
| Supabase     | pendiente                |

---

## Cómo correr el proyecto

```bash
nvm use
npm ci
npm start        # http://localhost:4200
```

| Comando                | Qué hace                            |
| ---------------------- | ----------------------------------- |
| `npm start`            | Levantar desarrollo                 |
| `npm run build`        | Build de producción a `dist/`       |
| `npm test`             | Tests en modo watch                 |
| `npm run test:ci`      | Tests una sola vez para CI          |
| `npm run lint`         | ESLint sobre TypeScript y templates |
| `npm run format`       | Prettier da formateo                |
| `npm run format:check` | Prettier valida formateo            |

---

## Estructura de carpetas

```
src/app/
├── app.ts / app.html / app.css
├── app.config.ts
├── app.routes.ts
├── pages/
│   ├── cartelera/
│   ├── compra/
│   └── admin/                       Detrás de un guard (rol administrador)
│       ├── peliculas/
│       ├── salas/
│       └── funciones/
├── componentes/
├── servicios/
├── interfaces/
├── guards/                          adminGuard
├── pipes/
├── directivas/
└── validadores/
```

---

## Manejo de branches y merges

**Trunk-based:**

- Una sola rama central, `main`.
- Cada rama de trabajo sale de `main` y vuelve a `main`.

**Rama por tipo + tarea:**

- `tipo/T-0XX-titulo-tarea`, con `tipo` uno de `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

**Pull request contra `main` siempre:**

- Nunca push directo.
- Se usa un hook `pre-push` local, bloqueo de merges contra main.

**`main` es lo único que deploya a producción:**

- El merge a `main` dispara el deploy de producción a Vercel.

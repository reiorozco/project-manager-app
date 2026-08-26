# 006 — Modernizar majors: Prisma 7, Zod 4, lucide-react 1

## Objetivo
Actualizar los 3 majors pendientes que Dependabot dejó ignorados por romper el build,
migrándolos correctamente uno por uno con build verde y deploy de producción verificado.

Repo: proyecto personal de portafolio (Next 16 + React 19 + Supabase Postgres).
Se puede probar en producción.

## Estado inicial (baseline)
- `tsc --noEmit` verde en main.
- Prisma 6.6 con generador `prisma-client-js`, output custom `../generated/prisma`.
- `url`/`directUrl` en el `datasource` del schema (Prisma 7 los rechaza — error P1012).
- `PrismaClient` instanciado sin adapter en `lib/prisma.ts` (singleton) y en
  `app/api/users/designers/route.ts` (instancia suelta).
- Zod 3 en 3 archivos: `app/projects/_utils/types.ts`, `app/auth/register/page.tsx`,
  `app/auth/login/page.tsx`. `@hookform/resolvers` en 5.4.0 (ya compatible con zod v4).
- lucide-react 0.487 en 22 archivos.

## Fase 1 — Prisma 6 → 7  [COMPLETADA]
Resultado: `prisma.config.ts` creado (carga `.env.local` con dotenv para el CLI local;
en Vercel las vars vienen de process.env). `url`/`directUrl` fuera del schema. Adapter
`PrismaPg` en `lib/prisma.ts`. `route.ts` usa el singleton. `prisma-dbml-generator` SÍ
funciona con Prisma 7. `prisma generate` + `tsc` + `next build` verdes (el prerender
conectó a Supabase vía adapter, confirmando el runtime).
Breaking real: `url`/`directUrl` salen del schema a `prisma.config.ts`, y `PrismaClient`
requiere un driver adapter (`@prisma/adapter-pg` para Postgres) o `accelerateUrl`.
Se mantiene el generador `prisma-client-js` (sigue válido en v7) para minimizar el cambio.

Pasos:
1. Instalar `prisma@7`, `@prisma/client@7`, `@prisma/adapter-pg`.
2. Crear `prisma.config.ts` con `defineConfig` (schema + datasource.url + migrations).
3. Quitar `url`/`directUrl` del `datasource` en `schema.prisma`.
4. Actualizar `lib/prisma.ts`: `new PrismaClient({ adapter: new PrismaPg(...) })`.
5. Actualizar `app/api/users/designers/route.ts` para usar el singleton de `lib/prisma.ts`.
6. Verificar compatibilidad de `prisma-dbml-generator` con Prisma 7 (dev-only; si rompe
   `prisma generate`, quitarlo).
7. `prisma generate` + `tsc --noEmit` + `next build` verdes.

## Fase 2 — Zod 3 → 4  [COMPLETADA]
Resultado: `zod@4.4.3`. Sin cambios de codigo (los breaking son backward-compatible:
`z.string().email()`, `z.nativeEnum()`, `{ message }` siguen funcionando). `zodResolver`
de `@hookform/resolvers` 5.4.0 funciona nativo con zod 4. `tsc` + `next build` verdes.
Los breaking son backward-compatible (message, `z.string().email()`, `z.nativeEnum()`
siguen funcionando, solo deprecados). Se moderniza la sintaxis donde sea trivial.

Pasos:
1. Instalar `zod@4`.
2. Verificar los 3 archivos con zod; `@hookform/resolvers` 5.4.0 ya usa `zod/v4/core`.
3. `tsc --noEmit` + `next build` verdes.

## Fase 3 — lucide-react 0 → 1  [COMPLETADA]
Resultado: `lucide-react@1.23.0`. Todos los iconos usados en los 22 archivos siguen
existiendo. `tsc` + `next build` verdes (build con los 3 majors combinados).
Major de la lib de iconos. Verificar que los iconos usados en los 22 archivos sigan
existiendo (renombrados/removidos rompen el import).

Pasos:
1. Instalar `lucide-react@1`.
2. `tsc --noEmit` + `next build` verdes (falla si algún icono ya no existe).

## Fase 4 — Cierre  [COMPLETADA]
1. Se MANTIENEN los ignores del `.github/dependabot.yml` (bloquean solo majors FUTUROS;
   los minor/patch dentro de 7.x/4.x/1.x siguen llegando).
2. Commit en español (PR #22), diff mostrado.
3. PR #22: deploy preview verde + verificado en vivo (200, iconos lucide 1 OK) →
   merge a main → deploy de produccion `success` → sitio en vivo verificado
   (redirects de auth OK, register 200) → 0 errores de runtime en produccion.

## Resultado final
project-manager-app modernizado: Prisma 7 (con adapter PrismaPg + prisma.config.ts),
Zod 4, lucide-react 1. Todo en produccion, sin errores de runtime.

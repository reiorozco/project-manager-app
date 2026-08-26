# 005 — Project Manager: pasada de diseño flagship

**Objetivo:** modernizar la UI de `project-manager-app` a nivel flagship (el proyecto que más
miran reclutadores) sin romper funcionalidad. Skill `impeccable` → aplicar polish con
shadcn/Tailwind respetando el design system → verificar en vivo (Playwright desktop+móvil,
consola, login) → redeploy y confirmar en producción.

- **Repo/clon:** `~/Dev/project-manager-app` (clonado ✔)
- **En vivo:** https://project-manager-app-cyan.vercel.app · auto-deploy en push a `main`
- **Demo:** `manager@demo.com` / `client@demo.com` / `designer@demo.com` — pass `demo1234`
- **Supabase:** ref `hslsqmuhkctcjftwnive` — **NO tocar env ni RLS**. Migración de schema vía
  Supabase MCP `apply_migration` (no toca `.env`).

## Decisiones aprobadas (Rei, 2026-06-26)
1. **Acento:** Indigo/Violet. Aplica a CTAs, nav activa, foco, iconos de stats, badge "In progress".
2. **Estado/lifecycle:** **migración real** — enum `ProjectStatus` + `dueDate` en Prisma + Supabase.
3. **Alcance:** completo **P1 + P2 + P3**.

## Diagnóstico (del critique + lectura del código) — Design Health 27/40
- **Sin identidad / monocromo (P1):** tokens shadcn `neutral` OKLCH grises sin tocar
  (`app/globals.css`), tipografía Geist por defecto, único color real `text-blue-600` (logo)
  y `bg-blue-50`. Mezcla de `text-gray-500/600` hardcodeados vs tokens `text-muted-foreground`,
  y `bg-gray-50 dark:bg-black` en el layout.
- **Layouts vacíos (P1):** `DashboardHeader` es una card `px-12 py-10` para 3 líneas; `QuickActions`
  card grande con 2 botones; `ProjectDetails` con mucho aire y campos sueltos.
- **Falta estado real (P2):** `Project` no tiene `status` ni `dueDate`. `ProjectDetails` rotula
  "Estado" pero solo muestra asignado/sin asignar.
- **Lista sin búsqueda/filtro/orden (P2):** `projects/page.tsx` mapea directo; `EmptyState` plano
  (`text-gray-600`, sin icono/ilustración/CTA real).
- **Micro-interacciones (P3):** `ProjectCard` ya tiene `hover:shadow-md`; faltan press states,
  skeletons coherentes, transiciones, focus-visible con el acento.

**Fortalezas a preservar:** UX de formularios (dropzone + validación inline), responsive,
0 errores de consola, lógica de roles/avatares/storage. No reinventar el design system.

---

## Plan multifase

### Fase 0 — Setup y baseline
- `npm install` + arrancar dev local; confirmar build y login con cuentas demo.
- Capturar baseline con Playwright (desktop + móvil): login, dashboard, lista, detalle, form.
- Invocar skill `impeccable` para guiar el polish.
- **Sin cambios de código.**

### Fase 1 — Identidad visual (P1)  ·  tokens + tipografía + acento
- `app/globals.css`: reasignar `--primary` (y `--ring`, `--sidebar-primary`, charts) a la rampa
  **indigo/violet** en OKLCH, light + dark. Mantener estructura de tokens shadcn (no reinventar).
- Tipografía: conservar Geist para UI/body (perf); afinar escala/pesos/tracking de headings y
  añadir 1 display face para `h1/h2` para romper el look "default Next".
- Sustituir colores hardcodeados (`text-gray-*`, `text-blue-600`, `bg-blue-50`, `bg-gray-50
  dark:bg-black`) por tokens (`muted-foreground`, `primary`, `bg-muted/background`).
- Logo, nav activa y CTAs al acento; `focus-visible` con el acento en toda la app.
- **Verificación:** Playwright desktop+móvil, light+dark, consola limpia.

### Fase 2 — Apretar layouts (P1)
- `DashboardHeader`: compactar (saludo personalizado por rol, sin card gigante vacía).
- `QuickActions` + stats: agrupar; stats con acento e iconografía consistente; jerarquía clara.
- `ProjectDetails`: layout en grid, agrupar metadatos, densidad correcta.
- **Verificación:** Playwright; sin regresiones de responsive.

### Fase 3 — Lifecycle de estado (P2)  ·  migración real
- **Schema** `prisma/schema.prisma`: `enum ProjectStatus { DRAFT IN_PROGRESS REVIEW DONE }`,
  `Project.status ProjectStatus @default(DRAFT)`, `Project.dueDate DateTime?`.
- **Migración Supabase** vía MCP `apply_migration`: `CREATE TYPE`, `ALTER TABLE ... ADD COLUMN`
  con default para filas existentes. **No tocar RLS/env.** `prisma generate` para tipos.
- **Backend:** `projectSchema` (zod) + API routes (`POST`/`PATCH`) + `project-service` admiten
  `status` y `dueDate`.
- **UI:** selector de estado en `ProjectForm`; `<StatusBadge>` (color por estado, "In progress"
  = acento, "Done" = verde) en `ProjectCard` y `ProjectDetails`; due date con formato.
- **Verificación:** crear/editar proyecto end-to-end con cuenta `manager@`; revisar advisors
  Supabase post-migración.

### Fase 4 — Lista: búsqueda/filtro/orden + empty state (P2)
- `projects/page.tsx`: barra con búsqueda (título), filtro por estado, orden (fecha/título/estado).
  Client-side sobre los datos ya cargados por React Query.
- `EmptyState` rediseñado: icono/ilustración, copy con propósito, CTA real según rol; estado
  "sin resultados de búsqueda" diferenciado.
- **Verificación:** Playwright sobre lista con datos demo y vacía.

### Fase 5 — Micro-interacciones y pulido (P3)
- Hover/press en cards y botones, transiciones suaves, `focus-visible` con acento.
- Skeletons coherentes (`ProjectDetailSkeleton`, `LoadingState`, stats) con el nuevo sistema.
- Copy: reemplazar boilerplate ("Bienvenido a Project Manager" / "Panel de gestión...") por
  algo con intención y rol.
- **Verificación:** pasada final Playwright desktop+móvil, light+dark, consola.

### Fase 6 — Deploy y confirmación en vivo
- Commit(s) limpios (sin firmas automáticas) → push a `main` → auto-deploy Vercel.
- Verificar el deploy con Playwright contra la URL de producción (login + flujos clave).
- Confirmar consola limpia y screenshots finales.

---

## Riesgos / notas
- **Migración (Fase 3):** único cambio que toca la DB. Vía Supabase MCP, con default para filas
  existentes; sin tocar RLS ni env. Reversible (drop column/type si hiciera falta).
- **No reinventar** el design system: solo retematizar tokens + densidad + estado.
- Mantener 0 errores de consola y responsive como están (fortalezas del critique).

## Estado de ejecución
- [x] Fase 0 — Setup/baseline (env de Vercel, dev local, baseline Playwright)
- [x] Fase 1 — Identidad (tokens índigo/violeta OKLCH light+dark, tipografía, nav activa, foco)
- [x] Fase 2 — Layouts (dashboard compacto + proyectos recientes, detalle agrupado)
- [x] Fase 3 — Lifecycle/migración (enum ProjectStatus + dueDate vía MCP, StatusBadge, form, CRUD verificado)
- [x] Fase 4 — Lista/empty state (búsqueda + filtro + orden, empty + sin-resultados)
- [x] Fase 5 — Micro-interacciones (press, hover, skeletons, reduced-motion, 0 colores hardcodeados)
- [~] Fase 6 — Deploy (push a main hecho; verificación en vivo en curso)

## Notas técnicas
- Migración aplicada vía Supabase MCP `apply_migration` (sin tocar RLS/env). La historia de
  Prisma Migrate estaba desincronizada (init no registrado en _prisma_migrations), por eso no
  se usó `migrate dev`. Schema.prisma actualizado + migración documentada en prisma/migrations/.
- Bugs corregidos durante QA: caché optimista de React Query tras crear/editar (ahora invalida
  en vez de reconstruir) y desfase de timezone en fechas límite (formateo en UTC).
- Advisors Supabase (preexistentes, NO tocados): RLS sin políticas en Project/File (la app usa
  authz a nivel de aplicación vía Prisma) y leaked-password protection en Auth.

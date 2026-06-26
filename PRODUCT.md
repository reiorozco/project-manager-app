# Product

## Register

product

## Users

Tres roles en un mismo flujo de gestión de proyectos de diseño:
- **Clientes** — crean proyectos y suben briefs/archivos; quieren ver el estado de su encargo de un vistazo.
- **Project Managers** — crean, asignan y supervisan proyectos; necesitan visión de carga y avance.
- **Diseñadores** — reciben proyectos asignados; necesitan saber qué hacer y para cuándo.

Contexto de uso: escritorio y móvil, sesiones cortas y orientadas a tarea (crear, asignar, revisar estado, descargar archivos).

## Product Purpose

App full-stack de gestión de proyectos de diseño con acceso multi-rol, Row-Level Security y almacenamiento de archivos (Next.js + Prisma + Supabase). Existe como **proyecto insignia de portafolio** de Rei Orozco (Full Stack + AI/MCP) — la que más miran reclutadores —, por lo que la UI debe transmitir criterio de producto, no de plantilla. Éxito = un reclutador fluido en buenas herramientas (Linear, Notion, Stripe) confía en la interfaz a primera vista.

## Brand Personality

Competente, nítido, sin ruido. Voz directa en español, etiquetas claras, cero relleno. Producto que "desaparece en la tarea": familiaridad ganada por encima de la sorpresa. Personalidad en 3 palabras: **preciso, confiable, moderno**.

## Anti-references

- El look "shadcn por defecto / AI template": gris neutro monocromo, tokens sin tocar, copy boilerplate ("Bienvenido a…", "Panel de gestión de…").
- Cards idénticas repetidas con icono+título+texto y mucho aire vacío.
- Decoración sin función: motion gratuito, glassmorphism, gradient text, side-stripe borders, eyebrows en mayúsculas sobre cada sección.

## Design Principles

1. **Familiaridad ganada** — afordancias estándar (nav, formularios, badges) que un usuario de Linear/Notion reconoce y confía; no reinventar lo estándar.
2. **El estado es el protagonista** — el ciclo de vida del proyecto (Draft → In progress → Review → Done) es la información primaria; la UI lo hace legible de un vistazo.
3. **Densidad con intención** — apretar layouts vacíos; cada bloque gana su espacio. El aire es ritmo, no relleno.
4. **Una identidad, un acento** — índigo/violeta como único acento (CTAs, foco, estado activo, "In progress"); el resto neutros tematizados. Sin paletas dispersas.
5. **Consistencia sobre sorpresa** — mismo vocabulario visual pantalla a pantalla; el deleite vive en micro-momentos, no en cada página.

## Accessibility & Inclusion

WCAG AA: contraste de cuerpo ≥4.5:1 (sin gris claro sobre tintes), foco visible con el acento, targets táctiles ≥44px, navegación por teclado, `prefers-reduced-motion` respetado. El estado no se comunica solo por color (icono + texto en los badges) para daltonismo.

# Frontend

React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + shadcn/ui.

## Stack

- **Framework**: React 19
- **Language**: TypeScript ~6 (strict)
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS v4 (Vite plugin — no `tailwind.config.js`)
- **UI Components**: shadcn/ui (registry-based, add via `npx shadcn add <component>`)
- **Theme**: Dark/light/system toggle via `ThemeProvider` — press `d` to cycle

## Scripts

```bash
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build
npm run typecheck    # tsc --noEmit (no emit, just type checking)
npm run lint         # ESLint
npm run format       # Prettier (formats *.ts, *.tsx)
npm run preview      # Preview production build
```

## Source Layout

```
src/
├── main.tsx                   # Entry: renders <App> inside <ThemeProvider>
├── App.tsx                    # Root component
├── index.css                  # Global styles, Tailwind directives
└── components/
    ├── theme-provider.tsx     # ThemeProvider + useTheme hook
    └── ui/                    # shadcn/ui primitives (auto-generated, don't hand-edit)
```

## Path Alias

`@/` maps to `src/`. Use it for all internal imports:
```ts
import { Button } from "@/components/ui/button"
```

## Adding shadcn Components

```bash
npx shadcn add <component-name>
# e.g. npx shadcn add dialog
```

Components are added to `src/components/ui/`. Do not manually edit generated files — re-run `add` instead.

## Conventions

- All files are `.tsx` (components) or `.ts` (utilities, hooks, types)
- No `.js` or `.jsx` — TypeScript everywhere
- Keep components small; co-locate related hooks next to the component file
- Use Tailwind utility classes directly; avoid inline `style={}` props
- Prefer named exports; `default export` only for page-level components
- `useTheme()` from `@/components/theme-provider` for theme access

## TypeScript Rules

- Do not use `any` — use `unknown` and narrow, or define proper types
- Prefer `type` over `interface` unless you need declaration merging
- All event handlers and callbacks must be typed

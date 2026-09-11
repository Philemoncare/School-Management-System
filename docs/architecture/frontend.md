# Frontend Architecture

## Stack
- **Next.js 13+ (App Router):** Modern routing and server component support.
- **Tailwind CSS:** Utility-first styling.
- **TypeScript:** Type safety across the UI.

## Structure
- `app/`: Routing and layouts.
- `components/`: Shared UI elements.
- `hooks/`: Custom React hooks for logic.
- `lib/`: API clients and utilities.
- `types/`: Frontend-specific type definitions.

## Authentication
Client-side state managed via React Context/Hooks, synchronized with HttpOnly cookies or JWT in local storage (TBD based on security audit).

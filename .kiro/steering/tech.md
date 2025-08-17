---
inclusion: always
---

# Technology Stack & Development Guidelines

## Core Technologies
- **React 18** with JSX - Use functional components with hooks exclusively
- **Vite** - Build tool and dev server (port 5173)
- **Tailwind CSS** - Utility-first styling with PostCSS processing
- **Headless UI** - Accessible component primitives
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Netlify** - Static hosting with SPA routing

## Code Style & Patterns

### React Conventions
- Use functional components with hooks (no class components)
- Prefer `useCallback` and `useMemo` for performance optimization
- Context providers for global state (Supabase client, modals)
- Custom hooks for data fetching and business logic
- Single-file architecture pattern (all components in App.jsx)

### Styling Guidelines
- Use Tailwind utility classes exclusively
- Responsive design with mobile-first approach
- Consistent spacing using Tailwind's spacing scale
- Dark mode not implemented - stick to light theme

### Data Management
- **Primary**: Supabase client via React Context
- **Fallback**: localStorage when Supabase unavailable
- Always handle offline scenarios gracefully
- Use real-time subscriptions for live data updates

## Environment Setup
```bash
npm install          # Install dependencies
npm run dev          # Development server (localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
```

### Required Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key  
- `VITE_ADMIN_ACCESS_TOKEN` - Manager dashboard access

## Architecture Constraints
- Hash-based routing (not browser history API)
- External Supabase client loaded via CDN script tag
- No build-time dependencies on Supabase SDK
- All business logic contained in single App.jsx file
- Modal state managed through custom ModalContext
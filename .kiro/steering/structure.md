# Project Structure

## Root Directory
```
├── src/                    # Source code
├── .kiro/                  # Kiro AI assistant configuration
├── .vscode/                # VS Code settings
├── .git/                   # Git repository
├── index.html              # Main HTML entry point
├── index.css               # Global CSS styles
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite build configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── netlify.toml            # Netlify deployment configuration
└── README.md               # Project documentation
```

## Source Code Organization
- **src/App.jsx** - Main application component (single-file architecture)
- **src/main.jsx** - React application entry point

## Key Architectural Patterns

### Single-File Component Architecture
The entire application logic is contained in `src/App.jsx` including:
- React components (EmployeeForm, ManagerDashboard, etc.)
- Custom hooks (useSupabase, useFetchSubmissions, useHash)
- Context providers (SupabaseProvider, ModalContext)
- Business logic functions (scoring, validation, data transformation)
- Constants and configuration

### Component Hierarchy
```
App (SupabaseProvider)
├── AppContent (ModalContext.Provider)
    ├── EmployeeForm (when not logged in as manager)
    └── ManagerDashboard (when logged in as manager)
        └── EmployeeReportDashboard (individual employee view)
```

### Data Flow
- Supabase client managed via React Context
- State management using useState and useCallback hooks
- Form data flows through updateCurrentSubmission callback
- Modal state managed through custom ModalContext

## File Naming Conventions
- React components: PascalCase (e.g., `EmployeeForm`)
- Hooks: camelCase with "use" prefix (e.g., `useSupabase`)
- Constants: UPPER_SNAKE_CASE (e.g., `EMPTY_SUBMISSION`)
- Configuration files: lowercase with extensions (e.g., `vite.config.js`)
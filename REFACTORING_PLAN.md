# File Refactoring Plan - Large File Structure Improvement

## Overview
This document outlines the plan to refactor large files (2000+ lines) in the codebase for better maintainability, reusability, and team collaboration.

## Current Large Files Analysis

### 🔴 Critical Priority (2000+ lines)
1. **ClientOnboardingForm.jsx** - 2,965 lines (124KB) - 15-step client onboarding form
2. **EmployeeForm.jsx** - 2,415 lines (108KB) - Employee performance form
3. **EmployeeForm/NewEmployeeForm.jsx** - 1,825 lines (76KB) - Enhanced employee form

### 🟡 High Priority (1000+ lines) 
4. **ManagerDashboard.jsx** - 1,476 lines (72KB) - Management dashboard
5. **kpi.jsx** - 1,432 lines (72KB) - KPI components for multiple services
6. **EmployeeOnboardingForm.jsx** - 1,260 lines (52KB) - Employee onboarding
7. **ui.jsx** - 1,038 lines - Shared UI components

## Refactoring Strategy

### Phase 1: Shared Infrastructure (Week 1)
- [ ] Create shared form hooks and utilities
- [ ] Set up component folder structures
- [ ] Extract common validation logic

### Phase 2: ClientOnboardingForm Split (Week 2)
- [ ] Extract 15 step components
- [ ] Create form state management hooks
- [ ] Implement auto-save functionality
- [ ] Add step navigation logic

### Phase 3: EmployeeForm Ecosystem (Week 3-4)
- [ ] Split EmployeeForm.jsx into steps and hooks
- [ ] Refactor NewEmployeeForm.jsx with shared components
- [ ] Create reusable performance scoring logic
- [ ] Implement draft management system

### Phase 4: Dashboard Components (Week 5)
- [ ] Split ManagerDashboard into views and components
- [ ] Extract KPI components by service type
- [ ] Create data processing hooks
- [ ] Implement export utilities

### Phase 5: Testing & Optimization (Week 6)
- [ ] Unit test all new components
- [ ] Performance testing
- [ ] Bundle size analysis
- [ ] Documentation update

## Expected Benefits

### 📈 Maintainability
- Files reduced from 2000+ lines to 150-300 lines each
- Clear separation of concerns
- Easier debugging and code review

### 🔄 Reusability
- Shared components across similar forms
- Reusable hooks for form state management
- Common validation and persistence logic

### 🚀 Performance
- Better code splitting opportunities
- Improved tree shaking
- Faster build times

### 👥 Team Collaboration
- Multiple developers can work on different components
- Reduced merge conflicts
- Cleaner git history

## Implementation Guidelines

### File Naming Convention
```
ComponentName/
├── index.jsx              # Main component
├── components/            # Sub-components
├── hooks/                 # Custom hooks
├── utils/                 # Utility functions
├── constants/             # Constants and data
└── types/                 # TypeScript types (future)
```

### Component Size Guidelines
- **Main components**: 200-400 lines max
- **Sub-components**: 100-200 lines max
- **Hooks**: 50-150 lines max
- **Utilities**: 50-100 lines max

### State Management
- Use custom hooks for complex state
- Keep form state as close to usage as possible
- Maintain existing auto-save functionality
- Preserve all current APIs

## Migration Strategy

### Backward Compatibility
- Original imports will continue to work
- No breaking changes to parent components
- Gradual migration approach
- Feature flags for testing

### Testing Strategy
- Unit tests for each extracted component
- Integration tests for form flows
- Visual regression testing
- Performance benchmarks

## Progress Tracking

- [ ] **Phase 1**: Shared Infrastructure
- [ ] **Phase 2**: ClientOnboardingForm
- [ ] **Phase 3**: EmployeeForm Ecosystem  
- [ ] **Phase 4**: Dashboard Components
- [ ] **Phase 5**: Testing & Optimization

## Success Metrics

- **File Size**: Reduce largest files by 80%+
- **Build Time**: Improve by 20%+
- **Bundle Size**: Optimize code splitting
- **Developer Experience**: Faster development cycles
- **Test Coverage**: Increase to 80%+

---
*Last Updated: August 25, 2024*
*Status: Planning Phase*
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/__tests__/setup.test.js',
  },
  server: {
    // Handle client-side routing for React Router
    historyApiFallback: {
      index: '/index.html'
    },
    // Custom middleware to handle clean URLs
    middlewareMode: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Dashboard chunks
          'manager-dashboard': [
            './src/components/ManagerDashboard.jsx',
            './src/components/ManagerEditEmployee.jsx'
          ],
          'employee-dashboard': [
            './src/components/EmployeePersonalDashboard.jsx',
            './src/components/NewReportDashboard.jsx'
          ],
          'intern-dashboard': [
            './src/components/InternDashboard.jsx'
          ],
          'agency-dashboard': [
            './src/components/AgencyDashboard.jsx'
          ],
          'forms': [
            './src/components/EmployeeForm.jsx',
            './src/components/EmployeeForm/NewEmployeeForm.jsx'
          ],
          'tools': [
            './src/components/MasterToolsPage.jsx'
          ],
          
          // Feature chunks
          'auth': [
            './src/features/auth/AuthContext.jsx',
            './src/features/auth/UnifiedLoginModal.jsx'
          ],
          'clients': [
            './src/features/clients/components/ClientAdditionForm.jsx',
            './src/features/clients/components/ClientDashboardView.jsx'
          ],
          'employees': [
            './src/features/employees/components/EmployeeSignupForm.jsx',
            './src/features/employees/components/EmployeeExitForm.jsx'
          ],
          
          // Shared utilities
          'shared-ui': [
            './src/shared/components/ui.jsx',
            './src/shared/components/Modal.jsx',
            './src/shared/components/Toast.jsx'
          ],
          'shared-services': [
            './src/shared/services/DataPersistence.js',
            './src/shared/services/ImageUploadService.js'
          ]
        }
      }
    },
    // Increase chunk size warning limit since we're intentionally splitting
    chunkSizeWarningLimit: 1000
  }
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    css: {
      postcss: './postcss.config.js',
      preprocessorOptions: {
        scss: {
          additionalData: `@import "./src/shared/styles/index.css";`
        }
      }
    },
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
      // Proxy API requests to backend server
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false
        }
      }
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


            'auth': [
              './src/features/auth/UnifiedAuthContext.jsx',
              './src/features/auth/LoginForm.jsx'
            ],

          }
        }
      },
      // Increase chunk size warning limit since we're intentionally splitting
      chunkSizeWarningLimit: 1000
    },
    define: {
      // Explicitly define environment variables to ensure they're available in the browser
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
      // VITE_ADMIN_ACCESS_TOKEN removed - should not be exposed in client-side build
    }
  }
})

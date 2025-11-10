import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Important for Electron builds: make asset paths relative when bundling for file://
  base: mode === 'electron' ? './' : undefined,
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: [
        'tailwind.config.ts',
        'postcss.config.js',
        'playwright.config.ts',
        'capacitor.config.ts',
        'eslint.config.js',
        'electron/**',
        'android/**',
        'dist/**',
        'public/**',
        'src/sw.ts',
        // Temporarily exclude large UI pages & layout until page tests exist
  // Reintroduce specific pages we are adding smoke tests for
  // Keep excluding the rest for now
  'src/pages/Dashboard.tsx',
  'src/pages/NovoTicket.tsx',
  'src/pages/FAQ.tsx',
  'src/pages/Relatorios.tsx',
  'src/pages/TodosChamados.tsx',
  'src/pages/PesquisarTickets.tsx',
  'src/pages/EditarTicket.tsx',
  'src/pages/VisualizarTicket.tsx',
  'src/pages/Perfil.tsx',
  'src/pages/Configuracoes.tsx',
  'src/pages/NotFound.tsx',
  // Layout components excluded for now
  'src/components/layout/**',
        'src/components/ui/**',
        'src/App.tsx',
        'src/main.tsx',
        'tests/**',
        'src/**/*.d.ts'
      ],
      thresholds: {
        lines: 40,
        statements: 40,
        branches: 25,
        functions: 40,
      }
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  }
}));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'framer-motion'],
          ui: ['lucide-react', 'clsx', 'tailwind-merge', 'date-fns', 'recharts'],
          supabase: ['@supabase/supabase-js'],
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "framer-motion", "@tanstack/react-query"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-query"],
  },
}));

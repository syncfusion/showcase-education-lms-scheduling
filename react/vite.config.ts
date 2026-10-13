import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served at /education-lms-scheduling/react/.
export default defineConfig({
  base: '/education-lms-scheduling/react/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('ej2-react-ai-assistview') || id.includes('ej2-react-interactive-chat')) return 'aiassist';
          if (id.includes('ej2-react-charts')) return 'charts';
          if (id.includes('ej2-react-schedule')) return 'schedule';
          if (id.includes('ej2-react-gantt')) return 'gantt';
          if (id.includes('ej2-react-filemanager')) return 'filemanager';
          if (id.includes('ej2-react-grids')) return 'grid';
          return undefined;
        }
      }
    }
  }
});
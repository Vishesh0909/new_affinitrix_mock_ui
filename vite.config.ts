import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          executive: path.resolve(__dirname, 'executive.html'),
          landing: path.resolve(__dirname, 'landing.html'),
          list: path.resolve(__dirname, 'list.html'),
          form: path.resolve(__dirname, 'form.html'),
          record: path.resolve(__dirname, 'record.html'),
          approval: path.resolve(__dirname, 'approval.html'),
          portal: path.resolve(__dirname, 'portal.html'),
          report: path.resolve(__dirname, 'report.html'),
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

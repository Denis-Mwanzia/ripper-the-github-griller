import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const projectId = env.VITE_FIREBASE_PROJECT_ID || 'github-griller';
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/billintel': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          rewrite: (path) =>
            `/${projectId}/us-central1/billIntelAnalyzeFunction`,
        },
      },
    },
  };
});

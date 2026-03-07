import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'frontend',
    base: '/ai-news-bot/',
    build: {
        outDir: '../dist',
        emptyOutDir: true
    },
    server: {
        port: 5173,
        open: true,
    },
    publicDir: resolve(__dirname, 'data')
});

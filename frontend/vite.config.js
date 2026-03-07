import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    server: {
        port: 5173,
        open: true,
    },
    publicDir: resolve(__dirname, '../data')
});

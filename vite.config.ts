import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'./',plugins:[react()],build:{outDir:'dist',assetsDir:'',rollupOptions:{input:'source.html',output:{entryFileNames:'app-[hash].js',chunkFileNames:'chunk-[name]-[hash].js',assetFileNames:'[name]-[hash][extname]'}}}});

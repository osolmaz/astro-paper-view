import { defineConfig } from 'astro/config';
export default defineConfig({ vite: { server: { fs: { allow: ['..'] } } } });

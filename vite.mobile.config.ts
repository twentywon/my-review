import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
export default defineConfig({root:fileURLToPath(new URL('./mobile',import.meta.url)),base:'./',plugins:[react()],build:{outDir:'../android/app/src/main/assets/web',emptyOutDir:true,target:'es2020',sourcemap:false}});

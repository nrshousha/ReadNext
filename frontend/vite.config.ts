import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,  // Bind to all interfaces (required for Docker)
        port: 5173,
        strictPort: true,
    },
})

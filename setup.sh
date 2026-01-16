# filename: setup.sh

#!/bin/bash

# 1. Create the main project folder and enter it
mkdir -p signature-seal
cd signature-seal

# 2. Initialize the Root package.json (manages both sides)
echo '{
  "name": "signature-seal-fullstack",
  "version": "1.0.0",
  "scripts": {
    "start": "concurrently \"npm run server\" \"npm run client\"",
    "server": "cd server && npm run dev",
    "client": "cd client && npm run dev",
    "install-all": "npm install && cd server && npm install && cd ../client && npm install"
  },
  "dependencies": {
    "concurrently": "^8.2.0"
  }
}' > package.json

# 3. Create Server (Backend) Structure & Config
mkdir -p server/src
mkdir -p server/prisma

# Server package.json
echo '{
  "name": "server",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "db:push": "npx prisma db push"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "prisma": "^5.1.1",
    "@prisma/client": "^5.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}' > server/package.json

# Create empty files for Server (you will paste code into these)
touch server/src/index.js
touch server/prisma/schema.prisma

# 4. Create Client (Frontend) Structure & Config
mkdir -p client/src
mkdir -p client/public

# Client package.json
echo '{
  "name": "client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1",
    "framer-motion": "^10.15.1",
    "clsx": "^2.0.0",
    "tailwind-merge": "^1.14.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.27",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.5"
  }
}' > client/package.json

# Tailwind Config
echo '/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      colors: {
        "brand-navy": "#2c3e50",
        "brand-navy-dark": "#1d2d3e",
        "brand-teal": "#1abc9c",
        "brand-gold": "#c59d5f",
        "brand-light": "#f8f9f9",
      }
    },
  },
  plugins: [],
}' > client/tailwind.config.js

# PostCSS Config
echo 'export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}' > client/postcss.config.js

# Vite Config (Crucial for Codespaces port mapping)
echo 'import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  }
})' > client/vite.config.js

# Create empty files for Client (you will paste code into these)
touch client/index.html
touch client/src/main.jsx
touch client/src/App.jsx
touch client/src/index.css

echo "✅ Project structure created! Navigate to the 'signature-seal' folder to begin."
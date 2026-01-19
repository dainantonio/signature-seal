#!/bin/bash

echo "🚨 Starting Emergency Fix..."

# 1. Force-Write CLEAN Server package.json
# (This removes any accidental markdown/text)
echo '{
  "name": "server",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "db:push": "npx prisma db push",
    "postinstall": "npx prisma generate"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "prisma": "^5.1.1",
    "@prisma/client": "^5.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}' > server/package.json
echo "✅ Server config sanitized."

# 2. Force-Write CLEAN Client package.json
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
    "tailwind-merge": "^1.14.0",
    "date-fns": "^2.30.0"
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
echo "✅ Client config sanitized."

# 3. Nuclear Clean of Dependencies
echo "🗑️  Deleting corrupt libraries..."
rm -rf node_modules
rm -rf client/node_modules
rm -rf server/node_modules
rm -f package-lock.json
rm -f client/package-lock.json
rm -f server/package-lock.json

# 4. Fresh Install
echo "⬇️  Installing Root..."
npm install

echo "⬇️  Installing Server..."
cd server && npm install
cd ..

echo "⬇️  Installing Client (Fixing Vite)..."
cd client && npm install
cd ..

echo "✅ FIX COMPLETE. You can now run 'npm start'!"
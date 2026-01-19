#!/bin/bash

echo "🛠️  External Consultant: Starting Configuration Overhaul..."

# 1. OVERWRITE Server package.json (The Brain)
# We strip out any potential markdown or comments. This is pure, valid JSON.
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
echo "✅ Server config forced to valid JSON."

# 2. OVERWRITE Root package.json (The Manager)
# CRITICAL CHANGE: We removed "npm run client" from the start script.
# If Railway accidentally runs this root file, it will now ONLY run the server.
echo '{
  "name": "signature-seal-fullstack",
  "version": "1.0.0",
  "scripts": {
    "start": "npm run server",
    "server": "cd server && npm install && npm start",
    "client": "echo 'Skipping client build on backend'",
    "install-all": "npm install && cd server && npm install && cd ../client && npm install"
  },
  "dependencies": {
    "concurrently": "^8.2.0"
  }
}' > package.json
echo "✅ Root config patched (Client script disabled for Backend)."

# 3. OVERWRITE Railway Config
# This reinforces the instruction to use the server folder.
echo '{
  "build": {
    "rootDirectory": "server"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}' > railway.json
echo "✅ Railway config reset."

# 4. Clean up any lingering "Zombie" files
rm -rf node_modules
rm -rf server/node_modules

# 5. Git Force Push
echo "🚀 Pushing fixes to GitHub..."
git add .
git commit -m "Emergency Fix: Sanitize JSON and disable Client run in Root"
git push

echo "---------------------------------------------------"
echo "✅ DONE. Check Railway Dashboard."
echo "If it still fails, go to Railway > Settings > Build"
echo "and manually set Root Directory to: server"
echo "---------------------------------------------------"
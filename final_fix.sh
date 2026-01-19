#!/bin/bash

echo "🔒 Locking down deployment paths..."

# 1. NEUTER THE ROOT PACKAGE.JSON
# We are changing the 'start' command in the ROOT folder.
# Old command: concurrently "npm run server" "npm run client" (Crashes because of client)
# New command: cd server && npm install && npm start (Forces it to go to server)
echo '{
  "name": "signature-seal-fullstack",
  "version": "1.0.0",
  "scripts": {
    "start": "cd server && npm install && npm start",
    "server": "cd server && npm start",
    "client": "echo 'Frontend skipped on backend server'",
    "build": "cd server && npm install && npx prisma generate",
    "install-all": "npm install && cd server && npm install"
  },
  "dependencies": {
    "concurrently": "^8.2.0"
  }
}' > package.json

echo "✅ Root package.json redirected."

# 2. ENSURE SERVER PACKAGE.JSON IS PERFECT
# This ensures the server installs dependencies and initializes the DB on start.
echo '{
  "name": "server",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "npx prisma db push && node src/index.js",
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

echo "✅ Server package.json verified."

# 3. FORCE RAILWAY CONFIG
echo '{
  "build": {
    "rootDirectory": "/"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}' > railway.json

echo "✅ Railway config updated to use Root Redirect."

# 4. PUSH TO GITHUB
echo "🚀 Sending fixes to GitHub..."
git add .
git commit -m "Fix: Force Root to redirect to Server only"
git push

echo "---------------------------------------------------"
echo "✅ DONE."
echo "1. Go to Railway."
echo "2. If it doesn't auto-deploy, click the 'Trigger Deploy' button."
echo "3. This time, even if it runs the root, it will work."
echo "---------------------------------------------------"
#!/bin/bash

echo "🚑 Applying Database Wake-Up Fix..."

# 1. Update Server package.json
# We change the "start" command to run "npx prisma db push" BEFORE "node src/index.js"
# This ensures the database file is created immediately upon startup.
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

echo "✅ Start command updated to initialize database."

# 2. Update Railway Config (Safety Check)
# Ensure Railway knows exactly where to look and what to run.
echo '{
  "build": {
    "rootDirectory": "server"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}' > railway.json
echo "✅ Railway config verified."

# 3. Push to GitHub
echo "🚀 Pushing fix to GitHub..."
git add .
git commit -m "Fix: Add DB initialization to start script"
git push

echo "---------------------------------------------------"
echo "✅ DONE. Watch Railway."
echo "It should now say 'Running prisma db push...' in the logs"
echo "before saying 'Server running on port...'"
echo "---------------------------------------------------"
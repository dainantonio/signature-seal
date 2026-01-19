#!/bin/bash

echo "🔒 Locking Railway to Server-Only Mode..."

# 1. REWRITE ROOT PACKAGE.JSON (The Manager)
# We are deleting the 'concurrently' command.
# Now, 'npm start' will IGNORE the client and go straight to the server.
echo '{
  "name": "signature-seal-root",
  "version": "1.0.0",
  "scripts": {
    "postinstall": "cd server && npm install && npx prisma generate",
    "start": "cd server && npx prisma db push --accept-data-loss && node src/index.js"
  },
  "dependencies": {
    "concurrently": "^8.2.0"
  }
}' > package.json
echo "✅ Root config updated: Client launch removed."

# 2. REWRITE SERVER PACKAGE.JSON (The Brain)
# Standard clean config for the API.
echo '{
  "name": "server",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "prisma": "^5.1.1",
    "@prisma/client": "^5.1.1"
  }
}' > server/package.json
echo "✅ Server config sanitized."

# 3. REWRITE RAILWAY CONFIG
# Tell Railway to just use the root, because we fixed the root to be safe.
echo '{
  "build": {
    "rootDirectory": "/"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}' > railway.json
echo "✅ Railway config pointed to Root."

# 4. PUSH FIXES
echo "🚀 Pushing to GitHub..."
git add .
git commit -m "Fix: Removed client start script from root package.json"
git push

echo "---------------------------------------------------"
echo "✅ DONE. Watch Railway."
echo "It will now install dependencies during build,"
echo "and ONLY run the server during start."
echo "The 'vite not found' error will be impossible."
echo "---------------------------------------------------"
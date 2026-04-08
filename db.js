const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with Service Account
// We assume serviceAccountKey.json is in the root directory.
let db;

try {
  const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
    });
  }
  db = admin.database();
  console.log("🔥 Firebase Admin SDK initialized successfully.");
} catch (err) {
  console.error("❌ Failed to initialize Firebase Admin. Please ensure serviceAccountKey.json exists.");
  console.error(err.message);
  
  // Note: To prevent a hard crash if the key isn't provided right away, we just throw/log.
  // The app will fail during DB operations rather than immediately crashing PM2/Node on boot.
}

module.exports = { db, admin };

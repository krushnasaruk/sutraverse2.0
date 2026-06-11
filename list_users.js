const admin = require('firebase-admin');
const serviceAccount = require('./src/database/config/sutraverse2-firebase-adminsdk-fbsvc-de34e6d305.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

admin.auth().listUsers(100)
  .then((listUsersResult) => {
    listUsersResult.users.forEach((userRecord) => {
      console.log('user', userRecord.toJSON().uid, userRecord.toJSON().email);
    });
    process.exit(0);
  })
  .catch((error) => {
    console.log('Error listing users:', error);
    process.exit(1);
  });

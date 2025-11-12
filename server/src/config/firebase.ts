import admin from "firebase-admin";
import path from "path";

// Load service account key
const serviceAccount = require(path.join(
  __dirname,
  "../../serviceAccountKey.json"
));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();

export const verifyFirebaseToken = async (token: string) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return { success: true, uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    return { success: false, error: "Invalid token" };
  }
};

export default admin;

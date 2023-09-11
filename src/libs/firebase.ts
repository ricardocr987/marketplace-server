import * as admin from 'firebase-admin';
import { config } from '../config';

const serviceAccount: admin.ServiceAccount = {
    projectId: config.FIREBASE_PROJECT_ID,
    clientEmail: config.FIREBASE_EMAIL,
    privateKey: config.FIREBASE_PRIVATE_KEY,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
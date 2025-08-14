import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

admin.initializeApp();

const db = admin.firestore();

type DebugJsonMessageTypes =
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'event'
  | 'command'
  | 'config'
  | 'revision';

type DebugJsonMessage = {
  type: DebugJsonMessageTypes; // * Required; Usually first in a stream
  t?: string; // Additional message typing i.e. device IDs, "WARN", "BSOD", etc.
  timestamp?: number; // ** Suggested; Milliseconds since t=revision sent (or program start)
  msg?: string;
  data?: {
    [key: string]: boolean | number | number[] | string;
    // We'll handle floating-point precision at deserialization time, create a class DebugJsonNumber
  };
  units?: {
    [key: string]: string; // I.e. "temperature": "°C"
  };
};

export const onMessageCreate = functions.database.ref('/messages/{slug}/{messageId}')
  .onCreate(async (snapshot, context) => {
    const messageData = snapshot.val() as DebugJsonMessage;
    const slug = context.params.slug;

    return Promise.all([
      db.collection(slug).add(messageData),
      ...(messageData.data ? (Object.entries(messageData.data).map(([label, val]) => {
        return db.collection(slug).doc('data')
          .set({[label]: admin.firestore.FieldValue.arrayUnion(val)}, {merge: true});
      })) : []),
    ]);
  });

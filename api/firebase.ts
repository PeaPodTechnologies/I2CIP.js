// Imports: Firebase
import { initializeApp } from 'firebase/app';
import {
  getDatabase, 
  ref, 
  push, 
  // set
} from 'firebase/database';
import { DebugJsonMessage } from './types';

// Initialize Firebase
const firebase = initializeApp({
  apiKey: 'AIzaSyAZbEGU0axvTV_cORq59pMCbK0RTm1GZBU',
  authDomain: 'debugjsoniot.firebaseapp.com',
  databaseURL: 'https://debugjsoniot-default-rtdb.firebaseio.com',
  projectId: 'debugjsoniot',
  storageBucket: 'debugjsoniot.firebasestorage.app',
  messagingSenderId: '170374016732',
  appId: '1:170374016732:web:7f67bb8007b4c1d480ce19',
  measurementId: 'G-WRFV5LCYXX'
});

export const database = getDatabase(firebase);

export const pushDebugMessage = (message: DebugJsonMessage, t?: string) => {
  const _r = ref(database, `messages/${t ?? 'default'}`);
  const r = push(_r, message);
  // set(r, message);
};

export const pushDebugMessages = (messages: DebugJsonMessage[], t?: string) => {
  if(messages.length === 0) return;
  const d = messages.reduce((l, msg) => {
    const label = msg.t ?? (t ?? 'default');
    if(!l[label]) l[label] = [];
    l[label].push(msg);
    return l;
  }, {});
  Object.keys(d).forEach(k => {
    const _r = ref(database, `messageBatches/${k}`);
    const r = push(_r, d[k]);
    // set(r, d[k]);
  });
};

export default firebase;
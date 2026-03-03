
'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9Lt714RRUT8O75x-X8pEhI_oFr1Tv3wU",
  authDomain: "lods-app-845f7.firebaseapp.com",
  projectId: "lods-app-845f7",
  storageBucket: "lods-app-845f7.firebasestorage.app",
  messagingSenderId: "319912452042",
  appId: "1:319912452042:web:2268437788befd1fb4f933"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

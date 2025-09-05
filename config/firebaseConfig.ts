// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { Persistence, ReactNativeAsyncStorage, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDr8nUn_8Sn-G0svmeHB-3g2LHsWwoqba4",
  authDomain: "testing-evm.firebaseapp.com",
  projectId: "testing-evm",
  storageBucket: "testing-evm.firebasestorage.app",
  messagingSenderId: "669981118508",
  appId: "1:669981118508:web:c65c3e30b9225232a34189",
  measurementId: "G-RVNKLDCQJ1"
};


const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app);

const db = getFirestore(app);

declare module "firebase/auth" {
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage,
  ): Persistence;
}

export { auth, db };
export default app;
// Note: Ensure that the import paths in other files are updated to match this file's name

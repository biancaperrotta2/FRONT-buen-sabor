import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAj31cO_dE2zRYew7IDfHw0OPGdHK1cr04",
  authDomain: "buen-sabor-28cdb.firebaseapp.com",
  projectId: "buen-sabor-28cdb",
  storageBucket: "buen-sabor-28cdb.firebasestorage.app",
  messagingSenderId: "124249203703",
  appId: "1:124249203703:web:329794be644bdf0e8404f2",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBIQm_Ux_JuO66_C4WNv7FG0Oa8KixMtI0",
  authDomain: "footbet-cda52.firebaseapp.com",
  databaseURL: "https://footbet-cda52-default-rtdb.firebaseio.com",
  projectId: "footbet-cda52",
  storageBucket: "footbet-cda52.firebasestorage.app",
  messagingSenderId: "577865489482",
  appId: "1:577865489482:web:4260f2e8dedfa7d4cd1ab3",
  measurementId: "G-SJPMT1B4RC"
};

export const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);

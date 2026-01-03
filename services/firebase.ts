
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * بيانات المشروع الجديد (almustafa2-48a22)
 */
const firebaseConfig = {
  apiKey: "AIzaSyBNd2HQJD9VVBgjKz8WmaZH_yQXwoeCqKE",
  authDomain: "almustafa2-48a22.firebaseapp.com",
  projectId: "almustafa2-48a22",
  storageBucket: "almustafa2-48a22.firebasestorage.app",
  messagingSenderId: "543703217240",
  appId: "1:543703217240:web:aae2241f8cd9b73c4fc62d",
  measurementId: "G-67FK6F7TKG"
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// تصدير قاعدة البيانات
export const db = getFirestore(app);

// Import and configure the Firebase SDK
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';


const firebaseConfig = {
    apiKey: "AIzaSyAqu-usFbiECu0VqE_z-4GVlkYGfY9PYIo",
    authDomain: "person-detection-9ba5d.firebaseapp.com",
    projectId: "person-detection-9ba5d",
    storageBucket: "person-detection-9ba5d.appspot.com",
    messagingSenderId: "865499889032",
    appId: "1:865499889032:web:e4515efb6f29dd6d1d8e3d"
};

// Initialize Firebase

const firebaseApp = initializeApp(firebaseConfig);
getMessaging(firebaseApp);
console.info('Firebase messaging service worker is set up');



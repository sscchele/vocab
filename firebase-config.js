// Initialize Firebase
const firebaseConfig = {
    // Replace with your Firebase configuration
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Collection references
const wrongAttemptsCollection = db.collection('wrongAttempts');
const starredWordsCollection = db.collection('starredWords');

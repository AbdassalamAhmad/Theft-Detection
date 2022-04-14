const functions = require('firebase-functions');
// Import and initialize the Firebase Admin SDK.
const admin = require('firebase-admin');
import {
    getAuth
  } from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    setDoc,
    updateDoc,
    doc,
    serverTimestamp,
  } from 'firebase/firestore';
  

import {
    getMessaging,
    getToken,
    onMessage
} from 'firebase/messaging';
admin.initializeApp();

// Saves the messaging device token to Cloud Firestore.
async function saveMessagingDeviceToken() {
    try {
        const currentToken = await getToken(getMessaging());
        if (currentToken) {
            console.log('Got FCM device token:', currentToken);
            // Saving the Device Token to Cloud Firestore.
            const tokenRef = doc(getFirestore(), 'users', getAuth().currentUser.uid, currentToken);
            await setDoc(tokenRef, { uid: getAuth().currentUser.uid });

            // This will fire when a message is received while the app is in the foreground.
            // When the app is in the background, firebase-messaging-sw.js will receive the message instead.
            onMessage(getMessaging(), (message) => {
                console.log(
                    'New foreground notification from Firebase Messaging!',
                    message.notification
                );
            });
        } else {
            // Need to request permissions to show notifications.
            requestNotificationsPermissions();
        }
    } catch (error) {
        console.error('Unable to get messaging token.', error);
    };
}


// Requests permissions to show notifications.
async function requestNotificationsPermissions() {
    console.log('Requesting notifications permission...');
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
        console.log('Notification permission granted.');
        // Notification permission granted.
        await saveMessagingDeviceToken();
    } else {
        console.log('Unable to get permission to notify.');
    }
}


// Sends a notifications to the user when a new detection happened.
exports.sendNotifications = functions.firestore.document('users/{userId}/events/{eventId}').onCreate(
    async (snapshot, context) => {
        // try this
        console.log(snapshot);
        console.log(context);
        // Notification details.
        // const text = snapshot.data().text;
        const payload = {
            notification: {
                //title: `${snapshot.data().name} posted ${text ? 'a message' : 'an image'}`,
                title: 'Person Detected Now',
                //body: text ? (text.length <= 100 ? text : text.substring(0, 97) + '...') : '',
                body: 'tap here to check it out!',
                //icon: snapshot.data().profilePicUrl || '/images/profile_placeholder.png',
                icon: 'https://cdn4.iconfinder.com/data/icons/google-i-o-2016/512/google_firebase-2-512.png',
                // TRY THIS IMPORTANT: Use ` instead of this ' in icon
                //click_action: `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com`,
                click_action: `https://abdassalamahmad.github.io/Theft-Detection/showimages.html`,
            }
        };

        // Get the list of device tokens.
        // const allTokens = await admin.firestore().collection('fcmTokens').get();
        const oneToken = await admin.firestore().doc(`users/${context.params.userId}`).get();
        if (!oneToken.exists || !oneToken.data().token) {
            console.log(`No token found for user ${context.params.userId}`);
        }
        const user_token = oneToken.data().token;
        //const tokens = [];
        //oneToken.forEach((tokenDoc) => {
        //    tokens.push(tokenDoc.id);
        //});


        //if (tokens.length > 0)
        if (user_token) {
            // Send notifications to all tokens.
            const response = await admin.messaging().sendToDevice(user_token, payload);
            await cleanupTokens(response, user_token);
            functions.logger.log('Notifications have been sent and tokens cleaned up.');
        }
    });



// Cleans up the tokens that are no longer valid.
function cleanupTokens(response, user_token) {
    // For each notification we check if there was an error.
    const tokensDelete = [];
    response.results.forEach((result) => {
        const error = result.error;
        if (error) {
            functions.logger.error('Failure sending notification to', user_token, error);
            // Cleanup the tokens that are not registered anymore.
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                const deleteTask = admin.firestore().doc(`users/${context.params.userId}`).doc(user_token).delete();
                tokensDelete.push(deleteTask);
            }
        }
    });
    return Promise.all(tokensDelete);
}
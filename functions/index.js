const functions = require('firebase-functions');
// Import and initialize the Firebase Admin SDK.
const admin = require('firebase-admin');
admin.initializeApp();


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
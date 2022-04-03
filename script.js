/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/********************************************************************
 * Demo created by Jason Mayes 2020.
 *
 * Got questions? Reach out to me on social:
 * Twitter: @jason_mayes
 * LinkedIn: https://www.linkedin.com/in/creativetech
 ********************************************************************/

//const VIDEO = document.getElementById('webcam');
const CANVAS = document.createElement('canvas');
const CTX = CANVAS.getContext('2d');
const demosSection = document.getElementById('demos');
const db = firebase.firestore();
const storage = firebase.storage();
var model = undefined;



const auth = firebase.auth();

//signup function
function signUp() {
    var email = document.getElementById("email");
    var password = document.getElementById("password");

    const promise = auth.createUserWithEmailAndPassword(email.value, password.value);
    //
    promise.catch(e => alert(e.message));
    alert("SignUp Successfully");
}

//signIN function
function signIn() {
    var email = document.getElementById("email");
    var password = document.getElementById("password");
    const promise = auth.signInWithEmailAndPassword(email.value, password.value);
    promise.catch(e => alert(e.message));
    console.log("Signed In Successfully")
}





// Before we do anything, we need to load the model and log in.
function checkReady() {
    if (firebase.auth().currentUser) {
        console.log("Model loaded, user logged in. Ready to go");
        // Show demo section now model is ready to use.
    }
}

// Check if the user is logged in (and wait if they're not)
firebase.auth().onAuthStateChanged((user) => {
    checkReady();
});




// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
cocoSsd.load().then(function (loadedModel) {
    model = loadedModel;
    checkReady();
    // Show demo section now model is ready to use.
    demosSection.classList.remove('invisible');
});


/********************************************************************
// Demo 1: Grab a bunch of images from the page and classify them
// upon click.
********************************************************************/

// In this demo, we have put all our clickable images in divs with the 
// CSS class 'classifyOnClick'. Lets get all the elements that have
// this class.
const imageContainers = document.getElementsByClassName('classifyOnClick');

// Now let's go through all of these and add a click event listener.
for (let i = 0; i < imageContainers.length; i++) {
    // Add event listener to the child element whichis the img element.
    imageContainers[i].children[0].addEventListener('click', handleClick);
}

// When an image is clicked, let's classify it and display results!
function handleClick(event) {
    if (!model) {
        console.log('Wait for model to load before clicking!');
        return;
    }

    // We can call model.classify as many times as we like with
    // different image data each time. This returns a promise
    // which we wait to complete and then call a function to
    // print out the results of the prediction.
    model.detect(event.target).then(function (predictions) {
        // Lets write the predictions to a new paragraph element and
        // add it to the DOM.
        console.log(predictions);

        for (let n = 0; n < predictions.length; n++) {
            // Description text
            const p = document.createElement('p');
            p.innerText = predictions[n].class + ' - with '
                + Math.round(parseFloat(predictions[n].score) * 100)
                + '% confidence.';
            // Positioned at the top left of the bounding box.
            // Height is whatever the text takes up.
            // Width subtracts text padding in CSS so fits perfectly.
            p.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
                'top: ' + predictions[n].bbox[1] + 'px; ' +
                'width: ' + (predictions[n].bbox[2] - 10) + 'px;';

            const highlighter = document.createElement('div');
            highlighter.setAttribute('class', 'highlighter');
            highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
                'top: ' + predictions[n].bbox[1] + 'px;' +
                'width: ' + predictions[n].bbox[2] + 'px;' +
                'height: ' + predictions[n].bbox[3] + 'px;';

            event.target.parentNode.appendChild(highlighter);
            event.target.parentNode.appendChild(p);



        }
    });
}

console.log("Getting data")





var docRef = db.collection("users").doc("aqPNEN79hPbg2VwFYksBdr4mNff2").collection("events").doc("1648900639100");
docRef.get().then((doc) => {
    if (doc.exists) {
        console.log("Document data:", doc.data());
    } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
    }
}).catch((error) => {
    console.log("Error getting document:", error);
});


/********************************************************************
// Demo 2: Continuously grab image from webcam stream and classify it.
// Note: You must access the demo on https for this to work:
// https://tensorflow-js-image-classification.glitch.me/
********************************************************************/

const MIN_ALERT_COOLDOWN_TIME = 2;
var foundMonitoredObjects = [];
const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
var sendAlerts = true;
// Check if webcam access is supported.
function hasGetUserMedia() {
    return !!(navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia);
}

// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
var children = [];


// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    const enableWebcamButton = document.getElementById('webcamButton');
    enableWebcamButton.addEventListener('click', enableCam);
} else {
    console.warn('getUserMedia() is not supported by your browser');
}


// Enable the live webcam view and start classification.
function enableCam(event) {
    if (!model) {
        console.log('Wait! Model not loaded yet.')
        return;
    }

    // Hide the button.
    event.target.classList.add('removed');

    // getUsermedia parameters.
    const constraints = {
        video: true
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        video.addEventListener('loadeddata', function () {
            recalculateVideoScale();
            predictWebcam();
        });
    });

}


// Prediction loop!
function predictWebcam() {
    // Now let's start classifying the stream.
    model.detect(video).then(function (predictions) {
        // Remove any highlighting we did previous frame.
        //console.log(predictions)
        for (let i = 0; i < children.length; i++) {
            liveView.removeChild(children[i]);
        }
        children.splice(0);

        // Now lets loop through predictions and draw them to the live view if
        // they have a high confidence score.
        for (let n = 0; n < predictions.length; n++) {
            if (predictions[n].class == "person") {

                // If we are over 66% sure we are sure we classified it right, draw it!
                if (predictions[n].score > 0.66) {
                    renderFoundObject(predictions[n])

                    if (sendAlerts) {
                        sendAlerts = false;
                        foundMonitoredObjects.push(predictions[n]);
                        sendAlert(predictions[n]);
                        setTimeout(cooldown, MIN_ALERT_COOLDOWN_TIME * 1000);
                    }

                }
            }
        }

        // Call this function again to keep predicting when the browser is ready.
        window.requestAnimationFrame(predictWebcam);
    });
}
function recalculateVideoScale() {
    ratioY = video.clientHeight / video.videoHeight;
    ratioX = video.clientWidth / video.videoWidth;
    CANVAS.width = video.videoWidth;
    CANVAS.height = video.videoHeight;
}


function renderFoundObject(prediction) {
    const p = document.createElement('p');
    p.innerText =
        prediction.class +
        ' - with ' +
        Math.round(parseFloat(prediction.score) * 100) +
        '% confidence.';
    // Draw in top left of bounding box outline.
    p.style =
        'left: ' +
        prediction.bbox[0] * ratioX +
        'px;' +
        'top: ' +
        prediction.bbox[1] * ratioY +
        'px;' +
        'width: ' +
        (prediction.bbox[2] * ratioX - 10) +
        'px;';

    // Draw the actual bounding box.
    const highlighter = document.createElement('div');
    highlighter.setAttribute('class', 'highlighter');
    highlighter.style =
        'left: ' +
        prediction.bbox[0] * ratioX +
        'px; top: ' +
        prediction.bbox[1] * ratioY +
        'px; width: ' +
        prediction.bbox[2] * ratioX +
        'px; height: ' +
        prediction.bbox[3] * ratioY +
        'px;';

    liveView.appendChild(highlighter);
    liveView.appendChild(p);

    // Store drawn objects in memory so we can delete them next time around.
    children.push(highlighter);
    children.push(p);
}


async function logToFirestore(blob, detectionEvent) {
    console.log("send to firebase initited")
    const uid = firebase.auth().currentUser.uid;
    console.log(uid);
    const imgId = detectionEvent.dateTime.toString();
    const imgRef = storage.ref().child(`users/${uid}/${imgId}.png`);
    //const imgRef = storage.ref().child(`users/${imgId}.png`);
    await imgRef.put(blob);
    detectionEvent.img = `users/${uid}/${imgId}.png`;
    //detectionEvent.img = `users/${imgId}.png`;
    await db.collection("users").doc(uid).collection("events").doc(imgId).set(detectionEvent);
    //await db.collection("events").doc(imgId).set(detectionEvent);
}





function sendAlert(foundMonitoredObjects) {
    var detectionEvent = {};
    // Epoch of detection time.
    detectionEvent.dateTime = Date.now();

    detectionEvent.eventData = [];

    var event = {};
    event.eventType = foundMonitoredObjects.class;
    event.score = foundMonitoredObjects.score;
    event.x1 = foundMonitoredObjects.bbox[0] / video.videoWidth;
    event.y1 = foundMonitoredObjects.bbox[1] / video.videoHeight;
    event.width = foundMonitoredObjects.bbox[2] / video.videoWidth;
    event.height = foundMonitoredObjects.bbox[3] / video.videoHeight;



    console.log(event, "this is the EVENT")
    detectionEvent.eventData.push(event);

    // Draw a frame from video to in memory canvas!
    CTX.drawImage(video, 0, 0);
    //document.body.appendChild(CANVAS);
    // Get image from canvas as blob.
    CANVAS.toBlob(function (blob) {
        logToFirestore(blob, detectionEvent).then(() => {
            console.log("Logged");
        }).catch((err) => {
            console.log(`Error writing to firestore ${err.message}`);
        })
    }, 'image/png');
}

function cooldown() {
    sendAlerts = true;
}
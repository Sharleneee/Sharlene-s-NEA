let ws = new WebSocket("ws://localhost:8080");
        
const eyes = ["eyes_1.png", "eyes_2.png", "eyes_3.png"];
const mouths = ["mouth_1.png", "mouth_2.png", "mouth_3.png", "mouth_4.png"];
const bodies = ["body_1.png", "body_2.png", "body_3.png", "body_4.png", "body_5.png", "body_6.png"];
let iconObject = {
    eyeStyle: "eyes_1.png",
    mouthStyle: "mouth_1.png",
    bodyStyle: "body_1.png"
}


/*The below functions change the picture between the arrows in the customise icon box*/

function findInStyleList(source,styleList){
    for(let i=0; i<styleList.length; i++){
        if(source === styleList[i]){
            return i;
        }
    }
    return -1; // if not found, -1 is returned
}

function traverse(currentPosition, direction, iconStyles){ // for moving along the circular queues for each of the icon styles 
    const queueLength = iconStyles.length;
    if(direction === "left"){
        if(currentPosition===0){
            return queueLength-1; // moves pointer to the end of the queue
        }
        return currentPosition -1; // decrements pointer

    }
    else if(direction === "right"){
        if(currentPosition === queueLength-1){
            return 0; // moves pointer back to start
        }
        return currentPosition +1; // increments pointer
                
    }
}

function changeStyle(direction, style){
    let currentImageSource = document.getElementById(style).src;
    const currentImageSourceRoot = "https://d2lawzz4zy243q.cloudfront.net/";
    let currentImageSourceFile = null;
    styleList = null;
    //setting styleList variable in terms of which style it is
    //and setting the image source root and source file name variables
    if(style==="eyeStyle"){ 
        styleList = eyes;
        currentImageSourceFile = currentImageSource.substring(currentImageSource.length - 10,currentImageSource.length);
    }
    else if(style === "mouthStyle"){
        styleList = mouths;
        currentImageSourceFile = currentImageSource.substring(currentImageSource.length - 11,currentImageSource.length);
    }
    else{ //for body style
        styleList = bodies;
        currentImageSourceFile = currentImageSource.substring(currentImageSource.length - 10,currentImageSource.length);
    }
    let position = findInStyleList(currentImageSourceFile, styleList);

    if(position >=0){
        position = traverse(position, direction, styleList);
        const newSource =  styleList[position];
        document.getElementById(style).src = currentImageSourceRoot + newSource;
        iconObject[style] = newSource; // changes the style property of the icon object to the new property.
    }
    else{
        console.log("Image index in eyes array not valid, it is less than 0."); // shows error if eyePosition is <0
    }
}

function leftEyes() {
    changeStyle("left", "eyeStyle");
}

function rightEyes() {
    changeStyle("right", "eyeStyle");
}

function leftMouth() {
    changeStyle("left", "mouthStyle");
}

function rightMouth() {
    changeStyle("right", "mouthStyle");
}

function leftBody() {
    changeStyle("left", "bodyStyle");
}

function rightBody() {
    changeStyle("right", "bodyStyle");
}

function getIconObject(){
    // returns the image sources for all the icon parts
    return iconObject;
}

        
/*The below functions are for the play game and play private game buttons*/


function createGuid() {
const firstPart = Math.floor(Math.random() * Math.pow(16,8)).toString(16);
const secondPart = Math.floor(Math.random() * Math.pow(16,4)).toString(16);
const thirdPart = Math.floor(Math.random() * Math.pow(16,4)).toString(16);
const fourthPart = Math.floor(Math.random() * Math.pow(16,4)).toString(16);
const fifthPart = Math.floor(Math.random() * Math.pow(16,12)).toString(16);
const guid = firstPart + '-' + secondPart + '-' + thirdPart + '-' + fourthPart + '-' + fifthPart
return guid;
}

function createPrivateGame(){
    const clientID = sessionStorage.getItem("clientID");
    const playerName = document.getElementById("nameBox").value;
    sessionStorage.setItem("playerName", playerName); // setting their name into session storage
    if(ws.readyState === 1){
        ws.send(JSON.stringify({
        method: "createPrivateGame",
        clientID: clientID,
        playerName: playerName,
        iconObject: getIconObject(),
        host: clientID
        }));
        sessionStorage.setItem("isHost", JSON.stringify({
            isHost: true
        }));
    }
            
}
        
function playPublicGame() {
    const playerName = document.getElementById("nameBox").value;
    sessionStorage.setItem("playerName", playerName); // setting their name into session storage

    sessionStorage.setItem("playerName", document.getElementById("nameBox").value); // setting their name into session storage
}

function joinWithCode(){ // 
    const playerName = document.getElementById("nameBox").value;
    sessionStorage.setItem("playerName", playerName); // setting their name into session storage
    const clientID = sessionStorage.getItem("clientID");
    let joinWithCodeBox = document.getElementById("joinWithCodeBox");
    const joinCode = joinWithCodeBox.value;
    
    //anyone who joins a game is not the host
    sessionStorage.setItem("isHost", JSON.stringify({
        isHost: false
    }));

    if(joinCode === ""){
        alert("Error. No code entered.");
    }
    else{
        ws.send(JSON.stringify({
            method: "joinPrivateGame",
            clientID: clientID,
            playerName: playerName,
            iconObject: getIconObject(),
            gameID: joinCode
        }));
        joinWithCodeBox.value = "";
    }
}



ws.onopen = () => {
    ws.send("Connection opened");
}

ws.onmessage = message => {
    // setting the session storage attributes of clientID and game
    console.log(`Received: ${message.data}`);
    const msg = JSON.parse(message.data);
    if(msg.method === "connect"){
        const clientID = msg.clientID;
        sessionStorage.setItem("clientID", clientID);
    }
    if(msg.method === "createPrivateGame"){
        sessionStorage.setItem("gameID", msg.gameID);
        console.log("game ID set: " + msg.gameID);
        window.location.href = "lobby.html";
    }
    if(msg.method === "joinPrivateGame"){
        if(msg.result === "success"){
            sessionStorage.setItem("gameID", msg.gameID);
            window.location.href = "lobby.html";
        }
        else if(msg.result === "fail"){
            const errorMessage = "Error. " + msg.reason;
            alert(errorMessage);
        }
        
    }
}

ws.onclose = event => {
    console.log("Error occurred.");
    alert(event);
}

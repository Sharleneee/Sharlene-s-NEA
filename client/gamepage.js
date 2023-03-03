// const { text } = require("express");

let ws = new WebSocket("ws://localhost:8080");

const oldClientID = sessionStorage.getItem("clientID");
let clientID = null;
const gameID = sessionStorage.getItem("gameID");
const playerName = sessionStorage.getItem("playerName");
let isHost = JSON.parse(sessionStorage.getItem("isHost")).isHost;
let isDrawer = false;
let gameSettings = null;
let timer = null;
let isRoundOver = false;

ws.onmessage = message => {
    const msg = JSON.parse(message.data);
    console.log(`We received a message from server ${message.data}`);

    if (msg.method === "connect") {
        // assigning client ID to clientID variable
        clientID = msg.clientID;
        // changing the old clientID in sessionStorage to the new clientID
        sessionStorage.setItem("clientID", clientID);
        if (ws.readyState === 1) {
            // this method requests to update this client's information on the server
            ws.send(JSON.stringify({
                method: "updateClientIDGamepage",
                gameID: gameID,
                oldClientID: oldClientID,
                clientID: clientID
            }));
        }

    }

    if (msg.method === "startMiniRound") {
        // game settings is not empty on the first round
        if (msg.gameSettings.length > 0) {
            gameSettings = msg.gameSettings;
            // only has numRounds and roundLength

            // change numrounds display
            document.getElementById("numRounds").innerHTML = gameSettings.numRounds;
        }



        if (msg.isDrawer === true) {
            isDrawer = true;
            prepareDrawer(msg.threeWords, msg.chooseWordBy);
        }
        else {
            prepareGuesser();
        }
    }

    if (msg.method === "sendWordChosen") {
        sendWordChosen();

    }

    if (msg.method === "startPlaying") {
        const wordChosen = msg.wordChosen;
        const roundFinishTime = msg.roundFinishTime;
        startCountdown(roundFinishTime, "round");

        //changes round number on display
        document.getElementById("roundNumber").innerHTML = msg.roundNumber;

        if (isDrawer) {
            startDrawerPlaying(wordChosen);
        }
        else {
            startGuesserPlaying(wordChosen.length);
        }

    }

    /*
    if(msg.method === "checkIfRoundOver"){
        isRoundOver = msg.isRoundOver;
    }
    */

    if (msg.method === "roundOver") {
        const playersAndScores = msg.playersAndScores;
        updateLeaderboard(playersAndScores);
        displayRoundOver(playersAndScores);
        if (isDrawer) {
            clearInterval(timer);
            timer = undefined;
            isDrawer = false;
            // removing event listeners so they can no longer draw
            c.removeEventListener("mousedown", startdraw);
            c.removeEventListener("touchstart", startdraw);

            c.removeEventListener("mousemove", moveDraw);
            c.removeEventListener("touchmove", moveDraw);

            c.removeEventListener("mouseup", endDraw);
            c.removeEventListener("touchend", endDraw);

            const tools = document.getElementById("toolbox").childNodes;
            for (let i = 0; i < tools.length; i++) {
                tools[i].hidden = true;
            }
            document.getElementById("timer").setAttribute("hidden", "true");
        }
        document.getElementById("wordToGuess").innerHTML = "";
    }

    if (msg.method === "startDraw") {
        displayStartdraw(msg.buttonSelected, msg.penColour, msg.penSize, msg.xCoord, msg.yCoord);
    }

    if (msg.method === "moveDraw") {
        displayMoveDraw(msg.xCoord, msg.yCoord);
    }

    if (msg.method === "endDraw") {
        displayEndDraw();
    }

    if (msg.method === "clearCanvas") {
        displayClearCanvas();
    }

    if (msg.method === "fillCanvas") {
        displayFill(msg.penColour);
    }

    if (msg.method === "redoDraw") {
        displayRedo();
    }

    if (msg.method === "undoDraw") {
        displayUndo();
    }

    if (msg.method === "message") {
        displayMessage(msg);
    }

    if (msg.method === "correctGuess") {
        displayCorrectGuessMessage();
    }


}


// clicking enter also presses button
/*document.getElementById("messageBox").addEventListener("keypress", function (event) {
    if (event.key === "Enter") { 
        document.getElementById("sendButton").click();
    }
});*/

// sendMessageToServer() called when send message button is clicked
function sendMessageToServer() {
    const messageBox = document.getElementById("messageBox");
    const message = messageBox.value;

    if (message === "") {
        alert("Error. Cannot send empty messages.");
    }
    else {
        const messageObj = {
            method: "message",
            messageContent: message,
            gameID: gameID,
            clientID: clientID
        };
        if (ws.readyState === 1) {
            ws.send(JSON.stringify(messageObj));
        }

        //displayMessage(messageObj);
        messageBox.value = "";
    }
}

// checking if enter key is pressed in the message box
/*function checkIfEnterPressed(event){
    if(event.keyCode === 13){
        document.getElementById("sendButton").click();
    }
}
*/

// takes message object as parameter
function displayMessage(message) {
    const content = message.messageContent;
    const chat = document.getElementById("chat");

    const newDivElement = document.createElement("div");
    newDivElement.style.backgroundColor = "#a7d1ac";
    newDivElement.style.outlineColor = "#2b8235";
    newDivElement.style.outlineStyle = "solid";
    newDivElement.style.outlineWidth = "1px";
    newDivElement.style.borderRadius = "2px";
    newDivElement.style.margin = "6px";

    // for css : message.style.marginTop = "4px";
    // for css : sendButton.style.marginTop = "4px";

    const newPElement = document.createElement("p"); //making a new paragraph element
    newPElement.style.margin = "2px";

    const node = document.createTextNode(message.messageSentBy + ": " + content);
    newPElement.appendChild(node); // inserting the text into the paragraph element
    newDivElement.appendChild(newPElement); // inserting the paragraph into the new div element
    chat.appendChild(newDivElement); // inserting the div element into the chat div
}

function displayCorrectGuessMessage() {
    const chat = document.getElementById("chat");

    const newDivElement = document.createElement("div");
    newDivElement.style.backgroundColor = "#a7d1ac";
    newDivElement.style.outlineColor = "#2b8235";
    newDivElement.style.outlineStyle = "solid";
    newDivElement.style.outlineWidth = "1px";
    newDivElement.style.borderRadius = "2px";
    newDivElement.style.margin = "6px";

    // for css : message.style.marginTop = "4px";
    // for css : sendButton.style.marginTop = "4px";

    const newPElement = document.createElement("p"); //making a new paragraph element
    newPElement.style.margin = "2px";

    const node = document.createTextNode("You have guessed correctly!");
    newPElement.appendChild(node); // inserting the text into the paragraph element
    newDivElement.appendChild(newPElement); // inserting the paragraph into the new div element
    chat.appendChild(newDivElement); // inserting the div element into the chat div
}

/////////////////////////////////////////////////////////////////////////////////

function startCountdown(endTime, countdownType) {
    timer = setInterval(function () {
        if (timer !== undefined) {
            updateCountdown(endTime, countdownType);
        }
    }, 1000);
}

function updateCountdown(endTime) {
    /*
    const now = new Date().getTime();
    const difference = endTime - now; // differrence is in milliseconds
    const secondsLeft = Math.floor((distance % (1000 * 60)) / 1000);
    */
    const now = Date.now();
    const difference = endTime - now;
    const secondsLeft = Math.floor(difference / 1000);

    document.getElementById("countdown").innerHTML = secondsLeft;
    if (difference <= 0) {
        document.getElementById("countdown").innerHTML = "";
    }
}

// this function accepts 0 or 1 parameters
function sendWordChosen(event) {
    clearInterval(timer);
    timer = undefined;
    let wordChosen = "";
    if (arguments.length === 0) {
        // drawer didn't choose word in time so empty string send so server chooses first one as default
    }
    else if (arguments.length === 1) {
        // a parameter is sent
        wordChosen = arguments[0];
    }
    else {
        // the empty string will be sent if  more than 1 parameters are taken
        console.log("Error. Can't take more than 1 parameters.");
    }
    if (ws.readyState === 1) {
        ws.send(JSON.stringify({
            method: "wordChosen",
            wordChosen: wordChosen,
            gameID: gameID,
            clientID: clientID
        }));
    }
    if (isDrawer) {
        document.getElementById("threeButtonsContainer").hidden = true;
    }
}
// can take one string or a list of strings
function createInfoBoard(text) {
    /*
    const newDiv = document.createElement("div");
    newDiv.setAttribute("class", "stackTop");
    newDiv.setAttribute("id", "infoBoard");
    newDiv.innerHTML = text;

    cContainer.appendChild(newDiv);
    */
    /*
     ctx.globalAlpha = 0.7;
     ctx.fillStyle = "white";
     ctx.fillRect(0, 0, canvasWidth, canvasHeight);
     ctx.globalAlpha = 1;
     */

    const fontSize = "20px";

    ctx.font = fontSize + " Arial";
    ctx.textAlign = "center";

    // arguments is a list of the parameters
    if (arguments.length === 1) {
        // if text is just a string
        if (typeof text === "string") {
            ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);
        }
        // if text is not a string, so an array 
        else {
            let rowCounter = 5;
            arguments[0].forEach(eachText => {
                ctx.fillText(eachText, canvasWidth / 2, rowCounter);
                rowCounter += fontSize;
            })
        }
    }
    else {
        console.log("Error. Too many parameters");
    }

}

function add3buttons(threeWords) {
    for (let i = 0; i < 3; i++) {
        const btnID = "btn" + (i + 1).toString();
        const button = document.getElementById(btnID);
        button.innerHTML = threeWords[i];

        button.hidden = false;
    }
}

//initalising variables
function prepareDrawer(threeWords, endTime) {
    startCountdown(endTime, "chooseWord");

    createInfoBoard("Choose a word to draw...");

    add3buttons(threeWords);

    const tools = document.getElementById("toolbox").childNodes;
    for (let i = 0; i < tools.length; i++) {
        tools[i].hidden = false;
    }
}

// makes all the drawing tools hidden and makes a screen show up saying the drawer is choosing a word
function prepareGuesser() {
    const tools = document.getElementById("toolbox").childNodes;
    for (let i = 0; i < tools.length; i++) {
        tools[i].hidden = true;
    }
    document.getElementById("timer").setAttribute("hidden", "true");

    createInfoBoard("Drawer is choosing word...");

}

function generateHiddenWord(wordChosenLength) {
    let hiddenWord = "";
    for (let i = 0; i < wordChosenLength; i++) {
        hiddenWord += "_ ";
    }
    return hiddenWord;
}

function startGuesserPlaying(wordChosenLength) {
    document.getElementById("timer").setAttribute("hidden", "false");
    document.getElementById("wordToGuess").innerHTML = generateHiddenWord(wordChosenLength);

    clearCanvas();
}

function startDrawerPlaying(wordChosen) {
    document.getElementById("wordToGuess").innerHTML = wordChosen;

    clearCanvas();

    // adding event listeners to allow them to draw
    c.addEventListener("mousedown", startdraw);
    c.addEventListener("touchstart", startdraw);

    c.addEventListener("mousemove", moveDraw);
    c.addEventListener("touchmove", moveDraw);

    c.addEventListener("mouseup", endDraw);
    c.addEventListener("touchend", endDraw);


}
/*
function checkIfRoundOver(){
    if(ws.readyState === 1){
        ws.send(JSON.stringify({
            method: "checkIfRoundOver",
            gameID: gameID
        }));
    }
}
*/


// sorts to descending order
function sortLeaderBoardList(leaderboard) {
    for (let i = 0; i < leaderboard.length; i++) {
        let swapped = false;
        for (let j = 0; j < leaderboard.length - i - 1; j++) {
            if (leaderboard[i].playerScore < leaderboard[i + 1].playerScore) {
                const temp = leaderboard[i];
                leaderboard[i] = leaderboard[i + 1];
                leaderboard[i + 1] = temp;
                swapped = true;
            }
        }
        if (!swapped) {
            break;
        }
    }
}

// sorts and displays leaderboard
function updateLeaderboard(playersAndScores) {
    const leaderboard = document.getElementById("leaderboard");
    sortLeaderBoardList(playersAndScores);
    leaderboard.innerHTML = "";
    playersAndScores.forEach(eachPlayer => {
        let iconNode = document.createElement("div");
        iconNode.setAttribute("height", "250px");
        iconNode.setAttribute("width", "250px");
        iconNode.setAttribute("class", "iconPart");
        iconNode.innerHTML = eachPlayer.playerName + ": " + eachPlayer.playerScore + "pts";

        const imageRoot = "https://d2lawzz4zy243q.cloudfront.net/";

        let bodyStyle = document.createElement("img");
        bodyStyle.setAttribute("src", imageRoot + eachPlayer.iconObject.bodyStyle);
        bodyStyle.setAttribute("height", "170px");
        bodyStyle.setAttribute("width", "230px");
        bodyStyle.setAttribute("id", "bodyStyle");
        iconNode.appendChild(bodyStyle);

        let eyeStyle = document.createElement("img");
        eyeStyle.setAttribute("src", imageRoot + eachPlayer.iconObject.eyeStyle);
        eyeStyle.setAttribute("height", "70px");
        eyeStyle.setAttribute("width", "140px");
        eyeStyle.setAttribute("id", "eyeStyle");
        iconNode.appendChild(eyeStyle);

        let mouthStyle = document.createElement("img");
        mouthStyle.setAttribute("src", imageRoot + eachPlayer.iconObject.mouthStyle);
        mouthStyle.setAttribute("height", "30px");
        mouthStyle.setAttribute("width", "60px");
        mouthStyle.setAttribute("id", "mouthStyle");
        iconNode.appendChild(mouthStyle);


        leaderboard.appendChild(iconNode);
    });

}

//displays all scores onto canvas
function displayRoundOver(leaderboardList) {
    const textToDisplay = ["Scores"];
    leaderboardList.forEach(eachPlayer => {
        textToDisplay.push(eachPlayer.playerName + ": " + eachPlayer.playerScore);
    });
    createInfoBoard(textToDisplay);
}

/////////////////////////////////////////////////////////////////////////////////

const canvasHeight = 500;
const canvasWidth = 500;
const c = document.getElementById("canvas");
const cContainer = document.getElementById("canvasContainer")
c.height = canvasHeight;
c.width = canvasWidth;
const ctx = c.getContext("2d");


/////////////////////////////////////////////////////////////////////////////



let buttonSelected = "paintbrush";
let penColour = "#000000"; // for eraser too, colour would be white for eraser
let penSize = 20;
let drawings = [];
let drawingsListTop = -1;
let undoStack = [];
let undoStackPointer = -1;
let isDrawing = false;


function setPaintbrush() {
    buttonSelected = "paintbrush";
}

function setEraser() {
    buttonSelected = "eraser";
}

function setColour(colour) {
    buttonSelected = "paintbrush";
    penColour = colour;
    document.getElementById("currentColour").style.backgroundColor = colour;
}

function sliding(x) {
    penSize = x;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    drawings = [];
    drawingsListTop = -1;

    if (ws.readyState === 1) {
        ws.send(JSON.stringify({
            method: "clearCanvas",
            gameID: gameID,
            clientID: clientID
        }));
    }
}

function displayClearCanvas() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    drawings = [];
    drawingsListTop = -1;
}

function fill() {
    ctx.fillStyle = penColour;
    ctx.strokeStyle = penColour;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    drawings.push(ctx.getImageData(0, 0, canvasWidth, canvasHeight));
    drawingsListTop += 1;
    console.log(drawings);

    if (ws.readyState === 1) {
        ws.send(JSON.stringify({
            method: "fillCanvas",
            gameID: gameID,
            clientID: clientID,
            penColour: penColour
        }));
    }
}

function displayFill(colour) {
    penColour = colour;
    ctx.fillStyle = penColour;
    ctx.strokeStyle = penColour;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    drawings.push(ctx.getImageData(0, 0, canvasWidth, canvasHeight));
    drawingsListTop += 1;
}

function undo() {
    if (drawingsListTop > 0) {
        undoStack.push(drawings.pop());
        drawingsListTop -= 1;
        undoStackPointer += 1;
        ctx.putImageData(drawings[drawingsListTop], 0, 0);

    }
    else if (drawingsListTop === 0) {
        undoStack.push(drawings.pop());
        drawingsListTop = -1;
        undoStackPointer += 1;
        drawings = [];

        clearCanvas();
    }

    if (ws.readyState === 1) {
        ws.send(JSON.stringify({
            method: "undoDraw",
            gameID: gameID,
            clientID: clientID
        }));
    }

    return; // do nothing if top pointer is -1 or less

}

function displayUndo(){
    if (drawingsListTop > 0) {
        undoStack.push(drawings.pop());
        drawingsListTop -= 1;
        undoStackPointer += 1;
        ctx.putImageData(drawings[drawingsListTop], 0, 0);

    }
    else if (drawingsListTop === 0) {
        undoStack.push(drawings.pop());
        drawingsListTop = -1;
        undoStackPointer += 1;
        drawings = [];

        clearCanvas();
    }
    return;
}

function redo() {
    if (undoStackPointer > -1) {
        ctx.putImageData(undoStack[undoStackPointer], 0, 0);
        drawings.push(undoStack.pop());
        drawingsListTop += 1;
        undoStackPointer -= 1;

        if (ws.readyState === 1) {
            ws.send(JSON.stringify({
                method: "redoDraw",
                gameID: gameID,
                clientID: clientID
            }));
        }
    }
    return;
}

function displayRedo() {
    ctx.putImageData(undoStack[undoStackPointer], 0, 0);
    drawings.push(undoStack.pop());
    drawingsListTop += 1;
    undoStackPointer -= 1;
}

function startdraw(event) {
    let x = event.clientX - c.offsetLeft; // offset makes it so that the line drawn is from where the mouse pointer is because without this, the line is offset
    let y = event.clientY - c.offsetTop;
    isDrawing = true;
    ctx.lineWidth = penSize;
    undoStack = [];
    undoStackPointer = -1;

    if (buttonSelected === "paintbrush") {
        ctx.strokeStyle = penColour;

        ctx.beginPath();
        ctx.arc(x, y, 0.5 * penSize, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = penColour;

        ctx.beginPath();
        ctx.moveTo(x, y);

    }
    else if (buttonSelected === "eraser") {
        ctx.strokeStyle = "#FFFFFF";

        ctx.beginPath();  // exact same as the above
        ctx.arc(x, y, 0.5 * penSize, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = "#FFFFFF";

        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    if (ws.readyState === 1) {
        ws.send(JSON.stringify({
            method: "startDraw",
            gameID: gameID,
            clientID: clientID,
            buttonSelected: buttonSelected,
            penColour: penColour,
            penSize: penSize,
            xCoord: x,
            yCoord: y
        }));
    }
    event.preventDefault();
}

function displayStartdraw(button, colour, size, x, y) {
    buttonSelected = button;
    penColour = colour;
    penSize = size;

    ctx.lineWidth = penSize;

    undoStack = [];
    undoStackPointer = -1;

    if (buttonSelected === "paintbrush") {
        ctx.strokeStyle = penColour;

        ctx.beginPath();
        ctx.arc(x, y, 0.5 * penSize, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = penColour;

        ctx.beginPath();
        ctx.moveTo(x, y);

    }
    else if (buttonSelected === "eraser") {
        ctx.strokeStyle = "#FFFFFF";

        ctx.beginPath();  // exact same as the above
        ctx.arc(x, y, 0.5 * penSize, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = "#FFFFFF";

        ctx.beginPath();
        ctx.moveTo(x, y);
    }
}

function moveDraw(event) {
    if (isDrawing) {
        x = event.clientX - c.offsetLeft;
        y = event.clientY - c.offsetTop;
        ctx.lineTo(x, y);
        ctx.stroke();

        if (ws.readyState === 1) {
            ws.send(JSON.stringify({
                method: "moveDraw",
                gameID: gameID,
                clientID: clientID,
                xCoord: x,
                yCoord: y

            }));
        }

    }
    event.preventDefault();
}

function displayMoveDraw(x, y) {
    ctx.lineTo(x, y);
    ctx.stroke();
}

function endDraw(event) {
    if (isDrawing) {
        isDrawing = false;
        ctx.stroke();
        ctx.closePath();

        drawings.push(ctx.getImageData(0, 0, canvasWidth, canvasHeight));
        drawingsListTop += 1;

        if (ws.readyState === 1) {
            ws.send(JSON.stringify({
                method: "endDraw",
                gameID: gameID,
                clientID: clientID
            }));
        }
    }
    event.preventDefault();
}

function displayEndDraw() {
    ctx.stroke();
    ctx.closePath();

    drawings.push(ctx.getImageData(0, 0, canvasWidth, canvasHeight));
    drawingsListTop += 1;
}

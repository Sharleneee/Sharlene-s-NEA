let ws = new WebSocket("ws://localhost:8080");

const oldClientID = sessionStorage.getItem("clientID");
let clientID = null;
const gameID = sessionStorage.getItem("gameID");
const playerName = sessionStorage.getItem("playerName");
let isHost = JSON.parse(sessionStorage.getItem("isHost")).isHost;
let gameSettings = null;

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

    if(msg.method === "initialiseGame"){
        gameSettings = msg.gameSettings; // only has numRounds and roundLength
        if(msg.isDrawer === true){
            initialiseDrawer(msg.threeWords);
        }
        else{
            initialiseGuesser();
        }
    }

    if (msg.method === "message") {
        displayMessage(msg);
    }


}



document.getElementById("messageBox").addEventListener("keypress", function () {
    if (event.key === "Enter") { // clicking enter also presses button
        document.getElementById("sendButton").click();
    }
});

function sendMessageToServer() { // called when send message button is clicked
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
        if(ws.readyState === 1){
            ws.send(JSON.stringify(messageObj));
        }
        
        displayMessage(messageObj);
        messageBox.value = "";
    }
}

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

    const node = document.createTextNode(playerName + ": " + content);
    newPElement.appendChild(node); // inserting the text into the paragraph element
    newDivElement.appendChild(newPElement); // inserting the paragraph into the new div element
    chat.appendChild(newDivElement); // inserting the div element into the chat div
}

/////////////////////////////////////////////////////////////////////////////////

function startCountdown(endTime){
    const timer = setInterval(updateCountdown(endTime), 1000);
}

function updateCountdown(end){
    const now = new Date().getTime();
    const difference = end - now;
    const secondsLeft = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("countdown").innerHTML = secondsLeft;
    if(difference < 0){
        document.getElementById("countdown").innerHTML = "";
        clearInterval(timer);
    }
}

function createInfoBoard(text){
    const newDiv = document.createElement("div");
    newDiv.setAttribute("class", "stackTop");
    newDiv.setAttribute("id", "infoBoard");
    newDiv.innerHTML = text;

    cContainer.appendChild(newDiv);
}

function add3buttons(threeWords, element){
    for(let i=0; i<3; i++){
        const newButton = document.createElement("button");
        newButton.innerHTML = threeWords[i];
        newButton.addEventListener("click", function(){
            if(ws.readyState === 1){
                ws.send(JSON.stringify({
                    method: "chooseWord",
                    wordChosen: document.newButton.innerHTML,
                    gameID: gameID
                }))
            }
        });
        element.appendChild(newButton);
    }
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

//initalising variables
function initialiseDrawer(threeWords){
    createInfoBoard("Choose a word to draw...");
    add3buttons(threeWords, document.getElementById("infoBoard"));
}

// makes all the drawing tools hidden and makes a screen show up saying the drawer is choosing a word
function initialiseGuesser(){
    const tools = document.getElementById("toolbox").childNodes;
    for(let i=0; i<tools.length; i++){
        tools[i].hidden = true;
    }

    createInfoBoard("Drawer is choosing word...");
    
}

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
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    drawings = [];
    drawingsListTop = -1;
    ctx.putImageData
}

function fill() {
    ctx.fillStyle = penColour;
    ctx.strokeStyle = penColour;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    drawings.push(ctx.getImageData(0, 0, canvasWidth, canvasHeight));
    drawingsListTop += 1;
    console.log(drawings);
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
    return; // do nothing if top pointer is -1 or less

}

function redo() {
    if (undoStackPointer > -1) {
        ctx.putImageData(undoStack[undoStackPointer], 0, 0);
        drawings.push(undoStack.pop());
        drawingsListTop += 1;
        undoStackPointer -= 1;
    }
    return;
}

c.addEventListener("mousedown", startdraw);
c.addEventListener("touchstart", startdraw);

//c.addEventListener("mousemove", moveDraw(Event));
//c.addEventListener("touchmove", moveDraw(Event));

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
        ctx.arc(x, y, 0.5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = "#FFFFFF";

        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    event.preventDefault();
}

c.addEventListener("mousemove", moveDraw);
c.addEventListener("touchmove", moveDraw);


function moveDraw(event) {
    if (isDrawing) {
        x = event.clientX - c.offsetLeft;
        y = event.clientY - c.offsetTop;
        ctx.lineTo(x, y);
        ctx.stroke();

    }
    event.preventDefault();
}

c.addEventListener("mouseup", endDraw);
c.addEventListener("touchend", endDraw);

function endDraw(event) {
    if (isDrawing) {
        isDrawing = false;
        ctx.stroke();
        ctx.closePath();

        drawings.push(ctx.getImageData(0, 0, canvasWidth, canvasHeight));
        drawingsListTop += 1;
    }
    event.preventDefault();
}





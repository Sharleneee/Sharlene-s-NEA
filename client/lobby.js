
let ws = new WebSocket("ws://localhost:8080");

const oldClientID = sessionStorage.getItem("clientID");
let clientID = null;
const gameID = sessionStorage.getItem("gameID");
const playerName = sessionStorage.getItem("playerName");
let isHost = JSON.parse(sessionStorage.getItem("isHost")).isHost;

let form = document.getElementById("changeSettings");
document.getElementById("gameCode").innerHTML = gameID;

ws.onmessage = message => {
    const msg = JSON.parse(message.data);
    console.log(message.data);

    if(msg.method === "connect"){
        // assigning client ID to clientID variable
        clientID = msg.clientID; 
        // changing the old clientID in sessionStorage to the new clientID
        sessionStorage.setItem("clientID", clientID);
        if(ws.readyState === 1){
            // this method requests to update this client's information on the server
            ws.send(JSON.stringify({ 
                method: "updateClientID",
                gameID: gameID,
                oldClientID: oldClientID,
                clientID: clientID
            }));
        }

        updatePlayersInLobby();
    } 

    if(msg.method === "updatePlayersInLobby"){ // displays the lobby players each time server updates lobby, ie. when other players call the udpate lobby function
        displayPlayersInLobby(msg.playersInLobby);
    }

    if(msg.method === "startGame"){
        if(msg.readyToStart === true){
            window.location.href = "gamepage.html";
        }
        else{
            alert(msg.reason);
        }
        
    }

    // for clients who are not the host:

    if(msg.method === "updateNumRounds"){ //only clients who didnt send the changeNumRounds method are sent this msg (ie. non hosts)
        form["numRounds"].value = msg.numRounds;
    }

    if(msg.method === "updateRoundLength"){ //only clients who didnt send the changeNumRounds method are sent this msg (ie. non hosts)
        form["roundLength"].value = msg.roundLength;
    }

}

///////////////////////////////////////////////////////////////////////////

if(!isHost){
    form["numRounds"].setAttribute("disabled", "true");
    form["roundLength"].setAttribute("disabled", "true");
    form["useCustomWords"].remove();
    document.getElementById("useCustomWordsLabel").remove();
    document.getElementById("startGameButton").setAttribute("disabled", "true");
}
else{
    const node = document.createElement("input");
    node.setAttribute("type", "text");
    node.setAttribute("height", "100px");
    node.setAttribute("size", "40");
    node.setAttribute("placeholder", "Enter custom words here, separated by commas");
    node.setAttribute("id", "listWordsAdded");
    node.style.overflow = "auto";
    
    document.getElementById("customWordsDiv").appendChild(node);
}

/* this functionality doesn't fully work 
function exitGame(){
    if(ws.readyState === 1){
        ws.send(JSON.stringify({
            method: "updatePlayersInLobby",
            event: "exit",
            gameID: gameID,
            clientID: clientID
        }));
    }
    sessionStorage.clear();
    //window.location.href = "index.html";
}
document.getElementById("exitGameButton").addEventListener("click", exitGame());
*/

// stops clients from leaving page using any other way than the exit game button on the page
/* 
function cancelLeavePage(){
    window.onbeforeunload = null;
    return "";
    
}
*/

/*
let numRounds = 0;
let roundLength = 0;
let useCustomWords = false;*/

function getNumRounds() {
    return form["numRounds"].value;
}

function getRoundLength() {
    return form["roundLength"].value;
}

function getUseCustomWords() {
    return form["useCustomWords"].checked; // returns boolean
}

function getListWordsAdded() {
    const wordsString = document.getElementById("listWordsAdded").value;
    if(wordsString === ""){
        return [];
    }
    const listWords = wordsString.split(",");
    for(let i=0; i<listWords.length; i++){
        listWords[i] = listWords[i].trim();
    }
    return listWords;
}



// the change attribute functions will only be used by host so no one else can change them and the update settings methods are only sent to non-host players.

function changeNumRounds() {
    const numRounds = getNumRounds();
    if(ws.readyState === 1){
        ws.send(JSON.stringify({
            method: "changeNumRounds",
            gameID: gameID,
            numRounds: numRounds
        }));
    }
}

function changeRoundLength() {
    const roundLength = getRoundLength();
    if(ws.readyState === 1){
        ws.send(JSON.stringify({
            method: "changeRoundLength",
            gameID: gameID,
            roundLength: roundLength
        }));
    }
}

function changeUseCustomWords() {
    const useCustomWords = getUseCustomWords();
    if(ws.readyState === 1){
        ws.send(JSON.stringify({
            method: "changeUseCustomWords",
            gameID: gameID,
            useCustomWords: useCustomWords
        }));
    }
}

function updatePlayersInLobby(){
    if(ws.readyState === 1){
        ws.send(JSON.stringify({
            method: "updatePlayersInLobby",
            event: "join",
            clientID: clientID,
            gameID: gameID
        }));
    }
}

function displayPlayersInLobby(playersInLobby){ // playersInLobby is a list of the players joined, sent by server when player joined lobby

    const playersDisplay = document.getElementById("playersDisplay");
    playersDisplay.innerHTML = "";
    playersInLobby.forEach(player => {
        let iconNode = document.createElement("div");
        iconNode.setAttribute("height", "250px");
        iconNode.setAttribute("width", "250px");
        iconNode.setAttribute("class", "iconPart");
        iconNode.innerHTML = player.playerName;

        const imageRoot = "https://d2lawzz4zy243q.cloudfront.net/";
        
        let bodyStyle = document.createElement("img");
        bodyStyle.setAttribute("src", imageRoot + player.iconObject.bodyStyle);
        bodyStyle.setAttribute("height", "170px");
        bodyStyle.setAttribute("width", "230px");
        bodyStyle.setAttribute("id", "bodyStyle");
        iconNode.appendChild(bodyStyle);

        let eyeStyle = document.createElement("img");
        eyeStyle.setAttribute("src", imageRoot + player.iconObject.eyeStyle);
        eyeStyle.setAttribute("height", "70px");
        eyeStyle.setAttribute("width", "140px");
        eyeStyle.setAttribute("id", "eyeStyle");
        iconNode.appendChild(eyeStyle);

        let mouthStyle = document.createElement("img");
        mouthStyle.setAttribute("src", imageRoot + player.iconObject.mouthStyle);
        mouthStyle.setAttribute("height", "30px");
        mouthStyle.setAttribute("width", "60px");
        mouthStyle.setAttribute("id", "mouthStyle");
        iconNode.appendChild(mouthStyle);


        playersDisplay.appendChild(iconNode);
    });


}

function startGame(){

    //sends all the game settings to the server
    ws.send(JSON.stringify({
        method: "startGame",
        gameID: gameID,
        numRounds: getNumRounds(),
        roundLength: getRoundLength(),
        useCustomWords: getUseCustomWords(),
        listWordsAdded: getListWordsAdded()
    }))
}







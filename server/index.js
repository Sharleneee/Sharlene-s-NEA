// server js file

function createGuid() {
    const firstPart = Math.floor(Math.random() * Math.pow(16, 8)).toString(16);
    const secondPart = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
    const thirdPart = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
    const fourthPart = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
    const fifthPart = Math.floor(Math.random() * Math.pow(16, 12)).toString(16);
    const guid = firstPart + '-' + secondPart + '-' + thirdPart + '-' + fourthPart + '-' + fifthPart
    return guid;
}

//gID = gameID and cID = clientID
function removeClientFromGame(gID, cID) {
    const indexInGameClients = games[gID].clients.findIndex(x => x.clientID === cID);
    games[gID].clients.splice(indexInGameClients, 1);
}

function removeClientFromClients(cID) {
    delete clients[cID];
}

function updateClientID(messageFromClient) {
    const clientID = messageFromClient.clientID;
    const oldClientID = messageFromClient.oldClientID;
    const gameID = messageFromClient.gameID;

    const client = games[gameID].clients.find(eachClient => eachClient.clientID === oldClientID);
    //changing the client's clientID from the old one to the new one in games array
    client.clientID = clientID;
    removeClientFromClients(oldClientID);
    //dont need to change the clientID of the corresponding client in playersInLobby list as it is automatically changed due to it being passed as reference from the games array, so it changes when game object changes
}



// functions ^^

words = ["Stapler", "Desk", "Phone", "Paper", "Light", "Chair", "Notepad", "Binder", "Calculator", "Calendar", "Pens", "Pencils", "Notebook", "Book", "Chairs", "Chairs", "Thermos", "Glue", "Clipboard", "Paperclips", "Chocolate", "Secretary", "Work", "Paperwork", "Workload", "Employee", "Boredom", "Coffee", "Golf", "Laptop", "Sandcastle", "Monday", "Vanilla", "Bamboo", "Sneeze", "Scratch", "Celery", "Hammer", "Frog", "Tennis", "Pants", "Bridge", "Bubblegum", "Bucket", "Skiing", "Sledding", "Snowboarding", "Snowman", "Cream", "Waffle", "Pancakes", "Sundae", "beach", "Sunglasses", "Surfboard", "Watermelon", "Baseball", "Bat", "Ball", "Kiss", "Jellyfish", "Jelly", "Butterfly", "Spider", "Broom", "Spiderweb", "Mummy", "Candy", "Bays", "Squirrels", "Basketball", "Unicorn", "Newspaper", "Girl", "Boy"];
const http = require("http");
const { start } = require("repl");
// const { getuid } = require("process");
const WebSocketServer = require("websocket").server;
let connection = null;
let clients = {};
let games = {};
let clock = null;

const httpserver = http.createServer()

httpserver.listen(8080, () => console.log("My server is listening on port 8080"));

const wss = new WebSocketServer({
    "httpServer": httpserver
})

wss.on("request", request => {
    const connection = request.accept(null, request.origin);

    const clientID = createGuid();
    clients[clientID] = {
        connection: connection
    }
    connection.send(JSON.stringify({ // maybe put this function and the below function into the function when the connection turns on
        method: "connect",
        clientID: clientID
    }));

    connection.on("close", () => {
        console.log("client disconnected");
    })

    connection.on('message', message => {

        console.log(`received: ${message.utf8Data}`);
        if (message.utf8Data[0] !== "{") {
            return;
        }
        const messageFromClient = JSON.parse(message.utf8Data);




        // homepage / index ///////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////


        if (messageFromClient.method === "createPrivateGame") {
            const gameID = createGuid();


            const client = {
                clientID: messageFromClient.clientID,
                playerName: messageFromClient.playerName,
                iconObject: messageFromClient.iconObject
            }
            games[gameID] = {
                gameID: gameID,
                clients: [client], // adds host to clients list when made
                gameStarted: false
            }
            const con = clients[messageFromClient.clientID].connection;
            const state = con.socket.connecting;
            if (clients[messageFromClient.clientID].connection.socket.connecting == false) {
                connection.send(JSON.stringify({
                    method: "createPrivateGame",
                    gameID: gameID
                }));
            }

        }
        //make a join game function similar to joinPriavteGame


        if (messageFromClient.method === "joinPrivateGame") {
            const gameID = messageFromClient.gameID;
            const game = games[gameID];

            // if invalid gameID
            if (games[gameID] === undefined) {
                clients[messageFromClient.clientID].connection.send(JSON.stringify({
                    method: "joinPrivateGame",
                    result: "fail",
                    reason: "Invalid game code."
                }))
                return;
            }


            //if game full
            if (game.clients.length >= 10) {
                clients[messageFromClient.clientID].connection.send(JSON.stringify({
                    method: "joinPrivateGame",
                    result: "fail",
                    reason: "Game full."
                }))
                return;
            }
            game.clients.push({
                clientID: messageFromClient.clientID,
                playerName: messageFromClient.playerName,
                iconObject: messageFromClient.iconObject
            });

            game.clients.forEach(eachClient => {
                const client = clients[eachClient.clientID];

                client.connection.send(JSON.stringify({
                    method: "joinPrivateGame",
                    result: "success",
                    gameID: gameID
                }));

            })
        }

        // LOBBY PAGE ///////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////

        if (messageFromClient.method === "updateClientID") {
            updateClientID(messageFromClient);
        }



        if (messageFromClient.method === "updatePlayersInLobby") {

            const game = games[messageFromClient.gameID];
            const gameID = messageFromClient.gameID;
            const clientID = messageFromClient.clientID;

            if (messageFromClient.event === "join") {
                //creating new list property called playersInLobby if the first time it's called
                if (games[gameID].playersInLobby === undefined) {
                    games[gameID].playersInLobby = [];
                }
                const clientObj = games[gameID].clients[games[gameID].clients.findIndex(x => x.clientID === clientID)]; // finding index of client in game clients list and assigning the object from the list to a variable
                games[gameID].playersInLobby.push(clientObj);

            }
            else if (messageFromClient.event === "exit") {
                if (games[gameID].gameStarted) {
                    return;
                }
                //assuming exit method is only used when there are more than 0 players in playersInLobby list.
                const indexInPlayersList = games[gameID].playersInLobby.findIndex(x => x.clientID === clientID); //returns undefined if not found
                //deleting client from players list:
                games[gameID].playersInLobby.splice(indexInPlayersList, 1);
                //deleting client from game clients list:
                removeClientFromGame(gameID, clientID);

            }
            // sends the updated playersInLobby list to everyon
            if (games[gameID].playersInLobby.length > 0) {
                game.clients.forEach(eachClient => {
                    const client = clients[eachClient.clientID];
                    client.connection.send(JSON.stringify({
                        method: "updatePlayersInLobby",
                        playersInLobby: games[gameID].playersInLobby
                    }));
                })
            }
        }

        if (messageFromClient.method === "changeNumRounds") {
            const game = games[messageFromClient.gameID];
            game.clients.forEach(eachClient => {
                const client = clients[eachClient.clientID];
                if (client.connection !== connection) {
                    const numRounds = messageFromClient.numRounds;
                    client.connection.send(JSON.stringify({
                        method: "updateNumRounds",
                        numRounds: numRounds
                    }));
                }
            })
        }

        if (messageFromClient.method === "changeRoundLength") {
            const game = games[messageFromClient.gameID];
            game.clients.forEach(eachClient => {
                const client = clients[eachClient.clientID];
                if (client.connection !== connection) {
                    const roundLength = messageFromClient.roundLength;
                    client.connection.send(JSON.stringify({
                        method: "updateRoundLength",
                        roundLength: roundLength
                    }));
                }
            })
        }

        if (messageFromClient.method === "changeUseCustomWords") {
            const game = games[messageFromClient.gameID];
            game.clients.forEach(eachClient => {
                const client = clients[eachClient.clientID];
                if (client.connection !== connection) {
                    const useCustomWords = messageFromClient.useCustomWords;
                    client.connection.send(JSON.stringify({
                        method: "updateUseCustomWords",
                        useCustomWords: useCustomWords
                    }));
                }
            })
        }

        if (messageFromClient.method === "startGame") {
            const gameID = messageFromClient.gameID;
            //this is to stop updatePlayersInLobby from removing players from the game and list
            games[gameID].gameStarted = true;

            // adding a game settings object to the game
            games[messageFromClient.gameID].gameSettings = {
                numRounds: messageFromClient.numRounds,
                roundLength: messageFromClient.roundLength,
                useCustomWords: messageFromClient.useCustomWords,
                listWordsAdded: messageFromClient.listWordsAdded
            };

            // sending startGame response to everyone
            games[gameID].clients.forEach(eachClient => {
                const numPlayersInLobby = games[gameID].playersInLobby.length; // when people leave, this number goes down so the last person isn't able to "play the game" so I am assigning it to a const
                const client = clients[eachClient.clientID];
                const readyToStart = games[gameID].clients.length > 1;
                let reason = ""
                if (!readyToStart) {
                    reason = "Cannot start game as there is not enough people to start the game (need more than one player).";
                }

                client.connection.send(JSON.stringify({
                    method: "startGame",
                    readyToStart: readyToStart,
                    reason: reason
                }));
            })

        }

        // GAME PAGE ///////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////////
        if (messageFromClient.method === "updateClientIDGamepage") {
            updateClientID(messageFromClient);
            initialiseGame(messageFromClient.gameID, messageFromClient.clientID);
        }



        if (messageFromClient.method === "wordChosen") {
            clearInterval(clock);
            const gameID = messageFromClient.gameID;
            const wordChosen = messageFromClient.wordChosen;

            // assings word chosen to the first word in the generated three words list
            if (wordChosen === "") {
                wordChosen = games[gameID].threeWords[0];
            }
            games[gameID].wordChosen = wordChosen;
            startPlaying(gameID, clientID);
        }



        /*
        
        if(messageFromClient.method === "checkIfRoundOver"){
            const gameID = messageFromClient.gameID;
            checkIfRoundOver(gameID);
        }
        */

        // if the data received is a message,
        if (messageFromClient.method === "message") {
            const gameID = messageFromClient.gameID;
            const clientID = messageFromClient.clientID;
            const messageSentBy = games[gameID].clients.find(eachClient => eachClient.clientID === clientID).playerName;

            let isCorrectGuess = false;

            if (games[gameID].isGuessing) {
                isCorrectGuess = checkIfCorrectGuess(messageFromClient.messageContent);
            }

            if (isCorrectGuess) {
                //checking if player is already in guessed correctly list
                if ((games[gameID].playersGuessedCorrectly.find(p => p.clientID === clientID)) === undefined) {
                    games[gameID].playersGuessedCorrectly.push(clientID);
                    clients[clientID].connection.send(JSON.stringify({
                        method: "correctGuess"
                    }));
                }

            }
            else {
                games[gameID].clients.forEach(eachClient => { // it will be sent to all the clients apart from the one that sent it
                    const client = clients[eachClient.clientID];
                    client.connection.send(JSON.stringify({
                        method: "message",
                        messageSentBy: messageSentBy,
                        messageContent: messageFromClient.messageContent
                    }));
                })
            }


        }


        /* not completed

        if(messageFromClient.method === "draw"){
            clients.forEach(eachClient => {
                if(eachClient.connection !== connection){
                    eachClient.send(JSON.stringify({
                        method: "drawUpdate",
                        game: {
                            gameID: messageFromClient.messageContent.gameID
                        }
                    }));
                }
            })
        }
        */


    });

});


////////// GAMEPAGE ////////////////////////



function getRandomWord(listWordsAdded, numWordsAdded) {
    //generate a random number from 
    const max = 75 + numWordsAdded;
    //get random number exclusive of max
    const index = Math.floor(Math.random() * max);
    if (index <= 74) {
        return words[index];
    }
    else {
        return listWordsAdded[index - 75];
    }
}

function wordInList(word, wordList) {
    wordList.forEach(x => {
        if (word === x) {
            return true;
        }
    })
    return false;
}

function genThreeWords(gameID, listWordsAdded) {
    //listWordsAdded can be empty
    const threeWords = [];

    for (let i = 0; i < 3; i++) {
        const wordGenerated = getRandomWord(listWordsAdded, listWordsAdded.length);
        if (!(wordInList(wordGenerated, threeWords))) {
            threeWords.push(wordGenerated);
        }
        // repeat until 3 words can be pushed into threeWords list
        else {
            i -= 1;
        }
    }
    return threeWords;
}

function secondsFromNow(secondsToAdd) {
    /*let now = new Date().getTime();
    return now.setSeconds(now.getSeconds() + secondsToAdd);*/

    let now = Date.now() // number of milliseconds since epoch
    return now + (secondsToAdd * 1000);
}

function startPlaying(gameID, clientID) {

    // current round is different to mini round
    if (games[gameID].currentRound === undefined) {
        // adds a current round property to game and initalises it to 1
        games[gameID].currentRound = 1;
    }
    else {
        // increments current round property
        if (games[gameID].drawerPointer === 0)
            games[gameID].currentRound += 1;
    }

    // adds/changes isRoundOver property to game
    games[gameID].isminiRoundOver = false;

    // adds/changes isGuessing property to game
    games[gameID].isGuessing = true;


    // adds/changes round finish time property to game
    const roundLength = games[gameID].gameSettings.roundLength;
    games[gameID].finishRoundBy = secondsFromNow(roundLength);

    // starts the round clock
    clock = setInterval(function () { checkTime(games[gameID].finishRoundBy, "round", gameID, clientID) }, 1000);

    // sends to all game clients to start the round
    games[gameID].clients.forEach(eachClient => {
        const client = clients[eachClient.clientID];
        client.connection.send(JSON.stringify({
            method: "startPlaying",
            wordChosen: games[gameID].wordChosen,
            roundFinishTime: games[gameID].finishRoundBy
        }));
    });
}

function endGame(gameID) {
    // sets game finish property of game to true and sends message to everyone that game is finished along with the game end state
}

// checks if all guessers have guessed correctly
// if they have, the isRoundOver property of the game is changed
function checkIfMiniRoundOver(gameID) {
    if (games[gameID].playersGuessedCorrectly.length === (games[gameID].playersInLobby.length - 1)) {
        games[gameID].isMiniRoundOver = true;
        clearInterval(clock);
        miniRoundOver();
    }
    /*
    games[gameID].clients.forEach(eachClient => {
        const client = clients[eachClient.clientID];
        client.connection.send(JSON.stringify({
            method: "checkIfRoundOver",
            isRoundOver: isRoundOver
        }));
    });
    */
}

function checkIfGameOver(gameID) {
    //checks if number of rounds completed and if drawer pointer is at end of playersInLobby list
    if ((games[gameID].currentRound === games[gameID].gameSettings.numRounds) && (games[gameID].drawerPointer === (games[gameID].playersInLobby.length - 1))) {
        return true;
    }
    return false;
}

function incrementDrawerPointer(gameID) {
    // circular array
    // checks if the drawer pointer is at the end of the list and sends it to the start
    if (games[gameID].drawerPointer === (games[gameID].playersInLobby.length - 1)) {
        games[gameID].drawerPointer = 0;
    }
    else {
        games[gameID].drawerPointer += 1;
    }
}

// is called when round is over so doesn't need to check if it is over
function miniRoundOver(gameID, clientID) {
    // checks if game over and ends game if it is

    if (checkIfGameOver(gameID)) {
        endGame(gameID);
        return;
    }

    // doesn't display normal mini round finish screen as an end game screen is displayed with the scores anyways

    //send to all game clients
    games[gameID].clients.forEach(eachClient => {
        const client = clients[eachClient.clientID];


        client.connection.send(JSON.stringify({
            method: "roundOver",
            playersAndScores: games[gameID].playersInLobby
        }));

    })

    games[gameID].isGuessing = false;

    incrementDrawerPointer(gameID);

    // start next round after 4 seconds
    clock = setTimeout(startMiniRound(gameID, clientID), 4000);
}

//timeToCheck given in ms
function checkTime(timeToCheck, typeOfTime, gameID, clientID) {
    /*
    const now = new Date().getTime();
    const difference = timeToCheck - now; // differrence is in milliseconds
    const secondsLeft = Math.floor((distance % (1000 * 60)) / 1000);
    // when the timer is up
    */
    const now = Date.now(); // in ms since epoch
    const difference = timeToCheck - now;
    const secondsLeft = Math.floor(difference / 1000);

    if (secondsLeft <= 0) {
        clearInterval(clock);
        clock = undefined;
        console.log("time is up for: " + typeOfTime);

        if (typeOfTime === "chooseWord") {
            receiveWordChosen(gameID);
        }
        else if (typeOfTime === "round") {
            miniRoundOver(gameID, clientID);
        }
        else {
            console.log("type of time invalid");
        }

    }
    else {
        checkIfMiniRoundOver(gameID);
    }
}

function checkIfPlayerIsDrawer(gameID, clientID) {
    // if the client is not a drawer, this is indicated by the empty threeWordslist
    let threeWords = [];
    const drawerPointer = games[gameID].drawerPointer;

    if (games[gameID].playersInLobby[drawerPointer].clientID === clientID) {
        threeWords = genThreeWords(gameID, games[gameID].gameSettings.listWordsAdded);
        // creates a new property if game just started 
        // assigns three words property to the three generated words
        games[gameID].threeWords = threeWords;
    }
    return threeWords;
}

// this function enables drawer to start choosing word and updates the screens of the players for the round to start
function startMiniRound(gameID, clientID) {
    // adds the chooseWordBy time to the game object and sets it to the new time
    const secondsToChooseWord = 10;
    games[gameID].chooseWordBy = secondsFromNow(secondsToChooseWord);

    const typeOfTime = "chooseWord";

    clock = setInterval(function () {
        if (clock !== undefined) {
            checkTime(games[gameID].chooseWordBy, typeOfTime, gameID, clientID)
        }
    }, 1000); // checks per second



    //////////////////////////////////////
    // assigning the variables to send to client:

    let isDrawer = false;
    const threeWords = checkIfPlayerIsDrawer(gameID, clientID);
    if (threeWords.length === 3) {
        isDrawer = true;
    }

    // empty object will be sent if it is not the first round 
    // as the player sets these settings to a variable on the first round so they can access it from there onwards
    let gameSettingsToSend = {};
    if ((games[gameID].currentRound === 1) && (games[gameID].drawerPointer === 0)) {
        gameSettingsToSend = {
            numRounds: games[gameID].gameSettings.numRounds,
            roundLength: games[gameID].gameSettings.roundLength,
        };
    }

    clients[clientID].connection.send(JSON.stringify({
        method: "startMiniRound",
        gameSettings: gameSettingsToSend,
        isDrawer: isDrawer,
        threeWords: threeWords,
        chooseWordBy: games[gameID].chooseWordBy
    }));
}

function initialiseGame(gameID, clientID) {
    // sends messsage to initialise game and start the first round after client's clientID updated

    // adds a game drawer pointer to point to a player in playersInLobby
    games[gameID].drawerPointer = 0;

    // adds a gameFinished property to game and initialises it to false
    games[gameID].gameFinished = false;

    // adds a playersGuessedCorrectly list property and initialises it to be an empty list
    games[gameID].playersGuessedCorrectly = [];

    // adding player score property and initialising them to 0
    games[gameID].playersInLobby.forEach(eachPlayer => {
        eachPlayer.playerScore = 0;
    });

    startMiniRound(gameID, clientID);
}

function receiveWordChosen(gameID) {
    const drawer = games[gameID].playersInLobby[games[gameID].drawerPointer];
    const client = clients[drawer.clientID];
    client.connection.send(JSON.stringify({
        method: "sendWordChosen"
    }));
}

function checkIfCorrectGuess(guess, gameID) {
    if (guess === games[gameID].wordChosen) {
        return true;
    }
    return false;
}

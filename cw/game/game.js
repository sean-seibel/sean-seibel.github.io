const pid = window.localStorage.getItem("playerID");
const sock = window.localStorage.getItem("socket");

// console.log(pid, sock, window.localStorage.length);

let self = "";
let board = [[]];
let activePlayer = "-";
let connect = 0;
let grav = false;

let timeSet = false;

const playerToColorClass = {
    "ONE": "red-piece",
    "TWO": "yellow-piece",
}

let gameStarted = false;

const api = new WsApi(sock, pid, (msg) => {
    const resp = JSON.parse(msg.data);
    console.log("received", resp.header, resp)
    switch (resp.header) {
        case ("MALFORMED"):
            console.log("malformed json");
            break;
        case ("INFORMATION"):
            self = resp.role;
            if (!timeSet) {
                addChat(`Time format: ${resp.boardData.time / 60}m + ${resp.boardData.increment}s`)
            }
            if (!timeSet && self == "ONE") {
                document.getElementById("myTime").classList.add("red-time");
                document.getElementById("myTime").id = "p1time";
                document.getElementById("theirTime").classList.add("yellow-time");
                document.getElementById("theirTime").id = "p2time";
                if (gameStarted) { startMyTimer(); }
                timeSet = true;
            } else {
                document.getElementById("myTime").classList.add("yellow-time");
                document.getElementById("myTime").id = "p2time";
                document.getElementById("theirTime").classList.add("red-time");
                document.getElementById("theirTime").id = "p1time";
                if (gameStarted) { startOppTimer(); }
                timeSet = true;
            }
            updateInfo(resp.boardData);
            if (self != activePlayer) { setState(OPP_TURN); }
            drawBoard(board);
            break;
        case ("MOVE_RESULT"):
            if (state == WAITING) { // we only expect this when we're waiting
                const result = resp.result;
                updateInfo(resp.boardData);
                if (result == "Valid") {
                    setState(OPP_TURN);
                } else if (result == "Win") {
                    setState(YOU_WIN);
                } else if (result == "Draw") {
                    setState(DRAW);
                } else {
                    setState(YOUR_TURN);
                    drawBoard(board); // this will probably not happen but uhhh idk lol
                }
            }
            break;
        case ("OPPONENT_MOVE"):
            if (state == OPP_TURN) { // we only expect this on opp's turn
                const result = resp.result;
                updateInfo(resp.boardData);
                if (result == "Valid") {
                    setState(YOUR_TURN);
                } else if (result == "Win") {
                    setState(YOU_LOSE);
                } else if (result == "Draw") {
                    setState(DRAW);
                } else {
                    setState(OPP_TURN); // shouldn't get here
                }
                drawBoard(board)
            }
            break;
        case ("MESSAGE"):
            addChat("Opp:", resp.message);
            break;
        case ("OPPONENT_RESIGN"):
            addChat("Opponent Resigned!");
            setState(YOU_WIN);
            break;
        case ("P1_TIME_OUT"):
            if (self == "ONE") {
                addChat("You lost on time!");
                setState(YOU_LOSE);
            } else {
                addChat("Opponent lost on time!");
                setState(YOU_WIN);
            }
            break;
        case ("P2_TIME_OUT"):
            if (self == "TWO") {
                addChat("You lost on time!");
                setState(YOU_LOSE);
            } else {
                addChat("Opponent lost on time!");
                setState(YOU_WIN);
            }
            break;
        case ("GAME_STARTED"):
            addChat("Game Started!");
            document.getElementById("state").classList.remove("invisible");
            document.getElementById("boardBar").classList.remove("uninteractable");
            document.getElementById("turnBar").classList.add("game-started");
            if (self == "ONE") {
                startMyTimer();
            } else if (self == "TWO") {
                startOppTimer();
            }
            gameStarted = true;
            break;
        case ("OPPONENT_DISCONNECT"):
            addChat("Opponent Disconnected");
            setState(YOU_WIN);
            break;
    }
});

const YOUR_TURN = 0;
const WAITING = 1;
const OPP_TURN = 2;
const YOU_WIN = 3;
const YOU_LOSE = 4;
const DRAW = 5;

const stateAsString = [
    "Your Turn",
    "Waiting...",
    "Opponent's Turn",
    "You Win!",
    "You Lose",
    "Draw!",
];

const gameIsOver = () => {
    return state >= 3 && state <= 5;
}

let timer;

const startTimer = (time) => {
    writeTimes();
    clearTimeout(timer);
    tickTime(time);
}

let theTime;

const tickTime = (time) => {
    theTime = new Date().getTime();
    timer = setInterval(() => {
        const oldTime = theTime;
        theTime = new Date().getTime();
        const elapsed = theTime - oldTime;
        time.raw -= elapsed;
        computeTime(time, time.raw);
        writeTimes();
    }, 100)
}

const setState = (st) => {
    if (state == WAITING && st == OPP_TURN) { // start opp timer, end your timer
        startOppTimer();
    }
    if (state == OPP_TURN && st == YOUR_TURN) { // start your timer, end ops timer
        startMyTimer();
    }

    state = st;
    if (gameIsOver()) {
        console.log("game is over!")
        clearInterval(timer);   
    }
    
    document.getElementById("state").textContent = stateAsString[st];
    
}
let state;
setState(YOUR_TURN);

const timeToText = (time) => {
    if (time.minutes === 0) {
        return `${time.seconds}.${time.decis}`;
    }
    if (time.seconds < 10) {
        return `${time.minutes}:0${time.seconds}`;
        }
    return `${time.minutes}:${time.seconds}`;
}

const computeTime = (time, t) => {
    time.minutes = Math.floor(t / 60000);
    time.seconds = Math.floor((t % 60000) / 1000);
    time.decis = Math.floor((t % 1000) / 100);
    
}

const p1time = {
    raw: 0,
    minutes: 0,
    seconds: 0,
    decis: 0,
}

const p2time = {
    raw: 0,
    minutes: 0,
    seconds: 0,
    decis: 0,
}

const playerToTime = { // if this works it would be so poggers
    "ONE": p1time,
    "TWO": p2time,
}

const startMyTimer = () => {
    startTimer(playerToTime[self]);
}

const startOppTimer = () => {
    startTimer(playerToTime[self == "ONE" ? "TWO" : "ONE"]);
}

const setP1Time = (t) => {
    p1time.raw = t;
    computeTime(p1time, t);
}

const setP2Time = (t) => {
    p2time.raw = t;
    computeTime(p2time, t);
}

const writeTimes = () => {
    document.getElementById("p1time").textContent = timeToText(p1time);
    document.getElementById("p2time").textContent = timeToText(p2time);
}

const updateInfo = (data) => {
    board = data.board;
    activePlayer = data.activePlayer;
    connect = data.connect;
    grav = data.gravity;
    setP1Time(data.p1time);
    setP2Time(data.p2time);
    writeTimes();
}

/**
 * @param {[[number]]} pieces 
 */
const drawBoard = (pieces) => {
    const board = document.getElementById("board");
    const newChildren = [];

    const width = pieces.length;
    const height = pieces[0].length;
    
    const barWidth = 12 / Math.max(width, height);
    const squareW = (100 - (barWidth * (width + 1))) / width;
    const squareH = (100 - (barWidth * (height + 1))) / height;

    for (let c = 0; c < width; c++) {
        newChildren.push(verticalBar(`${barWidth}%`));
        const column = verticalBar(`${squareW}%`);
        newChildren.push(column);
        let landingSpot = height - 1;
        if (grav) {
            for (; landingSpot >= 0; landingSpot--) {
                if (pieces[c][landingSpot] != 0) break;
            }
            landingSpot++;
        }
        for (let r = height - 1; r >= 0; r--) {
            if (!grav && pieces[c][r] == 0) { 
                landingSpot = r
            }
            column.appendChild(horizontalBar(`${barWidth}%`));
            const square = horizontalBar(`${squareH}%`)
            column.appendChild(square);
            square.classList.add("square") //style.backgroundColor = "rgb(255, 128, 70)";
            if (pieces[c][r] == 1) {
                const piece = document.createElement("div");
                piece.classList.add("red-piece");
                square.appendChild(piece);
            }
            if (pieces[c][r] == 2) {
                const piece = document.createElement("div");
                piece.classList.add("yellow-piece");
                square.appendChild(piece);
            }
            if (r == landingSpot && state == YOUR_TURN) {
                const fakePiece = document.createElement("div");
                fakePiece.classList.add(playerToColorClass[self]);
                fakePiece.classList.add("highlightPiece");
                square.appendChild(fakePiece);
                if (!grav) {
                    square.classList.add("reveal");
                    square.onclick = () => {
                        if (state == YOUR_TURN) {
                            square.classList.add("reveal-always");
                            board.classList.remove("interact");
                            setState(WAITING);
                            api.makeMove(c + 1, r + 1);
                        }
                    }
                }
            }
        }
        if (landingSpot < height && grav && state == YOUR_TURN) {
            column.classList.add("reveal");
            column.onclick = () => {
                if (state == YOUR_TURN) {
                    column.classList.add("reveal-always");
                    board.classList.remove("interact");
                    setState(WAITING);
                    api.makeMove(c + 1);
                }
            };
        }
    }
    board.replaceChildren(...newChildren);
    board.classList.add("interact");
}

const verticalBar = (width) => {
    const div = document.createElement("div");
    div.style.height = "full";
    div.style.width = width;
    return div;
}
const horizontalBar = (height) => {
    const div = document.createElement("div");
    div.style.height = height;
    div.style.width = "full";
    return div;
}

const addChat = (username, chatmessage) => {
    const chat = horizontalBar("");
    chat.classList.add("chat");
    const name = verticalBar("");
    name.textContent = username;
    const msg = verticalBar("");
    msg.textContent = chatmessage;
    chat.replaceChildren(name, msg);
    document.getElementById("chat").appendChild(chat);
    document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
}

const sendChat = () => {
    const msg = document.getElementById("chatInput").value;
    if (msg.trim()) {
        addChat("You:", msg);
        api.sendChat(msg);
    }
    document.getElementById("chatInput").value = "";
}

document.getElementById("chatButton").onclick = sendChat;
document.getElementById("chatInput").onkeydown = (ev) => {
    if (ev.key == "Enter") {
        sendChat()
        ev.preventDefault();
    }
}

document.getElementById("backButton").onclick = () => {
    if (!gameIsOver()) {
        if (confirm("Are you sure you want to abandon this game?")) {
            window.location.replace(_HOMEPAGE);
        }
    } else {
        window.location.replace(_HOMEPAGE);
    }
}

api.info(); // this starts everything

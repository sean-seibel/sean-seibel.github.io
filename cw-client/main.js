document.getElementById("gamesList").style.height = "calc(100% - " + document.getElementById("gamesLabel").clientHeight + "px)"

window.localStorage.clear();

const getPID = () => {
    Api.playerID((str) => { 
        window.localStorage.setItem("playerID", str);
        console.log("playerID", str);
    }, () => {
        setTimeout(getPID, 500);
    });
}
getPID();

const divWithText = (text) => {
    let d = document.createElement("div");
    d.appendChild(document.createTextNode(text));
    return d;
}

const roomDataToGameCard = (roomData) => {
    let card = document.createElement("div");
    card.classList.add("gamecard");
    let d1 = document.createElement("div");
    d1.appendChild(divWithText(`Connect ${roomData.connect}`));
    d1.appendChild(divWithText(`${roomData.numPlayers}/2`));
    let d2 = document.createElement("div");
    const grav = roomData.gravity ? " grav" : "";
    const time = `${Math.floor(roomData.time/60)}+${roomData.increment}`
    d2.appendChild(divWithText(`${roomData.w} x ${roomData.h}${grav}, ${time}`));
    let button = document.createElement("button");
    button.innerText = "Join";
    button.classList.add("joinButton");
    button.onclick = () => {
        joinAndRedirect(roomData.id);
    }
    d2.appendChild(button);
    card.replaceChildren(d1, d2);
    return card;
}

/**
 * @param {(roomData) => boolean} predicate 
 */
const updateRoomsList = (predicate = (rd) => true, showConnecting = false) => {
    let gameCount = document.getElementById("gameCount");
    let gamesList = document.getElementById("gamesList");
    gameCount.textContent = "Searching...";
    gamesList.replaceChildren();
    if (showConnecting) showDialog("Connecting...");
    Api.rooms((rooms) => {
        let openRooms = rooms.filter((rd) => rd.numPlayers < 2);
        let total = rooms.length;
        let filtered = openRooms.filter(predicate).map((rd) => roomDataToGameCard(rd));
        gamesList.replaceChildren(...filtered);
        gameCount.textContent = `Showing ${filtered.length}/${total}`;
        hideDialog();
    }, () => {
        alert("Couldn't load rooms. Check your connection.");
        hideDialog();
    });
};

const dialog = document.getElementById("dialog");
dialog.addEventListener('cancel', (event) => { event.preventDefault(); });
const showDialog = (message) => {
    dialog.replaceChildren(message);
    dialog.showModal();
}
const hideDialog = () => {
    dialog.close();
}

document.getElementById("searchButton").onclick = () => {
    updateRoomsList(rd => {
        return rd.w == (document.getElementById("widthInput").value || rd.w) &&
        rd.h == (document.getElementById("heightInput").value || rd.h) &&
        rd.connect == (document.getElementById("connectInput").value || rd.connect);
    });
}

document.getElementById("createButton").onclick = () => {
    const w = document.getElementById("widthInput").value;
    const h = document.getElementById("heightInput").value;
    const connect = document.getElementById("connectInput").value;
    const gravity = document.getElementById("gravityInput").checked;
    const minutes = document.getElementById("minutesInput").value;
    const seconds = document.getElementById("secondsInput").value;
    if (w < 1 || h < 1 || connect < 1 || connect > Math.max(w, h) || 
    50 < w || 50 < h || minutes < 1 || seconds < 0) { 
        alert("Invalid game metrics"); return; 
    }
    Api.createRoom(window.localStorage.getItem("playerID"), w, h, connect, gravity, minutes, seconds, (roomID) => {
        redirectTo(roomID);
    }, () => {
        alert("Room could not be created. Room system may be at capacity. If not, try making again.");
    });
}

const redirectTo = (roomID) => {
    //showDialog("Joining..."); // this breaks in safari for UNKNOWN reasons
    Api.roomSocket(roomID, window.localStorage.getItem("playerID"), (sd) => {
        window.localStorage.setItem("socket", `wss://${_DOMAIN}/socket/${sd.socketID}/`);
        window.location.replace(_GAMEPAGE);
    }, () => {
        alert("Couldn't get room connection.");
        hideDialog();
    });
}
const joinAndRedirect = (roomID) => {
    showDialog("Joining...");
    Api.joinRoom(roomID, window.localStorage.getItem("playerID"), () => {
        redirectTo(roomID);
    }, () => {
        alert("Unable to join room. Recommended to refresh rooms list.");
        hideDialog();
    });
}

const presets = {
    connect4: [7, 6, 4, true],
    ticTacTo: [3, 3, 3, false],
    gomoku: [15, 15, 5, false],
}

const presetsSelector = document.getElementById("presets");
presetsSelector.onchange = (ev) => {
    const pr = presets[presetsSelector.value];
    if (pr) {
        document.getElementById("chooseGame").classList.add("forbidChoose");
        document.getElementById("widthInput").value = pr[0];
        document.getElementById("heightInput").value = pr[1];
        document.getElementById("connectInput").value = pr[2];
        document.getElementById("gravityInput").checked = pr[3];
    } else {
        document.getElementById("chooseGame").classList.remove("forbidChoose");
        document.getElementById("widthInput").value = "";
        document.getElementById("heightInput").value = "";
        document.getElementById("connectInput").value = "";
        document.getElementById("gravityInput").checked = false;
    }
}

const presetsTime = {
    blitz: [3, 2],
    rapid: [10, 5],
    classical: [15, 30],
}

const presetsSelectorTime = document.getElementById("presetsTime");
presetsSelectorTime.onchange = (ev) => {
    const pr = presetsTime[presetsSelectorTime.value];
    if (pr) {
        document.getElementById("chooseTime").classList.add("forbidChoose");
        document.getElementById("minutesInput").value = pr[0];
        document.getElementById("secondsInput").value = pr[1];
    } else {
        document.getElementById("chooseTime").classList.remove("forbidChoose");
        document.getElementById("minutesInput").value = "";
        document.getElementById("secondsInput").value = "";
    }
}

updateRoomsList(_ => true, true);

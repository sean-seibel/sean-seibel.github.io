/*
Pattern:

Api function takes in (json) => {stuff;}
to be executed on successful retrieval

static async rooms(useRooms); or (body, use__)
useRooms is a function (rooms) => void
*/

class Api {
    /**
     * @param {([room]) => void} useRooms 
     */
    static rooms(useRooms, handleError = () => {}) {
        fetch(`${_URL}/rooms/`, { 
            method: "GET",
        }).catch((error) => {
            handleError();
            return Promise.reject(error);
        }).then(resp => resp.json()).then(json => useRooms(json));
    }

    /**
     * @param {(string) => void} usePlayerID 
     */
    static playerID(usePlayerID, handleError = () => {}) {
        fetch(`${_URL}/player_id/`, { 
            method: "GET",
        }).catch((error) => {
            handleError();
            return Promise.reject(error);
        }).then(resp => resp.text()).then(text => usePlayerID(text));
    }

    /**
     * @param {string} roomID 
     * @param {string} playerID 
     * @param {(socketData: {port: number, socketID: string}) => void} useSocketData 
     */
    static roomSocket(roomID, playerID, useSocketData, handleError = () => {}) {
        fetch(`${_URL}/room_socket/${roomID}/`, {
            body: playerID,
            method: "POST",
        }).catch((error) => {
            handleError();
            return Promise.reject(error);
        }).then(resp => resp.json()).then(json => useSocketData(json));
    }

    /**
     * @param {string} playerID 
     * @param {number} w 
     * @param {number} h 
     * @param {number} connect 
     * @param {number} minutes
     * @param {number} increment 
     * @param {(string) => void} useRoomID 
     */
    static createRoom(
        playerID,
        w, h, connect,
        gravity,
        minutes, increment,
        useRoomID, handleError = () => {}) {
        fetch(`${_URL}/create_room/`, {
            body: JSON.stringify({
                playerID: playerID,
                w: w,
                h: h,
                connect: connect,
                gravity: gravity,
                minutes: minutes,
                increment: increment,
            }),
            method: "POST",
        }).catch((error) => {
            handleError();
            return Promise.reject(error);
        }).then(resp => resp.text()).then(text => useRoomID(text));
    }

    /**
     * @param {string} roomID 
     * @param {string} playerID 
     * @param {() => void} onSuccess 
     */
    static joinRoom(roomID, playerID, onSuccess, handleError = () => {}) {
        fetch(`${_URL}/join_room/${roomID}/`, {
            body: playerID,
            method: "POST",
        }).catch((error) => {
            handleError();
            return Promise.reject(error);
        }).then(onSuccess);
    }
}
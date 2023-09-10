class WsApi {
    socket;
    joinedRoomStatus = 0; // 0 = not attempted join, 1 = joined, 2 = rejected from room
    constructor (url, pid, handleMsg, onJoin = () => {}, onReject = () => {}) {
        this.socket = new WebSocket(url);
        this.socket.onmessage = (ev) => {
            const resp = JSON.parse(ev.data);
            switch (resp.header) {
                case "JOINED":
                    this.joinedRoomStatus = 1;
                    console.log("joining room");
                    break;
                case "REJECTED":
                    this.joinedRoomStatus = 2;
                    console.log("couldn't join room");
                    break;
                default:
                    handleMsg(ev);
            }
        };
        this.sendWhenConnected(
            JSON.stringify({
                playerID: pid,
                joining: true,
            })
        );
    }
    sendWhenConnected(str) {
        if (this.socket.readyState === 0) {
            setTimeout(() => {
                console.log("retrying connection")
                this.sendWhenConnected(str)
            }, 200)
        } else {
            this.socket.send(str);
        }
    }
    sendWhenJoined(str) {
        if (this.joinedRoomStatus === 2) return;
        if (this.socket.readyState === 0 || this.joinedRoomStatus === 0) {
            setTimeout(() => {
                this.sendWhenJoined(str)
            }, 200)
        } else {
            this.socket.send(str);
        }
    }
    sendChat(msg) {
        this.sendWhenJoined(
            JSON.stringify({
                playerID: pid,
                message: msg,
            })
        )
    }
    makeMove(column, row) {
        this.sendWhenJoined(
            JSON.stringify({
                playerID: pid,
                move: column,
                moveRow: row,
            })
        )
    }
    info() {
        this.sendWhenJoined(
            JSON.stringify({
                playerID: pid,
            })
        )
    }
    resign() {
        this.sendWhenJoined(
            JSON.stringify({
                playerID: pid,
                resigns: true,
            })
        )
    }
}
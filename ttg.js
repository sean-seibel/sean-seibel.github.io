const board = document.getElementById("board")
const PLAYER1 = "#000000";
const PLAYER2 = "#F5F5F5";
const PLAYER1_VALID = "#144B14";
const PLAYER1_INVALID = "#8B1414";
const PLAYER2_VALID = "#C6FFC6";
const PLAYER2_INVALID = "#FF0000";
const HANDICAP = 1.5;
//board.appendChild(square)

const P1_CSS_NOBORDER = document.getElementById("black").style.cssText + "border: 5px solid transparent;";
const P2_CSS_NOBORDER = document.getElementById("white").style.cssText + "border: 5px solid transparent;";

const P1_CSS_BORDER = document.getElementById("black").style.cssText + "border: 5px solid #000000;";
const P2_CSS_BORDER = document.getElementById("black").style.cssText + "border: 5px solid #000000;";

document.getElementById("handicap").innerHTML = "+" + HANDICAP;

function updateDisplay(gt) {
    const white = document.getElementById("white_score");
    const black = document.getElementById("black_score");
    const [bs, ws] = gt.score;

    white.innerHTML = (ws - HANDICAP);
    black.innerHTML = bs;

    if (gt.winner) {
        document.getElementById("black").style.cssText = P1_CSS_NOBORDER;
        document.getElementById("white").style.cssText = P2_CSS_NOBORDER;
        white.innerHTML = ws;
        black.innerHTML = bs;
        document.getElementById("handicap").innerHTML = "";
        if (gt.winner == PLAYER1) {
            document.getElementById("black").style.cssText += "box-shadow: 0px 0px 40px 20px #FF0";
        } else if (gt.winner == PLAYER2) {
            document.getElementById("white").style.cssText += "box-shadow: 0px 0px 40px 20px #FF0";
        }
    } else {
        if (gt.getActiveColor() == PLAYER1) {
            document.getElementById("black").style.cssText = P1_CSS_BORDER;
            document.getElementById("white").style.cssText = P2_CSS_NOBORDER;
        } else if (gt.getActiveColor() == PLAYER2) {
            document.getElementById("black").style.cssText = P1_CSS_NOBORDER;
            document.getElementById("white").style.cssText = P2_CSS_BORDER;
        }
    }

    
    
}

class GameTracker {
    colors;
    colCycle;
    col;
    emptySpaces;
    spaceArray;
    w;
    h;
    winner;
    score;
    lastMoveX;
    lastMoveY;
    lastThreeList;
    showingThreeConnects;

    //int int Space[][], color[]
    constructor(w, h, colCycle) {
        this.w = w;
        this.h = h;

        this.colors = new Array(w);

        for (let x = 0; x < w; x++) {
            this.colors[x] = new Array(h);
            for (let y = 0; y < h; y++) {
                this.colors[x][y] = "";
            }
       }

        this.emptySpaces = w * h;
        this.col = 0;
        this.colCycle = colCycle;

        this.lastMoveX = -1;
        this.lastMoveY = -1;

        this.score = [0,HANDICAP];

        this.showingThreeConnects = false;

        updateDisplay(this);
    }

    //false = occupied
    //1 = can go
    //2 = empty, can't go
    checkMove(x, y) {
        if (this.colors[x][y]) {
            return false;
        } else {
            if (this.lastMoveX != -1) {
                if (Math.abs(this.lastMoveX - x) < 3 && Math.abs(this.lastMoveY - y) < 3) {
                    return 1;
                }
                return false;
            }
            return 1;
        }
    }

    setSpaceArray(sa) {
        this.spaceArray = sa;
    }

    getActiveColor() {
        return this.colCycle[this.col];
    }

    //+=int +=int color --(update array)--> boolean?
    makeMove(x, y) {
        if (this.checkMove(x, y)) {
            this.colors[x][y] = this.colCycle[this.col];
            this.spaceArray[x][y].drawPiece(this.colCycle[this.col]);
            this.emptySpaces--;
            this.col++;
            if (this.col >= this.colCycle.length) { this.col = 0; }
            //if (this.emptySpaces == 0) { this.computeWinner(); }

            if (this.lastMoveX != -1) {
                this.spaceArray[this.lastMoveX][this.lastMoveY].setPiece();
            }

            let emptyFound = false;
            for(let a = -2; a <= 2 && !emptyFound; a++) {
                for (let b = -2; b <= 2 && !emptyFound; b++) {
                    if (x + a >= 0 && y + b >= 0 && x + a < this.colors.length && y + b < this.colors[0].length) {
                        emptyFound = !this.colors[x + a][y + b];
                    }
                }
            }
            if (emptyFound) {
                this.lastMoveX = x;
                this.lastMoveY = y;
            } else {
                this.lastMoveX = -1;
                this.lastMoveY = -1;
                setTimeout(() => this.spaceArray[x][y].setPiece(),150);
            }

            this.computeWinner();
            updateDisplay(this);
            if (this.showingThreeConnects) {
                this.removeThreeConnectNumbers();
                this.writeThreeConnectNumbers();
            }
        }
    }

    computeWinner() {
        let threeList = new Array();
        let fourList = new Array();
        for (let x = 0; x < this.w; x++) {
            for (let y = 0; y < this.h; y++) {
                threeList = threeList.concat(Connect.allConnectRows(x, y, 3, this.colors));
                fourList = fourList.concat(Connect.allConnectRows(x, y, 4, this.colors));
            }
        }
        //console.log(threeList);
        threeList = this.eoc2(threeList);
        //console.log(threeList);
        //console.log(fourList);

        this.lastThreeList = threeList;

        let p1Pts = 0;
        let p2Pts = HANDICAP;

        for (let i = 0; i < threeList.length; i++) {
            if (threeList[i].value == PLAYER1) {
                p1Pts++;
            }
            if (threeList[i].value == PLAYER2) {
                p2Pts++;
            }
        }
        for (let i = 0; i < fourList.length; i++) {
            if (fourList[i].value == PLAYER1) {
                p1Pts++;
            }
            if (fourList[i].value == PLAYER2) {
                p2Pts++;
            }
        }

        this.score = [p1Pts, p2Pts];

        if (this.emptySpaces == 0) {
            if (p1Pts > p2Pts) {
                this.winner = PLAYER1;
            } else if (p2Pts > p1Pts) {
                this.winner = PLAYER2;
            } else {
                this.winner = "No one";
            }
        }
    }

    // eliminateOverlappingConnects(list) { 
    //     if (list.length <= 1) { return list; }
    //     const nodes = list;
    //     const edges = new Array(nodes.length);
    //     for (let i = 0; i < edges.length; i++) {
    //         edges[i] = new Array(nodes.length + 1).fill(false);
    //         edges[i][nodes.length] = 0;
    //     }

    //     //populate edges
    //     for (let i = 0; i < nodes.length - 1; i++) {
    //         for (let j = i + 1; j < nodes.length; j++) {
    //             if (nodes[i].overlaps(nodes[j])) {
    //                 edges[i][j] = true;
    //                 edges[j][i] = true;

    //                 edges[i][nodes.length]++;
    //                 edges[j][nodes.length]++;
    //             }
    //         }
    //     }

    //     // console.log("EDGES:");
    //     // console.log(edges);

    //     let noEdges = false;

    //     const numNodes = nodes.length;

    //     while (!noEdges) {
    //         let edgiest = 0;

    //         for (let i = 1; i < edges.length; i++) {
    //             if (edges[i][numNodes] > edges[edgiest][numNodes]) {
    //                 edgiest = i;
    //             }
    //         }

    //         if (edges[edgiest][numNodes] != 0) {
    //             //now remove edgiest
    //             edges[edgiest] = new Array(nodes.length + 1).fill(false);
    //             edges[edgiest][numNodes] = 0;
    //             for (let i = 0; i < edges.length; i++) {
    //                 if(edges[i][edgiest]) {
    //                     edges[i][numNodes]--;
    //                     edges[i][edgiest] = false;
    //                 }
    //             }
    //             nodes[edgiest] = false;
                
    //         } else {
    //             noEdges = true;
    //         }
    //     }

    //     //compress list (remove falses)
    //     for (let i = nodes.length - 1; i >= 0; i--) {
    //         if (!nodes[i]) {
    //             nodes.splice(i, 1);
    //         }
    //     }

    //     return nodes;
    // }

    eoc2(list) { // count lowest overlaps, and remove them as you go
        if (list.length <= 1) { return list; }
        const nodes = list;
        const edges = new Array(nodes.length);
        for (let i = 0; i < edges.length; i++) {
            edges[i] = new Array(nodes.length + 1).fill(false);
            edges[i][nodes.length] = 0;
        }

        //populate edges
        for (let i = 0; i < nodes.length - 1; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (nodes[i].overlaps(nodes[j])) {
                    edges[i][j] = true;
                    edges[j][i] = true;

                    edges[i][nodes.length]++;
                    edges[j][nodes.length]++;
                }
            }
        }

        //console.log(edges);

        let noEdges = false;

        const numNodes = nodes.length;

        const retList = new Array();

        while (!noEdges) {
            let alonest = 0;

            for (let i = 1; i < edges.length; i++) {
                if (edges[i][numNodes] < edges[alonest][numNodes]) {
                    alonest = i;
                }
            }

            if (edges[alonest][numNodes] == nodes.length) {
                noEdges = true;
                break;
            }

            //now take alonest and remove all it is edged to
            for (let m = 0; m < nodes.length; m++) {
                if(edges[alonest][m]) {
                    for (let k = 0; k < nodes.length; k++) {
                        if (edges[m][k]) {
                            edges[m][k] = false;
                            edges[m][nodes.length]--;
                        }
                    }
                    edges[m] = new Array(nodes.length + 1).fill(false);
                    edges[m][numNodes] = nodes.length;
                }
            }
            edges[alonest] = new Array(nodes.length + 1).fill(false);
            edges[alonest][numNodes] = nodes.length;
            retList.push(nodes[alonest]);
        }

        //console.log(retList);   

        return retList;
    }

    writeThreeConnectNumbers() {
        if (this.lastThreeList) {
            let blackCount = 1;
            let whiteCount = 1;
            for(let i = 0; i < this.lastThreeList.length; i++) {
                if (this.lastThreeList[i].value == PLAYER1) {
                    this.lastThreeList[i].writeOn(blackCount, this.spaceArray, PLAYER2);
                    blackCount++;
                } else {
                    this.lastThreeList[i].writeOn(whiteCount, this.spaceArray, PLAYER1);
                    whiteCount++;
                }
            }
            this.showingThreeConnects = true;
        }
    }

    removeThreeConnectNumbers() {
        for (let x = 0; x < this.spaceArray.length; x++) {
            for (let y = 0; y < this.spaceArray[x].length; y++) {
                this.spaceArray[x][y].removeTextFromPiece();
            }
        }    
        this.showingThreeConnects = false;
    }
}

class Line {
    m;
    x;
    y;

    constructor(m, x, y) {
        this.m = m;
        this.x = x;
        this.y = y;
    }

    intersects(other) {
        if (this.m == other.m) {
            if (((this.y - other.y) / (this.x - other.x)) == this.m) {
                if (this.x > other.x) {
                    return [this.x, this.y];
                } else {
                    return [other.x, other.y];
                }
            } else {
                return false;
            }
        }

        const newX = (this.m * this.x - other.m * other.x - this.y + other.y) / (this.m - other.m);
        const newY = this.m * (newX - this.x) + this.y;

        return [newX, newY];
    }
}

class Connect {
    x;
    y;
    dir; // "ne" "e" "se" "s"
    n;
    value;

    constructor(x, y, dir, n, value) {
        this.x = x;
        this.y = y;
        this.dir = dir;
        this.n = n;
        this.value = value;
    }

    // does this over lap another Connect?
    overlaps(other) {
        const intPoint = this.lineThrough().intersects(other.lineThrough());
        if (!intPoint) {
            if (this.dir == "s" && other.dir == "s") {
                return new Connect(this.y, this.x, "e", this.n, this.value)
                .overlaps(new Connect(other.y, other.x, "e", other.n, other.value));
            }
            return false;
        }
        let [intX, intY] = intPoint;

        intX = Math.round(intX * 4) / 4; //rounds to nearest 0.25 ?
        intY = Math.round(intY * 4) / 4;

        //console.log([intX, intY]);

        if (intX % 1 != 0 || intY % 1 != 0) {
            return false;
        }

        let thisDX = intX - this.x;
        let thisDY = intY - this.y;
        let otherDX = intX - other.x;
        let otherDY = intY - other.y;

        if (this.dir == "ne") { thisDY *= -1; }
        if (other.dir == "ne") {otherDY *= -1; }

        return (thisDX >= 0 && thisDX <= this.n - 1) &&
                (thisDY >= 0 && thisDY <= this.n - 1) &&
                (otherDX >= 0 && otherDX <= other.n - 1) &&
                (otherDY >= 0 && otherDY <= other.n - 1);
    }

    lineThrough() {
        let m;

        switch (this.dir) {
            case "ne":
                m = -1;
                break;
            case "e":
                m = 0;
                break;
            case "se":
                m = 1;
                break;
            case "s":
                m = -10000
                break;
        }

        return new Line(m, this.x, this.y);
    }

    writeOn(str, spaceArray, col) {
        let dx = 0;
        let dy = 0;
        switch (this.dir) {
            case "ne":
                dx = 1;
                dy = -1;
                break;
            case "e":
                dx = 1;
                break;
            case "se": 
                dx = 1;
                dy = 1;
                break;
            case "s": 
                dy = 1;
                break;
        }

        for (let i = 0; i < this.n; i++) {
            spaceArray[this.x + i*dx][this.y + i*dy].writeTextOnPiece(str, col);
        }

    }

    //int int [][] (no checks for oob)
    static allConnectRows(x, y, val, array) {
        const eqThis = array[x][y];

        if (!eqThis) {
            return new Array();
        }

        const rows = new Array();


        let dy = 0;
        let dx = 0;

        //ne
        let terminated = false;
        dx = 1;
        dy = -1;
        for (; dy > -val && !terminated; dy--) {
            if (x + dx >= array.length || y + dy >= array.length || y+dy < 0) { terminated = true; break; }
            if (array[x + dx][y + dy] != eqThis) { terminated = true; }
            dx++;
        }   
        if (!terminated) {
            rows.push(new Connect(x, y, "ne", val, eqThis));
        }

        //e
        terminated = false;
        dx = 1;
        dy = 0;
        for (; dx < val && !terminated; dx++) {
            if (x + dx >= array.length || y + dy >= array.length || y+dy < 0) { terminated = true; break; }
            if (array[x + dx][y + dy] != eqThis) { terminated = true; }
        }   
        if (!terminated) {
            rows.push(new Connect(x, y, "e", val, eqThis));
        }

        //se
        terminated = false;
        dx = 1;
        dy = 1;
        for (; dx < val && !terminated; dx++) {
            if (x + dx >= array.length || y + dy >= array.length || y+dy < 0) { terminated = true; break; }
            if (array[x + dx][y + dy] != eqThis) { terminated = true; }
            dy++;
        }   
        if (!terminated) {
            rows.push(new Connect(x, y, "se", val, eqThis));
        }

        //s
        terminated = false;
        dx = 0;
        dy = 1;
        for (; dy < val && !terminated; dy++) {
            if (x + dx >= array.length || y + dy >= array.length || y+dy < 0) { terminated = true; break; }
            if (array[x + dx][y + dy] != eqThis) { terminated = true; }
        }   
        if (!terminated) {
            rows.push(new Connect(x, y, "s", val, eqThis));
        }

        return rows;
    }
}

class Space {
    x;
    y;
    node;
    color;

    constructor(x, y, node) {
        this.x = x;
        this.y = y;
        this.node = node;
        this.color = "";
    }

    drawPiece(color) {
        if (color != "" && this.color == "") {
            while (this.node.firstChild) {
                this.node.removeChild(this.node.firstChild);
            }
            const piece = document.createElement("div");
            piece.style.cssText = `width:91%; height:91%; background-color:${color}; border-radius: 20%; 
            box-sizing: border-box;
            -moz-box-sizing: border-box;
            -webkit-box-sizing: border-box;
            border:5px solid #FFDD00;
            display: flex;
            align-items: center;
            justify-content: center;`;
            this.node.appendChild(piece);
            this.color = color;

            this.node.onmouseenter = () => {};
            this.node.onmouseleave = () => {};
        }
    }

    setPiece() {
        this.node.firstChild.style.cssText = 
        `width:91%; height:91%; background-color:${this.color}; border-radius: 20%;
        display: flex;
        align-items: center;
        justify-content: center;`;
    }

    writeTextOnPiece(s, col) {
        const text = document.createElement("label");
        text.innerHTML = s;
        text.style.cssText = `color:${col};`;
        this.node.firstChild.appendChild(text);
    }

    removeTextFromPiece() {
        if (this.node.firstChild) {
            while(this.node.firstChild.firstChild) {
                this.node.firstChild.removeChild(this.node.firstChild.firstChild);
            }
        }
    }

    drawPossibleMove(gt) {
        let col;

        if (gt.checkMove(this.x, this.y)) {
            if (gt.getActiveColor() == PLAYER1) {
                col = PLAYER1_VALID;
            } else if (gt.getActiveColor() == PLAYER2) {
                col = PLAYER2_VALID;
            }
        } else {
            if (gt.getActiveColor() == PLAYER1) {
                col = PLAYER1_INVALID;
            } else if (gt.getActiveColor() == PLAYER2) {
                col = PLAYER2_INVALID;
            }
        }

        const piece = document.createElement("div");
            piece.style.cssText = `width:91%; height:91%; background-color:${col}; border-radius:20%; opacity:50%;`;
            this.node.appendChild(piece);
    }

}

const gameTracker = new GameTracker(8, 8, [PLAYER1, PLAYER2]);
const spaces = drawBoardOn(board, gameTracker);
gameTracker.setSpaceArray(spaces);
//console.log(new Connect(3,0,"s",3,"black").overlaps(new Connect(3,1,"s",3,"black")));
//console.log()
function toggleShowThreeConnects(checkbox) {
    if (!checkbox.checked) {
        gameTracker.removeThreeConnectNumbers();
    } else {
        gameTracker.writeThreeConnectNumbers();
    }
}

//DOM node, +number, +number --(create nodes on board)--> 2d array of spaces
function drawBoardOn(node, gt) {
    const x = gt.w;
    const y = gt.h;

    const ratio = 15; // ratio:1 :: space:line
    const lineColor = "#151515";

    const spaceWPercent = (ratio / (x * ratio + x - 1)) * 100 + "%";
    const spaceHPercent = (ratio / (y * ratio + y - 1)) * 100 + "%";

    const lineWPercent = (1 / (x * ratio + x - 1)) * 100 + "%";
    const lineHPercent = (1 / (y * ratio + y - 1)) * 100 + "%";

    const nodeArray = new Array();

    for (let i = 0; i < x; i++) {
        nodeArray.push(new Array(y));
    }

    for (let i = 0; i < y; i++) {
        const div = document.createElement("div");
        div.style.cssText = `width:100%; height:${spaceHPercent}; display:flex; flex-direction:row;`;

        for (let j = 0; j < x; j++) {
            const space = document.createElement("div");
            space.style.cssText = `width:${spaceWPercent}; height:100%; display: flex; align-items: center; justify-content: center;`;

            const space_object = new Space(j, i, space);
            space.onclick = () => gt.makeMove(j, i);
            space.onmouseenter = () => space_object.drawPossibleMove(gt);
            space.onmouseleave = () => { while (space.firstChild) {space.removeChild(space.firstChild);}};

            nodeArray[j][i] = space_object;

            div.appendChild(space);

            if (j < x - 1) {
                const vertLine = document.createElement("div");
                vertLine.style.cssText = `width:${lineWPercent}; height:100%; background-color:${lineColor};`;
                div.appendChild(vertLine);
            }
        }

        node.appendChild(div);

        if (i < y - 1) {
            const horLine = document.createElement("div")
            horLine.style.cssText = `width:100%; height:${lineHPercent}; background-color:${lineColor};`;
            node.appendChild(horLine);
        }

    }

    return nodeArray;
}
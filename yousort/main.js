const build = (l) => {
    let a = [];
    for (i = 1; i <= l; i++) {
        a.push(i);
    }
    return a;
}

let _LENGTH = 32;
let _INITIAL_ARR = build(_LENGTH);
let _MAX = Math.max(..._INITIAL_ARR);
let _IDLE = true;
let _SELECTED = null;

const selectBar = (bar) => {
    if (_SELECTED) {
        _SELECTED.classList.remove('select-bar');
    }
    _SELECTED = bar;
    if (bar) {
        bar.classList.add('select-bar');
    }
}

const _ARRf = () => {
    const el = document.getElementById('bar-zone');
    const arr = new Array(el.childElementCount);
    for (let i = 0; i < el.childElementCount; i++) {
        arr[i] = el.children[i].getAttribute('value');
    }
    return arr;
}
const _LENGTHf = () => {
    return document.getElementById('bar-zone').childElementCount;
}


const textLabel = document.getElementById('text-label');
const buildButton = document.getElementById('build-button');


buildButton.onclick = () => {
    setNeedCompile(!compileInstructions());
};

const compilerator = new MutationObserver(() => { /*console.log('compile');*/ setNeedCompile(true); refresh(false); });

const marginSize =  (n) => {
    if (n < 15) return 5;
    if (n < 40) return 4;
    if (n < 100) return 3;
    if (n < 200) return 2;
    if (n < 350) return 1;
    return 0;
}

let lastLength = -1;
const drawBars = (arr) => { // only call this once
    const el = bars;
    const max = Math.max(...arr);
    const margin = marginSize(arr.length) + "px";
    const valueInput = document.getElementById('value-input');
    el.replaceChildren(...arr.slice(0, arr.length).map((val) => {
        const bar = document.createElement('div');
        bar.style.backgroundColor = "#FFF379";
        bar.style.width = "100%";
        bar.style.height = "calc(100% * " + (val/max) + ")";
        bar.style.marginLeft = margin;
        // 256 -> 1, 128 -> 2, 50 -> 3, 15 -> 4, 8 -> 5
        // 512 -> 0
        // bar.style.borderRadius = "";
        bar.classList.add("rounded-sm");
        bar.setAttribute('value', val);

        bar.onmouseover = () => { if (!_SELECTED) valueInput.value = bar.getAttribute('value'); };
        bar.onmouseout = () => { if (!_SELECTED) valueInput.value = ""; };
        bar.onclick = () => { 
            if (_SELECTED != bar) { 
                valueInput.value = bar.getAttribute('value'); 
                selectBar(bar); 
            } else { 
                selectBar(null); 
            }};
        return bar;
    }));
    
    _MAX = max;
    _SELECTED = null;
};
const refresh = (b) => {
    document.getElementById("ptr").textContent = _PTR + " / " + (document.getElementById('text').childElementCount);
    if (b) {
        // drawBars(bars);
    }
};

// pred : (node) -> bool
const getChildIndex = (par, pred) => {
    return [...par.childNodes.entries()].findIndex((val) => {
        return pred(val[1]);
    });
};

document.getElementById('randomize-button').onclick = () => { drawBars(randomizeARRf()); };

document.getElementById('copy-button').onclick = () => {
    navigator.clipboard.writeText(JSON.stringify(_INSTRUCTIONS)).then(
        () => { alert('Copied!'); },
        () => { alert('Copy failed :('); }
    );
};

document.getElementById('paste-button').onclick = () => {
    let pasteText = prompt('Paste here:');
    try {
        loadFromInstructions(pasteText);
    } catch (err) {
        alert('Could not process paste.');
    }
}

const fromCookie = getCookie('i');
if (fromCookie) {
    try {
        loadFromInstructions(fromCookie);
    } catch (err) {
        console.log(fromCookie);
        alert('Could not load from cookie ' + fromCookie);
        document.getElementById('text').replaceChildren();
    }
    compileInstructions();
}

const highlight = (ptr) => {
    let i = 0;
    document.getElementById('text').childNodes.forEach((val) => {
        if (i == ptr) {
            val.classList?.add('highlighted');
        } else {
            val.classList?.remove('highlighted');
        }
        i++;
    });
};

const setStopActive = (active) => {
    if (active) {
        document.getElementById('start-button').classList.add('disabled');
        document.getElementById('step-button').classList.add('disabled');
        document.getElementById('stop-button').classList.remove('disabled');
        document.getElementById('pause-button').classList.remove('disabled');
        document.getElementById('time-slider').classList.add('disabled');
        document.getElementById('text').classList.add('disabled-no-opacity');
        document.getElementById('length-input').focus();
        document.getElementById('length-input').blur(); // this is genius
    } else {
        document.getElementById('start-button').classList.remove('disabled');
        document.getElementById('step-button').classList.remove('disabled');
        document.getElementById('stop-button').classList.add('disabled');
        document.getElementById('pause-button').classList.add('disabled');
        document.getElementById('time-slider').classList.remove('disabled');
        document.getElementById('text').classList.remove('disabled-no-opacity');
    }
}

let _RUN_ID = 0;

const runWithDelay = (delay) => {
    tryCompileIfNeeded();
    if (_needCompile) { return; }
    _IDLE = false;
    setStopActive(true);
    console.log('running');
    _RUN_ID++;
    tick(delay, _RUN_ID);
}

const tick = (delay, run_id) => {
    tryCompileIfNeeded();
    if (_needCompile) { return; }
    if (_RUN_ID != run_id || _PTR >= _INSTRUCTIONS.length) {
        _IDLE = true;
        if (_PTR >= _INSTRUCTIONS.length) { _PTR = 0; /*refresh(false);*/ }
        highlight(-1);
        setStopActive(false);
        refresh(false);
        console.log('done');
        return;
    }
    highlight(_PTR);
    const err = !executeInstruction();
    if (err) {
        _IDLE = true;
        highlight(-1);
        setStopActive(false);
        refresh(false);
        console.log('errored');
        return;
    }
    setTimeout(tick, delay, delay, run_id);
}

document.getElementById('start-button').onclick = () => runWithDelay(_DELAY);
document.getElementById('start-button').onmouseenter = () => highlight(_PTR);
document.getElementById('start-button').onmouseleave = () => { if (_IDLE) highlight(-1); }

const stop = (reset) => {
    if (reset) { _PTR = 0; refresh(); }
    _RUN_ID++;
    setStopActive(false);
    highlight(-1);
}

document.getElementById('stop-button').onclick = () => stop(true);
document.getElementById('pause-button').onclick = () => stop(false);

document.getElementById('step-button').onmouseenter = () => highlight(_PTR);
document.getElementById('step-button').onmouseleave = () => highlight(-1);
document.getElementById('step-button').onclick = () => {
    executeInstruction();
    highlight(_PTR);
};

const setLength = (l) => {
    if (l < 1 || l > 500) { document.getElementById('length-input').value = _LENGTHf(); return false; }

    const arr = _ARRf();

    if (l > arr.length) {
        for (let i = arr.length + 1; i <= l; i++) {
            arr.push(i);
        }
        console.log(arr);
    }

    drawBars(arr.slice(0,l));

    document.getElementById('length-label').textContent = "Length: (" + _LENGTHf() + ")";
    document.getElementById('length-input').value = _LENGTHf();
    return true;
};
setLength(_INITIAL_ARR.length);

document.getElementById('length-set').onclick = () => {
    // set length, clear input, alert if unsuccessful
    const num = parseInt(document.getElementById('length-input').value || "0");
    if (setLength(num)) { // if (success)
        refresh(true);
    } else {
        alert('Length invalid: ' + num);
    }
};

document.getElementById('length-remake').onclick = () => {
    drawBars(build(_LENGTHf()));
    refresh(true);
}

document.getElementById('length-import').onclick = () => {
    const inputStr = prompt('Enter a separated list of positive integers');
    if (!inputStr) { return; }
    const numList = inputStr.split(/[^0123456789]+/).filter((s) => {
        return s;
    });
    if (numList.length == 0) { alert('No numbers found!'); return; }
    const values = numList.map((s) => {
        return parseInt(s);
    });
    // console.log(values);
    drawBars(values);
    refresh(true);
}

document.getElementById('length-copy').onclick = () => {
    navigator.clipboard.writeText(
        JSON.stringify(_ARRf())
        .replace(/[\[\]"]/g, "")
        ).then(
        () => { alert('Copied values!'); },
        () => { alert('Copy failed :('); }
    );
}

document.getElementById('value-set').onclick = () => {
    const valIn = document.getElementById('value-input');
    if (!_SELECTED) { valIn.value = ""; return; }
    // set length, clear input, alert if unsuccessful
    const num = parseInt(valIn.value);
    console.log(num);
    if (num != NaN) { // if (success)
        setBar(_SELECTED, num);
    } else {
        alert('Value invalid: ' + num);
    }
    valIn.value = _SELECTED.getAttribute('value');
};

drawBars(_INITIAL_ARR);
refresh(true);

// setTimeout(() => { setNeedCompile(false); }, 1);
compilerator.observe(document.getElementById('text'), {
    subtree: true,
    childList: true,
    characterData: true,
});

// const testobj = [
//     ["≤", 12],
//     ["–", 13],
//     ["45", 34],
//     [" ", 35],
// ]

// const testobj2 = JSON.parse('[[2,"noneswapped",[0,"0"]],[3,"start"],[5,"end",[0,"noneswapped"]],[2,"noneswapped",[0,"1"]],[2,"i",[0,"0"]],[3,"loop"],[5,"start",[1,"=",[0,"i"],[1,"–",[0,"LENGTH"],[0,"1"]]]],[5,"noswap",[1,"≤",[2,[0,"i"]],[2,[1,"+",[0,"i"],[0,"1"]]]]],[0,[0,"i"],[1,"+",[0,"i"],[0,"1"]]],[2,"noneswapped",[0,"0"]],[3,"noswap"],[2,"i",[1,"+",[0,"i"],[0,"1"]]],[4,"loop"],[3,"end"]]')

// console.log("test : " + JSON.stringify(testobj2));
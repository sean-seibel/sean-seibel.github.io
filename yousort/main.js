const build = (l) => {
    let a = [];
    for (i = 1; i <= l; i++) {
        a.push(i);
    }
    return a;
}

let _LENGTH = 32;
let _ARR = build(_LENGTH);
let _MAX = Math.max(..._ARR);
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

let _needCompile = false;
const textLabel = document.getElementById('text-label');
const buildButton = document.getElementById('build-button');
const setNeedCompile = (bool) => {
    if (bool) { // yes need compile
        textLabel.textContent = "TEXT *";
        buildButton.classList.remove('disabled');
    } else {
        textLabel.textContent = "TEXT";
        buildButton.classList.add('disabled');
    }
    _needCompile = bool;
}

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

const alignBarHeight = (bar) => {
    bar.style.height = "calc(100% * " + (parseInt(bar.getAttribute('value'))/_MAX) + ")";
}

const setBar = (bar, n) => {
    const wasMax = bar.getAttribute('value') == _MAX;
    bar.setAttribute('value', n);
    if (wasMax || n > _MAX) {
        if (n < _MAX) {
            bar.parentNode.childNodes.forEach((e) => {
                _MAX = Math.max(_MAX, e.getAttribute('value'));
            });
        } else {
            _MAX = n;
        }
        bar.parentNode.childNodes.forEach((e) => {
            alignBarHeight(e);
        });
    } else {
        alignBarHeight(bar);
    }
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

let _INSTRUCTIONS = [];
let _PTR = 0;
let _VAR_TABLE = new Map(); // string to number
let _FLAG_TABLE = new Map(); // string to number

const _SWAP = 0;
const _SET = 1;
const _STORE = 2;
const _FLAG = 3;
const _JUMP = 4;
const _JUMPIF = 5;
const _VAL_INPUT = 0;
const _EXPRESSION = 1;
const _VALUE = 2;
const _INST_CODES = ['swap', 'set', 'store', 'flag', 'jump', 'jumpif'];
const _SUB_CODES = ['val-input', 'expression', 'value']

const executeInstruction = () => {
    if (_needCompile) {
        setNeedCompile(!compileInstructions());
    }

    if (_PTR >= _INSTRUCTIONS.length || _needCompile) {
        return;
    }

    let command = _INSTRUCTIONS[_PTR];

    const bar_l = bars.childNodes;

    try {
        switch (command[0]) {
            case _SWAP:
                let i1 = computeSub(command[1], bar_l);
                let i2 = computeSub(command[2], bar_l);
                if (i1 < 0 || i1 >= _LENGTHf()) { throw Error('Out of bounds. ' + i1 + ' not within [0, ' + _LENGTHf() + ')'); }
                if (i2 < 0 || i2 >= _LENGTHf()) { throw Error('Out of bounds. ' + i2 + ' not within [0, ' + _LENGTHf() + ')'); }
                let temp = bar_l[i1].getAttribute('value');
                setBar(bar_l[i1], bar_l[i2].getAttribute('value'));
                setBar(bar_l[i2], temp);
                break;
            case _SET:
                let set_index = computeSub(command[1], bar_l);
                if (set_index < 0 || set_index >= _LENGTHf()) { throw Error('Out of bounds. ' + set_index + ' not within [0, ' + _LENGTHf() + ')'); }
                setBar(bar_l[computeSub(command[1], bar_l)], computeSub(command[2], bar_l));
                break;
            case _STORE:
                if (Number.isInteger(+command[1])) { throw Error('Can not use number as a symbol. (' + command[1] + ')'); }
                if (command[1] == 'LENGTH') {
                    const new_l = computeSub(command[2], bar_l);
                    if (!setLength(new_l)) {
                        throw Error('Invalid value for LENGTH: ' + new_l);
                    }
                    break;
                }
                _VAR_TABLE.set(
                    command[1], // don't let them do this if its a number? bc you can't retrieve it
                    computeSub(command[2], bar_l)
                );
                break;
            case _FLAG: break;
            case _JUMP:
                if (!_FLAG_TABLE.has(command[1])) { throw Error('Flag not found: ' + command[1]); }
                _PTR = _FLAG_TABLE.get(command[1]); // will drop you just after the flag
                break;
            case _JUMPIF:
                if (!_FLAG_TABLE.has(command[1])) { throw Error('Flag not found: ' + command[1]); }
                if (computeSub(command[2], bar_l)) {
                    _PTR = _FLAG_TABLE.get(command[1]); // will drop you just after the flag
                }
                break;
        }
    } catch (err) { // name errors, out of bounds errors?
        let msg = 'Runtime error at instruction ' + _PTR + ': ';
        switch (command[0]) {
            case _SWAP: msg += 'swap\n'; break;
            case _SET: msg += 'set\n'; break;
            case _STORE: msg += 'store\n'; break;
            case _FLAG: msg += 'flag\n'; break;
            case _JUMP: msg += 'jump\n'; break;
            case _JUMPIF: msg += 'jumpif\n'; break;
        }
        msg += err;
        alert(msg);
        _PTR = 0; // if you errored restart it
        setNeedCompile(true); // if you errored rewrite it
        return false;
    }

    _PTR++;
    console.log(_ARRf());
    console.log(_VAR_TABLE);
    refresh(); // this might have to redraw bars if you use [set]
    return true;
};

const computeSub = (sub, nodes) => {
    switch (sub[0]) {
        case _VAL_INPUT:
            if (sub[1] == 'LENGTH') {
                return _LENGTHf();
            } else if (Number.isInteger(+sub[1])) {
                return Number(sub[1]);
            } else {
                if (!_VAR_TABLE.has(sub[1])) { throw Error('Error: symbol not found: ' + sub[1]); }
                return _VAR_TABLE.get(sub[1]);
            }
        case _EXPRESSION:
            let func = _FUNCS[sub[1]];
            return func(computeSub(sub[2], nodes), computeSub(sub[3], nodes));
        case _VALUE:
            return nodes[computeSub(sub[1], nodes)].getAttribute('value');
    }
}

const compileInstructions = () => {
    let instructions = [];
    const text = document.getElementById("text");
    let failed = false;
    text.childNodes.forEach((node) => {
        if (node?.classList && !failed) {
            try {
                const inst = compileInstruction(node);
                //console.log(inst);
                instructions.push(inst);    
            } catch (err) {
                alert('Compilation error: Error on instruction ' + instructions.length + '.\nMust fix before running.\n' + err);
                failed = true;
            }
        }
    });
    if (failed) { return false; }
    _VAR_TABLE.clear();
    _FLAG_TABLE.clear();
    for(p = 0; p < instructions.length; p++) {
        if (instructions[p][0] == _FLAG) {
            _FLAG_TABLE.set(instructions[p][1], p);
        }
    }
    //console.log(_FLAG_TABLE);
    console.log(instructions);
    _INSTRUCTIONS = instructions;
    setCookie('i', JSON.stringify(_INSTRUCTIONS), 365);
    return true;
}

const compileInstruction = (instNode) => {
    let inst = [];
    inst.push(
        _INST_CODES.findIndex((st) => st == instNode.classList.item(0))
    );
    // inst.push(instNode); // for highlighting (if you add this update indicies in computing somehow)
    const accepts = childrenWithClass(instNode, 'accepts1');
    const inputs = childrenWithClass(instNode, 'val-input');
    switch (inst[0]) {
        case _SWAP:
            inst.push(compileSubcomputation(accepts[0]));
            inst.push(compileSubcomputation(accepts[1]));
            break;
        case _SET:
            inst.push(compileSubcomputation(accepts[0]));
            inst.push(compileSubcomputation(accepts[1]));
            break;
        case _STORE:
            inst.push(inputs[0].textContent);
            inst.push(compileSubcomputation(accepts[0]));
            break;
        case _FLAG:
            inst.push(inputs[0].textContent);
            break;
        case _JUMP:
            inst.push(inputs[0].textContent);
            break;
        case _JUMPIF:
            inst.push(inputs[0].textContent);
            inst.push(compileSubcomputation(accepts[0]));
            break;
    }
    return inst;
};

const compileSubcomputation = (accept1) => {
    const child = accept1.firstChild;
    if (!child) { return null; }
    // const cl = child.classList?.item(0);
    const cl = _SUB_CODES.findIndex((st) => st == child.classList?.item(0))
    const operands = childrenWithClass(child, 'accepts1'); // only immediate children
    switch (cl) {
        case _VAL_INPUT:
            if (!child.textContent) { throw Error('Empty input box'); }
            return [_VAL_INPUT, child.textContent];
        case _EXPRESSION:
            return [
                _EXPRESSION,
                child.getElementsByClassName("op-sel")[0].value,
                compileSubcomputation(operands[0]),
                compileSubcomputation(operands[1])
            ];
        case _VALUE:
            return [_VALUE, compileSubcomputation(operands[0])];
    }
    return null;
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
        alert('Could not load from cookie.');
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
    if (_needCompile) {
        setNeedCompile(!compileInstructions());
        if (_needCompile) { return; }
    }
    _IDLE = false;
    setStopActive(true);
    console.log('running');
    _RUN_ID++;
    tick(delay, _RUN_ID);
}

const tick = (delay, run_id) => {
    if (_needCompile) {
        setNeedCompile(!compileInstructions());
        if (_needCompile) { return; }
    }
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
setLength(_ARR.length);

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

drawBars(_ARR);
refresh(true);

// setTimeout(() => { setNeedCompile(false); }, 1);
compilerator.observe(document.getElementById('text'), {
    subtree: true,
    childList: true,
    characterData: true,
});
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

const executeInstruction = () => {
    tryCompileIfNeeded();

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
            return parseInt(nodes[computeSub(sub[1], nodes)].getAttribute('value'));
    }
}
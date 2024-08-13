let _needCompile = false;

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

const tryCompileIfNeeded = () => {
    if (_needCompile) {
        setNeedCompile(!compileInstructions());
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
    _INSTRUCTIONS = instructions;
    console.log(JSON.stringify(_INSTRUCTIONS));
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
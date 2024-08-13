const bars = document.getElementById("bar-zone");

// drags

const dragPrim = dragula([document.getElementById("source"), document.getElementById("text")], {
    copy: (el, source) => {
      return source === document.getElementById("source");
    },
    accepts: (el, target) => {
      return target.classList.contains("accepts");
    },
    invalid: (el, target) => {
        return !_IDLE || !el.classList.contains("prim");
    },
    removeOnSpill: true,
  })

const _source = document.getElementById("source");
const dragSub = dragula([_source], {
    isContainer: (c) => {
        return c.classList.contains('accepts1') && !_source.contains(c) && !c.parentElement.classList.contains('gu-transit');
    },
    copy: (el, source) => {
        return source === document.getElementById("source");
      },
    accepts: (el, target) => {
        const child = getFirstNonTransitSub(target); // ig this works
        // console.log(child);
        return target.classList.contains("accepts1") && !child;
            // ^ gu-transit is used for the placement shadow
            // basically forbid acceptance if there's an object in there that's not my shadow
    },
    invalid: (el, target) => {
        return !_IDLE || !el.classList.contains("sub");
    },
    removeOnSpill: true,
    // direction: 'horizontal',
});
dragPrim.on('drop', (el, target, source, sibling) => {
    refresh(false);
});

// on drop into accepts1: (drop)
//      replace editable node with dropped node

// on over: (over)
//      make editable node invisible (set font size to 0)

// on not over: (out)
//      make editable node visible (remove font 0)

// on block being removed from accepts1 (drop & remove)
//      create new editable node, and append it to the place that lost the original node

// container = latest container shadow has been in


dragSub.on('drop', (el, target, source, sibling) => {
    target.replaceChildren(el);

    if (source.classList.contains('accepts1')) {
        source.replaceChildren(makeEditableTextNode());
    }
});

dragSub.on('remove', (el, container, source) => {
    if (source.classList.contains('accepts1')) {
        source.replaceChildren(makeEditableTextNode());
    }
});

dragSub.on('over', (el, container, source) => {
    if (container.classList?.contains('accepts1')) {
        container.childNodes.forEach((val) => {
            if (val.classList?.contains('val-input')) {
                val.classList.add('no-font');
            }
        });
    }
});

dragSub.on('out', (el, container, source) => {
    if (container.classList?.contains('accepts1')) {
        container.childNodes.forEach((val) => {
            val.classList?.remove('no-font');
        });
    }
});

const getFirstNonTransitSub = (par) => {
    return [...par.childNodes].find((val) => {
        return (val).classList?.contains('sub') && !(val).classList?.contains('gu-transit');
    });
};

let barFrom = 0;
const dragBars = dragula([bars], {
    invalid: () => { return !_IDLE; },
    direction: 'horizontal'
}).on('drag', (el) => {
    barFrom = getChildIndex(bars, (n) => { return n == el });
}).on('drop', (el) => {
    const barTo = getChildIndex(bars, (n) => { return n == el });
    const temp = _INITIAL_ARR[barFrom];
    _INITIAL_ARR.splice(barFrom, 1);
    _INITIAL_ARR.splice(barTo, 0, temp);
    //console.log(_ARR); // ^ this reflects dragged bars in _ARR
});

// populating components

// 0 = False, !0 = True
const _FUNCS = {
    "+": (a, b) => a + b, 
    "–": (a, b) => a - b, 
    "*": (a, b) => a * b,  
    "/": (a, b) => Math.floor(a / b),  
    "%": (a, b) => a % b, 
    "=": (a, b) => a == b ? 1 : 0, 
    ">": (a, b) => a > b ? 1 : 0, 
    "<": (a, b) => a < b ? 1 : 0, 
    "≥": (a, b) => a >= b ? 1 : 0, 
    "≤": (a, b) => a <= b ? 1 : 0, 
    "r": (a, b) => Math.floor(Math.random() * (b-a)) + a,
};

const ops = document.getElementById("op-sel")
if (ops) {
    Object.keys(_FUNCS).forEach((op) => {
        const option = document.createElement("option");
        option.text = op;
        option.value = op;
        ops.add(option);
    });
}

// yeah you can still paste stuff in whaaaatever
const valueInput = document.getElementsByClassName('val-input');
[...valueInput].forEach((inp) => {
    inp.addEventListener('keydown', (evt) => {
        if (evt.key === "Enter") {
            evt.preventDefault();
        }
    });
});

const makeEditableTextNode = (text) => {
    const editableTextNode = document.createElement('pre');
    editableTextNode.classList.add('val-input');
    editableTextNode.classList.add('text-center');
    editableTextNode.setAttribute('contenteditable', true);
    if (text) { editableTextNode.textContent = text; }
    return editableTextNode
}

document.querySelectorAll(".accepts1").forEach((el) => {
    el.appendChild(
        makeEditableTextNode()
    );
});

// on events

document.onkeydown = (e) => {
    e = e || window.event;
    switch (e.key) {
        case "c":
            compileInstructions();
            _needCompile = false;
            _PTR = 0;
            refresh();
            break;
        case " ":
            highlight(_PTR);
            executeInstruction();
            break;
        case "p":
            dragSub.containers.forEach((val) => {
                console.log(val.parentElement);
            });
            break;
        case "Escape": selectBar(null); break;
        case "h": highlight(-1); break;
        case "0": highlight(0); break;
        case "1": highlight(1); break;
        case "2": highlight(2); break;
        case "3": highlight(3); break;
        case "4": highlight(4); break;
        case "5": highlight(5); break;
        case ",": setStopActive(false); break;
        case ".": setStopActive(true); break;
        default: break;
    }
};

document.onkeyup = (e) => {
    e = e || window.event;
    switch (e.key) {
        case " ": highlight(-1); break;
        default: break;
    }
}

const fischerYatesShuffle = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}
const randomizeARRf = () => { // and refresh
    const arr = _ARRf();
    fischerYatesShuffle(arr);
    return arr;
}

const childrenWithClass = (node, cl) => {
    return [...node.children].filter((child) => {
        return child.classList.contains(cl);
    })
};

const swapBlock = childrenWithClass(_source, 'swap')[0];
const setBlock = childrenWithClass(_source, 'set')[0];
const storeBlock = childrenWithClass(_source, 'store')[0];
const flagBlock = childrenWithClass(_source, 'flag')[0];
const jumpBlock = childrenWithClass(_source, 'jump')[0];
const jumpifBlock = childrenWithClass(_source, 'jumpif')[0];
const expressionBlock = childrenWithClass(_source, 'expression')[0];
const valueBlock = childrenWithClass(_source, 'value')[0];

const loadFromInstructions = (st) => {
    const text = document.getElementById('text');
    
    const instsFromPaste = JSON.parse(st);

    if (!instsFromPaste) { return; }

    text.replaceChildren(...instsFromPaste.map((inst) => {
        let node, accepts, valInputs;
        switch (inst[0]) {
            case _SWAP:
                node = swapBlock.cloneNode(true);
                accepts = childrenWithClass(node, 'accepts1');
                accepts[0].replaceChildren(loadSub(inst[1]));
                accepts[1].replaceChildren(loadSub(inst[2]));
                return node;
            case _SET:
                node = setBlock.cloneNode(true);
                accepts = childrenWithClass(node, 'accepts1');
                accepts[0].replaceChildren(loadSub(inst[1]));
                accepts[1].replaceChildren(loadSub(inst[2]));
                return node;
            case _STORE:
                node = storeBlock.cloneNode(true);
                accepts = childrenWithClass(node, 'accepts1');
                valInputs = childrenWithClass(node, 'val-input');
                valInputs[0].textContent = inst[1];
                accepts[0].replaceChildren(loadSub(inst[2]));
                return node;
            case _FLAG:
                node = flagBlock.cloneNode(true);
                valInputs = childrenWithClass(node, 'val-input');
                valInputs[0].textContent = inst[1];
                return node;
            case _JUMP:
                node = jumpBlock.cloneNode(true);
                valInputs = childrenWithClass(node, 'val-input');
                valInputs[0].textContent = inst[1];
                return node;
            case _JUMPIF:
                node = jumpifBlock.cloneNode(true);
                accepts = childrenWithClass(node, 'accepts1');
                valInputs = childrenWithClass(node, 'val-input');
                valInputs[0].textContent = inst[1];
                accepts[0].replaceChildren(loadSub(inst[2]));
                return node;        
        }
    }));

    // make all accept1s draggable ( we did this by using our IQ )
    // dragSub.containers.push(...text.querySelectorAll('.accepts1'));
};

const loadSub = (sub) => {
    switch (sub[0]) {
        case _VAL_INPUT:
            return makeEditableTextNode(sub[1]);
        case _EXPRESSION:
            let enode = expressionBlock.cloneNode(true);
            let eaccepts = childrenWithClass(enode, 'accepts1');
            eaccepts[0].replaceChildren(loadSub(sub[2]));
            eaccepts[1].replaceChildren(loadSub(sub[3]));
            childrenWithClass(enode, 'op-sel')[0].value = sub[1];
            return enode;
        case _VALUE:
            let vnode = valueBlock.cloneNode(true);
            let vaccepts = childrenWithClass(vnode, 'accepts1');
            vaccepts[0].replaceChildren(loadSub(sub[1]));
            return vnode;
    }
};

const _TIMES_STR = ['5.00', '3.00', '1.00', '0.75', '0.50', '0.30', '0.20', '0.10'];
const _TIMES = _TIMES_STR.map((s) => {
    return parseFloat(s) * 1000;
});


const timeSlider = document.getElementById('time-slider');
const timeLabel = document.getElementById('time-display');

timeSlider.max = _TIMES.length - 1;
timeSlider.value = Math.floor(_TIMES.length / 2);
let _DELAY = _TIMES[timeSlider.value];
timeLabel.textContent = _TIMES_STR[timeSlider.value];

timeSlider.oninput = (e) => {
    _DELAY = _TIMES[timeSlider.value];
    timeLabel.textContent = _TIMES_STR[timeSlider.value];
};

document.getElementById('dialog-close').onclick = () => {
    document.getElementById('dialog').close();
};
document.getElementById('dialog-show').onclick = () => {
    document.getElementById('dialog').showModal();
};

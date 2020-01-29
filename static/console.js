'use strict';

console.log('JavaScript has loaded');


const registerServiceWorker = () => {
    if (!Reflect.has(navigator, 'serviceWorker')) {
        console.log('Service workers are not supported');
        return;
    }
    const { serviceWorker } = navigator;
    serviceWorker.register('/worker.js').then(registration => {
        registration.addEventListener('updatefound', () => {
            console.log('updatefound');
            // A wild service worker has appeared in reg.installing!
            const newWorker = registration.installing;

            newWorker.addEventListener('statechange', () => {
                console.log('statechange');
                // Has network.state changed?
                switch (newWorker.state) {
                    case 'installed':
                        if (navigator.serviceWorker.controller) {
                            // new update available
                            newWorker.postMessage({ action: 'skipWaiting' });
                        }
                        // No update available
                        break;
                }
            });
        });

        if (registration.installing) {
            console.log('Service worker installing.', registration.installing);
            return;
        }
        if (registration.waiting) {
            console.log('Service worker installed.', registration.waiting);
            return;
        }
        if (registration.active) {
            console.log('Service worker active.', registration.active);
            return;
        }
    }).catch(error => {
        console.log('Registration failed.', error);
    });
};

window.addEventListener('load', () => {
    console.log('The page has loaded');
    registerServiceWorker();
});

window.addEventListener('beforeinstallprompt', event => {
    console.log('Installing PWA.', { beforeinstallprompt: event });
});

window.addEventListener('appinstalled', event => {
    console.log('PWA installed');
    console.dir({ appinstalled: event });
});

// AJAX API Builder

const buildAPI = methods => {
    const api = {};
    for (const method of methods) {
        api[method] = (...args) => new Promise((resolve, reject) => {
            const url = `/api/${method}`;
            console.log(url, args);
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(args),
            }).then(res => {
                const { status } = res;
                if (status !== 200) {
                    reject(new Error(`Status Code: ${status}`));
                    return;
                }
                resolve(res.json());
            });
        });
    }
    return api;
};

const getAllApi = () => new Promise((resolve, reject) => {
    const url = '/getAllApi';
    console.log(url);
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }).then(res => {
        const { status } = res;
        if (status !== 200) {
            reject(new Error(`Status Code: ${status}`));
            return;
        }
        resolve(res.json());
    });
});

// Console Emulation

const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
const DIGIT = '0123456789';
const CHARS = ALPHA + DIGIT;
const TIME_LINE = 300;
const TIME_CHAR = 20;

const KEY_CODE = {
    BACKSPACE: 8, TAB: 9, ENTER: 13, PAUSE: 19, ESC: 27, SPACE: 32,
    PGUP: 33, PGDN: 34, END: 35, HOME: 36,
    LT: 37, UP: 38, RT: 39, DN: 40, INS: 45, DEL: 46,
    F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117,
    F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123,
    ACCENT: 192,
};

const KEY_NAME = {};
for (const keyName in KEY_CODE) KEY_NAME[KEY_CODE[keyName]] = keyName;

let controlKeyboard, panelScroll;
let controlInput, controlBrowse, controlScroll;

let history = ['help'];
let iterator = 0;
let api;
let help;
getAllApi().then(res => {
    api = buildAPI(res);
    help = [
        '', `Commands: ${res.join(', ')}, clear, help`, ''
    ];
    api.clear = clear;
    api.help = () => `<p style="margin-left: 2%">${help[1]}</p>`;
});

//const api = buildAPI(['about', 'contacts']);

const pad = (padChar, length) => new Array(length + 1).join(padChar);

const isMobile = () => (
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i)
);

let viewportHeight, viewableRatio;
let contentHeight, scrollHeight;
let thumbHeight, thumbPosition;

const refreshScroll = () => {
    viewportHeight = controlBrowse.offsetHeight;
    contentHeight = controlBrowse.scrollHeight;
    viewableRatio = viewportHeight / contentHeight;
    scrollHeight = panelScroll.offsetHeight;
    thumbHeight = scrollHeight * viewableRatio;
    thumbPosition = controlBrowse.scrollTop * thumbHeight / viewportHeight;
    controlScroll.style.top = thumbPosition + 'px';
    controlScroll.style.height = thumbHeight + 'px';
};

const scrollBottom = () => {
    refreshScroll();
    controlBrowse.scrollTop = controlBrowse.scrollHeight;
};

const initScroll = () => {
    controlBrowse.scrollTop = controlBrowse.scrollHeight;
    controlBrowse.addEventListener('scroll', refreshScroll);
    window.addEventListener('orientationchange', () => {
        setTimeout(scrollBottom, 0);
    });
};

const showKeyboard = () => {
    if (!isMobile()) return;
    controlKeyboard.style.display = 'block';
    controlBrowse.style.bottom = controlKeyboard.offsetHeight + 'px';
};

const inputSetValue = value => {
    controlInput.inputValue = value;
    if (controlInput.inputType === 'masked') {
        value = pad('*', value.length);
    }
    value = value.replace(/ /g, '&nbsp;');
    controlInput.innerHTML = (
        controlInput.inputPrompt + value + '<span>&block;</span>'
    );
};

const input = (type, prompt, callback) => {
    showKeyboard();
    controlInput.style.display = 'none';
    controlBrowse.removeChild(controlInput);
    controlInput.inputActive = true;
    controlInput.inputPrompt = prompt;
    inputSetValue('');
    controlInput.inputType = type;
    controlInput.inputCallback = callback;
    controlBrowse.appendChild(controlInput);
    controlInput.style.display = 'block';
    setTimeout(scrollBottom, 0);
};

const print = s => {
    const list = Array.isArray(s);
    let line = list ? s.shift() : s;
    if (!line) line = '';
    const element = document.createElement('div');
    if (!line) line = '\xa0';
    if (line.charAt(0) === '<') {
        element.innerHTML += line;
    } else {
        const timer = setInterval(() => {
            const char = line.charAt(0);
            element.innerHTML += char;
            line = line.substr(1);
            if (!line) clearInterval(timer);
            controlBrowse.scrollTop = controlBrowse.scrollHeight;
            scrollBottom();
        }, TIME_CHAR);
    }
    if (list && s.length) setTimeout(print, TIME_LINE, s);
    controlBrowse.insertBefore(element, controlInput);
    controlBrowse.scrollTop = controlBrowse.scrollHeight;
    scrollBottom();
};

const inputKeyboardEvents = {
    ESC() {
        inputSetValue('');
    },
    BACKSPACE() {
        let value = controlInput.inputValue;
        value = value.slice(0, -1);
        inputSetValue(value);
    },
    ENTER() {
        const result = controlInput.inputValue;
        let value = result;
        iterator = history.length - 1;
        if (controlInput.inputType === 'masked') {
            value = pad('*', value.length);
        }
        print(controlInput.inputPrompt + value);
        controlInput.style.display = 'none';
        controlInput.inputActive = false;
        controlInput.inputCallback(null, value);
    },
    CAPS() {
        if (controlKeyboard.className === 'caps') {
            controlKeyboard.className = '';
        } else {
            controlKeyboard.className = 'caps';
        }
    },
    KEY(char) { // Alpha or Digit
        if (controlKeyboard.className === 'caps') {
            char = char.toUpperCase();
        }
        let value = controlInput.inputValue;
        value += char;
        inputSetValue(value);
    },
    TAB() {
        const value = controlInput.inputValue;
        const compleate = [];
        for (const i of Object.keys(api)) {
            if (i.startsWith(value)) compleate.push(i);
        }

        if (compleate.length === 1) inputSetValue(compleate[0]);
    },
    UP() {
        console.log(iterator);
        if (history.length - 1 > iterator) iterator += 1;
        inputSetValue(history[iterator]);
    },
    DN() {
        console.log(iterator);
        if (iterator - 1 >= 0) iterator -= 1;
        inputSetValue(history[iterator]);
    }
};

const makeKeyboardClick = char => e => {
    char = e.target.inputChar;
    if (char === '_') char = ' ';
    let keyName = 'KEY';
    if (char === '<') keyName = 'BACKSPACE';
    if (char === '>') keyName = 'ENTER';
    if (char === '^') keyName = 'CAPS';
    const fn = inputKeyboardEvents[keyName];
    if (fn) fn(char);
    e.stopPropagation();
    return false;
};

const initKeyboard = () => {
    if (!isMobile()) return;
    controlKeyboard.style.display = 'block';
    const KEYBOARD_LAYOUT = [
        '1234567890',
        'qwertyuiop',
        'asdfghjkl<',
        '^zxcvbnm_>'
    ];
    let i, j, char, keyboardClick;
    let keyboardLine, elementKey, elementLine;
    for (i = 0; i < KEYBOARD_LAYOUT.length; i++) {
        keyboardLine = KEYBOARD_LAYOUT[i];
        elementLine = document.createElement('div');
        controlKeyboard.appendChild(elementLine);
        for (j = 0; j < keyboardLine.length; j++) {
            char = keyboardLine[j];
            if (char === ' ') char = '&nbsp;';
            elementKey = document.createElement('div');
            elementKey.innerHTML = char;
            elementKey.inputChar = char;
            elementKey.className = 'key';
            elementKey.style.opacity = ((i + j) % 2) ? 0.8 : 1;
            keyboardClick = makeKeyboardClick(char);
            elementKey.addEventListener('click', keyboardClick);
            elementLine.appendChild(elementKey);
        }
    }
    controlBrowse.style.bottom = controlKeyboard.offsetHeight + 'px';
};

document.onkeydown = event => {
    let keyName, fn;
    if (controlInput.inputActive) {
        keyName = KEY_NAME[event.keyCode];
        fn = inputKeyboardEvents[keyName];
        if (fn) {
            fn();
            return false;
        }
    }
};

document.onkeypress = event => {
    if (controlInput.inputActive) {
        const fn = inputKeyboardEvents['KEY'];
        const char = String.fromCharCode(event.keyCode);
        if (CHARS.includes(char) && fn) {
            fn(char);
            return false;
        }
    }
};

const exec = async line => {
    const args = line.split(' ');
    const cmd = args.shift();
    history.push(cmd);
    const data = await api[cmd](args);
    print(data);
    commandLoop();
};


function commandLoop() {
    input('command', '>>> ', (err, line) => {
        exec(line);
        commandLoop();
    });
}

function clear() {
    const elements = controlBrowse.children;
    let element;
    for (let i = elements.length - 2; i > 5; i--) {
        element = elements[i];
        controlBrowse.removeChild(element);
    }
    history = ['help'];
    iterator = 0;
}

function loadHandler() {
    const commonImg = document.getElementById('commonImg');
    const body = document.getElementsByTagName('body')[0];

    if (isMobile()) {
        console.log('Is mobile');
        body.style.fontSize = '11pt';
        commonImg.style.width = '100%';
    } else {
        console.log('Is not mobile');
        body.style.fontSize = '13pt';
        commonImg.style.height = '256px';
    }

    panelScroll = document.getElementById('panelScroll');
    controlInput = document.getElementById('controlInput');
    controlKeyboard = document.getElementById('controlKeyboard');
    controlBrowse = document.getElementById('controlBrowse');
    controlScroll = document.getElementById('controlScroll');
    initKeyboard();
    initScroll();

    print([
        'Hi👋',
        'This is progressive web application with my CV.',
        'Enter command to familiar with my cv 👇',
    ].concat(help));
    commandLoop();
}

window.addEventListener('load', loadHandler);

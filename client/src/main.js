import './style.css';
import { bootGame } from './game/bootGame.js';
import { unit_manager } from "./game/unit_manager.js";
import { socket } from "./game/managers/SocketManager.js";

const params = new URLSearchParams(window.location.search);
const isDebug = params.has('debug');

// if (!import.meta.env.DEV) {
if (true) {
    console.log(
        '%cStop!',
        'color: red; font-size: 32px; font-weight: bold;'
    );

    console.log(
        '%cThis is a developer console. Do not paste code here unless you understand it.',
        'color: crimson; font-size: 14px;'
    );
    console.log(`
   ███████████████████████████████████
   █  HACKER TERMINAL - ROOT ACCESS  █
   ███████████████████████████████████

                // | \\
               ||     ||
               ||     ||
                '-----'
               ||     ||
               ||     ||
               ||     ||
              _||_   _||_
             /    \\ /    \\
           |      | |     |
            \\_____/\\_____/
`);
}

if (isDebug) {
    import('eruda').then((eruda) => {
        eruda.default.init();

        const entry = document.querySelector('.eruda-entry-btn');

        if (entry) {
            entry.style.left = 'auto';
            entry.style.right = '10vw';
            entry.style.top = '10vh';
            entry.style.bottom = 'auto';
        }
    });
}

async function startGame() {
    if (document.fonts?.load) {
        await document.fonts.load('16px "JungleAdventurer"');
    }

    bootGame('app');
}

startGame();


//socket
unit_manager.socket = socket;

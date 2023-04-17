import socket from './socket.js';

// Capturem events dels botons de la pàgina principal
const crearPartida = document.getElementById("crearPartida");
crearPartida.addEventListener("click", crearPartidaAdmin);
const jugarPartida = document.getElementById("jugarPartida");
jugarPartida.addEventListener("click", jugarPartidaClient);

function crearPartidaAdmin () {

    window.location.href = 'crearPartida.html';

}

function jugarPartidaClient() {

    window.location.href = 'jugarPartida.html';

}
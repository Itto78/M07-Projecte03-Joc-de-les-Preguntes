const socket = io({
    autoConnect: false
}); // Obre una conecció amb el servidor

// Capturem events dels botons de la pàgina principal
const crearPartida = document.getElementById("crearPartida");
crearPartida.addEventListener("click", crearPartidaAdmin);
const jugarPartida = document.getElementById("jugarPartida");
jugarPartida.addEventListener("click", jugarPartidaClient);

function crearPartidaAdmin () {
    socket.connect();
    window.location.href = 'crearPartida.html';
}

function jugarPartidaClient() {
    socket.connect();
    window.location.href = 'jugarPartida.html';
}
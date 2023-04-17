
import socket from './socket.js';

const seleccioTematica = document.getElementById("seleccioTematica");
seleccioTematica.addEventListener("click", generarPreguntes);

async function generarPreguntes() {
    const tematica = document.getElementById("tematica").value;
    switch (tematica) {
        case "popurri":
            var preguntes = await fetch('/preguntesRandom')
            .then(response => response.json());
            console.log(preguntes);
            
            break;
    
        default:
            var preguntes = await fetch('/preguntes/' + tematica)
            .then(response => response.json());
            console.log(preguntes);
            break;
    }
}

socket.connect();

socket.emit('join room', 'my-room');

socket.on('users', function(users){

    console.log(users)

    // const div = document.getElementById(container);
    // users.map(user =>{
    //     const div
    // })
})
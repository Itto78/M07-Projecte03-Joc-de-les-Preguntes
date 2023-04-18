import socket from './socket.js';
const ButtonPartida = document.getElementById('començarJoc');
ButtonPartida.addEventListener('click', carregarJoc);
const seleccioTematica = document.getElementById("seleccioTematica");
seleccioTematica.addEventListener("click", generarPreguntes);

var preguntes = [];

async function generarPreguntes() {
    const tematica = document.getElementById("tematica").value;
    switch (tematica) {
        case "popurri":
            // preguntes = await fetch('/preguntesRandom')
            // .then(response => response.json());   
            socket.emit('carregaPopurri');       
            break;
    
        default:
            // preguntes = await fetch('/preguntes/' + tematica)
            // .then(response => response.json());
            socket.emit('carregaTema', {tematica});
            break;
    }
    // if(preguntes.length != 0){
    //     console.log(preguntes)
    //     començarPartida.removeAttribute('disabled','');
    // }
}

socket.on('elements carregats', function(response){
    console.log(response)
    if(response) {
        ButtonPartida.removeAttribute('disabled','');
    }
});

function carregarJoc(){
    // Temporizador que va de 10 a 0
    var contador = 10;
    var temporizador = setInterval(function() {
        console.log(contador);
        contador--;
        if (contador < 0) {
            clearInterval(temporizador);
            començarJoc();
            console.log("¡Tiempo terminado!");
        }
    }, 1000);
}

function començarJoc(){
    console.log('comença el joc')
    socket.emit('començarJoc');
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
import socket from './socket.js';
const ButtonPartida = document.getElementById('començarJoc');
ButtonPartida.addEventListener('click', carregarJoc);
const seleccioTematica = document.getElementById("seleccioTematica");
seleccioTematica.addEventListener("click", generarPreguntes);
const selectTematica = document.getElementById("tematica");
const tornarEnrere = document.getElementById("tornarEnrere");
tornarEnrere.addEventListener("click", tornarAlSelect);
const pregunta = document.getElementById("pregunta");
const respostesPregunta = document.getElementById("respostesPregunta");
const respostesPreguntaA = document.getElementById("respostesPreguntaA");
const respostesPreguntaB = document.getElementById("respostesPreguntaB");
const respostesPreguntaC = document.getElementById("respostesPreguntaC");
const respostesPreguntaD = document.getElementById("respostesPreguntaD");
const temporitzador = document.getElementById("temporitzador");
const podiProvisional = document.getElementById("podiProvisional");
const bodyPodiProvisional = document.getElementById("bodyPodiProvisional");
const seguentPregunta = document.getElementById("seguentPregunta");
seguentPregunta.addEventListener('click', continuarJoc);
const reiniciaJoc = document.getElementById('reiniciaJoc');
reiniciaJoc.addEventListener('click', reiniciJoc)

async function generarPreguntes() {

    const tematica = document.getElementById("tematica").value;

    switch (tematica) {
        case "popurri":
            // Enviem l'event 'carregaPopurri'
            socket.emit('carregaPopurri');       
            break;
    
        default:
            // Enviem l'event 'carregaTema' al servidor per a llegir les preguntes, 
            // de la temàtica seleccionada, de l'arxiu .json
            socket.emit('carregaTema', {tematica});
            break;
    }
}

function tornarAlSelect() {
    socket.emit('reiniciaJugadors');
    selectTematica.removeAttribute("hidden");
    seleccioTematica.removeAttribute("hidden");
    ButtonPartida.setAttribute("hidden", true);
    tornarEnrere.setAttribute("hidden", true);
}

// Es rep l'event de 'elements carregats'
socket.on('elements carregats', function(response){
    // Habilitem o deshabilitem el botons corresponents
    if(response) {
        selectTematica.setAttribute("hidden", true);
        seleccioTematica.setAttribute("hidden", true);
        ButtonPartida.removeAttribute("hidden");
        tornarEnrere.removeAttribute("hidden");
    }
});

socket.on('mostrarCompteEnrere', (segons, estat) => {
    if (!estat) {
        titol.innerHTML = "La partida començarà en " + segons + " segons &#x1F601;";
        ButtonPartida.setAttribute("hidden", true);
        tornarEnrere.setAttribute("hidden", true);
        reiniciaJoc.classList.add("ocultar");
    } else {
        temporitzador.innerHTML = `${segons} s`;
    }
});

socket.on('mostrarPregunta', (enunciat, respostes, numPregunta) => {
    respostesPregunta.classList.remove("ocultar");
    respostesPregunta.classList.add("respostesPregunta");
    reiniciaJoc.classList.add("ocultar");
    titol.innerHTML = `Pregunta ${numPregunta}`;
    temporitzador.innerHTML = "10 s";
    pregunta.classList.remove("ocultar");
    pregunta.innerHTML = `${enunciat}`;
    respostesPreguntaA.innerHTML = `A. ${respostes[0]}`;
    respostesPreguntaB.innerHTML = `B. ${respostes[1]}`;
    respostesPreguntaC.innerHTML = `C. ${respostes[2]}`;
    respostesPreguntaD.innerHTML = `D. ${respostes[3]}`;
});

socket.on('mostrarPodi', (usuaris, partidaFinalitzada, numeroPeguntes) => {
    if (partidaFinalitzada) {
        titol.innerHTML = "CLASSIFICACIÓ FINAL";
        seguentPregunta.setAttribute("hidden", true);
        tornarEnrere.removeAttribute("hidden");
        reiniciaJoc.classList.remove("ocultar");
    } else {
        titol.innerHTML = "CLASSIFICACIÓ";
        seguentPregunta.removeAttribute("hidden");
    }
    respostesPregunta.classList.remove("respostesPregunta");
    respostesPregunta.classList.add("ocultar");
    pregunta.classList.add("ocultar");
    temporitzador.classList.add("ocultar");
    podiProvisional.classList.remove("ocultar");
    podiProvisional.classList.add("podiProvisional");
    reiniciaJoc.classList.remove("ocultar");
    bodyPodiProvisional.innerHTML = "";
    usuaris.forEach(usuari => {
        let encerts = usuari.nombreEncerts / numeroPeguntes * 100;
        let errors = usuari.nombreErrors / numeroPeguntes * 100;
        let tr = document.createElement('tr');
        let tdNickname = document.createElement('td');
        let tdPuntuacio = document.createElement('td');
        let tdEncertsErrors = document.createElement('td');
        tdNickname.innerHTML = usuari.username;
        tdPuntuacio.innerHTML = usuari.puntuacio;
        tdEncertsErrors.innerHTML = Math.round(encerts)  + "% / " + Math.round(errors) + "%";
        tr.appendChild(tdNickname);
        tr.appendChild(tdPuntuacio);
        tr.appendChild(tdEncertsErrors);
        bodyPodiProvisional.appendChild(tr);
    });
});

function reiniciJoc(){
    socket.emit('reiniciaJugadors');
    carregarJoc();
}

function carregarJoc(){
    podiProvisional.classList.add("ocultar");
    podiProvisional.classList.remove("podiProvisional");
    socket.emit('reinici');
    socket.emit('compteEnrere');
}

function continuarJoc() {
    podiProvisional.classList.remove("podiProvisional");
    podiProvisional.classList.add("ocultar");
    temporitzador.classList.remove("ocultar");
    pregunta.classList.remove("ocultar");
    socket.emit('continuarJoc');
}

// Establim connexió amb el servidor
socket.connect();

// Enviem l'event 'join room' al servidor per a unir-se a la sala 'my-room'
socket.emit('join room', 'my-room');

socket.emit('reinici');
socket.emit('reiniciaJugadors');

socket.on('users', function(users){
    console.log(users);
});
import socket from './socket.js';

const titol = document.getElementById("titol");
const nickname = document.getElementById("nickname");
const usuaris = document.getElementById("usuaris");
const respostes = document.getElementById("respostes");
const error = document.getElementById("error");
var body = document.getElementsByTagName("body");

const a = document.getElementById("a");
a.addEventListener("click", enviarResposta);
const b = document.getElementById("b");
b.addEventListener("click", enviarResposta);
const c = document.getElementById("c");
c.addEventListener("click", enviarResposta);
const d = document.getElementById("d");
d.addEventListener("click", enviarResposta);

const historic = document.getElementById("historic");

const nicknameInput = document.getElementById("nicknameInput");
const sendButton = document.getElementById("sendButton");
sendButton.addEventListener("click", send);

let totalPreguntesRespostes, childrens, id, preguntaActual;

function send() {
    if (nicknameInput.value !== "") {
        error.innerHTML = "";
        // Envia un missatge tipus nickname, la primera part ("") 
        // es configurable excepte paraules reservades segona part 
        // el contingut (,)
        socket.connect();
        socket.emit("nickname", {nickname: nicknameInput.value} )
    } else error.innerHTML = "El nom és obligatori";
};


socket.on('nickname rebut', function(data) {

    // document.cookie = 'id=' +data.id;
    id = data.id;
    socket.emit('join room', 'my-room');

    socket.emit('get users', {});

});

socket.on('users', function(users){
    
    titol.innerHTML = "Esperant a la resta de jugadors &#x1F634;...";
    nickname.remove(); // Esborra l'input de crear nickname
    usuaris.innerHTML = ""; // Reseteja el llistat d'usuaris que es moestren per pantalla

    // Mostrem el llistat d'usuaris per pantalla
    (users.users).forEach(usuari => {
        console.log(usuari)
        if(id == usuari.userID) totalPreguntesRespostes = usuari.historic;
        var span = document.createElement("span");
        span.innerText = usuari.username;
        usuaris.appendChild(span);
    });

});

socket.on('numeroPeguntes', function(data){
    historic.classList.remove('ocultar');
    for (let index = 0; index < data.numeroPeguntes; index++) {
        const div = document.createElement('div');
        div.innerText = index + 1;
        div.setAttribute('class', 'historic divNull');
        historic.appendChild(div);
    };

    preguntaActual = data.numPregunta;

    childrens = historic.children;
    modificarHistoric();
});

function modificarHistoric(){
    if(!childrens) return;

    for (const children of childrens) {
        let posicio = parseInt(children.textContent);

        children.classList.toggle('preguntaActual', posicio == preguntaActual);

        console.log(totalPreguntesRespostes)

        if(totalPreguntesRespostes[posicio - 1] === false) children.classList.replace('divNull', 'divIncorrecta');
        if(totalPreguntesRespostes[posicio - 1] === true) children.classList.replace('divNull', 'divCorrecta');        
    }
}

socket.on('mostrarCompteEnrere', (segons, estat) => {
    if (!estat) titol.innerHTML = "La partida començarà en " + segons + " segons &#x1F631;";
});

socket.on('carregarRespostes', () => {
    body[0].className = '';
    body[0].classList.add("gradient");
    titol.innerHTML = "Escull la resposta CORRECTA";
    usuaris.setAttribute("hidden", true);
    usuaris.classList.remove("usuaris");
    usuaris.classList.add("ocultar");
    respostes.classList.remove("ocultar");
    respostes.classList.add("respostes");
});

function enviarResposta(event) {
    titol.innerHTML = "Esperant a la resta de companys... &#x1F928;";
    respostes.classList.remove("respostes");
    respostes.classList.add("ocultar");
    socket.emit('enviarResposta', event.target.innerHTML);
}

socket.on('canviarFons', estado => {
    body[0].classList.remove("gradient");
    if (estado) {
        body[0].classList.add("green");
        titol.innerHTML = "Molt Bé!!! &#x1F603; &#x1F60D; &#x1F973;";
    } else {
        body[0].classList.add("red");
        titol.innerHTML = "En serio... &#x1F62B; &#x1F480; &#x1F64A;";
    }
});

socket.on('modificarHistoric', function(data){
    if(!childrens) return;

    for (const children of childrens) {
        let posicio = parseInt(children.textContent);

        children.classList.toggle('preguntaActual', posicio == data.numPregunta);

        if(totalPreguntesRespostes[posicio - 1] === false) children.classList.replace('divNull', 'divIncorrecta');
        if(totalPreguntesRespostes[posicio - 1] === true) children.classList.replace('divNull', 'divCorrecta');        
    }

});
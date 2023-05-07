import socket from './socket.js';

const titol = document.getElementById("titol");
const nickname = document.getElementById("nickname");
const usuaris = document.getElementById("usuaris");
const divPregunta = document.getElementById("pregunta");
const divRespostes = document.getElementById("respostes");
const podi = document.getElementById("podi");
const temps = document.getElementById('temps');
const historic = document.getElementById("historic");

const nicknameInput = document.getElementById("nicknameInput");
const sendButton = document.getElementById("sendButton");
sendButton.addEventListener("click", send);

let preguntaActual = 0;
let totalPreguntesRespostes;

function send() {
    // Envia un missatge tipus nickname, la primera part ("") 
    // es configurable excepte paraules reservades segona part 
    // el contingut (,)
    socket.connect();
    socket.emit("nickname", {nickname: nicknameInput.value} )
};


socket.on('nickname rebut', function(data) {

    socket.emit('join room', 'my-room');

    socket.emit('get users', {});

});

socket.on('users', function(data){
    const users = data.users;

    console.log(users)
    nickname.remove();
    usuaris.innerHTML = '';
    for (let i in users){
        const span = document.createElement('span');
        span.textContent = users[i].username + '    ' + users[i].puntuacio;
        usuaris.appendChild(span);
        totalPreguntesRespostes = users[i].historic;
    }

});

socket.on('pregunta', function(response){
    const {pregunta, respostes , correcta} = response;
    divRespostes.removeAttribute('disabled', '');
    if(totalPreguntesRespostes != 0) preguntaActual++;
    modificarHistoric();
    let count = 10;
    temps.innerText = count + 's'
    let setTemps = setInterval(function() {
        count--;
        temps.innerText = count + 's';
        if(count == 0){
            clearInterval(setTemps);
            if(!divRespostes.getAttribute('disabled')) resposta(null, correcta)
            respostaCorrecte(correcta);
            socket.emit('get users', {});
        }
    }, 1000);

    divPregunta.innerText = pregunta;

    divRespostes.innerHTML = '';

    for (let i in respostes) {
        const button = document.createElement('button');
        button.textContent = `${respostes[i]}`;
        button.setAttribute('class','respostes');
        button.addEventListener('click',() => resposta(respostes[i], correcta));
        divRespostes.appendChild(button);
    }

});

socket.on('numTotalPreg', function(data){
    for (let index = 0; index < data.numTotalPreg; index++) {
        const div = document.createElement('div');
        div.innerText = index + 1;
        div.setAttribute('class', 'historic');
        historic.appendChild(div);
    }
});

function resposta(resposta, correcta){
    divRespostes.setAttribute('disabled', '');
    socket.emit('resposta', {resposta, correcta});
}

function respostaCorrecte(correcta){
    let respostes = document.getElementsByClassName('respostes');
    console.log(respostes[1])
    for(let i = 0; i < 4; i++){
        if(respostes[i].textContent !== correcta) {
            respostes[i].classList.add('incorrecta');
        }
        else respostes[i].classList.add('correcta');
    }

}

function modificarHistoric(){
    const children = historic.children;
    for (const i of children) {
        if(i == preguntaActual){
            children[i].classList.add('preguntaActual')
        }
    }
}



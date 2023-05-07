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

let preguntaActual = 1;
let totalPreguntesRespostes, childrens, id;

function send() {
    // Envia un missatge tipus nickname, la primera part ("") 
    // es configurable excepte paraules reservades segona part 
    // el contingut (,)
    socket.connect();
    socket.emit("nickname", {nickname: nicknameInput.value} )
};


socket.on('nickname rebut', function(data) {

    console.log(data);

    // document.cookie = 'id=' +data.id;
    id = data.id;
    socket.emit('join room', 'my-room');

    socket.emit('get users', {});

});

socket.on('users', function(data){
    const users = data.users;

    // const id = getCookieValue('id');

    console.log({users, id})
    nickname.remove();
    usuaris.innerHTML = '';
    for (let i in users){
        if(id == users[i].userID) totalPreguntesRespostes = users[i].historic;
        const span = document.createElement('span');
        span.textContent = 'nickName: ' + users[i].username + ' puntuacio: ' + users[i].puntuacio + " percentatje d'accerts: " 
        + calcularPercentatjes(users[i].numeroEncerts) + "% percentatjes d'errros: " + calcularPercentatjes(users[i].numeroErrors) + '%';
        usuaris.appendChild(span);
        const br = document.createElement('br');
        usuaris.appendChild(br);
    }

});

socket.on('pregunta', function(response){
    const {pregunta, respostes , correcta} = response;
    console.log(correcta);
    modificarHistoric();
    let count = 10;
    temps.innerText = count + 's'
    let setTemps = setInterval(function() {
        count--;
        temps.innerText = count + 's';
        if(count == 0){
            clearInterval(setTemps);
            if(!divRespostes.firstChild.hasAttribute('disabled')) resposta(null, correcta);
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
        div.setAttribute('class', 'historic divNull');
        historic.appendChild(div);
    }
    
    childrens = historic.children;
    modificarHistoric();
});

socket.on('final', function(){
    socket.emit('get users', {});
    modificarHistoric();
})

function resposta(resposta, correcta){
    let buttons = divRespostes.children;
    for (const button of buttons) {
        button.setAttribute("disabled","");
    }
    socket.emit('resposta', {resposta, correcta});

}

function respostaCorrecte(correcta){
    let respostes = document.getElementsByClassName('respostes');

    for(let i = 0; i < 4; i++){
        if(respostes[i].textContent !== correcta) {
            respostes[i].classList.add('incorrecta');
        }
        else respostes[i].classList.add('correcta');
    }

}

function modificarHistoric(){
    if(!childrens) return;
    
    if(totalPreguntesRespostes.length != 0) {
        preguntaActual++;
    }

    for (const children of childrens) {
        let posicio = parseInt(children.textContent);

        children.classList.toggle('preguntaActual', posicio == preguntaActual);

        if(totalPreguntesRespostes[posicio - 1] === false) children.classList.replace('divNull', 'divIncorrecta');
        if(totalPreguntesRespostes[posicio - 1] === true) children.classList.replace('divNull', 'divCorrecta');        
    }
}

function calcularPercentatjes(num){
    if(childrens === undefined) return 0;
    let numTotalPreguntes = childrens.length;

    let percentatje = (num / numTotalPreguntes) * 100;
    return percentatje;
}

function getCookieValue(name) {
    var cookies = document.cookie.split("; ");
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].split("=");
        if (cookie[0] === name) {
            return decodeURIComponent(cookie[1]);
        }
    }
    return "";
}

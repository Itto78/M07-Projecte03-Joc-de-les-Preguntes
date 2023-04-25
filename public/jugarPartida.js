import socket from './socket.js';

const titul = document.getElementById("titul");
const respostes = document.getElementById("respostes");
const podi = document.getElementById("podi");

const nicknameInput = document.getElementById("nicknameInput");
const sendButton = document.getElementById("sendButton");
sendButton.addEventListener("click", send)

function send() {
    // Envia un missatge tipus nickname, la primera part ("") es configurable excepte paraules reservades segona part el contingut (,)
    socket.connect();
    socket.emit("nickname", {nickname: nicknameInput.value} )
};

socket.on('nickname rebut', function(data) {

    socket.emit('join room', 'my-room');

    socket.emit('get users', {});

});

socket.on('users', function(users){
    console.log(users.users)

});

socket.on('pregunta',function(response){
    console.log(response)

    titul.innerText = response.pregunta;

    respostes.innerHTML = '';

    for (let propietat in response.respostes) {
        const button = document.createElement('button');
        button.textContent = `${propietat}: ${response.respostes[propietat]}`;
        button.addEventListener('click',() => resposta(response.respostes[propietat], response.correcta));
        respostes.appendChild(button);
    }

    let count = 10;
    let setTemps = setInterval(function() {
        count--;
        console.log(count);

        if(count == 0){
            clearInterval(setTemps)
        }
    }, 1000);

});

function resposta(resposta, correcta){
    respostes.innerHTML = '';
    socket.emit('resposta',{resposta, correcta});
}



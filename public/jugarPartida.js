import socket from './socket.js';

const nicknameInput = document.getElementById("nicknameInput");
const sendButton = document.getElementById("sendButton");
sendButton.addEventListener("click", send)

function send() {
    // Envia un missatge tipus nickname, la primera part ("") es configurable excepte paraules reservades segona part el contingut (,)
    socket.connect();
    socket.emit("nickname", {nickname: nicknameInput.value} )
};

socket.on('nickname rebut', function(data) {

    socket.connect();

    socket.emit('get users', {});
    socket.emit('join room', 'my-room');

});

socket.on('users', function(users){
    console.log(users);
})
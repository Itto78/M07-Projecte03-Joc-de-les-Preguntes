
const socket = io(); // Obre una conecció amb el servidor

const nicknameInput = document.getElementById("nicknameInput");
const sendButton = document.getElementById("sendButton");
sendButton.addEventListener("click", send)

function send() {
    // Envia un missatge tipus nickname, la primera part ("") es configurable excepte paraules reservades segona part el contingut (,)
    socket.emit("nickname", {nickname: nicknameInput.value} )
}

socket.on('nickname rebut', function(data) {

    console.log(data)

})


socket.on('time', function(data) {

    console.log(data)

})


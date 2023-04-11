const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const fs = require('fs');

const app = express();
const httpServer = createServer(app);

app.use(express.static("public"));
app.use(express.json());

const io = new Server(httpServer, {});

function enviar() {
	console.log("enviant missatge");
	io.emit("time", { message: "Hola" });
}

// connection es una paraula reservada
io.on("connection", socket => {
	console.log("Connectat un client...");

	socket.on("nickname", function (data) {
		console.log(data.nickname);

		// Cada socket es individual
		socket.data.nickname = data.nickname;

		// respondre al que ha enviat
		socket.emit("nickname rebut", { response: "ok" });

		// respondre a la resta de clients menys el que ha enviat
		socket.broadcast.emit("nickname rebut", {
			response: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		});

		// Totes les funcions disponibles les tenim a
		//  https://socket.io/docs/v4/emit-cheatsheet/
	});

    socket.on("disconnect", function(){
        console.log('Usuari desconectat');
    })
});

app.get('/esports', (req, res) => {
	const path = './preguntes/esports.json';
	fs.readFile(path, 'utf-8', (err, data) => {
		if (err) {
			console.log(err);
			return;
		}
		res.status(200).json({preguntes: JSON.parse(data)});
	});
});

httpServer.listen(3000, () =>
	console.log(`Server listening at http://localhost:3000`),
);
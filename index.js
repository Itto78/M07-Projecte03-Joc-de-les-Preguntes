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

	socket.on('join room', function(room) {
		socket.join(room);
		console.log(`El socket ${socket.id} se unió a la sala ${room}`);
	});

	socket.on("nickname", function (data) {

		// Cada socket es individual
		socket.data.nickname = data.nickname;
		socket.data.puntuacio = 0;

		// respondre al que ha enviat
		socket.emit("nickname rebut", { response: "ok" });

		// respondre a la resta de clients menys el que ha enviat
		// socket.broadcast.emit("nickname rebut", {});

		// Totes les funcions disponibles les tenim a
		//  https://socket.io/docs/v4/emit-cheatsheet/
	});

	socket.on("get users", function (data) {
		const users = [];

		for (let [id, socket] of io.of("/").sockets) {
			console.log(socket.data.nickname)
			users.push({
				userID: id,
				username: socket.data.nickname,
				puntuacio: socket.data.puntuacio
			});
		}

		// socket.broadcast.emit("users", {users});
		io.to('my-room').emit('users', {users});
	});

    socket.on("disconnect", function(){
        console.log('Usuari desconectat');
    })
});

app.get('/preguntes/:tematica', (req, res) => {
	const path = './preguntes/' + req.params.tematica + '.json';
	fs.readFile(path, 'utf-8', (err, data) => {
		if (err) {
			console.log(err);
			return;
		}
		res.status(200).json({preguntes: JSON.parse(data)});
	});
});

app.get('/preguntesRandom', (req, res) => {

	const preguntes = [];

	const nomFitxers=['artILiteratura','ciencia','historia','esports','geografia','naturalesa'];

	Promise.all(nomFitxers.map(nom => {
	let path = './preguntes/' + nom + '.json';

	return new Promise((resolve, reject) => {
		fs.readFile(path, 'utf-8', (err, data) => {
		if (err) {
			console.log(err);
			reject(err);
			return;
		}

		let arrayPosPreguntes = [];
		let arrayPreguntes = JSON.parse(data);

		for (let i = 0; i < 5; i++) {
			let posPregunta = Math.floor(Math.random() * arrayPreguntes.length);

			if (!arrayPosPreguntes.includes(posPregunta)) {
				arrayPosPreguntes.push(posPregunta);
				preguntes.push(arrayPreguntes[posPregunta]);
			} else {
				i--;
			}
		}

		resolve();
		});
	});
	})).then(() => {
		console.log(preguntes);
		res.status(200).json({preguntes});
	}).catch(err => {
		console.log(err);
		res.status(500).send('Error');
	});

});

httpServer.listen(3000, () =>
	console.log(`Server listening at http://localhost:3000`),
);
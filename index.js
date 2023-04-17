// S'importa el mòdul 'express' per a poder definir rutes i controladors
const express = require("express");
// S'importa la funció 'createServer' del mòdul 'http'
const { createServer } = require("http");
// S'importa la classe 'Server' del mòdul 'socket.io'
const { Server } = require("socket.io");
// S'importa el mòdul 'fs' per a poder treballar amb arxius
const fs = require('fs');

// Es crea una instància a l'aplicació web en express i s'assigna a la variable 'app'
const app = express();
// S'utilitza la funció 'createServer' importada anteriorment per a crear el servidor 
// HTTP i assignar-lo a la variable 'httpServer'
const httpServer = createServer(app);

// El mètode 'use' de l'aplicació web en express serveix per a afegir middlewares.
// S'afegeix el middleware que subministra els arxius estàtics des del directori 'public'
app.use(express.static("public"));
// S'afegeix el middleware per a analitzar el cos de les sol·licituds com a objectes JSON
app.use(express.json());

// Es crea una instància de la classe 'Server' importada anteriorment i se li passa
// per paràmetre el servidor 'httpServer'
const io = new Server(httpServer, {});


function enviar() {
	console.log("enviant missatge");
	io.emit("time", { message: "Hola" });
}

// io - serveix per al tractament d'events entre el servidor i el client

// io.emit('nom_event',{objecte JSON})- Aquest mètode envia un event a tots 
// 		els clients connectats. El primer paràmetre és el nom de l'event i el 
// 		segon paràmetre són les dades que s'envien.



// connection es una paraula reservada
io.on("connection", socket => {
	console.log("Connectat un client...");

	socket.on("nickname", function (data) {
		// console.log(data.nickname);

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

	socket.on("get users", function (data) {
		const users = [];

		for (let [id, socket] of io.of("/").sockets) {
			console.log(socket.data)
			if (socket.data.tipus == "jugador") {
				users.push({
					userID: id,
					username: socket.data.nickname,
				});
			}
		}

		socket.broadcast.emit("users", {users});
		// ...
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
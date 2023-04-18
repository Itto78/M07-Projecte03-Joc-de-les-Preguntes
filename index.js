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

	socket.on('join room', function(room) {
		socket.join(room);
		console.log(`El socket ${socket.id} se unió a la sala ${room}`);
	});

	socket.on("nickname", function (data) {

		// Cada socket es individual
		socket.data.nickname = data.nickname;
		socket.data.puntuacio = 0;

		// respondre al que ha enviat
		if(socket.data.nickname != '') socket.emit("nickname rebut", { response: "ok" });
		else socket.emit("nickname rebut", { response: "false", message: 'El camp no pot estar vuit' });

		// respondre a la resta de clients menys el que ha enviat
		// socket.broadcast.emit("nickname rebut", {});

		// Totes les funcions disponibles les tenim a
		//  https://socket.io/docs/v4/emit-cheatsheet/
	});

	socket.on("get users", function (data) {
		const users = [];

		for (let [id, socket] of io.of("/").sockets) {
			if(socket.data.nickname){
				users.push({
					userID: id,
					username: socket.data.nickname,
					puntuacio: socket.data.puntuacio
				});
			}
		}

		io.to('my-room').emit('users', {users});
	});

	socket.on('carregaPopurri',function(){
		const preguntes = [];

		const nomFitxers=['artILiteratura', 'ciencia', 'historia', 'esports', 'geografia', 'naturalesa'];

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
			if(preguntes.length != 0 ){
				socket.data.preguntes = preguntes;
				socket.emit('elements carregats',{response: true});
			}
			else socket.emit('elements carregats',{response: false});
		}).catch(err => {
			console.log(err);
			res.status(500).send('Error');
		});
	});

	let correcta;

	socket.on('carregaTema', function (data){
		const path = './preguntes/' + data.tematica + '.json';
		fs.readFile(path, 'utf-8', (err, data) => {
			if (err) {
				socket.emit('elements carregats',{response: false});
				return;
			}
			socket.data.preguntes = data;
			socket.emit('elements carregats',{response: true});
			
		});
	})
		// correcta={...des};

	socket.on('començarJoc', function(){
		console.log('comença el joc')

		const des = seleccionarPreguntaAleatoria();
		const { pregunta, respostes} = {...des};
		correcta = {...des};

		socket.broadcast.emit('pregunta', {pregunta, respostes});

		let count = 0;

		intervalId = setInterval(function() {
			const des = seleccionarPreguntaAleatoria();
			const { pregunta, respostes} = {...des};
			correcta = {...des};
			socket.broadcast.emit('pregunta', {pregunta, respostes});
			count++;
			if (count > JSON.parse(socket.data.preguntes).length) {
				clearInterval(intervalId);
			}
		}, 10000);

	});

	socket.on('resposta', function(data){
		if(correcta == data.resposta) socket.data.puntuacio++;
	});

    socket.on("disconnect", function(){
        console.log('Usuari desconectat');
    });

	let preguntasEnviadas = [];

	function seleccionarPreguntaAleatoria() {
		let preguntasDisponibles = JSON.parse(socket.data.preguntes).filter(pregunta => !preguntasEnviadas.includes(pregunta));
		if (preguntasDisponibles.length === 0) {
		  preguntasEnviadas = [];
		  preguntasDisponibles = JSON.parse(socket.data.preguntes);
		}
		const preguntaSeleccionada = preguntasDisponibles[Math.floor(Math.random() * preguntasDisponibles.length)];
		preguntasEnviadas.push(preguntaSeleccionada);
		return preguntaSeleccionada;
	}
});

// app.get('/preguntes/:tematica', (req, res) => {
// 	const path = './preguntes/' + req.params.tematica + '.json';
// 	fs.readFile(path, 'utf-8', (err, data) => {
// 		if (err) {
// 			console.log(err);
// 			return;
// 		}
// 		res.status(200).json({preguntes: JSON.parse(data)});
// 	});
// });

// app.get('/preguntesRandom', (req, res) => {

// 	const preguntes = [];

// 	const nomFitxers=['artILiteratura', 'ciencia', 'historia', 'esports', 'geografia', 'naturalesa'];

// 	Promise.all(nomFitxers.map(nom => {
// 	let path = './preguntes/' + nom + '.json';

// 	return new Promise((resolve, reject) => {
// 		fs.readFile(path, 'utf-8', (err, data) => {
// 		if (err) {
// 			console.log(err);
// 			reject(err);
// 			return;
// 		}

// 		let arrayPosPreguntes = [];
// 		let arrayPreguntes = JSON.parse(data);

// 		for (let i = 0; i < 5; i++) {
// 			let posPregunta = Math.floor(Math.random() * arrayPreguntes.length);

// 			if (!arrayPosPreguntes.includes(posPregunta)) {
// 				arrayPosPreguntes.push(posPregunta);
// 				preguntes.push(arrayPreguntes[posPregunta]);
// 			} else {
// 				i--;
// 			}
// 		}

// 		resolve();
// 		});
// 	});
// 	})).then(() => {
// 		console.log(preguntes);
// 		res.status(200).json({preguntes});
// 	}).catch(err => {
// 		console.log(err);
// 		res.status(500).send('Error');
// 	});

// });

httpServer.listen(3000, () =>
	console.log(`Server listening at http://localhost:3000`),
);
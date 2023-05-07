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

// io - serveix per al tractament d'events entre el servidor i el client

// io.emit('nom_event',{objecte JSON})- Aquest mètode envia un event a tots 
// 		els clients connectats. El primer paràmetre és el nom de l'event i el 
// 		segon paràmetre són les dades que s'envien.



// Obrim connexió amb el socket on establim una serie de d'events que s'escoltaràn
// directament d'aquest client
io.on("connection", socket => {
	// Informem de que el client s'acaba de connectar
	console.log("Connectat un client...");

	// Agreguem el socket a la sala compartida 'my-room'
	socket.on('join room', function(room) {
		socket.join(room);
		console.log(`El socket ${socket.id} se unió a la sala ${room}`);
	});

	socket.on("nickname", function (data) {

		// Cada socket es individual
		socket.data.nickname = data.nickname;
		socket.data.puntuacio = 0;
		socket.data.historic = [];
		socket.data.numeroEncerts = 0;
		socket.data.numeroErrors = 0;
		socket.data.respostes = [];

		// respondre al que ha enviat
		if(socket.data.nickname != '') socket.emit("nickname rebut", { response: "ok", id: socket.id });
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
					puntuacio: socket.data.puntuacio,
					respostes: socket.data.respostes,
					historic: socket.data.historic,
					numeroEncerts: socket.data.numeroEncerts,
					numeroErrors: socket.data.numeroErrors,
				});
			}
		}

		io.to('my-room').emit('users', {users});
	});

	// Es rep l'event 'carregaPopurri' per part del client
	socket.on('carregaPopurri', function(){
		const preguntes = [];
		var nomFitxers = [];

		const directori = './preguntes'; // Ruta del directori que es vol llegir
		
		// Guardem les temàtiques a un array
		fs.readdirSync(directori).forEach(nomArxiu => {
			nomFitxers.push(nomArxiu.split('.')[0]);
		});

		// Llegirem un a un tots els arxius del directori /preguntes
		Promise.all(nomFitxers.map(nom => {
			let path = './preguntes/' + nom + '.json';

			return new Promise((resolve, reject) => {
				fs.readFile(path, 'utf-8', (err, data) => {
				if (err) { // si es produeix algún error en la lectura d'algun arxiu
					console.log(err);
					reject(err); // Es rebutja la promesa
					return;
				}

				// Si la lectura s'ha fet correctament, les dades de l'arxiu estaràn
				// a la variable 'data'
				let arrayPosPreguntes = [];
				let arrayPreguntes = JSON.parse(data); // Convertim les preguntes a objecte JSON

				// Guardem 5 preguntes de cada temàtica
				for (let i = 0; i < 5; i++) {
					let posPregunta = Math.floor(Math.random() * arrayPreguntes.length);

					// Comprovem que la pregunta no estigui ja repetida
					if (!arrayPosPreguntes.includes(posPregunta)) {
						arrayPosPreguntes.push(posPregunta);
						preguntes.push(arrayPreguntes[posPregunta]);
					} else {
						i--;
					}
				}

				resolve(); // Donem la promesa com a Resolta satisfactòriament
				});
			});
		})).then(() => { // Una vegada s'hagin llegit tots els arxius, creem la propietat 'preguntes'
						 // a l'objecte 'data' del socket on guardem totes les preguntes.
			if(preguntes.length != 0 ){
				socket.data.preguntes = preguntes;
				// S'envia l'event 'elements carregats' amb un 'true' com a contingut
				socket.emit('elements carregats',{response: true});
			}
			// S'envia l'event 'elements carregats' amb un 'false' com a contingut
			else socket.emit('elements carregats',{response: false});
		}).catch(err => { // En cas d'error en la promesa
			console.log(err);
			res.status(500).send('Error');
		});
	});

	// Es rep l'event 'carregaTema' per part del client i l'argument 'data'
	// coincideix amb el nom de l'arxiu JSON que s'ha de llegir. Aquest
	// arxiu està al directori /preguntes, que és on estan totes les preguntes
	socket.on('carregaTema', function (data){
		const path = './preguntes/' + data.tematica + '.json';
		fs.readFile(path, 'utf-8', (err, data) => {
			if (err) {
				socket.emit('error al carregar', {response: false});
				return;
			}
			// Si la lectura s'ha fet correctament, creem la propietat 'preguntes'
			// a l'objecte 'data' del socket on guardem totes les preguntes.
			socket.data.preguntes = data;
			// S'envia l'event 'elements carregats' amb un 'true' com a contingut
			socket.emit('elements carregats',{response: true});

			
		});
	});

	socket.on('començarJoc', function(){
		console.log('comença el joc')

		seleccionarPreguntaAleatoria();
		io.to('my-room').emit('numTotalPreg', {numTotalPreg: JSON.parse(socket.data.preguntes).length});

		let count = 1;

		let intervalId = setInterval(function() {
			
			count++;
			if (count > JSON.parse(socket.data.preguntes).length) {
				clearInterval(intervalId);
				io.to('my-room').emit('final');
			}
			
			else {
				seleccionarPreguntaAleatoria();
			}
			
		}, 15000);

	});
	
	socket.on('resposta', function(data){
		if(data.resposta == data.correcta) {
			socket.data.puntuacio += 1;
			socket.data.historic.push(true);
			socket.data.numeroEncerts += 1;
		}

		else if(data.resposta == null) socket.data.historic.push(null);

		else {
			socket.data.historic.push(false);
			socket.data.numeroErrors += 1;
		}
		
		socket.data.respostes.push(data.resposta);
	})

    socket.on("disconnect", function(){
        console.log('Usuari desconectat');
    });

	let preguntasEnviadas = [];

	function seleccionarPreguntaAleatoria() {
		let preguntasDisponibles = JSON.parse(socket.data.preguntes).filter(pregunta => {
			if(!preguntasEnviadas.some(preguntaEnviada => preguntaEnviada.pregunta === pregunta.pregunta)) {
				return pregunta;
			}
		});

		if (preguntasDisponibles.length === JSON.parse(socket.data.preguntes).length) {
			preguntasEnviadas = [];
			preguntasDisponibles = JSON.parse(socket.data.preguntes);
		}
		
		const preguntaSeleccionada = preguntasDisponibles[Math.floor(Math.random() * preguntasDisponibles.length)];
		preguntasEnviadas.push(preguntaSeleccionada);

		const { pregunta, respostes, correcta } = {...preguntaSeleccionada};
		io.to('my-room').emit('pregunta', {pregunta, respostes, correcta});
	};

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

// Iniciem el servidor HTTP pel port 3000
httpServer.listen(3000, () =>
	console.log(`Server listening at http://localhost:3000`),
);
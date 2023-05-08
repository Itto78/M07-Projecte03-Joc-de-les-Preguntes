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

var usuaris = [];
var puntuacio = [];
var numRespostes = 0;
var numPregunta = 1;
var preguntaActual;
var numeroPeguntes = 0;
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
					puntuacio: socket.data.puntuacio,
					nombreEncerts: 0
				});
			}
		}

		usuaris = users.slice();
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
				socket.data.preguntes = desordenarPreguntes(preguntes); // Desordenem les preguntes
				numeroPeguntes = (socket.data.preguntes).length;
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
			socket.data.preguntes = desordenarPreguntes(JSON.parse(data)); // Desordenem les preguntes
			numeroPeguntes = (socket.data.preguntes).length;
			// S'envia l'event 'elements carregats' amb un 'true' com a contingut
			socket.emit('elements carregats',{response: true});
		});
	});

	// Funció per a desordenar les preguntes de forma aleatoria
	function desordenarPreguntes(preguntes) {
		for (let i = preguntes.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[preguntes[i], preguntes[j]] = [preguntes[j], preguntes[i]];
		  }
		  return preguntes;
	}

	socket.on('compteEnrere', function(){
		var segons = 2;
		var temporitzador = setInterval( () => {
			io.to('my-room').emit('mostrarCompteEnrere', segons, false);
			segons--;
			if (segons < 0) {
				// segons = 2;
				numRespostes = 0;
				io.to('my-room').emit('carregarRespostes');
				console.log((socket.data.preguntes)[0].correcta);
				let pregunta = (socket.data.preguntes)[0].pregunta;
				let respostes = [(socket.data.preguntes)[0].respostes.a, (socket.data.preguntes)[0].respostes.b, (socket.data.preguntes)[0].respostes.c, (socket.data.preguntes)[0].respostes.d];
				preguntaActual = (socket.data.preguntes).shift();
				io.to('my-room').emit('mostrarPregunta', pregunta, respostes, numPregunta);
				numPregunta++;
				clearInterval(temporitzador);
				mostrarTemporitzador();
			}
		}, 1000);
	});

	socket.on('enviarResposta', resposta => {
		let respostaJugador = {
			socketID: socket.id,
			nickname: socket.data.nickname,
			resposta: resposta.toLowerCase()
		};
		puntuacio.push(respostaJugador);
		numRespostes++;
	});

	socket.on('continuarJoc', () => {
		if ((socket.data.preguntes).length != 0) {
			numRespostes = 0;
			puntuacio = [];
			io.to('my-room').emit('carregarRespostes');
			console.log((socket.data.preguntes)[0].correcta);
			let pregunta = (socket.data.preguntes)[0].pregunta;
			let respostes = [(socket.data.preguntes)[0].respostes.a, (socket.data.preguntes)[0].respostes.b, (socket.data.preguntes)[0].respostes.c, (socket.data.preguntes)[0].respostes.d];
			preguntaActual = (socket.data.preguntes).shift();
			io.to('my-room').emit('mostrarPregunta', pregunta, respostes, numPregunta);
			numPregunta++;
			mostrarTemporitzador();
		} else io.to('my-room').emit('mostrarPodi', usuaris, true);
	});

	function mostrarTemporitzador() {
		var temps = 9;
		// io.to('my-room').emit('mostrarPregunta', numero);
		var temporitzador = setInterval( () => {
			io.to('my-room').emit('mostrarCompteEnrere', temps, true);
			temps--;
			if (temps < 0 || numRespostes == usuaris.length) {
				clearInterval(temporitzador);
				actualitzarPuntuacio();
			}
		}, 1000);
	}

	function actualitzarPuntuacio() {
		// Recuperem la resposta correcta
		let respostes = preguntaActual.respostes;
		let respostaCorrecta = preguntaActual.correcta;
		for (let resposta in respostes) {
			if (respostes[resposta] === respostaCorrecta) {
				respostaCorrecta = resposta;
				break;
			}
		}

		// Comprovem els jugadors que han acertat la pregunta i afegim les puntuacions
		let posicio = 1;
		puntuacio.forEach(respostaJugador => {
			if (respostaJugador.resposta === respostaCorrecta) {
				let jugador = usuaris.filter(usuari => usuari.username === respostaJugador.nickname);
				jugador[0].nombreEncerts++;
				console.log(jugador[0].nombreEncerts);
				if (posicio > 5) jugador[0].puntuacio += 1000;
				else {
					if (posicio == 1) jugador[0].puntuacio += 1500;
					else if (posicio == 2) jugador[0].puntuacio += 1400;
					else if (posicio == 3) jugador[0].puntuacio += 1300;
					else if (posicio == 4) jugador[0].puntuacio += 1200;
					else if (posicio == 5) jugador[0].puntuacio += 1100;
					posicio++;
				}
				io.to(respostaJugador.socketID).emit('canviarFons', true);
			} else io.to(respostaJugador.socketID).emit('canviarFons', false);
		});

		// Ordenem la taula de jugadors per puntuació
		usuaris.sort(function(a, b) {
			return b.puntuacio - a.puntuacio;
		});

		io.to('my-room').emit('mostrarPodi', usuaris, false, numeroPeguntes);

	}

    socket.on("disconnect", function(){
        console.log('Usuari desconectat');
    });

});

// Iniciem el servidor HTTP pel port 3000
httpServer.listen(3000, () =>
	console.log(`Server listening at http://localhost:3000`),
);
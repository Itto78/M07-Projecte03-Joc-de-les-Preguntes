const socket = io({
    autoConnect: false
}); // Obre una conecció amb el servidor

export default socket;
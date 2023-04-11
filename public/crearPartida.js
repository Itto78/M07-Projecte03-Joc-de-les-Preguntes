// ############################################################### //
// ####################  Crear Partida  ########################## //
// ############################################################### //
const seleccioTematica = document.getElementById("seleccioTematica");
seleccioTematica.addEventListener("click", generarPreguntes);

async function generarPreguntes() {
    const tematica = document.getElementById("tematica").value;
    switch (tematica) {
        case "art":
            var preguntes = await fetch('/esports')
            .then(response => response.json());
            console.log(preguntes);
            
            break;
    
        default:
            break;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores y lógica de UI del formulario ---
    // Copia aquí TODOS los selectores y funciones de UI del formulario de dm.js
    // - selectores para #tokenName, #tokenLetter, stats, etc.
    // - función `updateCharStatUI`
    // - función `updateSavingThrowsUI`
    // - función `processImage`

    const addTokenBtn = document.getElementById('addTokenBtn'); // Asegúrate que tu botón tenga este ID
    const PLAYER_LIBRARY_KEY = 'playerCharacterLibrary';

    function getPlayerLibrary() {
        return JSON.parse(localStorage.getItem(PLAYER_LIBRARY_KEY)) || [];
    }

    function saveCharacterToLibrary(characterData) {
        let library = getPlayerLibrary();
        // Lógica para añadir o sobreescribir si ya existe (puedes copiarla de dm.js)
        library.push(characterData); // Versión simple
        localStorage.setItem(PLAYER_LIBRARY_KEY, JSON.stringify(library));
        // Aquí podrías usar tu función showNotification
        alert(`${characterData.identity.name} guardado en tu biblioteca!`);
    }

    async function createCharacterFromForm() {
        // --- COPIA AQUÍ LA LÓGICA DE RECOLECCIÓN DE DATOS de `createTokenFromForm` en `dm.js` ---
        // 1. Validar y recolectar datos del formulario
        const letter = document.getElementById('tokenLetter').value.trim();
        const name = document.getElementById('tokenName').value.trim();
        if (!letter || !name) {
            alert('Nombre y Letra son obligatorios.');
            return;
        }

        // ... (resto de la recolección de datos)

        const tokenData = {
            // ... (el objeto completo del personaje, igual que en dm.js)
        };

        // En lugar de añadirlo a un tablero, lo guardamos en la biblioteca local del jugador
        saveCharacterToLibrary(tokenData);

        // Opcional: También ofrecer exportación directa
        // exportCharacter(tokenData);
    }

    addTokenBtn.addEventListener('click', createCharacterFromForm);

    // Inicializa la UI de stats, etc.
    // Llama a updateCharStatUI para cada stat al inicio
});
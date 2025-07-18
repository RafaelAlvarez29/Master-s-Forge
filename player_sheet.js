document.addEventListener('DOMContentLoaded', () => {
    let currentCharacter = null;
    const PLAYER_CHAR_KEY = 'playerSheetCurrentCharacter'; // localStorage key

    // --- Selectores del DOM (versión jugador) ---
    const container = document.getElementById('player-sheet-container');
    const noCharacterLoadedMsg = document.getElementById('noCharacterLoaded');
    const tokenEditor = document.getElementById('tokenEditor');
    const exportCharacterBtn = document.getElementById('exportCharacterBtn');

    function loadCharacterFromStorage() {
        const charData = localStorage.getItem(PLAYER_CHAR_KEY);
        if (charData) {
            currentCharacter = JSON.parse(charData);
            renderCharacterSheet();
        }
    }

    function saveCharacterToStorage() {
        if (currentCharacter) {
            localStorage.setItem(PLAYER_CHAR_KEY, JSON.stringify(currentCharacter));
        }
    }

    function renderCharacterSheet() {
        if (!currentCharacter) {
            tokenEditor.style.display = 'none';
            noCharacterLoadedMsg.style.display = 'block';
            return;
        }
        tokenEditor.style.display = 'block';
        noCharacterLoadedMsg.style.display = 'none';

        // Lógica para poblar el HTML del editor con los datos de `currentCharacter`
        // Esta será MUY similar a tu función `updateTokenInUI` en dm.js,
        // pero adaptada para este HTML y sin comunicación por BroadcastChannel.

        // Ejemplo simple para el nombre:
        const header = tokenEditor.querySelector('.token-header-display');
        // Deberás construir el HTML del header, nav y content dinámicamente o tenerlo pre-hecho en el HTML
        // y solo poblarlo.
        
        // Aquí iría toda la lógica de renderizado...
        console.log("Renderizando personaje:", currentCharacter.identity.name);
        
        // --- Lógica de vida, estados, etc. ---
        // Debes replicar la lógica de los event listeners para los botones
        // de vida, añadir/quitar estados, etc., pero deben modificar el objeto
        // `currentCharacter` y luego llamar a `saveCharacterToStorage()` y
        // a `renderCharacterSheet()` para actualizar la UI.
    }
    
    exportCharacterBtn.addEventListener('click', () => {
        if (!currentCharacter) return;

        const jsonString = JSON.stringify(currentCharacter, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentCharacter.identity.name.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // Cargar el personaje al iniciar la página
    loadCharacterFromStorage();
});
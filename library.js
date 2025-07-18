document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('playerCharactersGrid');
    const noCharsMsg = document.getElementById('noSavedCharactersMessage');
    const PLAYER_LIBRARY_KEY = 'playerCharacterLibrary';
    const PLAYER_CHAR_KEY = 'playerSheetCurrentCharacter';

    function renderLibrary() {
        const library = JSON.parse(localStorage.getItem(PLAYER_LIBRARY_KEY)) || [];
        grid.innerHTML = '';
        noCharsMsg.style.display = library.length === 0 ? 'block' : 'none';

        library.forEach((char, index) => {
            const card = document.createElement('div');
            card.className = 'saved-char-card';
            // Copia el innerHTML de las tarjetas de personaje de dm.js
            card.innerHTML = `...`;

            card.addEventListener('click', () => {
                // Guardar el personaje seleccionado para que player_sheet.html lo cargue
                localStorage.setItem(PLAYER_CHAR_KEY, JSON.stringify(char));
                // Redirigir a la hoja de personaje
                window.location.href = 'player_sheet.html';
            });
            grid.appendChild(card);
        });
    }

    // Lógica para importar/exportar la biblioteca (puedes adaptarla de dm.js)

    renderLibrary();
});
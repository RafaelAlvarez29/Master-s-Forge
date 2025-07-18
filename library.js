document.addEventListener('DOMContentLoaded', () => {
    // --- CLAVES DE ALMACENAMIENTO ---
    const PLAYER_LIBRARY_KEY = 'playerCharacterLibrary';
    const PLAYER_CHAR_KEY = 'playerSheetCurrentCharacter';

    // --- SELECTORES DEL DOM ---
    const grid = document.getElementById('playerCharactersGrid');
    const noCharsMsg = document.getElementById('noSavedCharactersMessage');
    const exportLibraryBtn = document.getElementById('exportLibraryBtn');
    const importLibraryBtn = document.getElementById('importLibraryBtn');
    const importLibraryInput = document.getElementById('importLibraryInput');

    // --- LÓGICA PRINCIPAL ---

    function getPlayerLibrary() {
        return JSON.parse(localStorage.getItem(PLAYER_LIBRARY_KEY)) || [];
    }

    function savePlayerLibrary(library) {
        localStorage.setItem(PLAYER_LIBRARY_KEY, JSON.stringify(library));
    }

    function renderLibrary() {
        const library = getPlayerLibrary();
        grid.innerHTML = ''; // Limpiar la vista actual

        const hasCharacters = library.length > 0;
        noCharsMsg.style.display = hasCharacters ? 'none' : 'block';
        exportLibraryBtn.style.display = hasCharacters ? 'inline-block' : 'none';

        library.forEach((char, index) => {
            const card = document.createElement('div');
            card.className = 'saved-char-card';
            
            const imageStyle = char.identity.image ? `background-image: url(${char.identity.image});` : `background-color: ${char.appearance.color};`;
            const previewContent = char.identity.image ? '' : char.identity.letter;
            
            card.innerHTML = `
                <div class="saved-char-preview">
                    <div class="preview-content" style="${imageStyle}">${previewContent}</div>
                </div>
                <div class="saved-char-info">
                    <p class="saved-char-name">${char.identity.name}</p>
                    <p class="saved-char-level">${char.identity.char_class || 'Clase'}, Nivel ${char.identity.level}</p>
                </div>
                <button class="delete-saved-char-btn" title="Eliminar de la biblioteca">×</button>
            `;

            // Event listener para ver la hoja de personaje
            card.addEventListener('click', () => {
                localStorage.setItem(PLAYER_CHAR_KEY, JSON.stringify(char));
                window.location.href = 'player_sheet.html';
            });

            // Event listener para el botón de eliminar
            const deleteBtn = card.querySelector('.delete-saved-char-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que se dispare el clic de la tarjeta
                if (confirm(`¿Estás seguro de que quieres eliminar a "${char.identity.name}" de tu biblioteca?`)) {
                    deleteCharacter(index);
                }
            });

            grid.appendChild(card);
        });
    }

    function deleteCharacter(indexToDelete) {
        let library = getPlayerLibrary();
        const deletedChar = library.splice(indexToDelete, 1);
        savePlayerLibrary(library);
        renderLibrary();
        showNotification(`"${deletedChar[0].identity.name}" ha sido eliminado.`);
    }

    // --- LÓGICA DE IMPORTACIÓN Y EXPORTACIÓN ---

    function exportLibrary() {
        const library = getPlayerLibrary();
        if (library.length === 0) {
            alert("Tu biblioteca está vacía. No hay nada que exportar.");
            return;
        }

        const jsonString = JSON.stringify(library, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'forja_de_aventuras_biblioteca.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importLibrary(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (!Array.isArray(importedData)) {
                    throw new Error("El archivo no es una biblioteca válida.");
                }

                let currentLibrary = getPlayerLibrary();
                let addedCount = 0;
                let skippedCount = 0;

                importedData.forEach(newChar => {
                    // Validar que el personaje importado tenga una estructura mínima
                    if (newChar && newChar.identity && newChar.identity.name) {
                        const existingChar = currentLibrary.find(char => char.identity.name === newChar.identity.name);
                        if (!existingChar) {
                            currentLibrary.push(newChar);
                            addedCount++;
                        } else {
                            skippedCount++;
                        }
                    }
                });

                savePlayerLibrary(currentLibrary);
                renderLibrary();
                
                let summary = `${addedCount} personaje(s) nuevo(s) añadido(s).`;
                if (skippedCount > 0) {
                    summary += ` ${skippedCount} omitido(s) por tener nombres duplicados.`;
                }
                showNotification(summary, 6000); // Notificación más larga

            } catch (error) {
                alert(`Error al importar el archivo: ${error.message}`);
            } finally {
                // Resetear el input para poder cargar el mismo archivo de nuevo si es necesario
                importLibraryInput.value = '';
            }
        };
        reader.readAsText(file);
    }

    function showNotification(message, duration = 4000) {
        const container = document.getElementById('notification-container');
        if (!container) { alert(message.replace(/<[^>]*>?/gm, '')); return; }

        // Reutilizamos el CSS de creator.html para las notificaciones
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = message;

        // Añadimos estilos en línea ya que no tenemos un CSS dedicado para esto aquí
        Object.assign(container.style, {
            position: 'fixed', bottom: '20px', right: '20px', zIndex: '1050',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
        });
        Object.assign(toast.style, {
            backgroundColor: 'var(--panel-bg, #2c2c2c)', color: 'var(--text-light, #eee)',
            padding: '15px 20px', borderRadius: '8px', marginTop: '10px',
            border: '1px solid var(--border-gold, #e6c253)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            opacity: '0', transform: 'translateX(100%)',
            animation: `slideInAndOut ${duration / 1000}s ease-in-out forwards`
        });
        
        // Keyframes dinámicos si no están en el CSS principal
        if (!document.querySelector('#toast-keyframes')) {
            const styleSheet = document.createElement("style");
            styleSheet.id = "toast-keyframes";
            styleSheet.innerText = `@keyframes slideInAndOut { 0%, 100% { opacity: 0; transform: translateX(100%); } 10%, 90% { opacity: 1; transform: translateX(0); } }`;
            document.head.appendChild(styleSheet);
        }

        container.appendChild(toast);
        setTimeout(() => { toast.remove(); }, duration);
    }

    // --- EVENT LISTENERS ---

    exportLibraryBtn.addEventListener('click', exportLibrary);
    importLibraryBtn.addEventListener('click', () => importLibraryInput.click()); // Abre el selector de archivos
    importLibraryInput.addEventListener('change', importLibrary);

    // --- INICIALIZACIÓN ---
    renderLibrary();
});
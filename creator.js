document.addEventListener('DOMContentLoaded', () => {
    // --- CLAVES DE ALMACENAMIENTO ---
    const PLAYER_LIBRARY_KEY = 'playerCharacterLibrary';

    // --- SELECTORES DEL FORMULARIO ---
    const tokenNameInput = document.getElementById('tokenName');
    const tokenLetterInput = document.getElementById('tokenLetter');
    const tokenClassInput = document.getElementById('tokenClass');
    const tokenLevelInput = document.getElementById('tokenLevel');
    const tokenRaceInput = document.getElementById('tokenRace');
    const tokenImageInput = document.getElementById('tokenImageInput');
    const tokenImageName = document.getElementById('tokenImageName');
    const tokenVisionInput = document.getElementById('tokenVision');
    const tokenHealthInput = document.getElementById('tokenHealth');
    const proficiencyBonusInput = document.getElementById('add_proficiency_bonus');
    const speedInput = document.getElementById('add_speed');
    const armorClassInput = document.getElementById('add_armor_class');
    const tokenColorInput = document.getElementById('tokenColor');
    const addBorderCheckbox = document.getElementById('addBorderCheckbox');
    const tokenBorderColorInput = document.getElementById('tokenBorderColor');
    const addTransparentBgCheckbox = document.getElementById('addTransparentBgCheckbox');
    const tokenSizeMultiplierInput = document.getElementById('tokenSizeMultiplier');
    const tokenNotesInput = document.getElementById('tokenNotes');

    // --- SELECTORES DE ACCIONES ---
    const saveToLibraryBtn = document.getElementById('saveToLibraryBtn');
    const exportBtn = document.getElementById('exportBtn');

    // --- LÓGICA DE LA BIBLIOTECA DEL JUGADOR ---
    function getPlayerLibrary() {
        return JSON.parse(localStorage.getItem(PLAYER_LIBRARY_KEY)) || [];
    }

    function saveCharacterToLibrary(characterData) {
        let library = getPlayerLibrary();
        const existingIndex = library.findIndex(char => char.identity.name === characterData.identity.name);

        if (existingIndex > -1) {
            // Si ya existe, preguntamos si se quiere sobreescribir
            if (confirm(`El personaje "${characterData.identity.name}" ya existe. ¿Quieres sobreescribirlo?`)) {
                library[existingIndex] = characterData;
            } else {
                return false; // El usuario canceló la sobreescritura
            }
        } else {
            library.push(characterData);
        }

        localStorage.setItem(PLAYER_LIBRARY_KEY, JSON.stringify(library));
        showNotification(`¡<strong>${characterData.identity.name}</strong> guardado en tu biblioteca!`);
        return true;
    }

    // --- LÓGICA DE CREACIÓN Y EXPORTACIÓN ---

    async function getCharacterDataFromForm() {
        const name = tokenNameInput.value.trim();
        const letter = tokenLetterInput.value.trim();

        if (!name || !letter) {
            alert('El Nombre y la Letra son campos obligatorios.');
            return null;
        }

        let imageBase64 = null;
        if (tokenImageInput.files[0]) {
            imageBase64 = await processImage(tokenImageInput.files[0]);
        }

        const characteristics = {};
        ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => {
            characteristics[stat] = {
                score: parseInt(document.getElementById(`add_${stat}_score`).value) || 10,
                proficient: document.getElementById(`add_${stat}_save_prof`).checked
            };
        });
        
        const health = parseInt(tokenHealthInput.value) || 10;

        return {
            // Nota: No generamos un 'id' aquí, ya que no es necesario para la biblioteca.
            // Se puede generar uno al cargarlo en la hoja de personaje si es necesario.
            isDiscovered: true, // Un personaje de jugador siempre es "descubierto"
            identity: {
                name,
                type: 'player',
                letter,
                image: imageBase64,
                char_class: tokenClassInput.value.trim() || 'Aventurero',
                level: parseInt(tokenLevelInput.value) || 1,
                race: tokenRaceInput.value.trim() || 'Desconocida'
            },
            position: { x: 0, y: 0, sizeMultiplier: parseFloat(tokenSizeMultiplierInput.value) || 1 },
            stats: {
                initiative: 0, // El jugador lo puede editar después en su hoja
                vision: { radius: parseInt(tokenVisionInput.value) || 0 },
                health: { current: health, max: health },
                proficiencyBonus: parseInt(proficiencyBonusInput.value) || 2,
                speed: parseInt(speedInput.value) || 30,
                armorClass: parseInt(armorClassInput.value) || 10,
                characteristics
            },
            appearance: {
                color: addTransparentBgCheckbox.checked ? 'transparent' : tokenColorInput.value,
                borderColor: addBorderCheckbox.checked ? tokenBorderColorInput.value : null
            },
            info: {
                notes: tokenNotesInput.value.trim(),
                states: [],
                abilities: [],
                inventory: []
            }
        };
    }

    function exportCharacter(characterData) {
        const jsonString = JSON.stringify(characterData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${characterData.identity.name.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // --- MANEJADORES DE EVENTOS ---

    saveToLibraryBtn.addEventListener('click', async () => {
        const characterData = await getCharacterDataFromForm();
        if (characterData) {
            if(saveCharacterToLibrary(characterData)) {
                // Opcional: Redirigir a la biblioteca después de guardar
                setTimeout(() => { window.location.href = 'library.html'; }, 1000);
            }
        }
    });

    exportBtn.addEventListener('click', async () => {
        const characterData = await getCharacterDataFromForm();
        if (characterData) {
            exportCharacter(characterData);
        }
    });

    // --- FUNCIONES DE AYUDA Y UI (Copiadas de dm.js) ---

    async function processImage(file) {
        if (file.type === 'image/gif') {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }
        const MAX_WIDTH = 256;
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let { width, height } = img;
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/webp', 0.8));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    const calculateModifier = (score) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    const updateCharStatUI = (prefix, stat) => {
        const scoreInput = document.getElementById(`${prefix}_${stat}_score`);
        const modDisplay = document.getElementById(`${prefix}_${stat}_mod`);
        if (!scoreInput || !modDisplay) return;
        const score = parseInt(scoreInput.value) || 10;
        modDisplay.textContent = calculateModifier(score);
        updateSavingThrowsUI(prefix);
    };

    const updateSavingThrowsUI = (prefix) => {
        const stats = ['str', 'dex', 'con', 'int', 'wis', 'car'];
        const profBonus = parseInt(document.getElementById(`${prefix}_proficiency_bonus`).value) || 0;
        stats.forEach(stat => {
            const score = parseInt(document.getElementById(`${prefix}_${stat}_score`).value) || 10;
            const baseMod = Math.floor((score - 10) / 2);
            const isProficient = document.getElementById(`${prefix}_${stat}_save_prof`).checked;
            const total = baseMod + (isProficient ? profBonus : 0);
            const totalDisplay = document.getElementById(`${prefix}_${stat}_save_total`);
            if (totalDisplay) {
                totalDisplay.textContent = total >= 0 ? `+${total}` : `${total}`;
            }
        });
    };

    function showNotification(message) {
        const container = document.getElementById('notification-container');
        if (!container) { alert(message.replace(/<[^>]*>?/gm, '')); return; }
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = message;
        container.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 4000);
    }

    // Inicializar listeners de UI del formulario
    tokenImageInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            tokenImageName.textContent = e.target.files[0].name;
        } else {
            tokenImageName.textContent = 'Ningún archivo...';
        }
    });

    addTransparentBgCheckbox.addEventListener('change', () => {
        tokenColorInput.disabled = addTransparentBgCheckbox.checked;
    });

    ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => {
        document.getElementById(`add_${stat}_score`).addEventListener('input', () => updateCharStatUI('add', stat));
        document.getElementById(`add_${stat}_save_prof`).addEventListener('change', () => updateSavingThrowsUI('add'));
    });
    proficiencyBonusInput.addEventListener('input', () => updateSavingThrowsUI('add'));

    // Ejecutar una vez al cargar para inicializar modificadores
    ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => updateCharStatUI('add', stat));
});
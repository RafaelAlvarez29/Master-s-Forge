document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN DE INDEXEDDB ---
    const DB_NAME = 'DMArsenalDB';
    const DB_VERSION = 1;
    const SCENES_STORE = 'scenes';
    const ASSETS_STORE = 'assets';
    let db;
    async function initDB() {
        db = await idb.openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(SCENES_STORE)) {
                    db.createObjectStore(SCENES_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(ASSETS_STORE)) {
                    db.createObjectStore(ASSETS_STORE, { keyPath: 'id' });
                }
            },
        });
    }
    initDB();

    const CHAR_LIB_STORE = 'characterLibrary'; // Clave para localStorage

    // --- BROADCAST CHANNEL ---
    const openPlayerViewBtn = document.getElementById('openPlayerViewBtn');
    const channel = new BroadcastChannel('dnd_arsenal_channel');
    let playerViewWindow = null;
    let isMapLoaded = false;

    // --- SELECTORES (DM) ---
    const mapImageInput = document.getElementById('mapImageInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const saveStateBtn = document.getElementById('saveStateBtn');
    const loadStateBtn = document.getElementById('loadStateBtn');
    const gridToggle = document.getElementById('gridToggle');
    const gridColorInput = document.getElementById('gridColor');
    const gridOpacityInput = document.getElementById('gridOpacity');
    const cellSizeInput = document.getElementById('cellSize');
    const cellSizeSlider = document.getElementById('cellSizeSlider');
    const alignGridModeBtn = document.getElementById('alignGridModeBtn');
    const resetGridOffsetBtn = document.getElementById('resetGridOffsetBtn');
    const brushRevealCheckbox = document.getElementById('brushReveal');
    const brushHideCheckbox = document.getElementById('brushHide');
    const brushSizeInput = document.getElementById('brushSize');
    const clearWallsBtn = document.getElementById('clearWallsBtn');
    const doorListUl = document.getElementById('doorList');
    const noDoorsMessage = document.getElementById('noDoorsMessage');
    const toggleVisionBtn = document.getElementById('toggleVisionBtn');
    const resetFogBtn = document.getElementById('resetFogBtn');
    const addTokenBtn = document.getElementById('addTokenBtn');
    const add_tokenName = document.getElementById('tokenName');
    const add_tokenLetter = document.getElementById('tokenLetter');
    const add_tokenImageInput = document.getElementById('tokenImageInput');
    const add_tokenImageName = document.getElementById('tokenImageName');
    const add_tokenHealth = document.getElementById('tokenHealth');
    const add_tokenNotes = document.getElementById('tokenNotes');
    const add_tokenColor = document.getElementById('tokenColor');
    const add_tokenBorderColor = document.getElementById('tokenBorderColor');
    const add_addBorderCheckbox = document.getElementById('addBorderCheckbox');
    const add_tokenVision = document.getElementById('tokenVision');
    const add_tokenSizeMultiplier = document.getElementById('tokenSizeMultiplier');
    const selectedTokenView = document.getElementById('main-view-selected-token');
    const edit_tokenLetterPreview = document.getElementById('editTokenLetterPreview');
    const edit_tokenName = document.getElementById('editTokenName');
    const edit_tokenImageInput = document.getElementById('editTokenImageInput');
    const edit_tokenImagePreview = document.getElementById('editTokenImagePreview');
    const removeTokenImageBtn = document.getElementById('removeTokenImageBtn');
    const edit_tokenTurn = document.getElementById('editTokenTurn');
    const edit_tokenHealthMax = document.getElementById('editTokenHealthMax');
    const edit_tokenNotes = document.getElementById('editTokenNotes');
    const edit_tokenColor = document.getElementById('editTokenColor');
    const edit_tokenBorderColor = document.getElementById('editTokenBorderColor');
    const editBorderCheckbox = document.getElementById('editBorderCheckbox');
    const edit_tokenVision = document.getElementById('editTokenVision');
    const edit_tokenSizeMultiplier = document.getElementById('editTokenSizeMultiplier');
    const updateTokenBtn = document.getElementById('updateTokenBtn');
    const deselectTokenBtn = document.getElementById('deselectTokenBtn');
    const healthDisplay = document.getElementById('healthDisplay');
    const healthDisplayContainer = document.getElementById('healthDisplayContainer');
    const healthModifierBtns = document.querySelectorAll('.health-modifier-btn');
    const healthModifierInput = document.getElementById('healthModifierInput');
    const damageSound = document.getElementById('damage-sound');
    const healSound = document.getElementById('heal-sound');
    const tokenStatesEditor = document.getElementById('tokenStatesEditor');
    const newStateEmoji = document.getElementById('newStateEmoji');
    const newStateDesc = document.getElementById('newStateDesc');
    const addStateBtn = document.getElementById('addStateBtn');
    const editTokenStatesList = document.getElementById('editTokenStatesList');
    const aoeHeader = document.getElementById('aoeHeader');
    const aoeControlsContainer = document.getElementById('aoeControlsContainer');
    const aoeShapeButtons = document.querySelectorAll('#aoeShapeSelector button');
    const aoeParamsContainer = document.getElementById('aoeParamsContainer');
    const aoeColorInput = document.getElementById('aoeColor');
    const featureInventoryModal = document.getElementById('featureInventoryModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalNameInput = document.getElementById('modalNameInput');
    const modalDescriptionInput = document.getElementById('modalDescriptionInput');
    const confirmModalBtn = document.getElementById('confirmModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const addAbilityBtn = document.getElementById('addAbilityBtn');
    const addInventoryItemBtn = document.getElementById('addInventoryItemBtn');
    const editAbilitiesList = document.getElementById('editAbilitiesList');
    const editInventoryList = document.getElementById('editInventoryList');
    const searchAbilitiesInput = document.getElementById('searchAbilitiesInput');
    const searchInventoryInput = document.getElementById('searchInventoryInput');
    const tokenListUl = document.getElementById('tokenList');
    const saveSceneModal = document.getElementById('saveSceneModal');
    const sceneNameInput = document.getElementById('sceneNameInput');
    const confirmSaveSceneBtn = document.getElementById('confirmSaveSceneBtn');
    const cancelSaveSceneBtn = document.getElementById('cancelSaveSceneBtn');
    const savedScenesModal = document.getElementById('savedScenesModal');
    const closeSavedScenesBtn = document.getElementById('closeSavedScenesBtn');
    const sceneListContainer = document.getElementById('sceneListContainer');

    const tokenHeaderInfo = document.querySelector('.token-header-info');
    const tokenInfoView = document.getElementById('tokenInfoView');
    const tokenInfoEdit = document.getElementById('tokenInfoEdit');
    const savedCharactersGrid = document.getElementById('savedCharactersGrid');
    const noSavedCharactersMessage = document.getElementById('noSavedCharactersMessage');
    const saveCharacterBtn = document.getElementById('saveCharacterBtn');
    const exportSceneBtn = document.getElementById('exportSceneBtn');
    const importSceneInput = document.getElementById('importSceneInput');
    const exportLibraryBtn = document.getElementById('exportLibraryBtn');
    const importLibraryInput = document.getElementById('importLibraryInput');
    const characterLibraryActions = document.getElementById('characterLibraryActions');
    const addTransparentBgCheckbox = document.getElementById('addTransparentBgCheckbox');
    const editCardModal = document.getElementById('editCardModal');
    const editCardModalTitle = document.getElementById('editCardModalTitle');
    const editCardViewMode = document.getElementById('editCardViewMode');
    const editCardEditMode = document.getElementById('editCardEditMode');
    const viewCardName = document.getElementById('viewCardName');
    const viewCardDescription = document.getElementById('viewCardDescription');
    const editCardNameInput = document.getElementById('editCardNameInput');
    const editCardDescriptionInput = document.getElementById('editCardDescriptionInput');
    const editCardViewButtons = document.getElementById('editCardViewButtons');
    const editCardEditButtons = document.getElementById('editCardEditButtons');
    const editCardBtn = document.getElementById('editCardBtn');
    const closeCardBtn = document.getElementById('closeCardBtn');
    const updateCardBtn = document.getElementById('updateCardBtn');
    const cancelEditCardBtn = document.getElementById('cancelEditCardBtn');
    const openCreditsLink = document.getElementById('openCreditsLink');
    const creditsModal = document.getElementById('creditsModal');
    const closeCreditsBtn = document.getElementById('closeCreditsBtn');

    addTransparentBgCheckbox.addEventListener('change', () => {
        document.getElementById('tokenColor').disabled = addTransparentBgCheckbox.checked;
    });

    let tokens = [], walls = [], selectedTokenId = null, visionModeActive = false;
    let activeBrushMode = null;
    let activeLoopingSound = null, activeAoeType = null;
    let isAligningGrid = false;
    let currentModalContext = null;
    let editingCardContext = null;
    let cellSize = 50, gridVisible = false, gridColor = '#000000', gridOpacity = 0.5;
    let brushSize = 50, drawType = 'wall', gridOffsetX = 0, gridOffsetY = 0;
    let pendingExportData = null;
    let pendingSceneSave = null;


    function broadcast(type, payload) {
        if (playerViewWindow && !playerViewWindow.closed) {
            channel.postMessage({ type, payload });
        }
    }

    // ===============================================
    // --- FUNCIÓN PARA MOSTRAR NOTIFICACIONES (NUEVA) ---
    // ===============================================
    function showNotification(message) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = message;

        container.appendChild(toast);

        // Eliminar el elemento del DOM después de que la animación termine
        setTimeout(() => {
            toast.remove();
        }, 4000); // 4000ms = 4s, la misma duración de la animación
    }

    // ===============================================
    // --- SISTEMA DE MODAL DE DIÁLOGO PERSONALIZADO ---
    // ===============================================
    function showCustomModal({
        title,
        message,
        type = 'info', // 'info', 'success', 'warning', 'error', 'confirm'
        confirmText = 'Confirmar',
        cancelText = 'Cancelar'
    }) {
        const modal = document.getElementById('customModal');
        const modalIcon = document.getElementById('customModalIcon');
        const modalTitle = document.getElementById('customModalTitle');
        const modalMessage = document.getElementById('customModalMessage');
        const modalButtons = document.getElementById('customModalButtons');

        return new Promise(resolve => {
            // Limpiar estado anterior
            modal.className = 'modal-overlay'; // resetea clases de tipo
            modal.classList.add(`modal-type-${type}`);
            modalButtons.innerHTML = '';

            // Configurar contenido
            modalTitle.textContent = title;
            modalMessage.innerHTML = message;

            const closeModal = (resolution) => {
                modal.classList.remove('open');
                resolve(resolution); // <-- ESTA LÍNEA ES LA CLAVE
            };

            if (type === 'confirm') {
                // Botón de Confirmar
                const confirmBtn = document.createElement('button');
                confirmBtn.textContent = confirmText;
                confirmBtn.onclick = () => closeModal(true); // <-- RESUELVE LA PROMESA CON 'true'
                modalButtons.appendChild(confirmBtn);

                // Botón de Cancelar
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = cancelText;
                cancelBtn.className = 'secondary';
                cancelBtn.onclick = () => closeModal(false); // <-- RESUELVE LA PROMESA CON 'false'
                modalButtons.appendChild(cancelBtn);

            } else { // para 'info', 'success', 'warning', 'error'
                const okBtn = document.createElement('button');
                okBtn.textContent = 'Aceptar';
                okBtn.onclick = () => closeModal(true);
                modalButtons.appendChild(okBtn);
            }

            modal.classList.add('open');
        });
    }

    channel.onmessage = (event) => {
        const { type, payload } = event.data;
        switch (type) {
            case 'EVENT_TOKEN_MOVED':
                const movedToken = tokens.find(t => t.id === payload.id);
                if (movedToken) { movedToken.position.x = payload.x; movedToken.position.y = payload.y; if (visionModeActive) broadcast('CMD_DRAW_VISION', { tokens, walls, cellSize }); }
                break;
            case 'EVENT_TOKEN_CLICKED': selectToken(payload.id); break;
            case 'EVENT_MAP_CLICKED': deselectToken(); break;
            case 'EVENT_WALL_DRAWN':
                if (payload.drawType === 'door') {
                    // En lugar de abrir un modal local, enviamos una orden al jugador
                    broadcast('CMD_REQUEST_DOOR_NAME', {
                        doorData: { x1: payload.start.x, y1: payload.start.y, x2: payload.end.x, y2: payload.end.y }
                    });
                } else {
                    walls.push({ id: Date.now(), x1: payload.start.x, y1: payload.start.y, x2: payload.end.x, y2: payload.end.y, type: 'wall' });
                    broadcast('CMD_DRAW_WALLS', { walls });
                }
                break;
            case 'EVENT_UNDO_LAST_WALL':
                undoLastWall();
                break;
            case 'EVENT_CLEAR_ALL_WALLS':
                // La función clearAllWalls ya pide confirmación, pero es bueno tenerla
                // en ambos lados. Podemos quitar la confirmación de la función original
                // si ahora siempre se pedirá desde el origen del evento.
                // Por ahora, la mantenemos para que el botón del panel del DM también funcione.
                clearAllWalls();
                break;
            case 'EVENT_DOOR_NAME_SUBMITTED':
                const { name, doorData } = payload;
                walls.push({
                    id: Date.now(),
                    ...doorData,
                    type: 'door',
                    isOpen: false,
                    name: name
                });
                updateDoorList();
                broadcast('CMD_DRAW_WALLS', { walls });
                if (visionModeActive) {
                    broadcast('CMD_DRAW_VISION', { tokens, walls, cellSize });
                }
                break;

            case 'EVENT_DOOR_NAME_CANCELLED':
                // El jugador canceló. Simplemente re-dibujamos los muros actuales
                // para eliminar la línea de previsualización que quedó en su pantalla.
                broadcast('CMD_DRAW_WALLS', { walls });
                break;
            case 'EVENT_GRID_ALIGNED':
                gridOffsetX = payload.x;
                gridOffsetY = payload.y;
                broadcastGridSettings();
                toggleAlignGridMode(false);
                break;
            case 'EVENT_FOG_PAINTED': checkEnemyDiscovery(payload.visibleEnemies); break;
            case 'EVENT_FOG_DATA_RESPONSE':
                if (pendingExportData) {
                    pendingExportData.fogImageDataUrl = payload.fogDataUrl;
                    finalizeExport(pendingExportData);
                    pendingExportData = null;
                }
                else if (pendingSceneSave) {
                    const { sceneName, sceneId } = pendingSceneSave;
                    const fogDataUrl = payload.fogDataUrl;
                    finalizeSceneSave(sceneName, sceneId, fogDataUrl);
                    pendingSceneSave = null;
                }
                break;
        }
    };
    mapImageInput.addEventListener('change', handleImageUpload);

    addTokenBtn.addEventListener('click', createTokenFromForm);
    updateTokenBtn.addEventListener('click', updateSelectedToken);
    deselectTokenBtn.addEventListener('click', deselectToken);
    toggleVisionBtn.addEventListener('click', toggleVisionMode);
    resetFogBtn.addEventListener('click', resetFog);
    addStateBtn.addEventListener('click', addStateToSelectedToken);
    alignGridModeBtn.addEventListener('click', () => toggleAlignGridMode());
    resetGridOffsetBtn.addEventListener('click', resetGridOffset);
    saveStateBtn.addEventListener('click', () => {
        if (!isMapLoaded) {
            showCustomModal({
                title: 'Espera',
                message: `Carga un mapa antes de guardar la escena`,
                type: 'warning'
            });
            return;
        }
        sceneNameInput.value = '';
        saveSceneModal.classList.add('open');
        sceneNameInput.focus();
    });
    loadStateBtn.addEventListener('click', () => { renderSavedScenesList(); savedScenesModal.classList.add('open'); });
    cancelSaveSceneBtn.addEventListener('click', () => saveSceneModal.classList.remove('open'));
    confirmSaveSceneBtn.addEventListener('click', () => saveCurrentScene());
    closeSavedScenesBtn.addEventListener('click', () => savedScenesModal.classList.remove('open'));
    openPlayerViewBtn.addEventListener('click', () => { if (playerViewWindow && !playerViewWindow.closed) { playerViewWindow.focus(); return; } playerViewWindow = window.open('player.html', '_blank', 'width=1280,height=720'); setTimeout(() => { if (isMapLoaded) { const mapSrc = document.getElementById('mapImageInput')._dataUrl; broadcast('CMD_LOAD_NEW_MAP', { src: mapSrc }); setTimeout(() => { broadcast('CMD_LOAD_SCENE_DATA', { tokens: tokens, walls: walls, gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity, offsetX: gridOffsetX, offsetY: gridOffsetY, cellSize: cellSize } }); if (visionModeActive) { broadcast('CMD_SET_VISION_MODE', { active: true, tokens, walls, cellSize }); } }, 500); } }, 1500); });
    addAbilityBtn.addEventListener('click', () => openFeatureModal('ability'));
    addInventoryItemBtn.addEventListener('click', () => openFeatureModal('inventory'));
    cancelModalBtn.addEventListener('click', () => featureInventoryModal.classList.remove('open'));
    confirmModalBtn.addEventListener('click', saveFeatureOrItem);
    gridToggle.addEventListener('change', e => { gridVisible = e.target.checked; broadcastGridSettings(); });
    gridColorInput.addEventListener('input', e => { gridColor = e.target.value; broadcastGridSettings(); });
    gridOpacityInput.addEventListener('input', e => { gridOpacity = parseFloat(e.target.value); broadcastGridSettings(); });
    brushSizeInput.addEventListener('input', e => { brushSize = parseInt(e.target.value); broadcast('CMD_SET_BRUSH_SIZE', { size: brushSize }); });
    cellSizeSlider.addEventListener('input', () => { cellSizeInput.value = cellSizeSlider.value; updateCellSize(); });
    cellSizeInput.addEventListener('input', () => { const val = parseFloat(cellSizeInput.value) || 10; cellSizeSlider.value = val; updateCellSize(); });
    edit_tokenImageInput.addEventListener('change', handleEditTokenImageChange);
    removeTokenImageBtn.addEventListener('click', removeEditTokenImage);
    healthModifierBtns.forEach(btn => btn.addEventListener('click', () => applyHealthChange(parseInt(btn.dataset.amount))));
    healthModifierInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const amount = parseInt(healthModifierInput.value); if (!isNaN(amount)) { applyHealthChange(amount); healthModifierInput.value = ''; } } });
    edit_tokenHealthMax.addEventListener('change', () => { if (!selectedTokenId) return; const token = tokens.find(t => t.id === selectedTokenId); if (!token) return; token.stats.health.max = parseInt(edit_tokenHealthMax.value) || 0; if (token.stats.health.current > token.stats.health.max) { token.stats.health.current = token.stats.health.max; } updateTokenInUI(token); broadcast('CMD_UPDATE_TOKEN_DATA', { tokenData: token }); });
    brushRevealCheckbox.addEventListener('change', handleBrushModeChange);
    brushHideCheckbox.addEventListener('change', handleBrushModeChange);
    aoeShapeButtons.forEach(button => button.addEventListener('click', () => toggleAoe(button.dataset.shape)));
    aoeParamsContainer.querySelectorAll('input, [type=color]').forEach(input => { input.addEventListener('input', () => { if (activeAoeType) broadcastAoeState(); }); });
    ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => { document.getElementById(`add_${stat}_score`).addEventListener('input', () => updateCharStatUI('add', stat)); document.getElementById(`add_${stat}_save_prof`).addEventListener('change', () => updateSavingThrowsUI('add')); });
    document.getElementById('add_proficiency_bonus').addEventListener('input', () => updateSavingThrowsUI('add'));
    ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => { document.getElementById(`edit_${stat}_score`).addEventListener('input', () => { updateCharStatUI('edit', stat); updateSelectedToken(); }); document.getElementById(`edit_${stat}_save_prof`).addEventListener('change', () => { updateSavingThrowsUI('edit'); updateSelectedToken(); }); });
    document.getElementById('edit_proficiency_bonus').addEventListener('input', () => { updateSavingThrowsUI('edit'); updateSelectedToken(); });
    document.getElementById('edit_armor_class').addEventListener('input', () => updateSelectedToken());
    document.getElementById('edit_speed').addEventListener('input', () => updateSelectedToken());
    document.querySelectorAll('.sound-btn').forEach(button => { button.addEventListener('click', () => { const soundId = button.dataset.soundId; const audio = document.getElementById(soundId); if (!audio) return; if (audio.loop) { if (activeLoopingSound === audio) { audio.pause(); audio.currentTime = 0; activeLoopingSound = null; button.classList.remove('active'); } else { if (activeLoopingSound) { activeLoopingSound.pause(); activeLoopingSound.currentTime = 0; document.querySelector('.sound-btn.active')?.classList.remove('active'); } audio.play(); activeLoopingSound = audio; button.classList.add('active'); } } else { audio.currentTime = 0; audio.play(); } }); });
    tokenHeaderInfo.addEventListener('click', (e) => { if (tokenInfoEdit.style.display === 'none') { tokenInfoView.style.display = 'none'; tokenInfoEdit.style.display = 'block'; document.getElementById('editTokenName').focus(); } });
    const saveHeaderChanges = () => { if (!selectedTokenId) return; const token = tokens.find(t => t.id === selectedTokenId); if (!token) return; token.identity.name = document.getElementById('editTokenName').value; token.identity.char_class = document.getElementById('editTokenClass').value; token.identity.level = parseInt(document.getElementById('editTokenLevel').value) || 1; token.identity.race = document.getElementById('editTokenRace').value; updateTokenInUI(token); updateTokenList(); broadcast('CMD_UPDATE_TOKEN_DATA', { tokenData: token }); tokenInfoView.style.display = 'block'; tokenInfoEdit.style.display = 'none'; };
    exportSceneBtn.addEventListener('click', handleExportScene);
    importSceneInput.addEventListener('change', handleImportScene);
    exportLibraryBtn.addEventListener('click', handleExportLibrary);
    importLibraryInput.addEventListener('change', handleImportLibrary);

    openCreditsLink.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que el enlace '#' navegue
        creditsModal.classList.add('open');
    });

    closeCreditsBtn.addEventListener('click', () => {
        creditsModal.classList.remove('open');
    });

    // Cierra el modal si se hace clic en el fondo oscuro
    creditsModal.addEventListener('click', (e) => {
        if (e.target === creditsModal) {
            creditsModal.classList.remove('open');
        }
    });

    function getHealthColorClass(current, max) { if (max === 0) return 'health-mid'; const percentage = (current / max) * 100; if (percentage <= 10) return 'health-critical'; if (percentage <= 40) return 'health-low'; if (percentage <= 70) return 'health-mid'; return 'health-high'; } async function processImage(file) { if (file.type === 'image/gif') return new Promise(resolve => { const reader = new FileReader(); reader.onload = e => resolve(e.target.result); reader.readAsDataURL(file); }); const MAX_WIDTH = 256; return new Promise(resolve => { const reader = new FileReader(); reader.onload = e => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); let { width, height } = img; if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } canvas.width = width; canvas.height = height; ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/webp', 0.8)); }; img.src = e.target.result; }; reader.readAsDataURL(file); }); }

    // --- FUNCIÓN updateTokenInUI CORREGIDA ---
    function updateTokenInUI(token) {
        if (!token) { deselectToken(); return; }

        const listItem = tokenListUl.querySelector(`li[data-id="${token.id}"]`);
        document.querySelectorAll('#tokenList li.selected-in-list').forEach(li => li.classList.remove('selected-in-list'));
        if (listItem) listItem.classList.add('selected-in-list');
        selectedTokenView.classList.add('has-selection');

        document.getElementById('viewTokenName').textContent = token.identity.name;
        document.getElementById('viewTokenClass').textContent = token.identity.char_class || 'Clase';
        document.getElementById('viewTokenLevel').textContent = token.identity.level || 1;
        document.getElementById('viewTokenRace').textContent = token.identity.race || 'Raza';

        document.getElementById('editTokenName').value = token.identity.name;
        document.getElementById('editTokenClass').value = token.identity.char_class;
        document.getElementById('editTokenLevel').value = token.identity.level;
        document.getElementById('editTokenRace').value = token.identity.race;

        document.getElementById('tokenInfoView').style.display = 'block';
        document.getElementById('tokenInfoEdit').style.display = 'none';

        if (token.identity.image) {
            edit_tokenImagePreview.src = token.identity.image; edit_tokenImagePreview.style.display = 'block';
            document.getElementById('editTokenLetterPreview').style.display = 'none'; removeTokenImageBtn.style.display = 'block';
        } else {
            edit_tokenImagePreview.style.display = 'none'; document.getElementById('editTokenLetterPreview').style.display = 'flex';
            removeTokenImageBtn.style.display = 'none'; document.getElementById('editTokenLetterPreview').textContent = token.identity.letter;
            document.getElementById('editTokenLetterPreview').style.backgroundColor = token.appearance.color;
        }

        // --- PESTAÑA COMBATE ---
        document.getElementById('edit_proficiency_bonus').value = token.stats.proficiencyBonus;
        document.getElementById('editTokenTurn').value = token.stats.initiative || 0;
        document.getElementById('edit_speed').value = token.stats.speed;
        document.getElementById('edit_armor_class').value = token.stats.armorClass;
        document.getElementById('editTokenVision').value = token.stats.vision.radius;
        document.getElementById('editTokenHealthMax').value = token.stats.health.max;
        healthDisplay.textContent = token.stats.health.current;
        healthDisplay.className = `health-display ${getHealthColorClass(token.stats.health.current, token.stats.health.max)}`;
        renderTokenStatesEditor(token);

        // --- PESTAÑA ESTADÍSTICAS ---
        ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => {
            if (token.stats.characteristics && token.stats.characteristics[stat]) {
                document.getElementById(`edit_${stat}_score`).value = token.stats.characteristics[stat].score;
                document.getElementById(`edit_${stat}_save_prof`).checked = token.stats.characteristics[stat].proficient;
            }
            updateCharStatUI('edit', stat);
        });
        document.getElementById('editTokenColor').value = token.appearance.color === 'transparent' ? '#000000' : token.appearance.color;
        document.getElementById('editTokenBorderColor').value = token.appearance.borderColor || '#000000';
        editBorderCheckbox.checked = !!token.appearance.borderColor;
        const editTransparentBgCheckbox = document.getElementById('editTransparentBgCheckbox');
        editTransparentBgCheckbox.checked = token.appearance.color === 'transparent';
        document.getElementById('editTokenColor').disabled = editTransparentBgCheckbox.checked;
        editTransparentBgCheckbox.onchange = () => { document.getElementById('editTokenColor').disabled = editTransparentBgCheckbox.checked; updateSelectedToken(); };
        document.getElementById('editTokenSizeMultiplier').value = token.position.sizeMultiplier || 1;

        // --- PESTAÑAS HABILIDADES, INVENTARIO Y NOTAS ---
        renderAbilitiesList(token);
        renderInventoryList(token);
        document.getElementById('editTokenNotes').value = token.info.notes;
    }

    // ... El resto del archivo

    // El resto de las funciones (guardado, carga, etc.) se mantienen igual que en tu versión anterior.
    // ... (pegas aquí el resto de tu script.js desde `getSavedScenes` hasta el final)

    // --- GESTIÓN DE ESCENAS ---

    function saveCurrentScene() {
        const sceneName = sceneNameInput.value.trim();
        if (!sceneName) {
            showCustomModal({
                title: 'Atención',
                message: 'Por favor, introduce un nombre para la escena.',
                type: 'warning'
            });

            return;
        }

        if (!playerViewWindow || playerViewWindow.closed) {
            showCustomModal({
                title: 'Atención',
                message: 'La ventana del jugador debe estar abierta para guardar el estado completo de la escena (incluida la niebla de guerra)..',
                type: 'warning'
            });
            return;
        }

        pendingSceneSave = {
            sceneName: sceneName,
            sceneId: Date.now()
        };

        broadcast('CMD_REQUEST_FOG_DATA');
        saveSceneModal.classList.remove('open');
    }

    async function finalizeSceneSave(sceneName, sceneId, fogDataUrl) {
        try {
            // Guardamos los assets como antes
            const assetTx = db.transaction(ASSETS_STORE, 'readwrite');
            const assetStore = assetTx.objectStore(ASSETS_STORE);

            const mapAssetId = `map_${sceneId}`;
            const mapSrc = document.getElementById('mapImageInput')._dataUrl;
            await assetStore.put({ id: mapAssetId, data: mapSrc });

            const fogAssetId = `fog_${sceneId}`;
            await assetStore.put({ id: fogAssetId, data: fogDataUrl });

            const tokenPromises = tokens.map(async (t, index) => {
                let imageAssetId = null;
                if (t.identity.image) {
                    imageAssetId = `token_${sceneId}_${index}`;
                    await assetStore.put({ id: imageAssetId, data: t.identity.image });
                }
                const cleanToken = JSON.parse(JSON.stringify(t));
                if (cleanToken.identity.image) cleanToken.identity.imageAssetId = imageAssetId;
                delete cleanToken.identity.image; // No guardamos el dataURL en la metadata
                return cleanToken;
            });

            const tokenMetadata = await Promise.all(tokenPromises);
            await assetTx.done; // La transacción de assets termina aquí

            // Creamos el objeto completo de la escena
            const sceneObject = {
                id: sceneId,
                name: sceneName,
                date: new Date().toISOString(),
                mapAssetId: mapAssetId,
                fogAssetId: fogAssetId,
                cellSize: cellSize,
                tokens: tokenMetadata, // tokens sin la imagen en base64
                walls: walls,
                gridSettings: {
                    visible: gridVisible,
                    color: gridColor,
                    opacity: gridOpacity,
                    offsetX: gridOffsetX,
                    offsetY: gridOffsetY
                }
            };

            // --- CAMBIO CLAVE: Guardamos el objeto completo en IndexedDB, no en localStorage ---
            await db.put(SCENES_STORE, sceneObject);

            showCustomModal({
                title: 'Éxito',
                message: `¡Escena "${sceneName}" guardada con éxito!`,
                type: 'success'
            });

        } catch (error) {
            console.error('Error al finalizar el guardado de la escena:', error);
            showCustomModal({
                title: 'Error',
                message: 'Hubo un error al guardar la escena. Revisa la consola.',
                type: 'error'
            });
        }
    }

    async function loadSceneById(sceneId) {
        try {
            // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
            // Convertimos el ID que viene del 'dataset' (string) a un número.
            const numericSceneId = parseInt(sceneId, 10);

            // --- CAMBIO CLAVE: Usamos el ID numérico para buscar en IndexedDB ---
            const sceneMetadata = await db.get(SCENES_STORE, numericSceneId);

            if (!sceneMetadata) {
                showCustomModal({
                    title: 'Error',
                    message: 'No se encontró la escena.',
                    type: 'error'
                });
                return;
            }

            const assetTx = db.transaction(ASSETS_STORE, 'readonly');
            const assetStore = assetTx.objectStore(ASSETS_STORE);

            const mapAsset = await assetStore.get(sceneMetadata.mapAssetId);
            const fogAsset = sceneMetadata.fogAssetId ? await assetStore.get(sceneMetadata.fogAssetId) : null;

            // El resto de la lógica de carga es idéntica
            document.getElementById('mapImageInput')._dataUrl = mapAsset.data;
            isMapLoaded = true;
            cellSize = sceneMetadata.cellSize;
            cellSizeInput.value = cellSize;
            cellSizeSlider.value = cellSize;

            if (sceneMetadata.gridSettings) {
                gridVisible = sceneMetadata.gridSettings.visible;
                gridColor = sceneMetadata.gridSettings.color;
                gridOpacity = sceneMetadata.gridSettings.opacity;
                gridOffsetX = sceneMetadata.gridSettings.offsetX || 0;
                gridOffsetY = sceneMetadata.gridSettings.offsetY || 0;
                gridToggle.checked = gridVisible;
                gridColorInput.value = gridColor;
                gridOpacityInput.value = gridOpacity;
            }

            walls = sceneMetadata.walls || [];
            updateDoorList();

            const tokenAssetPromises = sceneMetadata.tokens.map(tokenMeta => {
                const assetId = tokenMeta.identity?.imageAssetId || tokenMeta.imageAssetId;
                return assetId ? assetStore.get(assetId) : Promise.resolve(null);
            });
            const tokenAssets = await Promise.all(tokenAssetPromises);

            tokens = sceneMetadata.tokens.map((tokenData, index) => {
                const migratedTokenData = migrateTokenData(tokenData);
                const asset = tokenAssets[index];
                if (asset) migratedTokenData.identity.image = asset.data;
                return migratedTokenData;
            });

            broadcast('CMD_LOAD_NEW_MAP', { src: mapAsset.data });

            setTimeout(() => {
                broadcast('CMD_LOAD_SCENE_DATA', {
                    tokens: tokens,
                    walls: walls,
                    gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity, offsetX: gridOffsetX, offsetY: gridOffsetY, cellSize: cellSize },
                    fogDataUrl: fogAsset ? fogAsset.data : null
                });
            }, 500);

            updateTokenList();
            deselectToken();
            savedScenesModal.classList.remove('open');

        } catch (error) {
            console.error('Error al cargar la escena:', error);
            showCustomModal({
                title: 'Error',
                message: 'Hubo un error al cargar los datos de la escena.',
                type: 'error'
            });
        }
    }

    async function renderSavedScenesList() {
        // --- CAMBIO CLAVE: Obtenemos todas las escenas de IndexedDB ---
        const scenes = await db.getAll(SCENES_STORE);
        sceneListContainer.innerHTML = '';

        if (scenes.length === 0) {
            sceneListContainer.innerHTML = `
        <div id="no-scenes-message">
            <div class="icon icon-map-large"></div>
            <h3>No hay mapas guardados</h3>
            <p>Aún no has guardado ninguna escena. Crea una y guárdala para poder cargarla más tarde.</p>
        </div>`;
            return;
        }

        scenes.sort((a, b) => new Date(b.date) - new Date(a.date));

        // El resto de la lógica para obtener los thumbnails y renderizar es igual
        const validMapKeys = scenes.map(scene => scene.mapAssetId).filter(key => key);
        const mapAssets = new Map();
        if (validMapKeys.length > 0) {
            const tx = db.transaction(ASSETS_STORE, 'readonly');
            const store = tx.objectStore(ASSETS_STORE);
            const assets = await Promise.all(validMapKeys.map(key => store.get(key)));
            assets.forEach(asset => {
                if (asset) mapAssets.set(asset.id, asset.data);
            });
        }

        scenes.forEach((scene) => {
            const mapSrc = mapAssets.get(scene.mapAssetId) || '';
            const formattedDate = new Date(scene.date).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const tokenCount = scene.tokens.length;
            const wallCount = scene.walls.filter(w => w.type === 'wall').length;
            const doorCount = scene.walls.filter(w => w.type === 'door').length;
            const card = document.createElement('div');
            card.className = 'scene-card';
            card.dataset.sceneId = scene.id;

            card.innerHTML = `
        <div class="scene-card-image-container">
            <img src="${mapSrc}" alt="Vista previa de ${scene.name}" class="scene-card-image">
            <div class="scene-card-info-overlay">
                <h3 class="scene-card-name">${scene.name}</h3>
                <p class="scene-card-date">Guardado: ${formattedDate}</p>
            </div>
            <button class="delete-scene-btn" data-scene-id="${scene.id}" title="Eliminar Escena">×</button>
        </div>
        <div class="scene-card-body">
            <div class="scene-card-stats">
                <div class="scene-card-stat-item"><span class="scene-card-stat-icon icon-stat-token"></span><span>${tokenCount} Fichas</span></div>
                <div class="scene-card-stat-item"><span class="scene-card-stat-icon icon-stat-wall"></span><span>${wallCount} Muros</span></div>
                <div class="scene-card-stat-item"><span class="scene-card-stat-icon icon-stat-door"></span><span>${doorCount} Puertas</span></div>
            </div>
        </div>`;
            sceneListContainer.appendChild(card);
        });

        sceneListContainer.querySelectorAll('.scene-card').forEach(card => card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-scene-btn')) loadSceneById(card.dataset.sceneId);
        }));

        sceneListContainer.querySelectorAll('.delete-scene-btn').forEach(btn => btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSceneById(btn.dataset.sceneId);
        }));
    }

    async function deleteSceneById(sceneId) {
        const confirmed = await showCustomModal({
            title: 'Confirmar Eliminación',
            message: '¿Estás realmente seguro de que quieres eliminar esta escena? Esta acción es irreversible.',
            type: 'confirm',
            confirmText: 'Sí, eliminarla',
            cancelText: 'No, cancelar'
        });

        if (!confirmed) return;

        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        // Convertimos el ID que viene del 'dataset' (string) a un número.
        const numericSceneId = parseInt(sceneId, 10);

        // Primero, obtenemos la metadata de la escena para saber qué assets borrar
        // Usamos el ID numérico para la búsqueda.
        const sceneToDelete = await db.get(SCENES_STORE, numericSceneId);

        if (!sceneToDelete) {
            console.warn("Se intentó borrar una escena que ya no existe:", numericSceneId);
            renderSavedScenesList(); // Refrescar la UI por si acaso
            return;
        }

        try {
            const tx = db.transaction([SCENES_STORE, ASSETS_STORE], 'readwrite');
            const sceneStore = tx.objectStore(SCENES_STORE);
            const assetStore = tx.objectStore(ASSETS_STORE);

            const deletePromises = [];

            // 1. Borramos la entrada de la escena usando el ID numérico.
            deletePromises.push(sceneStore.delete(numericSceneId));

            // 2. Borramos los assets asociados (esta parte ya funcionaba bien)
            if (sceneToDelete.mapAssetId) {
                deletePromises.push(assetStore.delete(sceneToDelete.mapAssetId));
            }
            if (sceneToDelete.fogAssetId) {
                deletePromises.push(assetStore.delete(sceneToDelete.fogAssetId));
            }
            if (sceneToDelete.tokens && Array.isArray(sceneToDelete.tokens)) {
                sceneToDelete.tokens.forEach(token => {
                    const assetId = token.identity?.imageAssetId || token.imageAssetId;
                    if (assetId) {
                        deletePromises.push(assetStore.delete(assetId));
                    }
                });
            }

            await Promise.all(deletePromises);
            await tx.done;

            renderSavedScenesList();

        } catch (error) {
            console.error("Error al eliminar la escena y sus assets:", error);
            showCustomModal({
                title: 'Error',
                message: 'Hubo un problema al eliminar los datos de la escena.',
                type: 'error'
            });
        }
    }

    function migrateTokenData(oldToken) { if (oldToken.stats && oldToken.stats.characteristics && oldToken.info && oldToken.info.abilities) { return oldToken; } const existingInfo = oldToken.info || {}; return { id: oldToken.id, isDiscovered: oldToken.isDiscovered, identity: oldToken.identity || { name: oldToken.name, type: oldToken.type, letter: oldToken.letter, image: null, imageAssetId: oldToken.imageAssetId }, position: oldToken.position || { x: oldToken.x, y: oldToken.y, sizeMultiplier: oldToken.sizeMultiplier || 1 }, stats: { initiative: oldToken.stats?.initiative ?? oldToken.turn ?? 0, vision: { radius: oldToken.stats?.vision?.radius ?? oldToken.visionRadius ?? 0 }, health: { current: oldToken.stats?.health?.current ?? oldToken.health_current ?? 0, max: oldToken.stats?.health?.max ?? oldToken.health_max ?? 0 }, proficiencyBonus: oldToken.stats?.proficiencyBonus ?? 2, speed: oldToken.stats?.speed ?? 30, armorClass: oldToken.stats?.armorClass ?? 10, characteristics: oldToken.stats?.characteristics || { str: { score: 10, proficient: false }, dex: { score: 10, proficient: false }, con: { score: 10, proficient: false }, int: { score: 10, proficient: false }, wis: { score: 10, proficient: false }, car: { score: 10, proficient: false } } }, appearance: oldToken.appearance || { color: oldToken.color, borderColor: oldToken.borderColor }, info: { notes: existingInfo.notes || oldToken.notes || '', states: existingInfo.states || oldToken.states || [], abilities: existingInfo.abilities || [], inventory: existingInfo.inventory || [] } }; }
    function handleImageUpload(event) { const file = event.target.files[0]; if (!file) { fileNameDisplay.textContent = 'Ningún archivo'; return; } fileNameDisplay.textContent = file.name; const reader = new FileReader(); reader.onload = e => { const src = e.target.result; document.getElementById('mapImageInput')._dataUrl = src; loadNewMap(src); }; reader.readAsDataURL(file); }
    function loadNewMap(src) { isMapLoaded = true; tokens = []; walls = []; selectedTokenId = null; visionModeActive = false; toggleVisionBtn.textContent = 'Iniciar Visión'; updateTokenList(); updateDoorList(); broadcast('CMD_LOAD_NEW_MAP', { src }); broadcastGridSettings(); }
    function updateCellSize() { const newSize = parseFloat(cellSizeInput.value); if (isNaN(newSize) || newSize < 10) { cellSizeInput.value = cellSize; return; } cellSize = newSize; broadcastGridSettings(); } async function addToken(existingCharacter = null, fromLibrary = false) {
        let tokenData; if (fromLibrary && existingCharacter) { tokenData = existingCharacter; } else {
            const letter = add_tokenLetter.value.trim(); const name = add_tokenName.value.trim(); if (!letter || !name) {
                showCustomModal({
                    title: 'Atención',
                    message: 'Nombre y Letra son obligatorios.',
                    type: 'warning'
                });
                return;
            } let imageBase64 = null; if (add_tokenImageInput.files[0]) imageBase64 = await processImage(add_tokenImageInput.files[0]); const characteristics = {};['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => { characteristics[stat] = { score: parseInt(document.getElementById(`add_${stat}_score`).value) || 10, proficient: document.getElementById(`add_${stat}_save_prof`).checked }; }); tokenData = { id: Date.now(), isDiscovered: document.querySelector('input[name="add_tokenType"]:checked').value === 'player', identity: { name, type: document.querySelector('input[name="add_tokenType"]:checked').value, letter, image: imageBase64, char_class: document.getElementById('tokenClass').value || 'Aventurero', level: parseInt(document.getElementById('tokenLevel').value) || 1, race: document.getElementById('tokenRace').value || 'Desconocida' }, position: { x: 20, y: 20, sizeMultiplier: parseFloat(add_tokenSizeMultiplier.value) || 1 }, stats: { initiative: 0, vision: { radius: parseInt(add_tokenVision.value) || 0 }, health: { current: parseInt(add_tokenHealth.value) || 0, max: parseInt(add_tokenHealth.value) || 0 }, proficiencyBonus: parseInt(document.getElementById('add_proficiency_bonus').value) || 2, speed: parseInt(document.getElementById('add_speed').value) || 30, armorClass: parseInt(document.getElementById('add_armor_class').value) || 10, characteristics }, appearance: { color: document.getElementById('tokenColor').value, borderColor: document.getElementById('addBorderCheckbox').checked ? document.getElementById('tokenBorderColor').value : null }, info: { notes: document.getElementById('tokenNotes').value, states: [], abilities: [], inventory: [] } };
        } addTokenToBoard(tokenData);
    }
    function deleteToken(tokenId) { tokens = tokens.filter(t => t.id !== tokenId); if (selectedTokenId === tokenId) deselectToken(); updateTokenList(); broadcast('CMD_DELETE_TOKEN', { id: tokenId }); if (visionModeActive) broadcast('CMD_DRAW_VISION', { tokens, walls, cellSize }); }
    function selectToken(tokenId) { if (selectedTokenId === tokenId) return; deselectToken(); selectedTokenId = tokenId; const token = tokens.find(t => t.id === tokenId); if (!token) { deselectToken(); return; } const mainColumn = document.querySelector('.main-column'); const tokenViewButton = mainColumn.querySelector('[data-view="main-view-selected-token"]'); if (tokenViewButton) { tokenViewButton.click(); } selectedTokenView.classList.add('has-selection'); updateTokenInUI(token); broadcast('CMD_SELECT_TOKEN', { id: tokenId }); broadcast('CMD_HIGHLIGHT_TRACKER_CARD', { id: tokenId }); }
    function deselectToken() { if (!selectedTokenId) return; const oldListItem = tokenListUl.querySelector(`li[data-id="${selectedTokenId}"]`); if (oldListItem) oldListItem.classList.remove('selected-in-list'); selectedTokenId = null; selectedTokenView.classList.remove('has-selection'); if (activeAoeType) toggleAoe(null); broadcast('CMD_DESELECT_TOKEN'); broadcast('CMD_HIGHLIGHT_TRACKER_CARD', { id: null }); }
    function updateSelectedToken() { if (!selectedTokenId) return; const token = tokens.find(t => t.id === selectedTokenId); if (!token) return; token.identity.name = document.getElementById('editTokenName').value.trim(); token.identity.char_class = document.getElementById('editTokenClass').value.trim() || 'Clase'; token.identity.level = parseInt(document.getElementById('editTokenLevel').value) || 1; token.identity.race = document.getElementById('editTokenRace').value.trim() || 'Raza'; token.stats.initiative = parseInt(document.getElementById('editTokenTurn').value) || 0; token.stats.vision.radius = parseInt(document.getElementById('editTokenVision').value) || 0; token.stats.health.max = parseInt(document.getElementById('editTokenHealthMax').value) || 0; token.stats.proficiencyBonus = parseInt(document.getElementById('edit_proficiency_bonus').value) || 0; token.stats.speed = parseInt(document.getElementById('edit_speed').value) || 0; token.stats.armorClass = parseInt(document.getElementById('edit_armor_class').value) || 0;['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => { token.stats.characteristics[stat].score = parseInt(document.getElementById(`edit_${stat}_score`).value) || 10; token.stats.characteristics[stat].proficient = document.getElementById(`edit_${stat}_save_prof`).checked; }); token.appearance.color = document.getElementById('editTransparentBgCheckbox').checked ? 'transparent' : document.getElementById('editTokenColor').value; token.appearance.borderColor = editBorderCheckbox.checked ? document.getElementById('editTokenBorderColor').value : null; token.info.notes = document.getElementById('editTokenNotes').value; token.position.sizeMultiplier = parseFloat(document.getElementById('editTokenSizeMultiplier').value) || 1; if (token.stats.health.current > token.stats.health.max) { token.stats.health.current = token.stats.health.max; } updateTokenInUI(token); updateTokenList(); broadcast('CMD_UPDATE_TOKEN_DATA', { tokenData: token }); if (visionModeActive) { broadcast('CMD_DRAW_VISION', { tokens, walls, cellSize }); } }
    function toggleVisionMode() { visionModeActive = !visionModeActive; toggleVisionBtn.textContent = visionModeActive ? 'Detener Visión' : 'Iniciar Visión'; broadcast('CMD_SET_VISION_MODE', { active: visionModeActive, tokens, walls, cellSize }); }
    function resetFog() { if (!confirm("¿Reiniciar toda la niebla de guerra?")) return; tokens.forEach(t => { if (t.identity.type === 'enemy') t.isDiscovered = false; }); broadcast('CMD_RESET_FOG'); if (visionModeActive) broadcast('CMD_DRAW_VISION', { tokens, walls, cellSize }); updateTokenList(); }
    function checkEnemyDiscovery(visibleEnemies) { let trackerNeedsUpdate = false; visibleEnemies.forEach(enemyId => { const enemy = tokens.find(t => t.id === enemyId && !t.isDiscovered); if (enemy) { enemy.isDiscovered = true; trackerNeedsUpdate = true; } }); if (trackerNeedsUpdate) { updateTokenList(); broadcast('CMD_UPDATE_TURN_TRACKER', { tokens }); } }
    function handleBrushModeChange(event) { const checkbox = event.target; const otherCheckbox = checkbox.id === 'brushReveal' ? brushHideCheckbox : brushRevealCheckbox; if (checkbox.checked) { otherCheckbox.checked = false; activeBrushMode = checkbox.value; } else { activeBrushMode = null; } broadcast('CMD_SET_BRUSH_MODE', { mode: activeBrushMode }); }
    
    function toggleAlignGridMode(forceState) { isAligningGrid = typeof forceState === 'boolean' ? forceState : !isAligningGrid; alignGridModeBtn.classList.toggle('active', isAligningGrid); alignGridModeBtn.textContent = isAligningGrid ? 'Cancelar Alineación' : 'Activar Modo Alineación'; broadcast('CMD_SET_GRID_ALIGN_MODE', { active: isAligningGrid }); }
    function broadcastGridSettings() { broadcast('CMD_SET_GRID_SETTINGS', { gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity, offsetX: gridOffsetX, offsetY: gridOffsetY, cellSize: cellSize } }); }
    const calculateModifier = (score) => { const mod = Math.floor((score - 10) / 2); return mod >= 0 ? `+${mod}` : `${mod}`; };
    const updateCharStatUI = (prefix, stat) => { const scoreInput = document.getElementById(`${prefix}_${stat}_score`); const modDisplay = document.getElementById(`${prefix}_${stat}_mod`); if (!scoreInput || !modDisplay) return; const score = parseInt(scoreInput.value) || 10; modDisplay.textContent = calculateModifier(score); updateSavingThrowsUI(prefix); };
    const updateSavingThrowsUI = (prefix) => { const stats = ['str', 'dex', 'con', 'int', 'wis', 'car']; const profBonus = parseInt(document.getElementById(`${prefix}_proficiency_bonus`).value) || 0; stats.forEach(stat => { const score = parseInt(document.getElementById(`${prefix}_${stat}_score`).value) || 10; const baseMod = Math.floor((score - 10) / 2); const isProficient = document.getElementById(`${prefix}_${stat}_save_prof`).checked; const total = baseMod + (isProficient ? profBonus : 0); const totalDisplay = document.getElementById(`${prefix}_${stat}_save_total`); if (totalDisplay) { totalDisplay.textContent = total >= 0 ? `+${total}` : `${total}`; } }); };
    async function handleEditTokenImageChange(event) { if (!selectedTokenId) return; const file = event.target.files[0]; if (file) { const token = tokens.find(t => t.id === selectedTokenId); if (token) { token.identity.image = await processImage(file); updateTokenInUI(token); broadcast('CMD_UPDATE_TOKEN_DATA', { tokenData: token }); } } }
    function removeEditTokenImage() { if (!selectedTokenId) return; const token = tokens.find(t => t.id === selectedTokenId); if (token) { token.identity.image = null; updateTokenInUI(token); broadcast('CMD_UPDATE_TOKEN_DATA', { tokenData: token }); } }
    function applyHealthChange(amount) { if (!selectedTokenId || isNaN(amount)) return; const token = tokens.find(t => t.id === selectedTokenId); if (!token) return; const oldHealth = token.stats.health.current; let newHealth = oldHealth + amount; newHealth = Math.max(0, Math.min(token.stats.health.max, newHealth)); const actualChange = newHealth - oldHealth; token.stats.health.current = newHealth; updateTokenInUI(token); updateTokenList(); if (actualChange !== 0) { const text = `${actualChange > 0 ? '+' : ''}${actualChange}`; const typeClass = actualChange > 0 ? 'heal' : 'damage'; const panelFloat = document.createElement('div'); panelFloat.className = `damage-float ${typeClass}`; panelFloat.textContent = text; healthDisplayContainer.appendChild(panelFloat); setTimeout(() => panelFloat.remove(), 1000); const sound = actualChange < 0 ? damageSound : healSound; sound.currentTime = 0; sound.play(); const animationClass = actualChange < 0 ? 'damaged' : 'healed'; const timeout = actualChange < 0 ? 400 : 500; broadcast('CMD_SHOW_DAMAGE_FLOAT', { amount: actualChange, tokenId: token.id }); broadcast('CMD_APPLY_TOKEN_ANIMATION', { tokenId: token.id, animationClass, timeout }); broadcast('CMD_UPDATE_TOKEN_DATA', { tokenData: token }); } } function addStateToSelectedToken() {
        if (!selectedTokenId) return; const token = tokens.find(t => t.id === selectedTokenId); if (!token) return; const emoji = newStateEmoji.value.trim(); const desc = newStateDesc.value.trim(); if (!emoji) {
            showCustomModal({
                title: 'Atención',
                message: 'El emoji del estado no puede estar vacío.',
                type: 'warning'
            });
            return;
        } if (!token.info.states) token.info.states = []; token.info.states.push({ emoji, description: desc }); newStateEmoji.value = ''; newStateDesc.value = ''; renderTokenStatesEditor(token); broadcast('CMD_UPDATE_TOKEN_DATA', { tokenData: token });
    }
    function removeStateFromSelectedToken(index) { if (!selectedTokenId) return; const token = tokens.find(t => t.id === selectedTokenId); if (!token || !token.info || !token.info.states || !token.info.states[index]) return; token.info.states.splice(index, 1); renderTokenStatesEditor(token); broadcast('CMD_UPDATE_TOKEN_DATA', { tokenData: token }); }
    function toggleAoe(shape) { activeAoeType = activeAoeType === shape ? null : shape; updateAoeControls(); if (activeAoeType) { broadcastAoeState(); } else { broadcast('CMD_CLEAR_AOE'); } }
    function updateAoeControls() { aoeShapeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.shape === activeAoeType)); document.querySelectorAll('.aoe-params').forEach(paramDiv => { paramDiv.style.display = paramDiv.id === `params-${activeAoeType}` ? 'block' : 'none'; }); }
    function broadcastAoeState() { if (!activeAoeType || !selectedTokenId) { broadcast('CMD_CLEAR_AOE'); return; } const token = tokens.find(t => t.id === selectedTokenId); if (!token) return; const aoeData = { type: activeAoeType, origin: { x: token.position.x + ((token.position.sizeMultiplier || 1) * cellSize / 2), y: token.position.y + ((token.position.sizeMultiplier || 1) * cellSize / 2) }, params: { color: aoeColorInput.value } }; switch (activeAoeType) { case 'line': aoeData.params.width = parseInt(document.getElementById('aoeLineWidth').value) || 1; break; case 'cone': aoeData.params.length = parseInt(document.getElementById('aoeConeLength').value) || 1; break; case 'cube': aoeData.params.size = parseInt(document.getElementById('aoeCubeSize').value) || 1; break; case 'sphere': aoeData.params.radius = parseInt(document.getElementById('aoeSphereRadius').value) || 1; break; case 'cylinder': aoeData.params.radius = parseInt(document.getElementById('aoeCylinderRadius').value) || 1; break; } broadcast('CMD_DRAW_AOE', { aoeData }); }
    function undoLastWall() { if (walls.length > 0) { walls.pop(); updateDoorList(); broadcast('CMD_DRAW_WALLS', { walls: walls }); if (visionModeActive) { broadcast('CMD_DRAW_VISION', { tokens, walls, cellSize }); } } }
    function clearAllWalls() {
        walls = [];
        updateDoorList();
        broadcast('CMD_DRAW_WALLS', { walls: walls });
        if (visionModeActive) {
            broadcast('CMD_DRAW_VISION', { tokens, walls, cellSize });
        }
    }

    function updateDoorList() {
        const doors = walls.filter(w => w.type === 'door'); doorListUl.innerHTML = ''; noDoorsMessage.style.display = doors.length === 0 ? 'block' : 'none'; doors.forEach(door => {
            const li = document.createElement('li'); li.innerHTML = `<span class="door-name" data-id="${door.id}" title="Haz clic para editar">${door.name}</span>
            <div class="door-actions"><button class="toggle-door-btn ${door.isOpen ? 'open' : ''}" data-id="${door.id}">${door.isOpen ? 'Cerrar' : 'Abrir'}</button><button class="delete-door-btn" data-id="${door.id}" title="Eliminar Acceso">X</button></div>`; doorListUl.appendChild(li);
        }); doorListUl.querySelectorAll('.toggle-door-btn').forEach(btn => btn.addEventListener('click', toggleDoorState)); doorListUl.querySelectorAll('.delete-door-btn').forEach(btn => btn.addEventListener('click', deleteDoor)); doorListUl.querySelectorAll('.door-name').forEach(nameSpan => nameSpan.addEventListener('click', makeDoorNameEditable));
    }
    function makeDoorNameEditable(event) { const nameSpan = event.target; const doorId = parseInt(nameSpan.dataset.id); const originalName = nameSpan.textContent; const input = document.createElement('input'); input.type = 'text'; input.value = originalName; input.classList.add('door-name-edit'); nameSpan.replaceWith(input); input.focus(); input.select(); const saveChanges = () => { const door = walls.find(w => w.id === doorId); if (door) { const newName = input.value.trim(); door.name = newName === '' ? originalName : newName; } updateDoorList(); broadcast('CMD_DRAW_WALLS', { walls }); }; input.addEventListener('blur', saveChanges); input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); else if (e.key === 'Escape') { input.value = originalName; input.blur(); } }); }
    function toggleDoorState(event) { const doorId = parseInt(event.target.dataset.id); const door = walls.find(w => w.id === doorId); if (door) { door.isOpen = !door.isOpen; updateDoorList(); broadcast('CMD_DRAW_WALLS', { walls }); if (visionModeActive) { broadcast('CMD_DRAW_VISION', { tokens, walls, cellSize }); } } }
    function deleteDoor(event) { const doorId = parseInt(event.target.dataset.id); walls = walls.filter(w => w.id !== doorId); updateDoorList(); broadcast('CMD_DRAW_WALLS', { walls }); if (visionModeActive) broadcast('CMD_DRAW_VISION', { tokens, walls, cellSize }); }
    function updateTokenList() {
        tokenListUl.innerHTML = ''; if (tokens.length === 0) { tokenListUl.innerHTML = `<p class="no-tokens-message">Aún no hay fichas en el tablero.</p>`; return; } const sortedTokens = [...tokens].sort((a, b) => (b.stats.initiative || 0) - (a.stats.initiative || 0)); sortedTokens.forEach(token => {
            const li = document.createElement('li'); li.dataset.id = token.id; const typeIconHTML = `<span class="token-list-icon ${token.identity.type === 'player' ? 'icon-player-list' : 'icon-enemy-list'}"></span>`; const borderStyle = token.appearance.borderColor ? `border: 3px solid ${token.appearance.borderColor};` : 'none'; const imageStyle = token.identity.image ? `background-image: url(${token.identity.image}); background-size: cover; background-position: center;` : `background-color: ${token.appearance.color};`; const previewContent = token.identity.image ? '' : token.identity.letter; li.innerHTML = ` <div class="token-list-preview" style="${imageStyle} ${borderStyle}">${previewContent}</div>
            <div class="token-list-header">${typeIconHTML}<span>${token.identity.name}</span></div>
            <div class="token-list-details"> <span>Iniciativa: ${token.stats.initiative || 0}</span> <span>♥️ ${token.stats.health.current}/${token.stats.health.max}</span> <span>👁️ ${token.stats.vision.radius}</span> </div> <button class="delete-token-btn" data-id="${token.id}" title="Eliminar Ficha">X</button>`; tokenListUl.appendChild(li);
        }); tokenListUl.querySelectorAll('.delete-token-btn').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); deleteToken(parseInt(e.target.dataset.id)); })); tokenListUl.querySelectorAll('li').forEach(li => li.addEventListener('click', e => selectToken(parseInt(e.currentTarget.dataset.id)))); if (selectedTokenId) { const selectedLi = tokenListUl.querySelector(`li[data-id="${selectedTokenId}"]`); if (selectedLi) selectedLi.classList.add('selected-in-list'); }
    }
    function resetGridOffset() { if (confirm("¿Restablecer la alineación de la rejilla?")) { gridOffsetX = 0; gridOffsetY = 0; broadcastGridSettings(); if (isAligningGrid) toggleAlignGridMode(false); } }
    function openFeatureModal(context) { if (!selectedTokenId) return; currentModalContext = context; if (context === 'ability') { modalTitle.textContent = 'Añadir Habilidad Destacada'; modalNameInput.placeholder = 'Ej: Ataque Furtivo'; modalDescriptionInput.placeholder = 'Describe la habilidad, dados de daño, etc.'; } else if (context === 'inventory') { modalTitle.textContent = 'Añadir Objeto al Inventario'; modalNameInput.placeholder = 'Ej: Poción de Curación Mayor'; modalDescriptionInput.placeholder = 'Cantidad, descripción del objeto, etc.'; } modalNameInput.value = ''; modalDescriptionInput.value = ''; featureInventoryModal.classList.add('open'); modalNameInput.focus(); }
    function saveFeatureOrItem() {
        if (!selectedTokenId || !currentModalContext) return; const token = tokens.find(t => t.id === selectedTokenId); if (!token) return; const name = modalNameInput.value.trim(); const description = modalDescriptionInput.value.trim(); if (!name) {
            showCustomModal({
                title: 'Atención',
                message: 'El nombre no puede estar vacío.',
                type: 'warning'
            });
            return;
        } const newItem = { id: Date.now(), name, description }; if (currentModalContext === 'ability') { if (!token.info.abilities) token.info.abilities = []; token.info.abilities.push(newItem); renderAbilitiesList(token); } else if (currentModalContext === 'inventory') { if (!token.info.inventory) token.info.inventory = []; token.info.inventory.push(newItem); renderInventoryList(token); } featureInventoryModal.classList.remove('open'); broadcast('CMD_UPDATE_TOKEN_DATA', { tokenData: token });
    }
    function renderAbilitiesList(token) {
        editAbilitiesList.innerHTML = '';
        if (!token || !token.info.abilities) return;
        token.info.abilities.forEach((ability, index) => {
            const card = document.createElement('div');
            card.className = 'info-card';
            card.innerHTML = `<h5 class="info-card-title">${ability.name}</h5><p class="info-card-desc">${ability.description}</p><button class="delete-info-btn" data-index="${index}" data-type="ability">×</button>`;
            editAbilitiesList.appendChild(card);

            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-info-btn')) return; // No abrir modal si se borra
                openEditCardModal('ability', index);
            });
        });
        editAbilitiesList.querySelectorAll('.delete-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                token.info.abilities.splice(parseInt(btn.dataset.index), 1);
                renderAbilitiesList(token);
                broadcast('CMD_UPDATE_TOKEN_DATA', { tokenData: token });
            });
        });
    }
    function renderInventoryList(token) {
        editInventoryList.innerHTML = '';
        if (!token || !token.info.inventory) return;
        token.info.inventory.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'info-card';
            card.innerHTML = `<h5 class="info-card-title">${item.name}</h5><p class="info-card-desc">${item.description}</p><button class="delete-info-btn" data-index="${index}" data-type="inventory">×</button>`;
            editInventoryList.appendChild(card);

            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-info-btn')) return;
                openEditCardModal('inventory', index);
            });
        });
        editInventoryList.querySelectorAll('.delete-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                token.info.inventory.splice(parseInt(btn.dataset.index), 1);
                renderInventoryList(token);
                broadcast('CMD_UPDATE_TOKEN_DATA', { tokenData: token });
            });
        });
    }
    function renderTokenStatesEditor(token) { editTokenStatesList.innerHTML = ''; if (!token || !token.info || !token.info.states) return; token.info.states.forEach((state, index) => { const li = document.createElement('li'); li.innerHTML = `<span class="state-emoji">${state.emoji}</span><span class="state-desc">${state.description}</span><button class="delete-state-btn" data-index="${index}">×</button>`; editTokenStatesList.appendChild(li); }); editTokenStatesList.querySelectorAll('.delete-state-btn').forEach(btn => btn.addEventListener('click', () => removeStateFromSelectedToken(parseInt(btn.dataset.index)))); }
    tokenInfoEdit.querySelectorAll('input').forEach(input => { input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveHeaderChanges(); tokenInfoView.style.display = 'block'; tokenInfoEdit.style.display = 'none'; } else if (e.key === 'Escape') { updateTokenInUI(tokens.find(t => t.id === selectedTokenId)); } }); });
    saveCharacterBtn.addEventListener('click', () => {
        if (!selectedTokenId) {
            showCustomModal({
                title: 'Atención',
                message: 'Primero selecciona una ficha del tablero para guardarla.',
                type: 'warning'
            });
            return;
        } const tokenToSave = tokens.find(t => t.id === selectedTokenId); if (tokenToSave) { saveCharacterToLibrary(tokenToSave); }
    });
    const saveHeaderBtn = document.getElementById('saveHeaderBtn'); if (saveHeaderBtn) { saveHeaderBtn.addEventListener('click', (e) => { e.stopPropagation(); saveHeaderChanges(); }); }
    tokenInfoEdit.querySelectorAll('input').forEach(input => { input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveHeaderChanges(); } else if (e.key === 'Escape') { const token = tokens.find(t => t.id === selectedTokenId); if (token) updateTokenInUI(token); tokenInfoView.style.display = 'block'; tokenInfoEdit.style.display = 'none'; } }); });
    function getCharacterLibrary() { return JSON.parse(localStorage.getItem(CHAR_LIB_STORE)) || []; }
    async function saveCharacterToLibrary(characterData) {
        // 1. Preguntar si se quiere guardar el personaje
        const wantsToSave = await showCustomModal({
            title: 'Guardar en Biblioteca',
            message: `¿Quieres guardar a <strong style="color: var(--text-gold);">${characterData.identity.name}</strong> en tu biblioteca para usarlo en futuras sesiones?`,
            type: 'confirm',
            confirmText: 'Sí, guardar',
            cancelText: 'No, gracias'
        });

        if (!wantsToSave) {
            return; // El usuario canceló la operación inicial
        }

        let library = getCharacterLibrary();
        const cleanCharacter = JSON.parse(JSON.stringify(characterData));
        delete cleanCharacter.id;
        delete cleanCharacter.element;

        const existingIndex = library.findIndex(char => char.identity.name === cleanCharacter.identity.name);

        if (existingIndex > -1) {
            // 2. Si ya existe, preguntar si se quiere sobreescribir
            const doOverwrite = await showCustomModal({
                title: 'Personaje Existente',
                message: `El personaje <strong style="color: var(--text-gold);">${cleanCharacter.identity.name}</strong> ya existe en tu biblioteca. ¿Quieres sobreescribir sus datos?`,
                type: 'confirm',
                confirmText: 'Sobrescribir',
                cancelText: 'Cancelar'
            });

            if (doOverwrite) {
                library[existingIndex] = cleanCharacter;
            } else {
                return; // El usuario decidió no sobreescribir
            }
        } else {
            library.push(cleanCharacter);
        }

        localStorage.setItem(CHAR_LIB_STORE, JSON.stringify(library));

        // 3. Notificación de éxito
        showNotification(`¡<strong style="color: var(--text-gold);">${cleanCharacter.identity.name}</strong> se ha guardado en la biblioteca!`);

        renderCharacterLibrary();
    }

    function renderCharacterLibrary() {
        const library = getCharacterLibrary(); savedCharactersGrid.innerHTML = '';
        const hasCharacters = library.length > 0; noSavedCharactersMessage.style.display = hasCharacters ? 'none' : 'block';
        characterLibraryActions.style.display = hasCharacters ? 'flex' : 'none';
        library.forEach((char, index) => {
            const card = document.createElement('div'); card.className = 'saved-char-card'; card.dataset.charIndex = index;
            const imageStyle = char.identity.image ? `background-image: url(${char.identity.image});` : `background-color: ${char.appearance.color};`;
            const previewContent = char.identity.image ? '' : char.identity.letter; card.innerHTML = ` <div class="saved-char-preview">
                <div class="preview-content" style="${imageStyle}">${previewContent}</div>
            </div>
            <div class="saved-char-info">
                <p class="saved-char-name">${char.identity.name}</p>
                <p class="saved-char-level">Nivel ${char.identity.level}</p>
            </div> <button class="delete-saved-char-btn" title="Eliminar de la biblioteca">×</button> `;
            card.addEventListener('click', () => {
                const characterToAdd = getCharacterLibrary()[index];
                if (characterToAdd) {
                    const newInstance = JSON.parse(JSON.stringify(characterToAdd));
                    newInstance.id = Date.now();
                    newInstance.position.x = 20;
                    newInstance.position.y = 20;
                    // =======================================================

                    addTokenToBoard(newInstance); // Ahora se añade con las coordenadas reseteadas                    //notificacion
                    // Llamada Mejorada para el toast
                    showNotification(`¡<strong style="color: var(--text-gold);">${characterToAdd.identity.name}</strong> ha regresado al tablero!`);
                }
            }); card.querySelector('.delete-saved-char-btn').addEventListener('click', (e) => {
                e.stopPropagation(); if (confirm(`¿Eliminar a "${char.identity.name}" de la biblioteca? Esta acción no se puede deshacer.`)) {
                    let currentLibrary = getCharacterLibrary(); currentLibrary.splice(index, 1); localStorage.setItem(CHAR_LIB_STORE, JSON.stringify(currentLibrary)); renderCharacterLibrary();
                }
            }); savedCharactersGrid.appendChild(card);
        });
    }
    async function createTokenFromForm() {
        // 1. Validar y recolectar datos del formulario
        const letter = add_tokenLetter.value.trim();
        const name = add_tokenName.value.trim();
        if (!letter || !name) {
            showCustomModal({
                title: 'Atención',
                message: 'Nombre y Letra son obligatorios.',
                type: 'warning'
            }); return;
        }

        let imageBase64 = null;
        if (add_tokenImageInput.files[0]) {
            imageBase64 = await processImage(add_tokenImageInput.files[0]);
        }

        const characteristics = {};
        ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => {
            characteristics[stat] = {
                score: parseInt(document.getElementById(`add_${stat}_score`).value) || 10,
                proficient: document.getElementById(`add_${stat}_save_prof`).checked
            };
        });

        // 2. Construir el objeto de datos del token
        const tokenData = {
            id: Date.now(), // ID único para el tablero
            isDiscovered: document.querySelector('input[name="add_tokenType"]:checked').value === 'player',
            identity: {
                name,
                type: document.querySelector('input[name="add_tokenType"]:checked').value,
                letter,
                image: imageBase64,
                char_class: document.getElementById('tokenClass').value || 'Aventurero',
                level: parseInt(document.getElementById('tokenLevel').value) || 1,
                race: document.getElementById('tokenRace').value || 'Desconocida'
            },
            position: { x: 20, y: 20, sizeMultiplier: parseFloat(add_tokenSizeMultiplier.value) || 1 },
            stats: {
                initiative: 0,
                vision: { radius: parseInt(add_tokenVision.value) || 0 },
                health: { current: parseInt(add_tokenHealth.value) || 0, max: parseInt(add_tokenHealth.value) || 0 },
                proficiencyBonus: parseInt(document.getElementById('add_proficiency_bonus').value) || 2,
                speed: parseInt(document.getElementById('add_speed').value) || 30,
                armorClass: parseInt(document.getElementById('add_armor_class').value) || 10,
                characteristics
            },
            appearance: {
                color: document.getElementById('addTransparentBgCheckbox').checked
                    ? 'transparent'
                    : document.getElementById('tokenColor').value,
                borderColor: document.getElementById('addBorderCheckbox').checked ? document.getElementById('tokenBorderColor').value : null
            },
            info: {
                notes: document.getElementById('tokenNotes').value,
                states: [],
                abilities: [],
                inventory: []
            }
        };

        // 3. Añadir el token al tablero
        addTokenToBoard(tokenData);
        //notificacion
        showNotification(`¡<strong style="color: var(--text-gold);">${tokenData.identity.name}</strong> se ha unido a la aventura!`);

        // 4. Limpiar el formulario para la siguiente entrada
        resetAddTokenForm();
    }

    function addTokenToBoard(tokenData) { tokens.push(tokenData); updateTokenList(); broadcast('CMD_CREATE_TOKEN', { tokenData }); if (visionModeActive) { broadcast('CMD_DRAW_VISION', { tokens, walls, cellSize }); } }
    const dmNotesTextarea = document.getElementById('dmNotes');
    const DM_NOTES_KEY = 'dmArsenalDmNotes';
    function loadDmNotes() { const savedNotes = localStorage.getItem(DM_NOTES_KEY); if (savedNotes) { dmNotesTextarea.value = savedNotes; } }
    dmNotesTextarea.addEventListener('input', () => { localStorage.setItem(DM_NOTES_KEY, dmNotesTextarea.value); });
    function filterList(inputElement, listContainer) { const filterText = inputElement.value.toLowerCase(); const items = listContainer.querySelectorAll('.info-card'); items.forEach(item => { const title = item.querySelector('.info-card-title')?.textContent.toLowerCase() || ''; const description = item.querySelector('.info-card-desc')?.textContent.toLowerCase() || ''; const isVisible = title.includes(filterText) || description.includes(filterText); item.style.display = isVisible ? 'block' : 'none'; }); }
    searchAbilitiesInput.addEventListener('input', () => { filterList(searchAbilitiesInput, editAbilitiesList); });
    searchInventoryInput.addEventListener('input', () => { filterList(searchInventoryInput, editInventoryList); });
    function handleExportScene() {
        if (!isMapLoaded) {
            showCustomModal({
                title: 'Atención',
                message: 'Carga un mapa antes de exportar la escena.',
                type: 'warning'
            });
            return;
        } if (!playerViewWindow || playerViewWindow.closed) {
            showCustomModal({
                title: 'Atención',
                message: 'La ventana del jugador debe estar abierta para exportar el estado completo (incluida la niebla de guerra)..',
                type: 'warning'
            });


            return;
        } const mapImageDataUrl = document.getElementById('mapImageInput')._dataUrl; if (!mapImageDataUrl) {
            showCustomModal({
                title: 'Error',
                message: 'No se encontró la imagen del mapa para exportar.',
                type: 'warning'
            });
            return;
        } pendingExportData = { mapImageDataUrl: mapImageDataUrl, tokens: tokens, walls: walls, gridSettings: { visible: gridVisible, color: gridColor, opacity: gridOpacity, offsetX: gridOffsetX, offsetY: gridOffsetY, cellSize: cellSize } }; broadcast('CMD_REQUEST_FOG_DATA');
    }
    function finalizeExport(sceneData) {
        const jsonString = JSON.stringify(sceneData, null, 2); const blob = new Blob([jsonString], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'dm-arsenal-scene.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        showCustomModal({
            title: 'Éxito',
            message: '¡Escena exportada con éxito!',
            type: 'success'
        });
    }
    function handleImportScene(event) {
        const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => {
            try {
                const sceneData = JSON.parse(e.target.result); if (!sceneData.mapImageDataUrl || !sceneData.tokens || !sceneData.walls || !sceneData.gridSettings) { throw new Error("El archivo no parece ser una escena válida de DM Arsenal."); } isMapLoaded = true; document.getElementById('mapImageInput')._dataUrl = sceneData.mapImageDataUrl; const gs = sceneData.gridSettings; gridVisible = gs.visible; gridColor = gs.color; gridOpacity = gs.opacity; gridOffsetX = gs.offsetX; gridOffsetY = gs.offsetY; cellSize = gs.cellSize; walls = sceneData.walls; tokens = sceneData.tokens; broadcast('CMD_LOAD_NEW_MAP', { src: sceneData.mapImageDataUrl }); setTimeout(() => { broadcast('CMD_LOAD_SCENE_DATA', { tokens: sceneData.tokens, walls: sceneData.walls, gridSettings: sceneData.gridSettings, fogDataUrl: sceneData.fogImageDataUrl }); if (visionModeActive) { broadcast('CMD_SET_VISION_MODE', { active: true, tokens, walls, cellSize }); } }, 500); updateTokenList(); updateDoorList(); deselectToken(); gridToggle.checked = gs.visible; gridColorInput.value = gs.color; gridOpacityInput.value = gs.opacity; cellSizeInput.value = gs.cellSize; cellSizeSlider.value = gs.cellSize;
                showCustomModal({
                    title: 'Éxito',
                    message: 'Escena importada con éxito!',
                    type: 'success'
                });


            }
            catch (error) {
                console.error("Error al importar la escena:", error);
                showCustomModal({
                    title: 'Error',
                    message: 'Error al importar el archivo: ${error.message}',
                    type: 'warning'
                });
            }
            finally { importSceneInput.value = ''; }
        }; reader.readAsText(file);
    }
    function handleExportLibrary() {
        const library = getCharacterLibrary(); if (library.length === 0) {
            showCustomModal({
                title: 'Atención',
                message: 'Tu biblioteca de personajes está vacía. No hay nada que exportar.',
                type: 'warning'
            });
            return;
        } const jsonString = JSON.stringify(library, null, 2); const blob = new Blob([jsonString], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'dm-arsenal-character-library.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }
    async function handleImportLibrary(event) {
        const file = event.target.files[0];
        if (!file) return; const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                // --- VALIDACIÓN MÁS ROBUSTA ---
                if (!Array.isArray(importedData)) {
                    // Lanza un error con un mensaje específico que podemos usar después.
                    throw new Error("El archivo no es una biblioteca válida (no es un array).");
                }

                const importedCharacters = importedData;

                if (importedCharacters.length === 0) {
                    await showCustomModal({
                        title: 'Biblioteca Vacía',
                        message: 'El archivo que intentas importar no contiene ningún personaje.',
                        type: 'warning'
                    });
                    // Limpiamos el input y salimos.
                    importLibraryInput.value = '';
                    return;
                }

                // --- EL RESTO DE TU LÓGICA (QUE YA ESTÁ BIEN) ---
                const importMode = await showCustomModal({
                    title: 'Modo de Importación',
                    message: '¿Cómo quieres importar los personajes de este archivo?',
                    type: 'confirm',
                    confirmText: 'Añadir a la Biblioteca',
                    cancelText: 'Reemplazar Biblioteca'
                });

                let currentLibrary = getCharacterLibrary();
                let addedCount = 0;
                let overwrittenCount = 0;

                if (importMode === true) {
                    for (const newChar of importedCharacters) {
                        if (!newChar.identity || !newChar.identity.name) {
                            console.warn("Se encontró un personaje sin identidad o nombre en el archivo importado. Será omitido.");
                            continue;
                        }
                        const existingIndex = currentLibrary.findIndex(char => char.identity.name === newChar.identity.name);
                        if (existingIndex > -1) {
                            const doOverwrite = await showCustomModal({
                                title: 'Personaje Duplicado',
                                message: `El personaje <strong style="color: var(--text-gold); font-size: 1.1em;">${newChar.identity.name}</strong> ya existe en tu biblioteca. ¿Quieres sobreescribirlo?`,
                                type: 'confirm',
                                confirmText: 'Sí, sobreescribir',
                                cancelText: 'No, omitir'
                            });
                            if (doOverwrite) {
                                currentLibrary[existingIndex] = newChar;
                                overwrittenCount++;
                            }
                        } else {
                            currentLibrary.push(newChar);
                            addedCount++;
                        }
                    }
                    await showCustomModal({
                        title: 'Importación Completada',
                        message: `Operación finalizada:\n- ${addedCount} personajes nuevos añadidos.\n- ${overwrittenCount} personajes sobreescritos.`,
                        type: 'success'
                    });
                } else if (importMode === false) {
                    const replaceConfirmed = await showCustomModal({
                        title: '¡Acción Definitiva!',
                        message: '¿Estás SEGURO de que quieres borrar tu biblioteca actual y reemplazarla? Esta acción no se puede deshacer.',
                        type: 'warning',
                        confirmText: 'Sí, reemplazar todo',
                        cancelText: 'Cancelar'
                    });
                    if (replaceConfirmed) {
                        currentLibrary = importedCharacters;
                        await showCustomModal({
                            title: 'Biblioteca Reemplazada',
                            message: `Tu biblioteca se ha reemplazado con éxito. Ahora tienes ${currentLibrary.length} personajes.`,
                            type: 'success'
                        });
                    } else {
                        await showCustomModal({
                            title: 'Operación Cancelada',
                            message: 'La importación ha sido cancelada. Tu biblioteca no ha sido modificada.',
                            type: 'info'
                        });
                        importLibraryInput.value = ''; // Limpiar el input también al cancelar
                        return;
                    }
                } else {
                    // El usuario cerró el modal de importación sin elegir
                    importLibraryInput.value = '';
                    return;
                }

                localStorage.setItem(CHAR_LIB_STORE, JSON.stringify(currentLibrary));
                renderCharacterLibrary();
                importLibraryInput.value = ''; // Limpiar al final de una operación exitosa

            } catch (error) {
                // --- MANEJO DE ERRORES MEJORADO ---
                // Este bloque ahora se activa si JSON.parse falla o si lanzamos un error manualmente.

                // Mostramos un modal de error específico para el usuario.
                await showCustomModal({
                    title: 'Error de Importación',
                    message: `No se pudo procesar el archivo. Asegúrate de que es un archivo de biblioteca válido.\n\nDetalle: ${error.message}`,
                    type: 'error'
                });

                // También lo registramos en la consola para depuración.
                originalConsoleError("Error al importar la biblioteca:", error);

            } finally {
                // Quitamos la limpieza del input de aquí para tener más control
                // importLibraryInput.value = ''; 
            }
        };
        reader.readAsText(file);
    }
    function setupPanelNavigation() { const panelColumnsWithNav = document.querySelectorAll('.panel-column'); panelColumnsWithNav.forEach(column => { const navButtons = column.querySelectorAll('.panel-nav-button'); const views = column.querySelectorAll('.panel-view'); navButtons.forEach(button => { button.addEventListener('click', () => { const viewIdToShow = button.dataset.view; views.forEach(view => view.classList.remove('active')); navButtons.forEach(btn => btn.classList.remove('active')); const viewToShow = column.querySelector('#' + viewIdToShow); if (viewToShow) { viewToShow.classList.add('active'); } button.classList.add('active'); }); }); }); }
    function setupTokenEditorNavigation() { const editor = document.getElementById('tokenEditor'); const navButtons = editor.querySelectorAll('.token-nav-button'); const views = editor.querySelectorAll('.token-view-panel'); navButtons.forEach(button => { button.addEventListener('click', () => { const viewIdToShow = button.dataset.view; views.forEach(view => view.classList.remove('active')); navButtons.forEach(btn => btn.classList.remove('active')); const viewToShow = editor.querySelector('#' + viewIdToShow); if (viewToShow) { viewToShow.classList.add('active'); } button.classList.add('active'); }); }); }


    // ===============================================
    // --- LÓGICA PARA EL NUEVO MODAL DE EDICIÓN ---
    // ===============================================
    function openEditCardModal(type, index) {
        if (!selectedTokenId) return;
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token) return;

        const item = type === 'ability' ? token.info.abilities[index] : token.info.inventory[index];
        if (!item) return;

        // Guardar el contexto
        editingCardContext = { type, index };

        // Poblar el modal y ponerlo en modo vista
        editCardModalTitle.textContent = `Editar ${type === 'ability' ? 'Habilidad' : 'Objeto'}`;
        viewCardName.textContent = item.name;
        viewCardDescription.textContent = item.description;

        editCardViewMode.style.display = 'block';
        editCardEditMode.style.display = 'none';
        editCardViewButtons.style.display = 'flex';
        editCardEditButtons.style.display = 'none';

        editCardModal.classList.add('open');
    }

    editCardBtn.addEventListener('click', () => {
        if (!editingCardContext) return;
        const { type, index } = editingCardContext;
        const token = tokens.find(t => t.id === selectedTokenId);
        const item = type === 'ability' ? token.info.abilities[index] : token.info.inventory[index];

        // Poblar los inputs con los datos actuales
        editCardNameInput.value = item.name;
        editCardDescriptionInput.value = item.description;

        // Cambiar a modo edición
        editCardViewMode.style.display = 'none';
        editCardEditMode.style.display = 'block';
        editCardViewButtons.style.display = 'none';
        editCardEditButtons.style.display = 'flex';
        editCardNameInput.focus();
    });

    updateCardBtn.addEventListener('click', () => {
        if (!editingCardContext) return;
        const { type, index } = editingCardContext;
        const token = tokens.find(t => t.id === selectedTokenId);

        const newName = editCardNameInput.value.trim();
        const newDescription = editCardDescriptionInput.value.trim();

        if (!newName) {
            showCustomModal({
                title: 'Atención',
                message: `El nombre no puede estar vacío.`,
                type: 'warning'
            });
            return;
        }

        // Actualizar el objeto en el array de tokens
        if (type === 'ability') {
            token.info.abilities[index].name = newName;
            token.info.abilities[index].description = newDescription;
            renderAbilitiesList(token); // Volver a renderizar la lista
        } else {
            token.info.inventory[index].name = newName;
            token.info.inventory[index].description = newDescription;
            renderInventoryList(token); // Volver a renderizar la lista
        }

        // Notificar al jugador y cerrar el modal
        broadcast('CMD_UPDATE_TOKEN_DATA', { tokenData: token });
        editCardModal.classList.remove('open');
        editingCardContext = null;
    });

    closeCardBtn.addEventListener('click', () => {
        editCardModal.classList.remove('open');
        editingCardContext = null;
    });

    cancelEditCardBtn.addEventListener('click', () => {
        // Simplemente volvemos al modo vista sin guardar
        editCardViewMode.style.display = 'block';
        editCardEditMode.style.display = 'none';
        editCardViewButtons.style.display = 'flex';
        editCardEditButtons.style.display = 'none';
    });
    function resetAddTokenForm() {
        // Resetear inputs de texto y número
        document.getElementById('tokenName').value = '';
        document.getElementById('tokenLetter').value = '';
        document.getElementById('tokenClass').value = '';
        document.getElementById('tokenLevel').value = '1';
        document.getElementById('tokenRace').value = '';
        document.getElementById('tokenImageInput').value = ''; // Limpia el input de archivo
        document.getElementById('tokenImageName').textContent = 'Ningún archivo...';

        // Resetear stats
        ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => {
            document.getElementById(`add_${stat}_score`).value = '10';
            updateCharStatUI('add', stat); // Llama a la función de UI para recalcular modificadores
        });

        // Resetear stats de combate
        document.getElementById('add_proficiency_bonus').value = '2';
        document.getElementById('add_initiative_mod').value = '0';
        document.getElementById('add_speed').value = '30';
        document.getElementById('add_armor_class').value = '10';
        document.getElementById('tokenVision').value = '12';
        document.getElementById('tokenHealth').value = '';

        // Resetear salvaciones
        document.querySelectorAll('#add_saving_throws_list input[type="checkbox"]').forEach(cb => cb.checked = false);
        updateSavingThrowsUI('add'); // Recalcula los totales de salvación

        // Resetear apariencia
        document.getElementById('tokenColor').value = '#4a90e2';
        document.getElementById('addBorderCheckbox').checked = false;
        document.getElementById('addTransparentBgCheckbox').checked = false;
        document.getElementById('tokenColor').disabled = false;
        document.getElementById('tokenBorderColor').value = '#000000';
        document.getElementById('tokenSizeMultiplier').value = '1';

        // Resetear notas
        document.getElementById('tokenNotes').value = '';

        // Poner el foco en el campo de nombre para la siguiente ficha
        document.getElementById('tokenName').focus();
    }

    // ===============================================
    // --- LÓGICA DE LA PANTALLA DE BIENVENIDA (SPLASH) ---
    // ===============================================
    window.addEventListener('load', () => {
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen) {
            // Espera un total de 3.5 segundos antes de empezar a desvanecerse
            // (1s para que aparezca el logo + 2.5s de animación de pulso)
            setTimeout(() => {
                splashScreen.classList.add('hidden');
            }, 0);//3500

            // Elimina completamente la pantalla del DOM después de que termine la transición de fade-out
            // para liberar recursos. 3500ms (espera) + 1000ms (transición) = 4500ms
            setTimeout(() => {
                splashScreen.remove();
            }, 0);//timepo de pantalla de bienvenida 4500
        }
    });
    setupPanelNavigation();
    renderCharacterLibrary();
    loadDmNotes();
    setupTokenEditorNavigation();
});
document.addEventListener('DOMContentLoaded', () => {
    // --- CLAVES DE ALMACENAMIENTO Y ESTADO GLOBAL ---
    const PLAYER_CHAR_KEY = 'playerSheetCurrentCharacter';
    let currentCharacter = null;
    let currentModalContext = null; // Para saber si estamos añadiendo habilidad o item
    let editingCardContext = null; // Para saber qué habilidad/item estamos editando

    // --- SELECTORES GENERALES DEL DOM ---
    const noCharacterLoadedMsg = document.getElementById('noCharacterLoaded');
    const tokenEditor = document.getElementById('tokenEditor');
    const exportCharacterBtn = document.getElementById('exportCharacterBtn');

    // --- SELECTORES DEL EDITOR DE PERSONAJE ---
    // Encabezado
    const viewTokenName = document.getElementById('viewTokenName');
    const viewTokenClass = document.getElementById('viewTokenClass');
    const viewTokenLevel = document.getElementById('viewTokenLevel');
    const viewTokenRace = document.getElementById('viewTokenRace');
    const editTokenImagePreview = document.getElementById('editTokenImagePreview');
    const editTokenLetterPreview = document.getElementById('editTokenLetterPreview');
    
    // Pestaña de Combate
    const editProficiencyBonus = document.getElementById('edit_proficiency_bonus');
    const editInitiative = document.getElementById('edit_initiative');
    const editSpeed = document.getElementById('edit_speed');
    const editArmorClass = document.getElementById('edit_armor_class');
    const editTokenHealthMax = document.getElementById('editTokenHealthMax');
    const healthDisplay = document.getElementById('healthDisplay');
    const healthModifierBtns = document.querySelectorAll('.health-modifier-btn');
    const healthModifierInput = document.getElementById('healthModifierInput');
    const newStateEmoji = document.getElementById('newStateEmoji');
    const newStateDesc = document.getElementById('newStateDesc');
    const addStateBtn = document.getElementById('addStateBtn');
    const editTokenStatesList = document.getElementById('editTokenStatesList');

    // Pestaña de Notas
    const editTokenNotes = document.getElementById('editTokenNotes');

    // Habilidades e Inventario
    const addAbilityBtn = document.getElementById('addAbilityBtn');
    const addInventoryItemBtn = document.getElementById('addInventoryItemBtn');
    const editAbilitiesList = document.getElementById('editAbilitiesList');
    const editInventoryList = document.getElementById('editInventoryList');
    const searchAbilitiesInput = document.getElementById('searchAbilitiesInput');
    const searchInventoryInput = document.getElementById('searchInventoryInput');

    // Selectores de Modales
    const featureInventoryModal = document.getElementById('featureInventoryModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalNameInput = document.getElementById('modalNameInput');
    const modalDescriptionInput = document.getElementById('modalDescriptionInput');
    const confirmModalBtn = document.getElementById('confirmModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');

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

    // --- LÓGICA DE DATOS ---

    function loadCharacterFromStorage() {
        const charData = localStorage.getItem(PLAYER_CHAR_KEY);
        if (charData) {
            currentCharacter = JSON.parse(charData);
            renderCharacterSheet();
        } else {
            tokenEditor.style.display = 'none';
            noCharacterLoadedMsg.style.display = 'block';
        }
    }

    function saveCharacterToStorage() {
        if (currentCharacter) {
            localStorage.setItem(PLAYER_CHAR_KEY, JSON.stringify(currentCharacter));
        }
    }
    
    // --- FUNCIÓN CENTRAL DE ACTUALIZACIÓN ---

    function updateAndSave() {
        if (!currentCharacter) return;

        // Recoger todos los valores del formulario y actualizar el objeto
        currentCharacter.stats.proficiencyBonus = parseInt(editProficiencyBonus.value) || 2;
        currentCharacter.stats.initiative = parseInt(editInitiative.value) || 0;
        currentCharacter.stats.speed = parseInt(editSpeed.value) || 30;
        currentCharacter.stats.armorClass = parseInt(editArmorClass.value) || 10;
        currentCharacter.stats.health.max = parseInt(editTokenHealthMax.value) || 0;
        
        if (currentCharacter.stats.health.current > currentCharacter.stats.health.max) {
            currentCharacter.stats.health.current = currentCharacter.stats.health.max;
        }

        ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => {
            currentCharacter.stats.characteristics[stat].score = parseInt(document.getElementById(`edit_${stat}_score`).value) || 10;
            currentCharacter.stats.characteristics[stat].proficient = document.getElementById(`edit_${stat}_save_prof`).checked;
        });

        // Volver a renderizar las partes de la UI que dependen de estos valores
        renderCombatTab(); // Esto actualiza la vida si cambió el máximo
        renderStatsTab();   // Esto actualiza modificadores y salvaciones
        
        saveCharacterToStorage();
    }

    // --- RENDERIZADO DE UI ---

    function renderCharacterSheet() {
        if (!currentCharacter) return;
        tokenEditor.style.display = 'block';
        noCharacterLoadedMsg.style.display = 'none';
        
        renderHeader();
        renderCombatTab();
        renderStatsTab();
        renderAbilitiesList();
        renderInventoryList();
        renderNotes();
    }

    function renderHeader() {
        viewTokenName.textContent = currentCharacter.identity.name;
        viewTokenClass.textContent = currentCharacter.identity.char_class || 'Clase';
        viewTokenLevel.textContent = currentCharacter.identity.level || 1;
        viewTokenRace.textContent = currentCharacter.identity.race || 'Raza';

        if (currentCharacter.identity.image) {
            editTokenImagePreview.src = currentCharacter.identity.image;
            editTokenImagePreview.style.display = 'block';
            editTokenLetterPreview.style.display = 'none';
        } else {
            editTokenImagePreview.style.display = 'none';
            editTokenLetterPreview.style.display = 'flex';
            editTokenLetterPreview.textContent = currentCharacter.identity.letter;
            editTokenLetterPreview.style.backgroundColor = currentCharacter.appearance.color;
        }
    }

    function renderCombatTab() {
        editProficiencyBonus.value = currentCharacter.stats.proficiencyBonus || 2;
        editInitiative.value = currentCharacter.stats.initiative || 0;
        editSpeed.value = currentCharacter.stats.speed || 30;
        editArmorClass.value = currentCharacter.stats.armorClass || 10;
        editTokenHealthMax.value = currentCharacter.stats.health.max;
        updateHealthUI();
        renderTokenStatesEditor();
    }

    function renderStatsTab() {
        ['str', 'dex', 'con', 'int', 'wis', 'car'].forEach(stat => {
            const charStats = currentCharacter.stats.characteristics;
            if (charStats && charStats[stat]) {
                document.getElementById(`edit_${stat}_score`).value = charStats[stat].score;
                document.getElementById(`edit_${stat}_save_prof`).checked = charStats[stat].proficient;
            }
            // Recalcular y mostrar modificadores y salvaciones
            updateCharStatUI('edit', stat);
        });
    }

    function renderNotes() {
        editTokenNotes.value = currentCharacter.info.notes || '';
    }

    function updateHealthUI() {
        const { current, max } = currentCharacter.stats.health;
        healthDisplay.textContent = current;
        healthDisplay.className = `health-display ${getHealthColorClass(current, max)}`;
    }

    function renderTokenStatesEditor() {
        editTokenStatesList.innerHTML = '';
        if (!currentCharacter.info.states) return;
        currentCharacter.info.states.forEach((state, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="state-emoji">${state.emoji}</span><span class="state-desc">${state.description}</span><button class="delete-state-btn" data-index="${index}">×</button>`;
            editTokenStatesList.appendChild(li);
        });
        editTokenStatesList.querySelectorAll('.delete-state-btn').forEach(btn =>
            btn.addEventListener('click', (e) => removeState(parseInt(e.target.dataset.index)))
        );
    }

    function renderAbilitiesList() {
        editAbilitiesList.innerHTML = '';
        if (!currentCharacter || !currentCharacter.info.abilities) return;
        currentCharacter.info.abilities.forEach((ability, index) => {
            const card = document.createElement('div');
            card.className = 'info-card';
            card.innerHTML = `<h5 class="info-card-title">${ability.name}</h5><p class="info-card-desc">${ability.description}</p><button class="delete-info-btn" data-index="${index}">×</button>`;
            editAbilitiesList.appendChild(card);
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-info-btn')) {
                    openEditCardModal('ability', index);
                }
            });
        });
        editAbilitiesList.querySelectorAll('.delete-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentCharacter.info.abilities.splice(parseInt(btn.dataset.index), 1);
                renderAbilitiesList();
                saveCharacterToStorage();
            });
        });
    }

    function renderInventoryList() {
        editInventoryList.innerHTML = '';
        if (!currentCharacter || !currentCharacter.info.inventory) return;
        currentCharacter.info.inventory.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'info-card';
            card.innerHTML = `<h5 class="info-card-title">${item.name}</h5><p class="info-card-desc">${item.description}</p><button class="delete-info-btn" data-index="${index}">×</button>`;
            editInventoryList.appendChild(card);
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-info-btn')) {
                    openEditCardModal('inventory', index);
                }
            });
        });
        editInventoryList.querySelectorAll('.delete-info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentCharacter.info.inventory.splice(parseInt(btn.dataset.index), 1);
                renderInventoryList();
                saveCharacterToStorage();
            });
        });
    }

    // --- LÓGICA DE INTERACCIÓN ---

    function applyHealthChange(amount) {
        if (!currentCharacter) return;
        const health = currentCharacter.stats.health;
        let newHealth = health.current + amount;
        health.current = Math.max(0, Math.min(health.max, newHealth));
        updateHealthUI();
        saveCharacterToStorage();
    }

    function addState() {
        if (!currentCharacter) return;
        const emoji = newStateEmoji.value.trim();
        const desc = newStateDesc.value.trim();
        if (!emoji) { alert('El emoji del estado es obligatorio.'); return; }
        if (!currentCharacter.info.states) currentCharacter.info.states = [];
        currentCharacter.info.states.push({ emoji, description: desc });
        newStateEmoji.value = '';
        newStateDesc.value = '';
        renderTokenStatesEditor();
        saveCharacterToStorage();
    }

    function removeState(index) {
        if (!currentCharacter) return;
        currentCharacter.info.states.splice(index, 1);
        renderTokenStatesEditor();
        saveCharacterToStorage();
    }

    function saveFeatureOrItem() {
        if (!currentCharacter || !currentModalContext) return;
        const name = modalNameInput.value.trim();
        const description = modalDescriptionInput.value.trim();
        if (!name) { alert('El nombre no puede estar vacío.'); return; }
        const newItem = { id: Date.now(), name, description };
        if (currentModalContext === 'ability') {
            if (!currentCharacter.info.abilities) currentCharacter.info.abilities = [];
            currentCharacter.info.abilities.push(newItem);
            renderAbilitiesList();
        } else if (currentModalContext === 'inventory') {
            if (!currentCharacter.info.inventory) currentCharacter.info.inventory = [];
            currentCharacter.info.inventory.push(newItem);
            renderInventoryList();
        }
        featureInventoryModal.classList.remove('open');
        saveCharacterToStorage();
    }

    // --- EVENT LISTENERS ---

    function setupEventListeners() {
        // Salud
        healthModifierBtns.forEach(btn => btn.addEventListener('click', () => applyHealthChange(parseInt(btn.dataset.amount))));
        healthModifierInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && healthModifierInput.value) {
                e.preventDefault();
                applyHealthChange(parseInt(healthModifierInput.value));
                healthModifierInput.value = '';
            }
        });
        
        // Listener centralizado para todos los inputs de stats y combate
        const statInputs = tokenEditor.querySelectorAll('#token-view-stats input, #token-view-combat input.combat-value-input, #editTokenHealthMax');
        statInputs.forEach(input => {
            input.addEventListener('change', updateAndSave);
        });

        // Estados, Notas, Habilidades, Inventario
        addStateBtn.addEventListener('click', addState);
        editTokenNotes.addEventListener('blur', (e) => {
            if (currentCharacter) {
                currentCharacter.info.notes = e.target.value;
                saveCharacterToStorage();
            }
        });
        addAbilityBtn.addEventListener('click', () => openFeatureModal('ability'));
        addInventoryItemBtn.addEventListener('click', () => openFeatureModal('inventory'));
        confirmModalBtn.addEventListener('click', saveFeatureOrItem);
        cancelModalBtn.addEventListener('click', () => featureInventoryModal.classList.remove('open'));
        editCardBtn.addEventListener('click', switchToEditCardMode);
        closeCardBtn.addEventListener('click', () => editCardModal.classList.remove('open'));
        updateCardBtn.addEventListener('click', updateCard);
        cancelEditCardBtn.addEventListener('click', switchToViewCardMode);
        exportCharacterBtn.addEventListener('click', exportCharacter);
        searchAbilitiesInput.addEventListener('input', () => filterList(searchAbilitiesInput, editAbilitiesList));
        searchInventoryInput.addEventListener('input', () => filterList(searchInventoryInput, editInventoryList));
    }

    // --- FUNCIONES DE AYUDA Y UTILIDADES ---

    function getHealthColorClass(current, max) {
        if (max === 0) return 'health-mid';
        const percentage = (current / max) * 100;
        if (percentage <= 10) return 'health-critical';
        if (percentage <= 40) return 'health-low';
        if (percentage <= 70) return 'health-mid';
        return 'health-high';
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
        const profBonusInput = document.getElementById(`${prefix}_proficiency_bonus`);
        if (!profBonusInput) return;
        const profBonus = parseInt(profBonusInput.value) || 0;
        stats.forEach(stat => {
            const scoreInput = document.getElementById(`${prefix}_${stat}_score`);
            const isProficientCheckbox = document.getElementById(`${prefix}_${stat}_save_prof`);
            const totalDisplay = document.getElementById(`${prefix}_${stat}_save_total`);
            if (!scoreInput || !isProficientCheckbox || !totalDisplay) return;
            
            const score = parseInt(scoreInput.value) || 10;
            const baseMod = Math.floor((score - 10) / 2);
            const isProficient = isProficientCheckbox.checked;
            const total = baseMod + (isProficient ? profBonus : 0);
            
            totalDisplay.textContent = total >= 0 ? `+${total}` : `${total}`;
        });
    };
    
    function filterList(inputElement, listContainer) {
        const filterText = inputElement.value.toLowerCase();
        const items = listContainer.querySelectorAll('.info-card');
        items.forEach(item => {
            const title = item.querySelector('.info-card-title')?.textContent.toLowerCase() || '';
            item.style.display = title.includes(filterText) ? 'block' : 'none';
        });
    }
    
    function exportCharacter() {
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
    }
    
    // --- LÓGICA DE MODALES ---

    function openFeatureModal(context) {
        currentModalContext = context;
        modalTitle.textContent = context === 'ability' ? 'Añadir Habilidad' : 'Añadir Objeto';
        modalNameInput.value = '';
        modalDescriptionInput.value = '';
        featureInventoryModal.classList.add('open');
        modalNameInput.focus();
    }
    
    function openEditCardModal(type, index) {
        const item = type === 'ability' ? currentCharacter.info.abilities[index] : currentCharacter.info.inventory[index];
        if (!item) return;
        editingCardContext = { type, index, item };
        
        editCardModalTitle.textContent = `Editar ${type === 'ability' ? 'Habilidad' : 'Objeto'}`;
        viewCardName.textContent = item.name;
        viewCardDescription.textContent = item.description;
        
        switchToViewCardMode();
        editCardModal.classList.add('open');
    }

    function switchToViewCardMode() {
        editCardViewMode.style.display = 'block';
        editCardEditMode.style.display = 'none';
        editCardViewButtons.style.display = 'flex';
        editCardEditButtons.style.display = 'none';
    }

    function switchToEditCardMode() {
        if (!editingCardContext) return;
        editCardNameInput.value = editingCardContext.item.name;
        editCardDescriptionInput.value = editingCardContext.item.description;
        
        editCardViewMode.style.display = 'none';
        editCardEditMode.style.display = 'block';
        editCardViewButtons.style.display = 'none';
        editCardEditButtons.style.display = 'flex';
        editCardNameInput.focus();
    }

    function updateCard() {
        if (!editingCardContext) return;
        const { type, index } = editingCardContext;
        const newName = editCardNameInput.value.trim();
        if (!newName) { alert('El nombre no puede estar vacío.'); return; }
        
        const list = type === 'ability' ? currentCharacter.info.abilities : currentCharacter.info.inventory;
        list[index].name = newName;
        list[index].description = editCardDescriptionInput.value.trim();
        
        if (type === 'ability') renderAbilitiesList();
        else renderInventoryList();
        
        saveCharacterToStorage();
        editCardModal.classList.remove('open');
    }
    
    // --- NAVEGACIÓN POR PESTAÑAS ---
    
    function setupTokenEditorNavigation() {
        const navButtons = tokenEditor.querySelectorAll('.token-nav-button');
        const views = tokenEditor.querySelectorAll('.token-view-panel');
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const viewIdToShow = button.dataset.view;
                views.forEach(view => view.classList.remove('active'));
                navButtons.forEach(btn => btn.classList.remove('active'));
                
                const viewToShow = tokenEditor.querySelector('#' + viewIdToShow);
                if (viewToShow) viewToShow.classList.add('active');
                button.classList.add('active');
            });
        });
    }

    // --- INICIALIZACIÓN DE LA PÁGINA ---
    setupEventListeners();
    setupTokenEditorNavigation();
    loadCharacterFromStorage();
});
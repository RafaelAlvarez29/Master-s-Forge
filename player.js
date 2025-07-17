document.addEventListener('DOMContentLoaded', () => {
    const channel = new BroadcastChannel('dnd_arsenal_channel');

    // --- Selectores del DOM ---
    const mapContainer = document.getElementById('mapContainer');
    const mapContentWrapper = document.getElementById('mapContentWrapper');
    const loadingState = document.querySelector('.loading-state');
    const mapImage = document.getElementById('mapImage');
    const tokensLayer = document.getElementById('tokensLayer');
    const playerTurnTracker = document.getElementById('playerTurnTracker');
    const gridCanvas = document.getElementById('gridCanvas'),
        gridCtx = gridCanvas.getContext('2d');
    const wallsCanvas = document.getElementById('wallsCanvas'),
        wallsCtx = wallsCanvas.getContext('2d');
    const visionCanvas = document.getElementById('visionCanvas'),
        visionCtx = visionCanvas.getContext('2d');
    const aoeCanvas = document.getElementById('aoeCanvas'),
        aoeCtx = aoeCanvas.getContext('2d');
    const revealedBufferCanvas = document.createElement('canvas'),
        revealedBufferCtx = revealedBufferCanvas.getContext('2d', {
            willReadFrequently: true
        });

    // --- Selectores de Controles de Jugador ---
    const multiSelectBtn = document.getElementById('multiSelectBtn');
    const toggleTrackerPosBtn = document.getElementById('toggleTrackerPosBtn');
    const playerControlsContainer = document.getElementById('playerControlsContainer');
    const drawingControls = document.getElementById('drawingControls');
    const drawWallBtn = document.getElementById('drawWallBtn');
    const drawDoorBtn = document.getElementById('drawDoorBtn');
    const undoDrawBtn = document.getElementById('undoDrawBtn');
    const clearWallsBtnPlayer = document.getElementById('clearWallsBtnPlayer');


    // NUEVOS SELECTORES PARA EL MODAL DE PUERTA
    const playerDoorNameModal = document.getElementById('playerDoorNameModal');
    const playerDoorNameInput = document.getElementById('playerDoorNameInput');
    const confirmPlayerDoorNameBtn = document.getElementById('confirmPlayerDoorNameBtn');
    const cancelPlayerDoorNameBtn = document.getElementById('cancelPlayerDoorNameBtn');


    // --- Variables de Estado Locales ---
    let localTokens = [];
    let localWalls = [];
    let isVisionActive = false;
    let cellSize = 50;
    let pendingPlayerDoor = null;

    let scale = 1,
        panX = 0,
        panY = 0;
    let isPanning = false,
        panStartX, panStartY;
    const MIN_SCALE = 0.1,
        MAX_SCALE = 5;

    let currentDraggedToken = null;
    let dragInitialMouseX, dragInitialMouseY;
    let dragInitialTokenX, dragInitialTokenY;

    // MODIFICADO: Ahora el modo dibujo se controla con estados
    let activeDrawTool = null; // Puede ser 'wall' o 'door'
    let wallStartPoint = null;

    let isAligningGrid = false;
    let isPaintingFog = false,
        activeBrushMode = null,
        brushSize = 50;
    let currentAoeData = null;

    let isMultiSelectMode = false;
    let selectedGroup = new Set();
    let dragOffsets = new Map();


    // --- MANEJO DE COMANDOS DEL DM ---
    channel.onmessage = (event) => {
        const {
            type,
            payload
        } = event.data;
        switch (type) {
            case 'CMD_LOAD_NEW_MAP':
                loadNewMap(payload.src);
                break;
            case 'CMD_LOAD_SCENE_DATA':
                localTokens = [];
                tokensLayer.innerHTML = '';
                if (payload.gridSettings) cellSize = payload.gridSettings.cellSize;
                localWalls = payload.walls || [];
                payload.tokens.forEach(t => createToken(t));
                drawWalls(localWalls);
                renderGrid(payload.gridSettings);
                updatePlayerTurnTracker(localTokens);

                if (payload.fogDataUrl) {
                    const fogImg = new Image();
                    fogImg.onload = () => {
                        revealedBufferCtx.clearRect(0, 0, revealedBufferCanvas.width, revealedBufferCanvas.height);
                        revealedBufferCtx.drawImage(fogImg, 0, 0);
                        if (isVisionActive) drawVision(localTokens, localWalls);
                    };
                    fogImg.src = payload.fogDataUrl;
                } else {
                    revealedBufferCtx.clearRect(0, 0, revealedBufferCanvas.width, revealedBufferCanvas.height);
                }
                break;
            case 'CMD_SET_GRID_SETTINGS':
                if (payload.gridSettings) {
                    cellSize = payload.gridSettings.cellSize;
                    renderGrid(payload.gridSettings);
                    localTokens.forEach(updateTokenElement);
                }
                break;
            case 'CMD_CREATE_TOKEN':
                createToken(payload.tokenData);
                updatePlayerTurnTracker(localTokens);
                break;
            case 'CMD_UPDATE_TOKEN_DATA':
                const tokenToUpdate = localTokens.find(t => t.id === payload.tokenData.id);
                if (tokenToUpdate) {
                    Object.assign(tokenToUpdate, payload.tokenData);
                    updateTokenElement(tokenToUpdate);
                    updatePlayerTurnTracker(localTokens);
                }
                break;
            case 'CMD_DELETE_TOKEN':
                deleteToken(payload.id);
                updatePlayerTurnTracker(localTokens);
                break;
            case 'CMD_UPDATE_TURN_TRACKER':
                if (payload.tokens) updatePlayerTurnTracker(payload.tokens);
                break;
            case 'CMD_SELECT_TOKEN':
                document.querySelectorAll('.token.selected').forEach(t => t.classList.remove('selected'));
                const selectedEl = findTokenElement(payload.id);
                if (selectedEl) selectedEl.classList.add('selected');
                break;
            case 'CMD_DESELECT_TOKEN':
                document.querySelectorAll('.token.selected').forEach(t => t.classList.remove('selected'));
                break;
            case 'CMD_DRAW_WALLS':
                localWalls = payload.walls || [];
                drawWalls(localWalls);
                break;

            // --- CASE MODIFICADO PARA OCULTAR/MOSTRAR CONTROLES ---
            case 'CMD_SET_VISION_MODE':
                isVisionActive = payload.active;
                visionCanvas.style.display = payload.active ? 'block' : 'none';
                wallsCanvas.style.display = payload.active ? 'none' : 'block';

                // Lógica de visibilidad de controles de dibujo
                drawingControls.classList.toggle('controls-hidden', payload.active);
                if (payload.active) { // Si se activa la visión, desactivamos el modo dibujo
                    deactivateDrawTools();
                }

                if (payload.active) {
                    if (payload.cellSize) cellSize = payload.cellSize;
                    drawVision(localTokens, localWalls);
                } else {
                    visionCtx.clearRect(0, 0, visionCanvas.width, visionCanvas.height);
                    drawWalls(localWalls);
                }
                updateAllTokenVisibility();
                break;

            case 'CMD_DRAW_VISION':
                if (payload.cellSize) cellSize = payload.cellSize;
                drawVision(payload.tokens, payload.walls);
                break;
            case 'CMD_RESET_FOG':
                revealedBufferCtx.clearRect(0, 0, revealedBufferCanvas.width, revealedBufferCanvas.height);
                visionCtx.clearRect(0, 0, visionCanvas.width, visionCanvas.height);
                updateAllTokenVisibility();
                break;
            case 'CMD_SET_BRUSH_MODE':
                activeBrushMode = payload.mode;
                mapContainer.classList.toggle('brush-mode-active', !!activeBrushMode);
                break;
            case 'CMD_SET_BRUSH_SIZE':
                brushSize = payload.size;
                break;
            case 'CMD_SET_GRID_ALIGN_MODE':
                isAligningGrid = payload.active;
                mapContainer.style.cursor = isAligningGrid ? 'crosshair' : 'grab';
                break;
            case 'CMD_SHOW_DAMAGE_FLOAT':
                showDamageFloat(payload.amount, payload.tokenId);
                break;
            case 'CMD_APPLY_TOKEN_ANIMATION':
                const animTokenEl = findTokenElement(payload.tokenId);
                const trackerCard = playerTurnTracker.querySelector(`.player-token-card[data-id="${payload.tokenId}"]`);
                if (animTokenEl) {
                    animTokenEl.classList.add(`token-${payload.animationClass}`);
                    setTimeout(() => animTokenEl.classList.remove(`token-${payload.animationClass}`), payload.timeout);
                }
                if (trackerCard) {
                    trackerCard.classList.add(`card-${payload.animationClass}`);
                    setTimeout(() => trackerCard.classList.remove(`card-${payload.animationClass}`), payload.timeout);
                }
                break;
            case 'CMD_DRAW_AOE':
                currentAoeData = payload.aoeData;
                if (currentAoeData.type === 'sphere') {
                    mapContainer.removeEventListener('mousemove', handleAoeMouseMove);
                    drawAoe(null);
                } else {
                    mapContainer.addEventListener('mousemove', handleAoeMouseMove);
                }
                break;
            case 'CMD_CLEAR_AOE':
                aoeCtx.clearRect(0, 0, aoeCanvas.width, aoeCanvas.height);
                currentAoeData = null;
                mapContainer.removeEventListener('mousemove', handleAoeMouseMove);
                break;
            case 'CMD_HIGHLIGHT_TRACKER_CARD':
                document.querySelectorAll('.player-token-card.selected-in-tracker').forEach(card => card.classList.remove('selected-in-tracker'));
                if (payload.id) {
                    const cardToHighlight = playerTurnTracker.querySelector(`.player-token-card[data-id="${payload.id}"]`);
                    if (cardToHighlight) cardToHighlight.classList.add('selected-in-tracker');
                }
                break;
            case 'CMD_REQUEST_FOG_DATA':
                broadcast('EVENT_FOG_DATA_RESPONSE', {
                    fogDataUrl: revealedBufferCanvas.toDataURL()
                });
                break;
            case 'CMD_REQUEST_DOOR_NAME':
                pendingPlayerDoor = payload.doorData; // Guardamos los datos de la puerta
                playerDoorNameModal.classList.add('open');
                playerDoorNameInput.value = ''; // Limpiamos el input
                playerDoorNameInput.focus();
                break;
        }
    };

    // --- LÓGICA DE DIBUJO Y HERRAMIENTAS ---

    function deactivateDrawTools() {
        activeDrawTool = null;
        wallStartPoint = null;
        drawWallBtn.classList.remove('active');
        drawDoorBtn.classList.remove('active');
        mapContainer.style.cursor = 'grab';
    }

    drawWallBtn.addEventListener('click', () => {
        const wasActive = drawWallBtn.classList.contains('active');
        deactivateDrawTools();
        if (!wasActive) {
            activeDrawTool = 'wall';
            drawWallBtn.classList.add('active');
            mapContainer.style.cursor = 'crosshair';
        }
    });

    drawDoorBtn.addEventListener('click', () => {
        const wasActive = drawDoorBtn.classList.contains('active');
        deactivateDrawTools();
        if (!wasActive) {
            activeDrawTool = 'door';
            drawDoorBtn.classList.add('active');
            mapContainer.style.cursor = 'crosshair';
        }
    });

    undoDrawBtn.addEventListener('click', () => {
        // Enviar evento al DM para que gestione el "deshacer"
        broadcast('EVENT_UNDO_LAST_WALL');
    });
    clearWallsBtnPlayer.addEventListener('click', () => {
        // Pedir confirmación al DM antes de una acción destructiva
        if (confirm('¿Estás seguro de que quieres eliminar TODOS los muros y puertas del mapa?')) {
            // Enviar evento al DM para que ejecute la limpieza
            broadcast('EVENT_CLEAR_ALL_WALLS');
        }
    });
    // --- MANEJO DE MOUSE ACTUALIZADO ---

    mapContainer.addEventListener('mousedown', e => {
        e.preventDefault();

        if (isAligningGrid) {
            const {
                x,
                y
            } = getMapCoordinates(e);
            channel.postMessage({
                type: 'EVENT_GRID_ALIGNED',
                payload: {
                    x: x % cellSize,
                    y: y % cellSize
                }
            });
            isAligningGrid = false;
            mapContainer.style.cursor = 'grab';
            return;
        }

        // --- NUEVA LÓGICA DE DIBUJO ---
        if (activeDrawTool) {
            const {
                x,
                y
            } = getMapCoordinates(e);
            if (!wallStartPoint) {
                wallStartPoint = {
                    x,
                    y
                };
            } else {
                // Hemos completado un trazo
                channel.postMessage({
                    type: 'EVENT_WALL_DRAWN',
                    payload: {
                        start: wallStartPoint,
                        end: {
                            x,
                            y
                        },
                        drawType: activeDrawTool // Enviamos el tipo
                    }
                });

                wallStartPoint = null; // Reiniciamos el punto de inicio

                // Si era una puerta, desactivamos el modo
                if (activeDrawTool === 'door') {
                    deactivateDrawTools();
                }
            }
            return;
        }

        // ... (resto del código de mousedown: multi-select, arrastre, paneo, etc.)
        const tokenElement = e.target.closest('.token');
        const clickedToken = tokenElement ? localTokens.find(t => t.id == tokenElement.dataset.id) : null;
        if (isMultiSelectMode) {
            if (clickedToken) {
                handleMultiSelectClick(clickedToken);
            }
            return;
        }
        if (clickedToken && e.button === 0) {
            currentDraggedToken = clickedToken;
            const mouseCoords = getMapCoordinates(e);
            dragInitialMouseX = mouseCoords.x;
            dragInitialMouseY = mouseCoords.y;
            if (selectedGroup.size > 1 && selectedGroup.has(currentDraggedToken.id)) {
                dragOffsets.clear();
                selectedGroup.forEach(id => {
                    const memberToken = localTokens.find(t => t.id === id);
                    if (memberToken) {
                        dragOffsets.set(id, {
                            x: memberToken.position.x,
                            y: memberToken.position.y
                        });
                    }
                });
            } else {
                dragInitialTokenX = currentDraggedToken.position.x;
                dragInitialTokenY = currentDraggedToken.position.y;
                clearSelectedGroup();
            }
            currentDraggedToken.element.style.zIndex = 100;
            return;
        }
        if (activeBrushMode) {
            isPaintingFog = true;
            paintFog(e);
            return;
        }
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        mapContainer.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', e => {
        // ... (código de arrastre y paneo sin cambios)
        if (currentDraggedToken) {
            const mouseCoords = getMapCoordinates(e);
            const deltaX = mouseCoords.x - dragInitialMouseX;
            const deltaY = mouseCoords.y - dragInitialMouseY;
            if (dragOffsets.size > 0) {
                selectedGroup.forEach(id => {
                    const memberToken = localTokens.find(t => t.id === id);
                    const initialPos = dragOffsets.get(id);
                    if (memberToken && initialPos) {
                        memberToken.position.x = initialPos.x + deltaX;
                        memberToken.position.y = initialPos.y + deltaY;
                        updateTokenElement(memberToken);
                    }
                });
            } else {
                currentDraggedToken.position.x = dragInitialTokenX + deltaX;
                currentDraggedToken.position.y = dragInitialTokenY + deltaY;
                updateTokenElement(currentDraggedToken);
            }
            if (isVisionActive) drawVision(localTokens, localWalls);
            return;
        }
        if (isPanning) {
            const dx = e.clientX - panStartX;
            const dy = e.clientY - panStartY;
            panX += dx;
            panY += dy;
            panStartX = e.clientX;
            panStartY = e.clientY;
            updateTransform();
            return;
        }
        if (isPaintingFog) {
            paintFog(e);
            return;
        }

        // --- Previsualización de línea al dibujar ---
        if (activeDrawTool && wallStartPoint) {
            drawWalls(localWalls);
            const {
                x: endX,
                y: endY
            } = getMapCoordinates(e);
            wallsCtx.beginPath();
            wallsCtx.moveTo(wallStartPoint.x, wallStartPoint.y);
            wallsCtx.setLineDash(activeDrawTool === 'door' ? [10, 8] : []);
            wallsCtx.strokeStyle = 'cyan';
            wallsCtx.lineWidth = 4;
            wallsCtx.lineTo(endX, endY);
            wallsCtx.stroke();
            wallsCtx.setLineDash([]);
        }
    });

    // ... (El resto del archivo, incluyendo el listener de 'mouseup' y otras funciones, sigue igual)

    document.addEventListener('mouseup', e => {
        if (currentDraggedToken) {
            if (dragOffsets.size > 0) {
                const movedTokensData = [];
                selectedGroup.forEach(id => {
                    const token = localTokens.find(t => t.id === id);
                    if (token) {
                        movedTokensData.push({
                            id: token.id,
                            x: token.position.x,
                            y: token.position.y
                        });
                    }
                });
                movedTokensData.forEach(data => {
                    channel.postMessage({
                        type: 'EVENT_TOKEN_MOVED',
                        payload: data
                    });
                });
                dragOffsets.clear();
            } else {
                channel.postMessage({
                    type: 'EVENT_TOKEN_MOVED',
                    payload: {
                        id: currentDraggedToken.id,
                        x: currentDraggedToken.position.x,
                        y: currentDraggedToken.position.y
                    }
                });
            }
            currentDraggedToken.element.style.zIndex = '';
            currentDraggedToken = null;
        }
        if (isPanning) {
            isPanning = false;
            mapContainer.style.cursor = 'grab';
        }
        if (isPaintingFog) {
            isPaintingFog = false;
        }
    });
    mapContainer.addEventListener('click', e => {
        if (isMultiSelectMode) return;
        if (isPanning || currentDraggedToken || activeDrawTool || activeBrushMode) return;
        const tokenElement = e.target.closest('.token');
        if (tokenElement) {
            clearSelectedGroup();
            channel.postMessage({
                type: 'EVENT_TOKEN_CLICKED',
                payload: {
                    id: parseInt(tokenElement.dataset.id)
                }
            });
        } else {
            clearSelectedGroup();
            channel.postMessage({
                type: 'EVENT_MAP_CLICKED'
            });
        }
    });

    function updateTransform() {
        mapContentWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    }

    function getMapCoordinates(event) {
        const mapRect = mapContainer.getBoundingClientRect();
        const viewportX = event.clientX - mapRect.left;
        const viewportY = event.clientY - mapRect.top;
        const mapX = (viewportX - panX) / scale;
        const mapY = (viewportY - panY) / scale;
        return {
            x: mapX,
            y: mapY
        };
    }

    function loadNewMap(src) {
        mapImage.onload = () => {
            loadingState.style.display = 'none';
            mapContentWrapper.style.display = 'block';
            resizeAllCanvas();
            const containerWidth = mapContainer.clientWidth;
            const containerHeight = mapContainer.clientHeight;
            const mapWidth = mapImage.naturalWidth;
            const mapHeight = mapImage.naturalHeight;
            const scaleX = containerWidth / mapWidth;
            const scaleY = containerHeight / mapHeight;
            scale = Math.min(scaleX, scaleY, 1);
            panX = (containerWidth - mapWidth * scale) / 2;
            panY = (containerHeight - mapHeight * scale) / 2;
            updateTransform();
        };
        mapImage.src = src;
        if (mapImage.complete) mapImage.onload();
    }
    mapContainer.addEventListener('wheel', e => {
        e.preventDefault();

        const {
            x: mouseX,
            y: mouseY
        } = getMapCoordinates(e); // Posición del ratón en el mapa
        const zoomFactor = 1.1;
        const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;

        scale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));

        // Ajustar el paneo para que el zoom se centre en el cursor
        panX = panX - (mouseX * (scale - (scale / (e.deltaY < 0 ? zoomFactor : 1 / zoomFactor))));
        panY = panY - (mouseY * (scale - (scale / (e.deltaY < 0 ? zoomFactor : 1 / zoomFactor))));

        updateTransform();
    });
    function resizeAllCanvas() {
        const w = mapImage.naturalWidth,
            h = mapImage.naturalHeight;
        if (w > 0 && h > 0) {
            [gridCanvas, wallsCanvas, visionCanvas, aoeCanvas, revealedBufferCanvas].forEach(c => {
                c.width = w;
                c.height = h;
            });
        }
    }

    function createToken(tokenData) {
        const tokenElement = document.createElement('div');
        tokenElement.className = 'token';
        tokenElement.dataset.id = tokenData.id;
        const token = {
            ...tokenData,
            element: tokenElement
        };
        localTokens.push(token);
        updateTokenElement(token);
        tokensLayer.appendChild(tokenElement);
    }

    function deleteToken(tokenId) {
        const tokenIndex = localTokens.findIndex(t => t.id === tokenId);
        if (tokenIndex > -1) {
            localTokens[tokenIndex].element.remove();
            localTokens.splice(tokenIndex, 1);
        }
    }

    function findTokenElement(tokenId) {
        const token = localTokens.find(t => t.id == tokenId);
        return token ? token.element : null;
    }

    function updateTokenElement(token) {
        const el = token.element;
        if (!el) return;
        const size = (token.position.sizeMultiplier || 1) * cellSize;
        token.position.size = size;
        el.style.left = `${token.position.x}px`;
        el.style.top = `${token.position.y}px`;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.backgroundColor = token.appearance.color;
        el.style.border = token.appearance.borderColor ? `3px solid ${token.appearance.borderColor}` : 'none';
        if (token.identity.image) {
            el.classList.add('has-image');
            el.style.backgroundImage = `url(${token.identity.image})`;
            el.textContent = '';
        } else {
            el.classList.remove('has-image');
            el.style.backgroundImage = 'none';
            el.textContent = token.identity.letter;
        }
        updateTokenVisibility(token);
    }

    function updateTokenVisibility(token) {
        token.element.classList.toggle('hidden-enemy', isVisionActive && token.identity.type === 'enemy' && !token.isDiscovered);
    }

    function updateAllTokenVisibility() {
        localTokens.forEach(updateTokenVisibility);
    }

    function renderGrid(gridSettings) {
        const w = gridCanvas.width,
            h = gridCanvas.height;
        gridCtx.clearRect(0, 0, w, h);
        if (!gridSettings || !gridSettings.visible || !gridSettings.cellSize) return;
        cellSize = gridSettings.cellSize;
        gridCtx.strokeStyle = gridSettings.color;
        gridCtx.globalAlpha = gridSettings.opacity;
        gridCtx.lineWidth = 1;
        gridCtx.beginPath();
        for (let x = gridSettings.offsetX; x < w; x += gridSettings.cellSize) {
            gridCtx.moveTo(x, 0);
            gridCtx.lineTo(x, h);
        }
        for (let y = gridSettings.offsetY; y < h; y += gridSettings.cellSize) {
            gridCtx.moveTo(0, y);
            gridCtx.lineTo(w, y);
        }
        gridCtx.stroke();
        gridCtx.globalAlpha = 1.0;
    }

    function drawWalls(wallsData) {
        wallsCtx.clearRect(0, 0, wallsCanvas.width, wallsCanvas.height);
        if (!wallsData) return;
        wallsData.forEach(wall => {
            wallsCtx.beginPath();
            wallsCtx.moveTo(wall.x1, wall.y1);
            wallsCtx.lineTo(wall.x2, wall.y2);
            if (wall.type === 'door') {
                wallsCtx.strokeStyle = wall.isOpen ? '#5dc66f' : '#c65d5d';
                wallsCtx.setLineDash([10, 8]);
                wallsCtx.lineWidth = 5;
            } else {
                wallsCtx.strokeStyle = '#e6c253';
                wallsCtx.setLineDash([]);
                wallsCtx.lineWidth = 4;
            }
            wallsCtx.stroke();
        });
        wallsCtx.setLineDash([]);
    }

    function getIntersection(ray, wall) {
        const r_px = ray.x1,
            r_py = ray.y1,
            r_dx = ray.x2 - r_px,
            r_dy = ray.y2 - r_py;
        const s_px = wall.x1,
            s_py = wall.y1,
            s_dx = wall.x2 - s_px,
            s_dy = wall.y2 - s_py;
        const T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / (s_dx * r_dy - s_dy * r_dx);
        const T1 = (s_px + s_dx * T2 - r_px) / r_dx;
        if (T1 < 0 || T2 < 0 || T2 > 1) return null;
        return {
            x: r_px + r_dx * T1,
            y: r_py + r_dy * T1,
            param: T1
        };
    }

    function drawVision(tokensData, wallsData) {
        if (!tokensData || !wallsData) return;
        const visionThisFrameCanvas = document.createElement('canvas');
        visionThisFrameCanvas.width = visionCanvas.width;
        visionThisFrameCanvas.height = visionCanvas.height;
        const visionThisFrameCtx = visionThisFrameCanvas.getContext('2d');
        const mapBoundaries = [{
            x1: 0,
            y1: 0,
            x2: visionCanvas.width,
            y2: 0
        }, {
            x1: visionCanvas.width,
            y1: 0,
            x2: visionCanvas.width,
            y2: visionCanvas.height
        }, {
            x1: visionCanvas.width,
            y1: visionCanvas.height,
            x2: 0,
            y2: visionCanvas.height
        }, {
            x1: 0,
            y1: visionCanvas.height,
            x2: 0,
            y2: 0
        }];
        const activeWalls = wallsData.filter(w => w.type === 'wall' || (w.type === 'door' && !w.isOpen));
        tokensData.filter(t => t.identity.type === 'player').forEach(pToken => {
            const tokenSize = (pToken.position.sizeMultiplier || 1) * cellSize;
            const centerX = pToken.position.x + tokenSize / 2;
            const centerY = pToken.position.y + tokenSize / 2;
            const visionRadiusPixels = pToken.stats.vision.radius * cellSize;
            visionThisFrameCtx.save();
            visionThisFrameCtx.beginPath();
            visionThisFrameCtx.arc(centerX, centerY, visionRadiusPixels, 0, Math.PI * 2);
            visionThisFrameCtx.clip();
            const allObstacles = [...activeWalls, ...mapBoundaries];
            let points = [];
            allObstacles.forEach(wall => {
                points.push({
                    x: wall.x1,
                    y: wall.y1
                });
                points.push({
                    x: wall.x2,
                    y: wall.y2
                });
            });
            let rays = [];
            points.forEach(point => {
                const angle = Math.atan2(point.y - centerY, point.x - centerX);
                for (let i = -1; i <= 1; i++) {
                    const offset = i * 0.0001;
                    rays.push({
                        angle: angle + offset,
                        x1: centerX,
                        y1: centerY,
                        x2: centerX + Math.cos(angle + offset) * visionRadiusPixels * 1.5,
                        y2: centerY + Math.sin(angle + offset) * visionRadiusPixels * 1.5
                    });
                }
            });
            let intersects = [];
            rays.forEach(ray => {
                let closestIntersect = null;
                allObstacles.forEach(wall => {
                    const intersect = getIntersection(ray, wall);
                    if (intersect) {
                        if (!closestIntersect || intersect.param < closestIntersect.param) {
                            closestIntersect = intersect;
                        }
                    }
                });
                if (closestIntersect) {
                    closestIntersect.angle = ray.angle;
                    intersects.push(closestIntersect);
                }
            });
            intersects.sort((a, b) => a.angle - b.angle);
            if (intersects.length > 0) {
                visionThisFrameCtx.fillStyle = 'white';
                visionThisFrameCtx.beginPath();
                visionThisFrameCtx.moveTo(intersects[0].x, intersects[0].y);
                for (let i = 1; i < intersects.length; i++) {
                    visionThisFrameCtx.lineTo(intersects[i].x, intersects[i].y);
                }
                visionThisFrameCtx.closePath();
                visionThisFrameCtx.fill();
            }
            visionThisFrameCtx.restore();
        });
        revealedBufferCtx.globalCompositeOperation = 'source-over';
        revealedBufferCtx.drawImage(visionThisFrameCanvas, 0, 0);
        visionCtx.clearRect(0, 0, visionCanvas.width, visionCanvas.height);
        visionCtx.fillStyle = 'rgba(0,0,0,0.95)';
        visionCtx.fillRect(0, 0, visionCanvas.width, visionCanvas.height);
        visionCtx.globalCompositeOperation = 'destination-out';
        visionCtx.drawImage(revealedBufferCanvas, 0, 0);
        visionCtx.globalCompositeOperation = 'source-over';
        checkEnemyDiscoveryInView();
    }

    function checkEnemyDiscoveryInView() {
        if (revealedBufferCanvas.width === 0) return;
        const fogImageData = revealedBufferCtx.getImageData(0, 0, revealedBufferCanvas.width, revealedBufferCanvas.height);
        const fogData = fogImageData.data;
        const canvasWidth = revealedBufferCanvas.width;
        const newlyVisibleEnemies = [];
        localTokens.filter(t => t.identity.type === 'enemy' && !t.isDiscovered).forEach(enemy => {
            const tokenSize = (enemy.position.sizeMultiplier || 1) * cellSize;
            const centerX = Math.floor(enemy.position.x + tokenSize / 2);
            const centerY = Math.floor(enemy.position.y + tokenSize / 2);
            if (centerX >= 0 && centerX < canvasWidth && centerY >= 0 && centerY < revealedBufferCanvas.height) {
                const pixelIndex = (centerY * canvasWidth + centerX) * 4;
                if (fogData[pixelIndex + 3] > 0) {
                    enemy.isDiscovered = true;
                    updateTokenVisibility(enemy);
                    newlyVisibleEnemies.push(enemy.id);
                }
            }
        });
        if (newlyVisibleEnemies.length > 0) {
            channel.postMessage({
                type: 'EVENT_FOG_PAINTED',
                payload: {
                    visibleEnemies: newlyVisibleEnemies
                }
            });
        }
    }

    function paintFog(event) {
        if (!activeBrushMode) return;
        const {
            x,
            y
        } = getMapCoordinates(event);
        revealedBufferCtx.globalCompositeOperation = activeBrushMode === 'reveal' ? 'source-over' : 'destination-out';
        revealedBufferCtx.fillStyle = 'white';
        revealedBufferCtx.beginPath();
        revealedBufferCtx.arc(x, y, brushSize / (2 * scale), 0, Math.PI * 2);
        revealedBufferCtx.fill();
        visionCtx.clearRect(0, 0, visionCanvas.width, visionCanvas.height);
        visionCtx.fillStyle = 'rgba(0,0,0,0.95)';
        visionCtx.fillRect(0, 0, visionCanvas.width, visionCanvas.height);
        visionCtx.globalCompositeOperation = 'destination-out';
        visionCtx.drawImage(revealedBufferCanvas, 0, 0);
        visionCtx.globalCompositeOperation = 'source-over';
        checkEnemyDiscoveryInView();
    }

    function getHealthColorClass(current, max) {
        if (max === 0) return 'health-mid';
        const percentage = (current / max) * 100;
        if (percentage <= 10) return 'health-critical';
        if (percentage <= 40) return 'health-low';
        if (percentage <= 70) return 'health-mid';
        return 'health-high';
    }

    function updatePlayerTurnTracker(tokens) {
        playerTurnTracker.innerHTML = '';
        if (!tokens) return;
        const visibleTokens = tokens.filter(t => t.identity.type === 'player' || (t.identity.type === 'enemy' && t.isDiscovered));
        const sortedTokens = visibleTokens.sort((a, b) => (b.stats.initiative || 0) - (a.stats.initiative || 0));
        sortedTokens.forEach(token => {
            const card = document.createElement('div');
            card.className = 'player-token-card';
            card.dataset.id = token.id;
            const imageStyle = token.identity.image ? `background-image: url(${token.identity.image});` : `background-color: ${token.appearance.color};`;
            const statesHTML = (token.info.states || []).map(state => `<span title="${state.description}">${state.emoji}</span>`).join('');
            let healthInfoHTML = '';
            const healthPercentage = token.stats.health.max > 0 ? (token.stats.health.current / token.stats.health.max) * 100 : 0;
            const healthColorClass = getHealthColorClass(token.stats.health.current, token.stats.health.max);
            healthInfoHTML = `<div class="health-bar-container"><div class="health-bar-fill ${healthColorClass}" style="width: ${healthPercentage}%;"></div></div><div class="player-token-health-text">Vida: ${token.stats.health.current}/${token.stats.health.max}</div>`;
            card.innerHTML = ` <div class="player-token-preview" style="${imageStyle}">${token.identity.image ? '' : token.identity.letter}</div> <div class="player-token-info"> <div class="player-token-name">${token.identity.name}</div> <div class="player-token-initiative">Iniciativa: ${token.stats.initiative || 0}</div> ${healthInfoHTML} <div class="player-token-states">${statesHTML}</div> </div>`;
            playerTurnTracker.appendChild(card);
        });
    }

    function showDamageFloat(amount, tokenId) {
        const token = localTokens.find(t => t.id === tokenId);
        if (!token || !token.element) return;
        const text = `${amount > 0 ? '+' : ''}${amount}`;
        const typeClass = amount > 0 ? 'heal' : 'damage';
        const mapFloat = document.createElement('div');
        mapFloat.className = `damage-float ${typeClass}`;
        mapFloat.textContent = text;
        const tokenSize = (token.position.sizeMultiplier || 1) * cellSize;
        mapFloat.style.left = `${token.position.x + tokenSize / 2}px`;
        mapFloat.style.top = `${token.position.y}px`;
        tokensLayer.appendChild(mapFloat);
        setTimeout(() => mapFloat.remove(), 1000);
        const trackerCard = playerTurnTracker.querySelector(`.player-token-card[data-id="${tokenId}"]`);
        if (trackerCard) {
            const trackerFloat = document.createElement('div');
            trackerFloat.className = `damage-float ${typeClass}`;
            trackerFloat.textContent = text;
            const cardRect = trackerCard.getBoundingClientRect();
            trackerFloat.style.position = 'fixed';
            trackerFloat.style.left = `${cardRect.left + (cardRect.width / 2)}px`;
            trackerFloat.style.top = `${cardRect.top}px`;
            document.body.appendChild(trackerFloat);
            setTimeout(() => trackerFloat.remove(), 1000);
        }
    }

    function drawAoe(event) {
        if (!currentAoeData || !currentAoeData.params) {
            aoeCtx.clearRect(0, 0, aoeCanvas.width, aoeCanvas.height);
            return;
        }
        aoeCtx.clearRect(0, 0, aoeCanvas.width, aoeCanvas.height);
        let mouseX, mouseY;
        if (event) {
            const coords = getMapCoordinates(event);
            mouseX = coords.x;
            mouseY = coords.y;
        }
        const {
            type,
            params,
            origin
        } = currentAoeData;
        aoeCtx.fillStyle = params.color;
        aoeCtx.strokeStyle = params.color;
        aoeCtx.lineCap = 'round';
        switch (type) {
            case 'line':
                if (!event) return;
                aoeCtx.lineWidth = params.width * cellSize;
                aoeCtx.beginPath();
                aoeCtx.moveTo(origin.x, origin.y);
                aoeCtx.lineTo(mouseX, mouseY);
                aoeCtx.stroke();
                break;
            case 'cone':
                if (!event) return;
                const coneLength = params.length * cellSize;
                const angle = Math.atan2(mouseY - origin.y, mouseX - origin.x);
                const endX = origin.x + Math.cos(angle) * coneLength;
                const endY = origin.y + Math.sin(angle) * coneLength;
                const halfW = coneLength / 2;
                aoeCtx.beginPath();
                aoeCtx.moveTo(origin.x, origin.y);
                aoeCtx.lineTo(endX - halfW * Math.sin(angle), endY + halfW * Math.cos(angle));
                aoeCtx.lineTo(endX + halfW * Math.sin(angle), endY - halfW * Math.cos(angle));
                aoeCtx.closePath();
                aoeCtx.fill();
                break;
            case 'cube':
                if (!event) return;
                const cubeSize = params.size * cellSize;
                aoeCtx.fillRect(mouseX - cubeSize / 2, mouseY - cubeSize / 2, cubeSize, cubeSize);
                break;
            case 'sphere':
                const sphereRadius = params.radius * cellSize;
                aoeCtx.beginPath();
                aoeCtx.arc(origin.x, origin.y, sphereRadius, 0, Math.PI * 2);
                aoeCtx.fill();
                break;
            case 'cylinder':
                if (!event) return;
                const cylinderRadius = params.radius * cellSize;
                aoeCtx.beginPath();
                aoeCtx.arc(mouseX, mouseY, cylinderRadius, 0, Math.PI * 2);
                aoeCtx.fill();
                break;
        }
    }

    function broadcast(type, payload) {
        channel.postMessage({
            type,
            payload
        });
    }

    function handleAoeMouseMove(event) {
        drawAoe(event);
    }

    // --- Lógica de Controles de Interfaz de Jugador ---
    multiSelectBtn.addEventListener('click', () => {
        isMultiSelectMode = !isMultiSelectMode;
        multiSelectBtn.classList.toggle('active', isMultiSelectMode);
    });

    function handleMultiSelectClick(token) {
        if (!token) return;
        if (selectedGroup.has(token.id)) {
            selectedGroup.delete(token.id);
            token.element.classList.remove('multi-selected');
        } else {
            selectedGroup.add(token.id);
            token.element.classList.add('multi-selected');
        }
    }

    function clearSelectedGroup() {
        selectedGroup.forEach(id => {
            const token = localTokens.find(t => t.id === id);
            if (token) token.element.classList.remove('multi-selected');
        });
        selectedGroup.clear();
    }

    toggleTrackerPosBtn.addEventListener('click', () => {
        playerTurnTracker.classList.toggle('tracker-left');
        playerControlsContainer.classList.toggle('controls-right');
    });

    toggleTrackerPosBtn.addEventListener('click', () => {
        playerTurnTracker.classList.toggle('tracker-left');
        playerControlsContainer.classList.toggle('controls-right');
    });

    // --- NUEVOS MANEJADORES PARA EL MODAL DE PUERTA ---
    confirmPlayerDoorNameBtn.addEventListener('click', () => {
        const doorName = playerDoorNameInput.value.trim();
        if (!doorName) {
            alert('El nombre del acceso no puede estar vacío.');
            return;
        }

        // Enviamos el nombre y los datos de la puerta de vuelta al DM
        broadcast('EVENT_DOOR_NAME_SUBMITTED', {
            name: doorName,
            doorData: pendingPlayerDoor
        });

        playerDoorNameModal.classList.remove('open');
        pendingPlayerDoor = null; // Limpiamos el estado
    });

    cancelPlayerDoorNameBtn.addEventListener('click', () => {
        playerDoorNameModal.classList.remove('open');
        pendingPlayerDoor = null;
        // Notificamos al DM que se canceló para que pueda limpiar la línea temporal
        broadcast('EVENT_DOOR_NAME_CANCELLED');
    });
    playerDoorNameInput.addEventListener('keydown', (event) => {
        // Comprobamos si la tecla presionada es 'Enter'
        if (event.key === 'Enter') {
            // Evitamos que el formulario se envíe si estuviera dentro de uno (buena práctica)
            event.preventDefault();

            // Simulamos un clic en el botón de confirmar
            confirmPlayerDoorNameBtn.click();
        }
    });
});
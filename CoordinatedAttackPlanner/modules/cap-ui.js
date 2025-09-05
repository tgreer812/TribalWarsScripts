// CAP UI Module
// Handles all UI components, styling, and DOM manipulation

window.CAP = window.CAP || {};

window.CAP.UI = (function() {
    
    // Create the initial choice modal
    const createModal = () => {
        const styles = `
            <style>
                #popup_box_CoordinatedAttackPlanner {
                    width: 500px;
                    position: relative;
                }
                .cap-content {
                    padding: 20px;
                    background: url('graphic/index/main_bg.jpg') 100% 0% #E3D5B3;
                    border: 2px solid #7D510F;
                    border-radius: 8px;
                }
                .cap-title {
                    color: #7D510F;
                    font-weight: bold;
                    margin-bottom: 15px;
                    text-align: center;
                    font-size: 18px;
                }
                .cap-description {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #5D4037;
                    font-size: 14px;
                }
                .cap-button-container {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-top: 15px;
                }
                .cap-button {
                    background: linear-gradient(to bottom, #f4e4bc 0%, #c9b576 100%);
                    border: 2px solid #7D510F;
                    border-radius: 4px;
                    color: #5D4037;
                    font-weight: bold;
                    padding: 12px 24px;
                    cursor: pointer;
                    font-size: 14px;
                    text-shadow: 1px 1px 1px rgba(255,255,255,0.5);
                    min-width: 140px;
                    box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
                }
                .cap-button:hover {
                    background: linear-gradient(to bottom, #f8e8c0 0%, #d4c07e 100%);
                    border-color: #8B5A0F;
                }
                .cap-button:active {
                    background: linear-gradient(to bottom, #c9b576 0%, #f4e4bc 100%);
                    box-shadow: inset 1px 1px 3px rgba(0,0,0,0.3);
                }
            </style>
        `;

        const html = `
            ${styles}
            <div class="cap-content">
                <h2 class="cap-title">Coordinated Attack Planner</h2>
                <p class="cap-description">What would you like to do?</p>
                <div class="cap-button-container">
                    <button class="cap-button" id="cap-create-btn">Create a Plan</button>
                    <button class="cap-button" id="cap-import-btn">Import a Plan</button>
                </div>
            </div>
        `;

        Dialog.show('CoordinatedAttackPlanner', html);
    };

    // Show the plan design page
    const showPlanDesignPage = () => {
        const styles = `
            <style>
                #popup_box_CoordinatedAttackPlanner {
                    width: 800px;
                    position: relative;
                }
                .cap-content {
                    padding: 20px;
                    background: url('graphic/index/main_bg.jpg') 100% 0% #E3D5B3;
                    border: 2px solid #7D510F;
                    border-radius: 8px;
                }
                .cap-section {
                    margin-bottom: 15px;
                    padding: 10px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid #7D510F;
                    border-radius: 4px;
                }
                .cap-section h3 {
                    color: #7D510F;
                    margin: 0 0 10px 0;
                    font-size: 16px;
                }
                .cap-form-group {
                    margin: 10px 0;
                }
                .cap-form-group label {
                    display: inline-block;
                    width: 120px;
                    font-weight: bold;
                    color: #5D4037;
                }
                .cap-form-group input, .cap-form-group select {
                    padding: 4px;
                    border: 1px solid #7D510F;
                    border-radius: 2px;
                }
                .cap-input-with-buttons {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    flex-wrap: wrap;
                }
                .cap-input-with-buttons input {
                    flex: 1;
                    min-width: 200px;
                }
                .cap-target-list {
                    max-height: 120px;
                    overflow-y: auto;
                    border: 1px solid #7D510F;
                    background: rgba(255,255,255,0.8);
                    padding: 5px;
                    margin-top: 10px;
                }
                .cap-target-item {
                    display: inline-block;
                    background: #f0f0f0;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    padding: 3px 8px;
                    margin: 2px;
                    font-size: 12px;
                }
                .cap-target-item .remove {
                    color: red;
                    cursor: pointer;
                    margin-left: 5px;
                    font-weight: bold;
                }
                .cap-village-list {
                    max-height: 150px;
                    overflow-y: auto;
                    border: 1px solid #7D510F;
                    background: rgba(255,255,255,0.8);
                    padding: 5px;
                }
                .cap-village-checkbox {
                    margin: 2px 0;
                    padding: 2px 5px;
                    border-bottom: 1px solid #ddd;
                }
                .cap-village-checkbox:last-child {
                    border-bottom: none;
                }
                .cap-village-checkbox input {
                    margin-right: 8px;
                }
                .cap-attack-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                .cap-attack-table th {
                    background: #c1a264;
                    padding: 5px;
                    border: 1px solid #7D510F;
                    color: #5D4037;
                }
                .cap-attack-table td {
                    padding: 5px;
                    border: 1px solid #7D510F;
                    background: rgba(255,255,255,0.8);
                }
                .cap-button {
                    background: linear-gradient(to bottom, #f4e4bc 0%, #c9b576 100%);
                    border: 2px solid #7D510F;
                    border-radius: 4px;
                    color: #5D4037;
                    font-weight: bold;
                    padding: 8px 16px;
                    cursor: pointer;
                    font-size: 12px;
                    text-shadow: 1px 1px 1px rgba(255,255,255,0.5);
                    margin: 2px;
                }
                .cap-button:hover {
                    background: linear-gradient(to bottom, #f8e8c0 0%, #d4c07e 100%);
                    border-color: #8B5A0F;
                }
                .cap-button-small {
                    padding: 4px 8px;
                    font-size: 11px;
                }
                .cap-action-buttons {
                    text-align: center;
                    margin-top: 20px;
                }
                .cap-disabled {
                    opacity: 0.5;
                    pointer-events: none;
                }
                .cap-loading-indicator {
                    display: inline-block;
                    margin-left: 10px;
                    color: #7D510F;
                    font-weight: bold;
                }
                .cap-spinner {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #7D510F;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-right: 5px;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        const html = `
            ${styles}
            <div class="cap-content">
                <h2 class="cap-title">Create Attack Plan</h2>
                
                <!-- Attacking Player Selection -->
                <div class="cap-section">
                    <h3>1. Select Attacking Player (Plan Recipient)</h3>
                    <div class="cap-form-group">
                        <label>Player Name:</label>
                        <div class="cap-input-with-buttons">
                            <input type="text" id="cap-attacking-player-input" placeholder="Enter player name..." autocomplete="off">
                            <button class="cap-button cap-button-small" id="cap-set-attacking-player">Set Player</button>
                        </div>
                    </div>
                    <div id="cap-attacking-player-display" style="display: none;">
                        <strong>Creating plan for: <span id="cap-attacking-player-name"></span></strong>
                        <button class="cap-button cap-button-small" id="cap-change-attacking-player" style="margin-left: 10px;">Change Player</button>
                    </div>
                </div>

                <!-- Attacking Villages -->
                <div class="cap-section cap-disabled" id="cap-attacking-villages-section">
                    <h3>2. Select Attacking Villages</h3>
                    <div class="cap-form-group">
                        <button class="cap-button" id="cap-select-all-attackers">Select All</button>
                        <button class="cap-button" id="cap-clear-attackers">Clear All</button>
                    </div>
                    <div class="cap-village-list" id="cap-attacker-villages">
                        Please select an attacking player first...
                    </div>
                </div>

                <!-- Target Player Selection -->
                <div class="cap-section cap-disabled" id="cap-target-players-section">
                    <h3>3. Select Target Players</h3>
                    <div class="cap-form-group">
                        <label>Add Player:</label>
                        <div class="cap-input-with-buttons">
                            <input type="text" id="cap-player-input" placeholder="Enter player name..." autocomplete="off">
                            <button class="cap-button cap-button-small" id="cap-add-player">Add</button>
                            <button class="cap-button cap-button-small" id="cap-add-tribe">Add Tribe</button>
                        </div>
                    </div>
                    <div class="cap-target-list" id="cap-target-players">
                        <div style="color: #666; font-style: italic;">No target players selected</div>
                    </div>
                </div>

                <!-- Target Villages -->
                <div class="cap-section cap-disabled" id="cap-target-villages-section">
                    <h3>4. Select Target Villages</h3>
                    <div class="cap-form-group">
                        <label>Add by Coords:</label>
                        <div class="cap-input-with-buttons">
                            <input type="text" id="cap-target-coords" placeholder="XXX|YYY,XXX|YYY (comma separated)">
                            <button class="cap-button cap-button-small" id="cap-add-coords">Add</button>
                        </div>
                    </div>
                    <div class="cap-form-group">
                        <label>From Players:</label>
                        <button class="cap-button cap-button-small" id="cap-add-all-villages">Add All Villages</button>
                        <button class="cap-button cap-button-small" id="cap-clear-all-villages">Clear All</button>
                        <span id="cap-loading-all-villages" class="cap-loading-indicator" style="display: none;">
                            <span class="cap-spinner"></span>Loading villages...
                        </span>
                        <span style="color: #666; font-size: 11px; margin-left: 10px;">Adds all villages from selected target players</span>
                    </div>
                    <div class="cap-form-group">
                        <label>Select Player:</label>
                        <select id="cap-target-player-dropdown" style="width: 150px;">
                            <option value="">Choose player...</option>
                        </select>
                        <label style="width: 80px; margin-left: 10px;">Village:</label>
                        <select id="cap-target-village-dropdown" style="width: 180px;" disabled>
                            <option value="">Select player first...</option>
                        </select>
                        <button class="cap-button cap-button-small" id="cap-add-selected-village">Add Village</button>
                        <button class="cap-button cap-button-small" id="cap-add-all-player-villages">Add All</button>
                    </div>
                    <div class="cap-target-list" id="cap-target-villages">
                        <div style="color: #666; font-style: italic;">No target villages selected</div>
                    </div>
                </div>

                <!-- Attack Configuration -->
                <div class="cap-section cap-disabled" id="cap-attack-config-section">
                    <h3>5. Configure Attacks</h3>
                    <div class="cap-form-group">
                        <button class="cap-button" id="cap-add-attack">Add Attack</button>
                        <button class="cap-button" id="cap-mass-add">Mass Add (All to All)</button>
                        <button class="cap-button" id="cap-clear-attacks">Clear All</button>
                    </div>
                    <table class="cap-attack-table">
                        <thead>
                            <tr>
                                <th>Attacking Village</th>
                                <th>Target Village</th>
                                <th>Landing Time</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="cap-attack-list">
                            <tr>
                                <td colspan="5" style="text-align: center; color: #666;">No attacks configured</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Action Buttons -->
                <div class="cap-action-buttons">
                    <button class="cap-button" id="cap-back">← Back</button>
                    <button class="cap-button cap-disabled" id="cap-preview">Preview Plan</button>
                    <button class="cap-button cap-disabled" id="cap-export">Export Plan</button>
                </div>
            </div>
        `;

        Dialog.show('CoordinatedAttackPlanner', html);
    };

    // Generic function to render items with remove functionality - enhanced for villages
    const renderItemsWithRemove = (containerId, items, removeCallback, emptyMessage = 'No items selected', isVillageList = false) => {
        const container = document.getElementById(containerId);
        
        if (!items || items.size === 0) {
            container.innerHTML = `<div style="color: #666; font-style: italic;">${emptyMessage}</div>`;
            return;
        }

        let html = '';
        if (isVillageList) {
            // For villages, items is a Map with coords -> {coords, name, player}
            items.forEach((village, coords) => {
                const displayText = village.name !== coords ? `${village.name} (${coords})` : coords;
                html += `
                    <span class="cap-target-item">
                        ${displayText}
                        <span class="remove" onclick="${removeCallback}('${coords}')" style="color: red; cursor: pointer; margin-left: 5px; font-weight: bold;">&times;</span>
                    </span>
                `;
            });
        } else {
            // For regular items (players), items is a Set
            items.forEach(item => {
                html += `
                    <span class="cap-target-item">
                        ${item}
                        <span class="remove" onclick="${removeCallback}('${item}')" style="color: red; cursor: pointer; margin-left: 5px; font-weight: bold;">&times;</span>
                    </span>
                `;
            });
        }
        
        container.innerHTML = html;
    };

    // Update the target players display
    const updateTargetPlayersDisplay = () => {
        const targetPlayers = window.CAP.State.getTargetPlayers();
        renderItemsWithRemove('cap-target-players', targetPlayers, 'window.CAP.removeTargetPlayer', 'No target players selected');
        updateTargetPlayerDropdown();
    };

    // Update the target villages display
    const updateTargetVillagesDisplay = () => {
        const targetVillages = window.CAP.State.getTargetVillages();
        renderItemsWithRemove('cap-target-villages', targetVillages, 'window.CAP.removeTargetVillage', 'No target villages selected', true);
    };

    // Update target player dropdown
    const updateTargetPlayerDropdown = () => {
        const dropdown = document.getElementById('cap-target-player-dropdown');
        const targetPlayers = window.CAP.State.getTargetPlayers();
        
        let html = '<option value="">Choose player...</option>';
        targetPlayers.forEach(playerName => {
            html += `<option value="${playerName}">${playerName}</option>`;
        });
        
        dropdown.innerHTML = html;
        
        // Reset village dropdown
        document.getElementById('cap-target-village-dropdown').innerHTML = '<option value="">Select player first...</option>';
        document.getElementById('cap-target-village-dropdown').disabled = true;
    };

    // Update target village dropdown based on selected player
    const updateTargetVillageDropdown = (playerName) => {
        const dropdown = document.getElementById('cap-target-village-dropdown');
        
        if (!playerName) {
            dropdown.innerHTML = '<option value="">Select player first...</option>';
            dropdown.disabled = true;
            return;
        }

        const playerVillages = window.CAP.State.getPlayerVillages(playerName);
        
        if (Object.keys(playerVillages).length === 0) {
            // Try to fetch villages for this player
            window.CAP.Validation.getPlayerVillages(playerName)
                .then(villages => {
                    window.CAP.State.setPlayerVillages(playerName, villages);
                    populateVillageDropdown(villages);
                })
                .catch(error => {
                    dropdown.innerHTML = '<option value="">Failed to load villages</option>';
                    dropdown.disabled = true;
                });
        } else {
            populateVillageDropdown(playerVillages);
        }

        function populateVillageDropdown(villages) {
            let html = '<option value="">Choose village...</option>';
            Object.values(villages).forEach(village => {
                html += `<option value="${village.coords}">${village.name} (${village.coords})</option>`;
            });
            dropdown.innerHTML = html;
            dropdown.disabled = false;
        }
    };

    // Show add tribe dialog
    const showAddTribeDialog = () => {
        const html = `
            <div style="padding: 20px;">
                <h3>Add Tribe Members</h3>
                <p>Enter tribe tag to add all members as targets:</p>
                <input type="text" id="tribe-input" placeholder="Enter tribe tag..." style="width: 200px; margin: 10px 0;">
                <br>
                <button class="cap-button" id="cap-add-tribe-confirm" onclick="window.CAP.addTribeMembers()">Add Tribe</button>
                <button class="cap-button" onclick="Dialog.close()">Cancel</button>
            </div>
        `;
        
        Dialog.show('AddTribe', html);
        
        // Focus the input
        setTimeout(() => {
            document.getElementById('tribe-input').focus();
        }, 100);
    };

    // Update attacking villages display
    const updateAttackingVillagesDisplay = () => {
        const container = document.getElementById('cap-attacker-villages');
        const attackingPlayer = window.CAP.State.getAttackingPlayer();
        const playerVillages = window.CAP.State.getPlayerVillages(attackingPlayer);
        const selectedVillages = window.CAP.State.getAttackingVillages();

        if (!attackingPlayer) {
            container.innerHTML = 'Please select an attacking player first...';
            return;
        }

        if (Object.keys(playerVillages).length === 0) {
            container.innerHTML = '<div style="color: #666; font-style: italic;">Loading villages...</div>';
            return;
        }

        let html = '';
        Object.values(playerVillages).forEach(village => {
            const isSelected = selectedVillages.has(village.id);
            html += `
                <div class="cap-village-checkbox">
                    <input type="checkbox" id="village-${village.id}" data-village-id="${village.id}" ${isSelected ? 'checked' : ''}>
                    <label for="village-${village.id}">${village.name} (${village.coords})</label>
                </div>
            `;
        });

        container.innerHTML = html;

        // Bind village checkbox events
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const villageId = this.dataset.villageId;
                if (this.checked) {
                    window.CAP.State.addAttackingVillage(villageId);
                } else {
                    window.CAP.State.removeAttackingVillage(villageId);
                }
            });
        });
    };

    // Enable/disable sections based on attacking player selection
    const toggleSectionStates = (attackingPlayerSet) => {
        const sections = [
            'cap-attacking-villages-section',
            'cap-target-players-section', 
            'cap-target-villages-section',
            'cap-attack-config-section'
        ];

        const buttons = ['cap-preview', 'cap-export'];

        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                if (attackingPlayerSet) {
                    section.classList.remove('cap-disabled');
                } else {
                    section.classList.add('cap-disabled');
                }
            }
        });

        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                if (attackingPlayerSet) {
                    button.classList.remove('cap-disabled');
                } else {
                    button.classList.add('cap-disabled');
                }
            }
        });
    };

    // Show loading indicator for village loading
    const showVillageLoadingIndicator = (show, message = 'Loading villages...') => {
        const indicator = document.getElementById('cap-loading-all-villages');
        if (indicator) {
            if (show) {
                indicator.style.display = 'inline-block';
                indicator.innerHTML = `<span class="cap-spinner"></span>${message}`;
            } else {
                indicator.style.display = 'none';
            }
        }
    };

    // Update loading indicator message
    const updateVillageLoadingMessage = (message) => {
        const indicator = document.getElementById('cap-village-loading');
        if (indicator) {
            indicator.textContent = message;
        }
    };

    // Show add attack dialog
    const showAddAttackDialog = () => {
        const styles = `
            <style>
                .cap-attack-form {
                    padding: 20px;
                    background: url('graphic/index/main_bg.jpg') 100% 0% #E3D5B3;
                    border: 2px solid #7D510F;
                    border-radius: 8px;
                }
                .cap-attack-form h3 {
                    color: #7D510F;
                    margin-bottom: 15px;
                    font-size: 16px;
                }
                .cap-attack-form-group {
                    margin-bottom: 15px;
                }
                .cap-attack-form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: #5D4037;
                }
                .cap-attack-form select,
                .cap-attack-form input,
                .cap-attack-form textarea {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #7D510F;
                    border-radius: 4px;
                    font-size: 12px;
                    box-sizing: border-box;
                }
                .cap-attack-form textarea {
                    height: 60px;
                    resize: vertical;
                }
                .cap-attack-dialog-buttons {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                }
            </style>
        `;

        // Get available attacking villages
        const attackingPlayer = window.CAP.State.getAttackingPlayer();
        const attackingVillages = window.CAP.State.getAttackingVillages();
        const playerVillages = window.CAP.State.getPlayerVillages(attackingPlayer);
        
        let attackingVillageOptions = '';
        attackingVillages.forEach(villageId => {
            const village = playerVillages[villageId];
            if (village) {
                attackingVillageOptions += `<option value="${villageId}">${village.name} (${village.coords})</option>`;
            }
        });

        // Get available target villages
        const targetVillages = window.CAP.State.getTargetVillages();
        let targetVillageOptions = '';
        targetVillages.forEach((village, coords) => {
            targetVillageOptions += `<option value="${coords}">${village.name} (${coords}) - ${village.player}</option>`;
        });

        // Get current server time for default landing time
        const now = new Date();
        
        // Safely get server time - fallback to local time if server_utc_diff is not available
        let serverTime;
        try {
            const utcDiff = (typeof game_data !== 'undefined' && game_data.server_utc_diff) ? 
                game_data.server_utc_diff : 0;
            serverTime = new Date(now.getTime() + (utcDiff * 1000));
            
            // Validate the server time is valid
            if (isNaN(serverTime.getTime())) {
                serverTime = now; // Fallback to local time
            }
        } catch (e) {
            serverTime = now; // Fallback to local time
        }
        
        const defaultTime = new Date(serverTime.getTime() + 60 * 60 * 1000); // 1 hour from now
        const defaultTimeStr = defaultTime.toISOString().slice(0, 19).replace('T', ' ');

        const html = `
            ${styles}
            <div class="cap-attack-form">
                <h3>Add New Attack</h3>
                <div class="cap-attack-form-group">
                    <label for="cap-attack-attacking-village">Attacking Village:</label>
                    <select id="cap-attack-attacking-village">
                        <option value="">-- Select Attacking Village --</option>
                        ${attackingVillageOptions}
                    </select>
                </div>
                <div class="cap-attack-form-group">
                    <label for="cap-attack-target-village">Target Village:</label>
                    <select id="cap-attack-target-village">
                        <option value="">-- Select Target Village --</option>
                        ${targetVillageOptions}
                    </select>
                </div>
                <div class="cap-attack-form-group">
                    <label for="cap-attack-landing-time">Landing Time (Server Time):</label>
                    <input type="text" id="cap-attack-landing-time" value="${defaultTimeStr}" placeholder="YYYY-MM-DD HH:MM:SS">
                    <small style="display: block; margin-top: 5px; color: #666;">Format: YYYY-MM-DD HH:MM:SS (e.g., 2025-09-05 15:30:00)</small>
                </div>
                <div class="cap-attack-form-group">
                    <label for="cap-attack-notes">Notes (Optional):</label>
                    <textarea id="cap-attack-notes" placeholder="Optional notes about this attack..."></textarea>
                </div>
                <div class="cap-attack-dialog-buttons">
                    <button class="cap-button" id="cap-attack-cancel">Cancel</button>
                    <button class="cap-button" id="cap-attack-save">Save Attack</button>
                </div>
            </div>
        `;

        Dialog.show('AddAttack', html);
    };

    // Show mass add dialog
    const showMassAddDialog = () => {
        const styles = `
            <style>
                .cap-mass-add-form {
                    padding: 20px;
                    background: url('graphic/index/main_bg.jpg') 100% 0% #E3D5B3;
                    border: 2px solid #7D510F;
                    border-radius: 8px;
                }
                .cap-mass-add-form h3 {
                    color: #7D510F;
                    margin-bottom: 15px;
                    font-size: 16px;
                }
                .cap-mass-add-form-group {
                    margin-bottom: 15px;
                }
                .cap-mass-add-form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: #5D4037;
                }
                .cap-mass-add-form input,
                .cap-mass-add-form textarea,
                .cap-mass-add-form select {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #7D510F;
                    border-radius: 4px;
                    font-size: 12px;
                    box-sizing: border-box;
                }
                .cap-mass-add-form textarea {
                    height: 60px;
                    resize: vertical;
                }
                .cap-mass-add-preview {
                    background: #f5f5f5;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    padding: 10px;
                    margin: 10px 0;
                    font-weight: bold;
                    color: #333;
                }
                .cap-mass-add-dialog-buttons {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                }
                .cap-time-spread-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .cap-time-spread-group input {
                    width: 80px;
                }
            </style>
        `;

        // Get current server time for default landing time
        const now = new Date();
        
        // Safely get server time - fallback to local time if server_utc_diff is not available
        let serverTime;
        try {
            const utcDiff = (typeof game_data !== 'undefined' && game_data.server_utc_diff) ? 
                game_data.server_utc_diff : 0;
            serverTime = new Date(now.getTime() + (utcDiff * 1000));
            
            // Validate the server time is valid
            if (isNaN(serverTime.getTime())) {
                serverTime = now; // Fallback to local time
            }
        } catch (e) {
            serverTime = now; // Fallback to local time
        }
        
        const defaultTime = new Date(serverTime.getTime() + 60 * 60 * 1000); // 1 hour from now
        const defaultTimeStr = defaultTime.toISOString().slice(0, 19).replace('T', ' ');

        const html = `
            ${styles}
            <div class="cap-mass-add-form">
                <h3>Mass Add Attacks (All to All)</h3>
                <div id="cap-mass-add-preview" class="cap-mass-add-preview">
                    Loading preview...
                </div>
                <div class="cap-mass-add-form-group">
                    <label for="cap-mass-add-landing-time">Landing Time (Server Time):</label>
                    <input type="text" id="cap-mass-add-landing-time" value="${defaultTimeStr}" placeholder="YYYY-MM-DD HH:MM:SS">
                    <small style="display: block; margin-top: 5px; color: #666;">Format: YYYY-MM-DD HH:MM:SS (e.g., 2025-09-05 15:30:00)</small>
                </div>
                <div class="cap-mass-add-form-group">
                    <label for="cap-mass-add-time-spread">Time Spreading (Optional):</label>
                    <div class="cap-time-spread-group">
                        <input type="number" id="cap-mass-add-time-spread" value="0" min="0" max="3600" placeholder="0">
                        <span>seconds between attacks</span>
                    </div>
                    <small style="display: block; margin-top: 5px; color: #666;">Each attack will be offset by this many seconds (e.g., 10 seconds = attacks at +0s, +10s, +20s, etc.)</small>
                </div>
                <div class="cap-mass-add-form-group">
                    <label for="cap-mass-add-notes">Global Notes (Optional):</label>
                    <textarea id="cap-mass-add-notes" placeholder="These notes will be applied to all attacks..."></textarea>
                </div>
                <div class="cap-mass-add-dialog-buttons">
                    <button class="cap-button" id="cap-mass-add-cancel">Cancel</button>
                    <button class="cap-button" id="cap-mass-add-save">Create All Attacks</button>
                </div>
            </div>
        `;

        Dialog.show('MassAddAttacks', html);
        
        // Update preview immediately
        updateMassAddPreview();
    };

    // Update mass add preview
    const updateMassAddPreview = () => {
        const attackingVillages = window.CAP.State.getAttackingVillages();
        const targetVillages = window.CAP.State.getTargetVillages();
        
        const attackerCount = attackingVillages.size;
        const targetCount = targetVillages.size;
        const totalAttacks = attackerCount * targetCount;
        
        const previewElement = document.getElementById('cap-mass-add-preview');
        if (previewElement) {
            previewElement.innerHTML = `
                <strong>Preview:</strong> ${attackerCount} attacking villages × ${targetCount} target villages = 
                <span style="color: #7D510F;">${totalAttacks} total attacks</span>
            `;
        }
    };

    // Update attack table display
    const updateAttackTable = () => {
        const tbody = document.getElementById('cap-attack-list');
        if (!tbody) return;

        const attacks = window.CAP.State.getAttacks();
        
        if (attacks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No attacks configured</td></tr>';
            return;
        }

        tbody.innerHTML = attacks.map(attack => `
            <tr>
                <td>${attack.attackingVillage.name} (${attack.attackingVillage.coords})</td>
                <td>${attack.targetVillage.name} (${attack.targetVillage.coords}) - ${attack.targetVillage.player}</td>
                <td>${attack.landingTime}</td>
                <td>${attack.notes || '-'}</td>
                <td>
                    <button class="cap-button cap-button-small" onclick="window.CAP.editAttack('${attack.id}')">Edit</button>
                    <button class="cap-button cap-button-small" onclick="window.CAP.removeAttack('${attack.id}')" style="margin-left: 5px;">Remove</button>
                </td>
            </tr>
        `).join('');
    };

    return {
        createModal,
        showPlanDesignPage,
        updateTargetPlayersDisplay,
        updateTargetVillagesDisplay,
        updateTargetPlayerDropdown,
        updateTargetVillageDropdown,
        updateAttackingVillagesDisplay,
        showAddTribeDialog,
        toggleSectionStates,
        showVillageLoadingIndicator,
        updateVillageLoadingMessage,
        showAddAttackDialog,
        showMassAddDialog,
        updateMassAddPreview,
        updateAttackTable
    };
})();

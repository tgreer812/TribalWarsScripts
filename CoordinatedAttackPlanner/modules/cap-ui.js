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
                
                <!-- Plan Details -->
                <div class="cap-section">
                    <h3>Plan Details (Optional)</h3>
                    <div class="cap-form-group">
                        <label>Plan Name:</label>
                        <input type="text" id="cap-plan-name" placeholder="Enter plan name..." maxlength="100" style="width: 300px;">
                    </div>
                    <div class="cap-form-group">
                        <label>Description:</label>
                        <input type="text" id="cap-plan-description" placeholder="Enter plan description..." maxlength="500" style="width: 400px;">
                    </div>
                </div>
                
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
        }            tbody.innerHTML = attacks.map(attack => `
            <tr>
                <td>${attack.attackingVillage.name} (${attack.attackingVillage.coords})</td>
                <td>${attack.targetVillage.name} (${attack.targetVillage.coords}) - ${attack.targetVillage.player}</td>
                <td>${formatDateTime(attack.arrivalTime)}</td>
                <td>${attack.notes || '-'}</td>
                <td>
                    <button class="cap-button cap-button-small" onclick="window.CAP.editAttack('${attack.id}')">Edit</button>
                    <button class="cap-button cap-button-small" onclick="window.CAP.removeAttack('${attack.id}')" style="margin-left: 5px;">Remove</button>
                </td>
            </tr>
        `).join('');
    };

    // Show export plan modal
    const showExportPlanModal = (base64String, attackCount, planName) => {
        const modal = `
            <div class="cap-content">
                <h2 class="cap-title">Export Plan</h2>
                <div style="margin-bottom: 15px;">
                    <strong>Plan exported successfully!</strong><br>
                    Attacks: ${attackCount}<br>
                    Plan: ${planName || 'Unnamed Plan'}
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="cap-export-data" style="display: block; margin-bottom: 5px; font-weight: bold;">Base64 Plan Data:</label>
                    <textarea id="cap-export-data" readonly style="width: 100%; height: 150px; padding: 5px; border: 1px solid #7D510F; border-radius: 2px; font-family: monospace; font-size: 12px; resize: vertical;">${base64String}</textarea>
                </div>
                <div style="margin-bottom: 15px; padding: 10px; background: rgba(255,215,0,0.1); border: 1px solid #DAA520; border-radius: 4px;">
                    <strong>Instructions:</strong><br>
                    1. Copy the base64 data above<br>
                    2. Share this data with the plan recipient<br>
                    3. They can import it using the "Import Plan" option
                </div>
                <div class="cap-button-container">
                    <button class="cap-button" id="cap-copy-export">Copy to Clipboard</button>
                    <button class="cap-button" id="cap-export-close">Close</button>
                </div>
            </div>
        `;

        Dialog.show('CoordinatedAttackPlanner', modal);

        // Bind events
        document.getElementById('cap-copy-export').onclick = function() {
            const textarea = document.getElementById('cap-export-data');
            textarea.select();
            textarea.setSelectionRange(0, 99999); // For mobile devices
            
            try {
                document.execCommand('copy');
                this.textContent = 'Copied!';
                this.style.background = '#90EE90';
                setTimeout(() => {
                    this.textContent = 'Copy to Clipboard';
                    this.style.background = '';
                }, 2000);
            } catch (err) {
                alert('Copy failed. Please manually select and copy the text.');
            }
        };

        document.getElementById('cap-export-close').onclick = function() {
            Dialog.close();
        };

        // Auto-select the textarea content for easy copying
        document.getElementById('cap-export-data').focus();
        document.getElementById('cap-export-data').select();
    };

    // Show direct export modal (for already finalized plans)
    const showDirectExportModal = (base64String, planName, attackCount) => {
        const modal = `
            <div class="cap-content">
                <h2 class="cap-title">Export Plan</h2>
                <div style="margin-bottom: 15px;">
                    <strong>Plan exported successfully!</strong><br>
                    Attacks: ${attackCount}<br>
                    Plan: ${planName || 'Unnamed Plan'}
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="cap-export-data-direct" style="display: block; margin-bottom: 5px; font-weight: bold;">Base64 Plan Data:</label>
                    <textarea id="cap-export-data-direct" readonly style="width: 100%; height: 150px; padding: 5px; border: 1px solid #7D510F; border-radius: 2px; font-family: monospace; font-size: 12px; resize: vertical;">${base64String}</textarea>
                </div>
                <div style="margin-bottom: 15px; padding: 10px; background: rgba(255,215,0,0.1); border: 1px solid #DAA520; border-radius: 4px;">
                    <strong>Instructions:</strong><br>
                    1. Copy the base64 data above<br>
                    2. Share this data with others<br>
                    3. This plan is finalized and ready for execution
                </div>
                <div class="cap-button-container">
                    <button class="cap-button" id="cap-copy-export-direct">Copy to Clipboard</button>
                    <button class="cap-button" id="cap-export-close-direct">Close</button>
                </div>
            </div>
        `;

        Dialog.show('CoordinatedAttackPlanner', modal);

        // Bind events
        document.getElementById('cap-copy-export-direct').onclick = function() {
            const textarea = document.getElementById('cap-export-data-direct');
            textarea.select();
            textarea.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                this.textContent = 'Copied!';
                setTimeout(() => {
                    this.textContent = 'Copy to Clipboard';
                }, 2000);
            } catch (err) {
                alert('Copy failed. Please select and copy manually.');
            }
        };

        document.getElementById('cap-export-close-direct').onclick = function() {
            Dialog.close();
        };

        // Focus and select the textarea
        document.getElementById('cap-export-data-direct').focus();
        document.getElementById('cap-export-data-direct').select();
    };

    // Show import dialog
    const showImportDialog = () => {
        const content = `
            <div class="cap-content">
                <h2 class="cap-title">Import Plan</h2>
                
                <div style="margin-bottom: 15px; padding: 10px; background: rgba(255,215,0,0.1); border: 1px solid #DAA520; border-radius: 4px;">
                    <strong>Instructions:</strong><br>
                    1. Get the base64-encoded plan string from the plan creator<br>
                    2. Paste it in the text area below<br>
                    3. Click "Import Plan" to load the attacks<br>
                    4. Assign templates if needed, then execute!
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label for="cap-import-text" style="display: block; margin-bottom: 5px; font-weight: bold;">Plan Data:</label>
                    <textarea id="cap-import-text" rows="8" 
                        placeholder="Paste your base64-encoded plan string here..." 
                        style="width: 100%; font-family: monospace; font-size: 12px; padding: 8px; border: 1px solid #7D510F; border-radius: 4px; resize: vertical;"></textarea>
                </div>
                
                <div class="cap-button-container">
                    <button class="cap-button" id="cap-import-confirm">Import Plan</button>
                    <button class="cap-button" id="cap-import-cancel">Cancel</button>
                </div>
            </div>
        `;
        
        Dialog.show('CoordinatedAttackPlanner', content);
        
        // Bind events
        document.getElementById('cap-import-confirm').onclick = handleImportConfirm;
        document.getElementById('cap-import-cancel').onclick = () => Dialog.close();
        
        // Focus on textarea
        document.getElementById('cap-import-text').focus();
    };

    // Handle import confirmation
    const handleImportConfirm = () => {
        const planString = document.getElementById('cap-import-text').value.trim();
        
        if (!planString) {
            alert('Please enter a plan string.');
            return;
        }
        
        const importResult = window.CAP.State.importPlan(planString);
        
        if (!importResult.isValid) {
            alert(importResult.error);
            return;
        }
        
        Dialog.close();
        
        // Check if plan is ready for execution or needs template assignment
        if (window.CAP.State.isPlanReadyForExecution(importResult.planData)) {
            showExecutionScreen(importResult.planData);
        } else {
            showTemplateAssignmentScreen(importResult.planData);
        }
    };

    // Show template assignment screen
    const showTemplateAssignmentScreen = (planData) => {
        // Show loading state first
        const loadingContent = `
            <div class="cap-content">
                <h2 class="cap-title">Template Assignment</h2>
                <div style="text-align: center; margin: 40px 0;">
                    <div class="cap-spinner"></div>
                    <span class="cap-loading-indicator">Loading templates...</span>
                </div>
            </div>
        `;
        
        Dialog.show('CoordinatedAttackPlanner', loadingContent);
        
        // Fetch templates (this may be async)
        setTimeout(() => {
            const userTemplates = window.CAP.State.getUserTemplates();
            const attacksNeedingTemplates = window.CAP.State.getAttacksNeedingTemplates(planData);
            
            // Always show the template assignment interface, even if no templates are found
            // Users can still assign slowest units manually
            showTemplateAssignmentInterface(planData, userTemplates);
        }, 500); // Small delay to show loading state
    };
    
    // Show the actual template assignment interface
    const showTemplateAssignmentInterface = (planData, userTemplates) => {
        
        const content = `
            <div class="cap-content">
                <h2 class="cap-title">Template Assignment</h2>
                
                <div style="margin-bottom: 15px; text-align: center;">
                    <p><strong>Plan:</strong> ${planData.planName || 'Untitled Plan'}</p>
                    ${planData.description ? `<p><strong>Description:</strong> ${planData.description}</p>` : ''}
                </div>
                
                <div style="margin-bottom: 15px; padding: 10px; background: rgba(255,215,0,0.1); border: 1px solid #DAA520; border-radius: 4px;">
                    <strong>Attack Configuration:</strong><br>
                    • For each attack, choose either a <strong>Template</strong> OR a <strong>Slowest Unit</strong><br>
                    • Templates will use saved unit configurations from your account<br>
                    • Slowest Unit will calculate send times based on the specified unit type<br>
                    ${userTemplates.length === 0 ? 
                        '• <strong style="color: #d32f2f;">No templates found - use Slowest Unit option or create templates in Rally Point first</strong><br>' : ''
                    }
                    • All attacks must be configured before the plan can be finalized
                </div>
                
                <div style="margin: 20px 0; max-height: 400px; overflow-y: auto;">
                    <table class="vis" style="width: 100%; font-size: 12px;">
                        <thead>
                            <tr>
                                <th style="text-align: center; width: 40px;">#</th>
                                <th style="width: 120px;">From</th>
                                <th style="width: 120px;">To</th>
                                <th style="width: 140px;">Landing Time</th>
                                <th style="width: 120px;">Current Status</th>
                                <th style="width: 200px;">Template Selection</th>
                                <th style="width: 150px;">Slowest Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${planData.attacks.map((attack, index) => {
                                const isReady = window.CAP.State.isAttackReady(attack);
                                const hasTemplate = window.CAP.State.hasTemplateAssigned(attack);
                                const hasUnit = window.CAP.State.hasSlowestUnitAssigned(attack);
                                
                                let statusText = 'Needs Configuration';
                                let statusColor = 'red';
                                
                                if (hasTemplate) {
                                    statusText = `Template: ${attack.template}`;
                                    statusColor = 'green';
                                } else if (hasUnit) {
                                    statusText = `Unit: ${attack.slowestUnit}`;
                                    statusColor = 'blue';
                                }
                                
                                // Determine current selection for UI state
                                const currentTemplate = hasTemplate ? attack.template : '';
                                const currentUnit = hasUnit ? attack.slowestUnit : '';
                                
                                // Format village names with links - handle both full objects and coordinate strings
                                let fromVillageDisplay, toVillageDisplay;
                                
                                if (typeof attack.attackingVillage === 'object') {
                                    // Full village object with name
                                    const coords = attack.attackingVillage.coords;
                                    const name = attack.attackingVillage.name;
                                    const fullName = `${name} (${coords})`;
                                    fromVillageDisplay = `<a href="/game.php?screen=info_village&x=${coords.split('|')[0]}&y=${coords.split('|')[1]}" target="_blank" title="View village info" data-coords="${coords}">${fullName}</a>`;
                                } else {
                                    // Just coordinates - will be updated async
                                    const coords = attack.attackingVillage;
                                    fromVillageDisplay = `<a href="/game.php?screen=info_village&x=${coords.split('|')[0]}&y=${coords.split('|')[1]}" target="_blank" title="View village info" data-coords="${coords}">${coords}</a>`;
                                }
                                
                                if (typeof attack.targetVillage === 'object') {
                                    // Full village object with name and player
                                    const coords = attack.targetVillage.coords;
                                    const name = attack.targetVillage.name;
                                    const player = attack.targetVillage.player;
                                    const fullName = `${name} (${coords})`;
                                    const playerDisplay = player ? ` <span style="color: #666;">(${player})</span>` : '';
                                    toVillageDisplay = `<a href="/game.php?screen=info_village&x=${coords.split('|')[0]}&y=${coords.split('|')[1]}" target="_blank" title="View village info" data-coords="${coords}">${fullName}</a>${playerDisplay}`;
                                } else {
                                    // Just coordinates - will be updated async
                                    const coords = attack.targetVillage;
                                    toVillageDisplay = `<a href="/game.php?screen=info_village&x=${coords.split('|')[0]}&y=${coords.split('|')[1]}" target="_blank" title="View village info" data-coords="${coords}">${coords}</a>`;
                                }
                                
                                return `
                                    <tr>
                                        <td style="text-align: center;">${index + 1}</td>
                                        <td>${fromVillageDisplay}</td>
                                        <td>${toVillageDisplay}</td>
                                        <td>${formatDateTime(attack.arrivalTime)}</td>
                                        <td style="color: ${statusColor}; font-weight: bold; font-size: 11px;">${statusText}</td>
                                        <td>
                                            <select id="template-${index}" class="cap-template-select" 
                                                    style="width: 180px; font-size: 11px; ${userTemplates.length === 0 || hasUnit ? 'opacity: 0.5;' : ''}" 
                                                    onchange="handleTemplateUnitSelection(${index}, 'template', this.value)"
                                                    ${hasUnit || userTemplates.length === 0 ? 'disabled' : ''}>
                                                <option value="">Select Template...</option>
                                                ${userTemplates.length > 0 ? 
                                                    userTemplates.map(template => 
                                                        `<option value="${template.name}" ${currentTemplate === template.name ? 'selected' : ''}>${template.name}</option>`
                                                    ).join('') :
                                                    '<option value="" disabled>No templates found</option>'
                                                }
                                            </select>
                                            ${userTemplates.length === 0 ? 
                                                '<br><small style="color: #666; font-size: 10px;">Create templates in Rally Point</small>' : ''
                                            }
                                        </td>
                                        <td>
                                            <select id="slowest-unit-${index}" class="cap-unit-select" 
                                                    style="width: 130px; font-size: 11px; ${hasTemplate ? 'opacity: 0.5;' : ''}"
                                                    onchange="handleTemplateUnitSelection(${index}, 'unit', this.value)"
                                                    ${hasTemplate ? 'disabled' : ''}>
                                                <option value="">Select Unit...</option>
                                                <option value="spear" ${currentUnit === 'spear' ? 'selected' : ''}>Spear fighter</option>
                                                <option value="sword" ${currentUnit === 'sword' ? 'selected' : ''}>Swordsman</option>
                                                <option value="axe" ${currentUnit === 'axe' ? 'selected' : ''}>Axeman</option>
                                                <option value="archer" ${currentUnit === 'archer' ? 'selected' : ''}>Archer</option>
                                                <option value="spy" ${currentUnit === 'spy' ? 'selected' : ''}>Scout</option>
                                                <option value="light" ${currentUnit === 'light' ? 'selected' : ''}>Light cavalry</option>
                                                <option value="marcher" ${currentUnit === 'marcher' ? 'selected' : ''}>Mounted archer</option>
                                                <option value="heavy" ${currentUnit === 'heavy' ? 'selected' : ''}>Heavy cavalry</option>
                                                <option value="ram" ${currentUnit === 'ram' ? 'selected' : ''}>Ram</option>
                                                <option value="catapult" ${currentUnit === 'catapult' ? 'selected' : ''}>Catapult</option>
                                                <option value="knight" ${currentUnit === 'knight' ? 'selected' : ''}>Paladin</option>
                                                <option value="snob" ${currentUnit === 'snob' ? 'selected' : ''}>Nobleman</option>
                                            </select>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="cap-button-container">
                    <button class="cap-button" id="cap-finalize-plan">Finalize Plan</button>
                    <button class="cap-button" id="cap-template-cancel">Cancel</button>
                </div>
            </div>
        `;
        
        // Show as a modal dialog
        Dialog.show('CoordinatedAttackPlanner', content);
        
        // Update village links asynchronously with proper names
        setTimeout(() => {
            updateVillageLinksAsync();
        }, 100);
        
        // Add the selection handler function to global scope
        window.handleTemplateUnitSelection = function(attackIndex, type, value) {
            const templateSelect = document.getElementById(`template-${attackIndex}`);
            const unitSelect = document.getElementById(`slowest-unit-${attackIndex}`);
            
            if (type === 'template') {
                if (value) {
                    // Template selected, disable unit select and clear its value
                    unitSelect.disabled = true;
                    unitSelect.value = '';
                    unitSelect.style.opacity = '0.5';
                } else {
                    // Template cleared, enable unit select (unless no templates available)
                    unitSelect.disabled = false;
                    unitSelect.style.opacity = '1';
                }
            } else if (type === 'unit') {
                if (value) {
                    // Unit selected, disable template select and clear its value (if templates are available)
                    if (templateSelect.options.length > 1 && templateSelect.options[1].value !== '') {
                        templateSelect.disabled = true;
                        templateSelect.value = '';
                        templateSelect.style.opacity = '0.5';
                    }
                } else {
                    // Unit cleared, enable template select (if templates are available)
                    if (templateSelect.options.length > 1 && templateSelect.options[1].value !== '') {
                        templateSelect.disabled = false;
                        templateSelect.style.opacity = '1';
                    }
                }
            }
        };
        
        // Bind events
        document.getElementById('cap-finalize-plan').onclick = () => handleFinalizePlan(planData);
        document.getElementById('cap-template-cancel').onclick = () => {
            Dialog.close();
            showInitialScreen();
        };
    };

    // Handle plan finalization
    const handleFinalizePlan = (planData) => {
        // Collect template and unit assignments for attacks that need them
        const templateAssignments = [];
        const unitAssignments = [];
        let missingConfigurations = [];
        
        for (let i = 0; i < planData.attacks.length; i++) {
            const attack = planData.attacks[i];
            
            if (window.CAP.State.isAttackReady(attack)) {
                // Attack already ready, no assignment needed
                templateAssignments.push(null);
                unitAssignments.push(null);
            } else {
                // Get template and unit selections
                const templateSelect = document.getElementById(`template-${i}`);
                const unitSelect = document.getElementById(`slowest-unit-${i}`);
                
                const selectedTemplate = templateSelect ? templateSelect.value : '';
                const selectedUnit = unitSelect ? unitSelect.value : '';
                
                if (!selectedTemplate && !selectedUnit) {
                    missingConfigurations.push(i + 1);
                    templateAssignments.push('');
                    unitAssignments.push('');
                } else if (selectedTemplate) {
                    templateAssignments.push(selectedTemplate);
                    unitAssignments.push('');
                } else if (selectedUnit) {
                    templateAssignments.push('');
                    unitAssignments.push(selectedUnit);
                }
            }
        }
        
        // Check if any configurations are missing
        if (missingConfigurations.length > 0) {
            const attackText = missingConfigurations.length === 1 ? 'attack' : 'attacks';
            const attackList = missingConfigurations.length <= 3 ? 
                missingConfigurations.join(', ') : 
                `${missingConfigurations.slice(0, 3).join(', ')} and ${missingConfigurations.length - 3} more`;
            
            alert(`Please configure ${attackText} ${attackList} with either a template or slowest unit before finalizing the plan.`);
            return;
        }
        
        // Finalize the plan with both template and unit assignments
        const finalizeResult = window.CAP.State.finalizePlan(planData, templateAssignments, unitAssignments);
        
        if (!finalizeResult.isValid) {
            alert('Failed to finalize plan: ' + finalizeResult.error);
            return;
        }
        
        // Show finalized plan export dialog
        showFinalizedPlanDialog(finalizeResult.planData);
    };

    // Show finalized plan dialog
    const showFinalizedPlanDialog = (finalizedPlan) => {
        // Generate base64 export
        const exportResult = window.CAP.State.exportExistingPlan(finalizedPlan);
        if (!exportResult.isValid) {
            alert('Failed to export finalized plan: ' + exportResult.error);
            return;
        }
        
        const content = `
            <div class="cap-content">
                <h2 class="cap-title">Plan Finalized!</h2>
                <p style="text-align: center;">Your plan has been successfully finalized with template assignments.</p>
                
                <div style="margin: 20px 0;">
                    <p><strong>Plan Name:</strong> ${finalizedPlan.planName || 'Untitled'}</p>
                    <p><strong>Total Attacks:</strong> ${finalizedPlan.attacks.length}</p>
                    <p><strong>All attacks ready for execution:</strong> ✓</p>
                </div>
                
                <p>Save this finalized plan string to import later for execution:</p>
                <textarea id="cap-finalized-export" rows="8" readonly 
                    style="width: 100%; font-family: monospace; font-size: 12px; margin: 10px 0; padding: 8px; border: 1px solid #7D510F; border-radius: 4px;">${exportResult.base64}</textarea>
                
                <div class="cap-button-container">
                    <button class="cap-button" id="cap-copy-finalized">Copy to Clipboard</button>
                    <button class="cap-button" id="cap-execute-now">Execute Now</button>
                    <button class="cap-button" id="cap-finalized-close">Close</button>
                </div>
            </div>
        `;
        
        Dialog.show('CoordinatedAttackPlanner', content);
        
        // Bind events
        document.getElementById('cap-copy-finalized').onclick = () => {
            document.getElementById('cap-finalized-export').select();
            document.execCommand('copy');
            alert('Finalized plan copied to clipboard!');
        };
        
        document.getElementById('cap-execute-now').onclick = () => {
            Dialog.close();
            showExecutionScreen(finalizedPlan);
        };
        
        document.getElementById('cap-finalized-close').onclick = () => {
            Dialog.close();
            showInitialScreen();
        };
        
        // Select and focus on the text
        document.getElementById('cap-finalized-export').focus();
        document.getElementById('cap-finalized-export').select();
    };

    // Show execution screen for finalized plans
    const showExecutionScreen = (planData) => {
        // Sort attacks by send time (launch time)
        const sortedAttacks = [...planData.attacks].sort((a, b) => {
            const aReady = window.CAP.State.isAttackReady(a);
            const bReady = window.CAP.State.isAttackReady(b);
            
            if (!aReady && !bReady) return 0;
            if (!aReady) return 1;
            if (!bReady) return -1;
            
            try {
                // Extract coordinates for calculations
                const aAttackingCoords = typeof a.attackingVillage === 'object' ? 
                    a.attackingVillage.coords : a.attackingVillage;
                const aTargetCoords = typeof a.targetVillage === 'object' ? 
                    a.targetVillage.coords : a.targetVillage;
                const bAttackingCoords = typeof b.attackingVillage === 'object' ? 
                    b.attackingVillage.coords : b.attackingVillage;
                const bTargetCoords = typeof b.targetVillage === 'object' ? 
                    b.targetVillage.coords : b.targetVillage;
                
                const aSendTime = window.CAP.calculateSendTime(
                    a.arrivalTime, aAttackingCoords, aTargetCoords, a.slowestUnit || a.template
                );
                const bSendTime = window.CAP.calculateSendTime(
                    b.arrivalTime, bAttackingCoords, bTargetCoords, b.slowestUnit || b.template
                );
                return new Date(aSendTime) - new Date(bSendTime);
            } catch (error) {
                console.warn('Error sorting attacks by send time:', error);
                return 0;
            }
        });
        
        const content = `
            <div class="cap-execution-screen" style="padding: 20px;">
                <h2>Plan Execution</h2>
                <div style="margin-bottom: 20px;">
                    <p><strong>Plan:</strong> ${planData.planName || 'Untitled Plan'}</p>
                    ${planData.description ? `<p><strong>Description:</strong> ${planData.description}</p>` : ''}
                    <p><strong>Total Attacks:</strong> ${planData.attacks.length}</p>
                </div>
                
                <div class="cap-execution-controls" style="margin-bottom: 20px;">
                    <button class="cap-button" id="cap-edit-templates" style="margin-right: 10px;">Edit Templates</button>
                    <button class="cap-button" id="cap-export-execution" style="margin-right: 10px;">Export Plan</button>
                    <button class="cap-button" id="cap-execution-back">Back to Main</button>
                </div>
                
                <div id="cap-execution-table-container">
                    <table class="vis" style="width: 100%;">
                        <thead>
                            <tr>
                                <th style="width: 110px;">Launch Time</th>
                                <th style="width: 80px;">Countdown</th>
                                <th style="width: 180px;">From</th>
                                <th style="width: 180px;">To</th>
                                <th style="width: 80px;">Travel Time</th>
                                <th style="width: 140px;">Arrival Time</th>
                                <th style="width: 120px;">Template</th>
                                <th style="width: 150px;">Notes</th>
                                <th style="width: 100px;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="cap-execution-tbody">
                            ${sortedAttacks.map(attack => {
                                const isReady = window.CAP.State.isAttackReady(attack);
                                const hasTemplate = window.CAP.State.hasTemplateAssigned(attack);
                                const hasUnit = window.CAP.State.hasSlowestUnitAssigned(attack);
                                
                                let templateDisplay = 'Not Set';
                                if (hasTemplate) {
                                    templateDisplay = attack.template;
                                } else if (hasUnit) {
                                    templateDisplay = `Manual (${attack.slowestUnit})`;
                                }
                                
                                // Calculate send time dynamically if attack is ready
                                let sendTimeDisplay = 'Not calculated';
                                let sendTimeTarget = '';
                                let travelTimeDisplay = '--';
                                
                                if (isReady) {
                                    try {
                                        // Extract coordinates for calculations
                                        const attackingCoords = typeof attack.attackingVillage === 'object' ? 
                                            attack.attackingVillage.coords : attack.attackingVillage;
                                        const targetCoords = typeof attack.targetVillage === 'object' ? 
                                            attack.targetVillage.coords : attack.targetVillage;
                                        
                                        const sendTime = window.CAP.calculateSendTime(
                                            attack.arrivalTime, 
                                            attackingCoords, 
                                            targetCoords, 
                                            attack.slowestUnit || attack.template
                                        );
                                        sendTimeDisplay = formatDateTime(sendTime);
                                        sendTimeTarget = sendTime;
                                        
                                        // Calculate travel time
                                        const travelTimeMinutes = window.CAP.calculateTravelTime(
                                            attackingCoords, 
                                            targetCoords, 
                                            attack.slowestUnit || attack.template
                                        );
                                        travelTimeDisplay = window.CAP.formatTravelTime(travelTimeMinutes);
                                    } catch (error) {
                                        sendTimeDisplay = 'Calculation Error';
                                        console.error('Error calculating send time for display:', error);
                                    }
                                }
                                
                                // Format village names with links - handle both full objects and coordinate strings
                                // We'll use placeholders initially and update them asynchronously
                                let fromVillageDisplay, toVillageDisplay;
                                
                                if (typeof attack.attackingVillage === 'object') {
                                    // Full village object with name
                                    const coords = attack.attackingVillage.coords;
                                    const name = attack.attackingVillage.name;
                                    const fullName = `${name} (${coords})`;
                                    fromVillageDisplay = `<a href="/game.php?screen=info_village&x=${coords.split('|')[0]}&y=${coords.split('|')[1]}" target="_blank" title="View village info" data-coords="${coords}" data-attack-id="${attack.id}" data-type="from">${fullName}</a>`;
                                } else {
                                    // Just coordinates - will be updated async
                                    const coords = attack.attackingVillage;
                                    fromVillageDisplay = `<a href="/game.php?screen=info_village&x=${coords.split('|')[0]}&y=${coords.split('|')[1]}" target="_blank" title="View village info" data-coords="${coords}" data-attack-id="${attack.id}" data-type="from">${coords}</a>`;
                                }
                                
                                if (typeof attack.targetVillage === 'object') {
                                    // Full village object with name and player
                                    const coords = attack.targetVillage.coords;
                                    const name = attack.targetVillage.name;
                                    const player = attack.targetVillage.player;
                                    const fullName = `${name} (${coords})`;
                                    const playerDisplay = player ? ` <span style="color: #666;">(${player})</span>` : '';
                                    toVillageDisplay = `<a href="/game.php?screen=info_village&x=${coords.split('|')[0]}&y=${coords.split('|')[1]}" target="_blank" title="View village info" data-coords="${coords}" data-attack-id="${attack.id}" data-type="to">${fullName}</a>${playerDisplay}`;
                                } else {
                                    // Just coordinates - will be updated async
                                    const coords = attack.targetVillage;
                                    toVillageDisplay = `<a href="/game.php?screen=info_village&x=${coords.split('|')[0]}&y=${coords.split('|')[1]}" target="_blank" title="View village info" data-coords="${coords}" data-attack-id="${attack.id}" data-type="to">${coords}</a>`;
                                }
                                
                                return `
                                    <tr data-attack-id="${attack.id}" class="cap-attack-row">
                                        <td style="font-size: 11px;">${sendTimeDisplay}</td>
                                        <td class="cap-countdown" data-target="${sendTimeTarget}" style="font-weight: bold; font-family: monospace; font-size: 11px;">--:--:--</td>
                                        <td style="font-size: 11px;">${fromVillageDisplay}</td>
                                        <td style="font-size: 11px;">${toVillageDisplay}</td>
                                        <td style="font-size: 11px; text-align: center;">${travelTimeDisplay}</td>
                                        <td style="font-size: 11px;">${formatDateTime(attack.arrivalTime)}</td>
                                        <td style="font-size: 11px;">${templateDisplay}</td>
                                        <td style="font-size: 11px;">${attack.notes || ''}</td>
                                        <td>
                                            ${isReady && sendTimeTarget ? 
                                                (hasTemplate ? 
                                                    `<button class="cap-button cap-launch-btn" 
                                                            data-attack-id="${attack.id}"
                                                            data-from="${attack.attackingVillage}"
                                                            data-to="${attack.targetVillage}"
                                                            data-template="${attack.template || ''}"
                                                            style="background-color: #4CAF50; font-size: 10px; padding: 3px 6px;">
                                                        Launch
                                                    </button>` :
                                                    `<button class="cap-button cap-configure-btn" 
                                                            data-attack-id="${attack.id}"
                                                            data-from="${attack.attackingVillage}"
                                                            data-to="${attack.targetVillage}"
                                                            data-template="${attack.template || ''}"
                                                            style="background-color: #D2B48C; font-size: 10px; padding: 3px 6px;">
                                                        Configure
                                                    </button>`
                                                ) :
                                                `<button class="cap-button" disabled style="background-color: #ccc; font-size: 10px; padding: 3px 6px;">Not Ready</button>`
                                            }
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        showFullScreenContent(content);
        
        // Bind events
        document.getElementById('cap-edit-templates').onclick = () => showTemplateAssignmentScreen(planData);
        document.getElementById('cap-export-execution').onclick = () => {
            // Export the current finalized plan
            const exportResult = window.CAP.State.exportExistingPlan(planData);
            if (exportResult.isValid) {
                showDirectExportModal(exportResult.base64, planData.planName, planData.attacks.length);
            } else {
                alert('Failed to export plan: ' + exportResult.error);
            }
        };
        document.getElementById('cap-execution-back').onclick = showInitialScreen;
        
        // Bind launch and configure buttons
        document.querySelectorAll('.cap-launch-btn').forEach(button => {
            button.onclick = () => handleLaunchAttack(button);
        });
        document.querySelectorAll('.cap-configure-btn').forEach(button => {
            button.onclick = () => handleConfigureAttack(button);
        });
        
        // Start countdown timers
        startCountdowns();
        
        // Async village link updates after the countdown timers start
        updateVillageLinksAsync();
    };

    // Update village links asynchronously with proper IDs and full names
    const updateVillageLinksAsync = async () => {
        // Find all village links that need updating (both with and without attack-id)
        const villageLinks = document.querySelectorAll('a[data-coords]');
        
        // Process links in small batches to avoid overwhelming the API
        const batchSize = 5;
        const delay = 200; // 200ms delay between batches
        
        for (let i = 0; i < villageLinks.length; i += batchSize) {
            const batch = Array.from(villageLinks).slice(i, i + batchSize);
            
            // Process this batch in parallel
            await Promise.all(batch.map(async (link) => {
                try {
                    const coords = link.getAttribute('data-coords');
                    const attackId = link.getAttribute('data-attack-id');
                    const type = link.getAttribute('data-type'); // 'from' or 'to'
                    
                    // Skip if already has a proper name (not just coordinates)
                    if (link.textContent !== coords) {
                        return;
                    }
                    
                    // Get full village info
                    const villageInfo = await window.CAP.getVillageFullInfo(coords);
                    
                    if (villageInfo.found) {
                        // Update the link with proper URL and name
                        link.href = villageInfo.linkUrl;
                        link.textContent = villageInfo.fullName;
                        link.title = `View village info - ${villageInfo.fullName}`;
                        
                        // If this is a target village and we have player info, add player name
                        // Check for either explicit type attribute or if this looks like a target village
                        const isTargetVillage = type === 'to' || (!type && link.parentElement.cellIndex === 2); // Assuming target is 3rd column (index 2)
                        if (isTargetVillage && villageInfo.playerName) {
                            const playerSpan = document.createElement('span');
                            playerSpan.style.color = '#666';
                            playerSpan.textContent = ` (${villageInfo.playerName})`;
                            link.parentNode.insertBefore(playerSpan, link.nextSibling);
                        }
                    }
                } catch (error) {
                    // Silently ignore errors for individual villages
                    console.warn('Error updating village link:', error);
                }
            }));
            
            // Add delay between batches if there are more to process
            if (i + batchSize < villageLinks.length) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    // Handle launching an attack (with template)
    const handleLaunchAttack = (button) => {
        const attackId = button.getAttribute('data-attack-id');
        const fromCoords = button.getAttribute('data-from');
        const toCoords = button.getAttribute('data-to');
        const template = button.getAttribute('data-template');
        
        // Provide immediate visual feedback
        const originalText = button.textContent;
        button.textContent = 'Looking up...';
        button.disabled = true;
        
        // Look up the village ID for the attacking village
        lookupVillageId(fromCoords)
            .then(villageId => {
                if (villageId) {
                    // Construct the attack URL with the specific village rally point
                    const [x, y] = toCoords.split('|');
                    let attackUrl = `/game.php?village=${villageId}&screen=place&x=${x}&y=${y}`;
                    
                    if (template && template !== '') {
                        attackUrl += `&template_id=${template}`;
                    }
                    
                    // Open in new window/tab
                    window.open(attackUrl, '_blank');
                } else {
                    // Fallback to the old method if village lookup fails
                    const [x, y] = toCoords.split('|');
                    let attackUrl = `/game.php?screen=place&x=${x}&y=${y}`;
                    
                    if (template && template !== '') {
                        attackUrl += `&template_id=${template}`;
                    }
                    
                    window.open(attackUrl, '_blank');
                    console.warn(`Could not find village ID for coordinates ${fromCoords}, using fallback method`);
                }
                
                // Mark attack as launched (visual feedback)
                button.textContent = 'Launched';
                button.style.backgroundColor = '#666';
                
                // Add launched class to row
                const row = button.closest('.cap-attack-row');
                if (row) {
                    row.style.backgroundColor = '#f0f0f0';
                }
            })
            .catch(error => {
                console.error('Error looking up village ID for launch:', error);
                
                // Fallback to the old method
                const [x, y] = toCoords.split('|');
                let attackUrl = `/game.php?screen=place&x=${x}&y=${y}`;
                
                if (template && template !== '') {
                    attackUrl += `&template_id=${template}`;
                }
                
                window.open(attackUrl, '_blank');
                
                // Mark attack as launched with error indication
                button.textContent = 'Launched (Error)';
                button.style.backgroundColor = '#666';
                
                // Add launched class to row
                const row = button.closest('.cap-attack-row');
                if (row) {
                    row.style.backgroundColor = '#f0f0f0';
                }
            });
    };

    // Handle configuring an attack (manual/slowest unit)
    const handleConfigureAttack = (button) => {
        const attackId = button.getAttribute('data-attack-id');
        const fromCoords = button.getAttribute('data-from');
        const toCoords = button.getAttribute('data-to');
        
        // Provide immediate visual feedback
        const originalText = button.textContent;
        const originalColor = button.style.backgroundColor;
        button.textContent = 'Looking up...';
        button.style.backgroundColor = '#B8860B'; // Darker tan
        button.disabled = true;
        
        // Look up the village ID for the attacking village
        lookupVillageId(fromCoords)
            .then(villageId => {
                if (villageId) {
                    // Construct the attack URL with the specific village rally point
                    const [x, y] = toCoords.split('|');
                    const attackUrl = `/game.php?village=${villageId}&screen=place&x=${x}&y=${y}`;
                    
                    // Open in new window/tab
                    window.open(attackUrl, '_blank');
                    
                    // Update button to show success
                    button.textContent = 'Opened';
                } else {
                    // Fallback to the old method if village lookup fails
                    const [x, y] = toCoords.split('|');
                    const attackUrl = `/game.php?screen=place&x=${x}&y=${y}`;
                    window.open(attackUrl, '_blank');
                    
                    button.textContent = 'Opened (Fallback)';
                    console.warn(`Could not find village ID for coordinates ${fromCoords}, using fallback method`);
                }
            })
            .catch(error => {
                console.error('Error looking up village ID:', error);
                
                // Fallback to the old method
                const [x, y] = toCoords.split('|');
                const attackUrl = `/game.php?screen=place&x=${x}&y=${y}`;
                window.open(attackUrl, '_blank');
                
                button.textContent = 'Opened (Error)';
            })
            .finally(() => {
                // Reset the button after 2 seconds
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = originalColor || '#D2B48C';
                    button.disabled = false;
                }, 2000);
            });
    };

    // Helper function to look up village ID from coordinates
    const lookupVillageId = (coords) => {
        return new Promise((resolve, reject) => {
            // Use the current village ID for the API request (this is just for authentication/context)
            const currentVillageId = game_data.village.id;
            
            // Encode the coordinates for the URL (e.g., "500|500" becomes "500%7C500")
            const encodedCoords = encodeURIComponent(coords);
            
            // Construct the API URL based on the pattern you provided
            const apiUrl = `/game.php?village=${currentVillageId}&screen=api&ajax=target_selection&input=${encodedCoords}&type=coord&request_id=${Date.now()}&limit=8&offset=0`;
            
            // Make the request
            $.get(apiUrl)
                .done(function(response) {
                    try {
                        // The response should be JSON with village information
                        let data;
                        if (typeof response === 'string') {
                            data = JSON.parse(response);
                        } else {
                            data = response;
                        }
                        
                        // Look for a village at the exact coordinates
                        if (data && data.villages && Array.isArray(data.villages)) {
                            const village = data.villages.find(v => 
                                v.x && v.y && `${v.x}|${v.y}` === coords
                            );
                            
                            if (village && village.id) {
                                resolve(village.id);
                            } else {
                                console.warn(`No village found at coordinates ${coords} in API response`);
                                resolve(null);
                            }
                        } else {
                            console.warn('Unexpected API response format:', data);
                            resolve(null);
                        }
                    } catch (error) {
                        console.error('Error parsing village lookup response:', error);
                        reject(error);
                    }
                })
                .fail(function(xhr, status, error) {
                    console.error('Village lookup API request failed:', error);
                    reject(new Error(`API request failed: ${status} - ${error}`));
                });
        });
    };

    // Start countdown timers
    const startCountdowns = () => {
        // Clear any existing timer
        if (window.capCountdownTimer) {
            clearInterval(window.capCountdownTimer);
        }
        
        window.capCountdownTimer = setInterval(() => {
            document.querySelectorAll('.cap-countdown').forEach(element => {
                const targetTime = element.getAttribute('data-target');
                if (!targetTime) {
                    element.textContent = '--:--:--';
                    return;
                }
                
                const target = new Date(targetTime);
                let now;
                
                try {
                    now = window.CAP.getCurrentServerTime();
                } catch (error) {
                    // If we can't get server time, show error in countdown
                    element.textContent = 'TIME ERROR!';
                    element.style.color = 'red';
                    element.style.fontWeight = 'bold';
                    return;
                }
                
                const diff = target - now;
                
                if (diff <= 0) {
                    element.textContent = 'LAUNCH NOW!';
                    element.style.color = 'red';
                    element.style.fontWeight = 'bold';
                    
                    // Flash the row
                    const row = element.closest('.cap-attack-row');
                    if (row && !row.classList.contains('cap-flash')) {
                        row.classList.add('cap-flash');
                        row.style.backgroundColor = '#ffcccc';
                    }
                } else {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    
                    element.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    element.style.color = diff < 5 * 60 * 1000 ? 'orange' : 'black'; // Orange if less than 5 minutes
                    
                    // Remove flash if time is not up
                    const row = element.closest('.cap-attack-row');
                    if (row && row.classList.contains('cap-flash')) {
                        row.classList.remove('cap-flash');
                        row.style.backgroundColor = '';
                    }
                }
            });
        }, 1000);
    };

    // Format date/time for display
    const formatDateTime = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    // Show initial screen helper
    const showInitialScreen = () => {
        // Clear any running timers
        if (window.capCountdownTimer) {
            clearInterval(window.capCountdownTimer);
        }
        
        // Reset to initial screen
        window.location.reload();
    };

    // Show full screen content helper
    const showFullScreenContent = (content) => {
        // Hide any existing content
        const container = document.getElementById('contentContainer');
        if (container) {
            container.style.display = 'none';
        }
        
        // Create or update full screen container
        let fullScreenContainer = document.getElementById('cap-fullscreen-container');
        if (!fullScreenContainer) {
            fullScreenContainer = document.createElement('div');
            fullScreenContainer.id = 'cap-fullscreen-container';
            fullScreenContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: white;
                z-index: 10000;
                overflow: auto;
                padding: 20px;
                box-sizing: border-box;
            `;
            document.body.appendChild(fullScreenContainer);
        }
        
        fullScreenContainer.innerHTML = content;
        fullScreenContainer.style.display = 'block';
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
        updateAttackTable,
        showExportPlanModal,
        
        // Import and execution functions
        showImportDialog,
        showTemplateAssignmentScreen,
        showExecutionScreen,
        showInitialScreen,
        formatDateTime,
        showDirectExportModal
    };
})();

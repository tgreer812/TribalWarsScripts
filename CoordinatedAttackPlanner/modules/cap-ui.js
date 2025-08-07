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

    // Generic function to render items with remove functionality
    const renderItemsWithRemove = (containerId, items, removeCallback, emptyMessage = 'No items selected') => {
        const container = document.getElementById(containerId);
        
        if (!items || items.size === 0) {
            container.innerHTML = `<div style="color: #666; font-style: italic;">${emptyMessage}</div>`;
            return;
        }

        let html = '';
        items.forEach(item => {
            html += `
                <span class="cap-target-item">
                    ${item}
                    <span class="remove" onclick="${removeCallback}('${item}')" style="color: red; cursor: pointer; margin-left: 5px; font-weight: bold;">&times;</span>
                </span>
            `;
        });
        
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
        renderItemsWithRemove('cap-target-villages', targetVillages, 'window.CAP.removeTargetVillage', 'No target villages selected');
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
                <button class="cap-button" onclick="window.CAP.addTribeMembers()">Add Tribe</button>
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

    return {
        createModal,
        showPlanDesignPage,
        updateTargetPlayersDisplay,
        updateTargetVillagesDisplay,
        updateTargetPlayerDropdown,
        updateTargetVillageDropdown,
        updateAttackingVillagesDisplay,
        showAddTribeDialog,
        toggleSectionStates
    };
})();

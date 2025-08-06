// Coordinated Attack Planner - Merged Build
// Generated on: 2025-08-05 22:40:13
// This file is auto-generated. Do not edit directly.

// ==================================================
// MODULE: CoordinatedAttackPlanner\modules\cap-state.js
// ==================================================

// CAP State Management Module
// Handles all application state and data structures

window.CAP = window.CAP || {};

window.CAP.State = (function() {
    // Application state
    let targetPlayers = new Set(); // Store selected target player names
    let targetVillages = new Set(); // Store selected target villages
    let attackingVillages = new Set(); // Store selected attacking villages
    let attacks = []; // Store configured attacks
    let currentPlan = null; // Current plan being worked on

    // Getters
    const getTargetPlayers = () => targetPlayers;
    const getTargetVillages = () => targetVillages;
    const getAttackingVillages = () => attackingVillages;
    const getAttacks = () => attacks;
    const getCurrentPlan = () => currentPlan;

    // Setters
    const setTargetPlayers = (players) => { targetPlayers = new Set(players); };
    const setTargetVillages = (villages) => { targetVillages = new Set(villages); };
    const setAttackingVillages = (villages) => { attackingVillages = new Set(villages); };
    const setAttacks = (newAttacks) => { attacks = [...newAttacks]; };
    const setCurrentPlan = (plan) => { currentPlan = plan; };

    // Utility functions
    const addTargetPlayer = (playerName) => {
        targetPlayers.add(playerName);
    };

    const removeTargetPlayer = (playerName) => {
        targetPlayers.delete(playerName);
    };

    const clearAll = () => {
        targetPlayers.clear();
        targetVillages.clear();
        attackingVillages.clear();
        attacks.length = 0;
        currentPlan = null;
    };

    // Recent targets management
    const getRecentTargets = () => {
        const stored = localStorage.getItem('cap-recent-targets');
        return stored ? JSON.parse(stored) : [];
    };

    const addToRecentTargets = (playerName) => {
        let recent = getRecentTargets();
        
        // Remove if already exists
        recent = recent.filter(name => name !== playerName);
        
        // Add to front
        recent.unshift(playerName);
        
        // Keep only last 10
        recent = recent.slice(0, 10);
        
        localStorage.setItem('cap-recent-targets', JSON.stringify(recent));
    };

    return {
        // Getters
        getTargetPlayers,
        getTargetVillages,
        getAttackingVillages,
        getAttacks,
        getCurrentPlan,
        
        // Setters
        setTargetPlayers,
        setTargetVillages,
        setAttackingVillages,
        setAttacks,
        setCurrentPlan,
        
        // Utilities
        addTargetPlayer,
        removeTargetPlayer,
        clearAll,
        getRecentTargets,
        addToRecentTargets
    };
})();

// ==================================================
// MODULE: CoordinatedAttackPlanner\modules\cap-validation.js
// ==================================================

// CAP Validation Module
// Handles player and tribe validation logic

window.CAP = window.CAP || {};

window.CAP.Validation = (function() {
    
    // Validate that a player exists
    const validatePlayer = (playerName) => {
        return new Promise((resolve, reject) => {
            // Use the ranking system to check if player exists
            $.get('/game.php?village=' + game_data.village.id + '&screen=ranking&mode=player&name=' + encodeURIComponent(playerName))
                .done(function(html) {
                    const $html = $(html);
                    const $table = $html.find('#player_ranking_table');
                    
                    if ($table.length === 0) {
                        reject(`Player "${playerName}" not found`);
                        return;
                    }

                    // Check if any row contains the exact player name
                    let playerFound = false;
                    $table.find('tr').each(function() {
                        const $nameCell = $(this).find('td:nth-child(2)');
                        if ($nameCell.length > 0) {
                            const foundName = $nameCell.text().trim();
                            if (foundName.toLowerCase() === playerName.toLowerCase()) {
                                playerFound = true;
                                return false; // break
                            }
                        }
                    });

                    if (playerFound) {
                        resolve();
                    } else {
                        reject(`Player "${playerName}" not found`);
                    }
                })
                .fail(function() {
                    reject(`Failed to verify player "${playerName}". Please check the name and try again.`);
                });
        });
    };

    // Validate that a tribe exists and get its members
    const validateTribe = (tribeTag) => {
        return new Promise((resolve, reject) => {
            // First check if tribe exists
            $.get('/game.php?village=' + game_data.village.id + '&screen=ranking&mode=ally&name=' + encodeURIComponent(tribeTag))
                .done(function(html) {
                    const $html = $(html);
                    const $table = $html.find('#ally_ranking_table');
                    
                    if ($table.length === 0) {
                        reject(`Tribe "${tribeTag}" not found`);
                        return;
                    }

                    // Check if any row contains the exact tribe tag
                    let tribeFound = false;
                    let tribeId = null;
                    
                    $table.find('tr').each(function() {
                        const $nameCell = $(this).find('td:nth-child(2)');
                        if ($nameCell.length > 0) {
                            const foundTag = $nameCell.text().trim();
                            if (foundTag.toLowerCase() === tribeTag.toLowerCase()) {
                                tribeFound = true;
                                // Try to extract tribe ID from any links in the row
                                const $link = $(this).find('a[href*="info_ally"]').first();
                                if ($link.length > 0) {
                                    const href = $link.attr('href');
                                    const match = href.match(/id=(\d+)/);
                                    if (match) {
                                        tribeId = match[1];
                                    }
                                }
                                return false; // break
                            }
                        }
                    });

                    if (!tribeFound) {
                        reject(`Tribe "${tribeTag}" not found`);
                        return;
                    }

                    // If we have tribe ID, get members, otherwise use fallback
                    if (tribeId) {
                        getTribeMembers(tribeId, tribeTag).then(resolve).catch(reject);
                    } else {
                        // Fallback: try to get members by searching player rankings
                        getTribeMembersBySearch(tribeTag).then(resolve).catch(reject);
                    }
                })
                .fail(function() {
                    reject(`Failed to verify tribe "${tribeTag}". Please check the tag and try again.`);
                });
        });
    };

    // Get tribe members by tribe ID
    const getTribeMembers = (tribeId, tribeTag) => {
        return new Promise((resolve, reject) => {
            $.get('/game.php?village=' + game_data.village.id + '&screen=info_ally&id=' + tribeId)
                .done(function(html) {
                    const $html = $(html);
                    const members = [];
                    
                    // Look for member list in the tribe info page
                    $html.find('table').each(function() {
                        const $table = $(this);
                        // Find table with player names (look for links to player profiles)
                        $table.find('a[href*="info_player"]').each(function() {
                            const playerName = $(this).text().trim();
                            if (playerName && !members.includes(playerName)) {
                                members.push(playerName);
                            }
                        });
                    });

                    if (members.length === 0) {
                        reject(`No members found for tribe "${tribeTag}"`);
                    } else {
                        resolve(members);
                    }
                })
                .fail(function() {
                    reject(`Failed to load members for tribe "${tribeTag}"`);
                });
        });
    };

    // Fallback method to get tribe members by searching player rankings
    const getTribeMembersBySearch = (tribeTag) => {
        return new Promise((resolve, reject) => {
            // This is a more limited approach - we'll search the current world's player rankings
            // and filter by tribe. This may not get all members if the tribe is large.
            $.get('/game.php?village=' + game_data.village.id + '&screen=ranking&mode=player')
                .done(function(html) {
                    const $html = $(html);
                    const members = [];
                    
                    // Look through player ranking table for tribe members
                    $html.find('#player_ranking_table tr').each(function() {
                        const $row = $(this);
                        const $tribeCell = $row.find('td:nth-child(4)'); // Tribe column is usually 4th
                        const $nameCell = $row.find('td:nth-child(2)'); // Name column is usually 2nd
                        
                        if ($tribeCell.length > 0 && $nameCell.length > 0) {
                            const tribeName = $tribeCell.text().trim();
                            const playerName = $nameCell.text().trim();
                            
                            if (tribeName.toLowerCase() === tribeTag.toLowerCase() && playerName) {
                                members.push(playerName);
                            }
                        }
                    });

                    if (members.length === 0) {
                        reject(`No members found for tribe "${tribeTag}" (limited search)`);
                    } else {
                        resolve(members);
                    }
                })
                .fail(function() {
                    reject(`Failed to search for tribe "${tribeTag}" members`);
                });
        });
    };

    return {
        validatePlayer,
        validateTribe
    };
})();

// ==================================================
// MODULE: CoordinatedAttackPlanner\modules\cap-ui.js
// ==================================================

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
                    color: #red;
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
            </style>
        `;

        const html = `
            ${styles}
            <div class="cap-content">
                <h2 class="cap-title">Create Attack Plan</h2>
                
                <!-- Target Player Selection -->
                <div class="cap-section">
                    <h3>1. Select Target Players</h3>
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

                <!-- Attacking Villages -->
                <div class="cap-section">
                    <h3>2. Select Attacking Villages</h3>
                    <div class="cap-form-group">
                        <button class="cap-button" id="cap-select-all-attackers">Select All</button>
                        <button class="cap-button" id="cap-clear-attackers">Clear All</button>
                    </div>
                    <div class="cap-village-list" id="cap-attacker-villages">
                        Loading villages...
                    </div>
                </div>

                <!-- Target Villages -->
                <div class="cap-section">
                    <h3>3. Select Target Villages</h3>
                    <div class="cap-form-group">
                        <label>Add by Coords:</label>
                        <div class="cap-input-with-buttons">
                            <input type="text" id="cap-target-coords" placeholder="XXX|YYY,XXX|YYY">
                            <button class="cap-button cap-button-small" id="cap-add-coords">Add</button>
                        </div>
                    </div>
                    <div class="cap-form-group">
                        <label>From Players:</label>
                        <button class="cap-button cap-button-small" id="cap-add-all-villages">Add All Villages</button>
                        <span style="color: #666; font-size: 11px; margin-left: 10px;">Adds all villages from selected target players</span>
                    </div>
                    <div class="cap-village-list" id="cap-target-villages">
                        No targets selected
                    </div>
                </div>

                <!-- Attack Configuration -->
                <div class="cap-section">
                    <h3>4. Configure Attacks</h3>
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
                    <button class="cap-button" id="cap-preview">Preview Plan</button>
                    <button class="cap-button" id="cap-export">Export Plan</button>
                </div>
            </div>
        `;

        Dialog.show('CoordinatedAttackPlanner', html);
    };

    // Update the target players display
    const updateTargetPlayersDisplay = () => {
        const container = document.getElementById('cap-target-players');
        const targetPlayers = window.CAP.State.getTargetPlayers();
        
        if (targetPlayers.size === 0) {
            container.innerHTML = '<div style="color: #666; font-style: italic;">No target players selected</div>';
            return;
        }

        let html = '';
        targetPlayers.forEach(playerName => {
            html += `
                <span class="cap-target-item">
                    ${playerName}
                    <span class="remove" onclick="window.CAP.removeTargetPlayer('${playerName}')" style="color: red; cursor: pointer; margin-left: 5px; font-weight: bold;">&times;</span>
                </span>
            `;
        });
        
        container.innerHTML = html;
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

    return {
        createModal,
        showPlanDesignPage,
        updateTargetPlayersDisplay,
        showAddTribeDialog
    };
})();

// ==================================================
// MAIN FILE
// ==================================================

(function() {
    // Global namespace for the application
    window.CAP = window.CAP || {};

    // Main application controller
    window.CAP.Main = (function() {

        // Add a target player by name
        const addTargetPlayer = () => {
            const input = document.getElementById('cap-player-input');
            const playerName = input.value.trim();
            
            if (!playerName) {
                UI.ErrorMessage('Please enter a player name');
                return;
            }

            if (window.CAP.State.getTargetPlayers().has(playerName)) {
                UI.ErrorMessage('Player already added');
                return;
            }

            // Show loading indicator
            input.disabled = true;
            document.getElementById('cap-add-player').disabled = true;
            document.getElementById('cap-add-player').textContent = 'Checking...';

            // Validate player exists
            window.CAP.Validation.validatePlayer(playerName)
                .then(() => {
                    // Add to our state
                    window.CAP.State.addTargetPlayer(playerName);
                    
                    // Clear input
                    input.value = '';
                    
                    // Update display
                    window.CAP.UI.updateTargetPlayersDisplay();
                    
                    // Store in recent targets
                    window.CAP.State.addToRecentTargets(playerName);
                    
                    UI.SuccessMessage(`Player "${playerName}" added successfully`);
                })
                .catch(error => {
                    UI.ErrorMessage(error);
                })
                .finally(() => {
                    // Re-enable controls
                    input.disabled = false;
                    document.getElementById('cap-add-player').disabled = false;
                    document.getElementById('cap-add-player').textContent = 'Add';
                });
        };

        // Add tribe members with validation
        const addTribeMembers = () => {
            const tribeTag = document.getElementById('tribe-input').value.trim();
            
            if (!tribeTag) {
                UI.ErrorMessage('Please enter a tribe tag');
                return;
            }

            // Disable inputs while checking
            document.getElementById('tribe-input').disabled = true;
            const addBtn = document.querySelector('#AddTribe .cap-button:first-of-type');
            addBtn.disabled = true;
            addBtn.textContent = 'Checking...';

            window.CAP.Validation.validateTribe(tribeTag)
                .then(members => {
                    Dialog.close();
                    
                    let addedCount = 0;
                    members.forEach(playerName => {
                        if (!window.CAP.State.getTargetPlayers().has(playerName)) {
                            window.CAP.State.addTargetPlayer(playerName);
                            window.CAP.State.addToRecentTargets(playerName);
                            addedCount++;
                        }
                    });
                    
                    window.CAP.UI.updateTargetPlayersDisplay();
                    UI.SuccessMessage(`Added ${addedCount} players from tribe ${tribeTag}`);
                })
                .catch(error => {
                    UI.ErrorMessage(error);
                    // Re-enable inputs on error
                    document.getElementById('tribe-input').disabled = false;
                    addBtn.disabled = false;
                    addBtn.textContent = 'Add Tribe';
                });
        };

        // Remove a target player
        const removeTargetPlayer = (playerName) => {
            window.CAP.State.removeTargetPlayer(playerName);
            window.CAP.UI.updateTargetPlayersDisplay();
        };

        // Load player data (placeholder)
        const loadPlayerData = () => {
            // Placeholder implementation
            console.log('Loading player data...');
        };

        // Bind events for plan design page
        const bindPlanDesignEvents = () => {
            // Back button
            document.getElementById('cap-back').onclick = function() {
                Dialog.close();
                window.CAP.UI.createModal();
                bindInitialEvents();
            };

            // Player input - Enter key support
            document.getElementById('cap-player-input').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addTargetPlayer();
                }
            });

            // Add player button
            document.getElementById('cap-add-player').onclick = addTargetPlayer;

            // Add tribe button
            document.getElementById('cap-add-tribe').onclick = function() {
                window.CAP.UI.showAddTribeDialog();
            };

            // Placeholder event handlers for other buttons
            document.getElementById('cap-select-all-attackers').onclick = function() {
                alert('Select all attackers - not implemented');
            };

            document.getElementById('cap-clear-attackers').onclick = function() {
                alert('Clear attackers - not implemented');
            };

            document.getElementById('cap-add-coords').onclick = function() {
                alert('Add coordinates - not implemented');
            };

            document.getElementById('cap-add-all-villages').onclick = function() {
                const targetPlayers = window.CAP.State.getTargetPlayers();
                if (targetPlayers.size === 0) {
                    alert('Please select target players first');
                    return;
                }
                alert('Add all villages from selected players - not implemented');
            };

            document.getElementById('cap-add-attack').onclick = function() {
                alert('Add attack - not implemented');
            };

            document.getElementById('cap-mass-add').onclick = function() {
                alert('Mass add - not implemented');
            };

            document.getElementById('cap-clear-attacks').onclick = function() {
                alert('Clear attacks - not implemented');
            };

            document.getElementById('cap-preview').onclick = function() {
                alert('Preview plan - not implemented');
            };

            document.getElementById('cap-export').onclick = function() {
                alert('Export plan - not implemented');
            };
        };

        // Bind events for initial modal
        const bindInitialEvents = () => {
            // Bind event handlers for initial modal
            document.getElementById('cap-create-btn').onclick = function() {
                Dialog.close();
                window.CAP.UI.showPlanDesignPage();
                bindPlanDesignEvents();
                loadPlayerData();
            };

            document.getElementById('cap-import-btn').onclick = function() {
                Dialog.close();
                alert('Import mode not yet implemented.');
            };
        };

        // Initialize the application
        const init = () => {
            window.CAP.UI.createModal();
            bindInitialEvents();
        };

        // Export functions to global scope for onclick handlers
        window.CAP.removeTargetPlayer = removeTargetPlayer;
        window.CAP.addTribeMembers = addTribeMembers;

        return {
            init
        };
    })();

    // Run on script load
    window.CAP.Main.init();
})();

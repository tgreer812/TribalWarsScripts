// Coordinated Attack Planner - Merged Build
// Generated on: 2025-08-06 20:59:46
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
    let targetVillages = new Set(); // Store selected target village coordinates
    let attackingPlayer = null; // Store the attacking player name
    let attackingVillages = new Set(); // Store selected attacking villages
    let playerVillages = {}; // Store player's village data {playerId: {villageId: {name, coords, ...}}}
    let attacks = []; // Store configured attacks
    let currentPlan = null; // Current plan being worked on

    // Getters
    const getTargetPlayers = () => targetPlayers;
    const getTargetVillages = () => targetVillages;
    const getAttackingPlayer = () => attackingPlayer;
    const getAttackingVillages = () => attackingVillages;
    const getPlayerVillages = (playerName) => playerVillages[playerName] || {};
    const getAttacks = () => attacks;
    const getCurrentPlan = () => currentPlan;

    // Setters
    const setTargetPlayers = (players) => { targetPlayers = new Set(players); };
    const setTargetVillages = (villages) => { targetVillages = new Set(villages); };
    const setAttackingPlayer = (playerName) => { attackingPlayer = playerName; };
    const setAttackingVillages = (villages) => { attackingVillages = new Set(villages); };
    const setPlayerVillages = (playerName, villages) => { playerVillages[playerName] = villages; };
    const setAttacks = (newAttacks) => { attacks = [...newAttacks]; };
    const setCurrentPlan = (plan) => { currentPlan = plan; };

    // Utility functions
    const addTargetPlayer = (playerName) => {
        targetPlayers.add(playerName);
    };

    const removeTargetPlayer = (playerName) => {
        targetPlayers.delete(playerName);
    };

    const addTargetVillage = (villageCoords) => {
        targetVillages.add(villageCoords);
    };

    const removeTargetVillage = (villageCoords) => {
        targetVillages.delete(villageCoords);
    };

    const addAttackingVillage = (villageId) => {
        attackingVillages.add(villageId);
    };

    const removeAttackingVillage = (villageId) => {
        attackingVillages.delete(villageId);
    };

    const clearAll = () => {
        targetPlayers.clear();
        targetVillages.clear();
        attackingPlayer = null;
        attackingVillages.clear();
        playerVillages = {};
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
        getAttackingPlayer,
        getAttackingVillages,
        getPlayerVillages,
        getAttacks,
        getCurrentPlan,
        
        // Setters
        setTargetPlayers,
        setTargetVillages,
        setAttackingPlayer,
        setAttackingVillages,
        setPlayerVillages,
        setAttacks,
        setCurrentPlan,
        
        // Utilities
        addTargetPlayer,
        removeTargetPlayer,
        addTargetVillage,
        removeTargetVillage,
        addAttackingVillage,
        removeAttackingVillage,
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
                    
                    // Look for the specific member table with headers: Name, Rank, Points, Global Rank, Villages
                    $html.find('table.vis').each(function() {
                        const $table = $(this);
                        const $headers = $table.find('th');
                        
                        // Check if this is the member table by looking for specific headers
                        let isMemberTable = false;
                        $headers.each(function() {
                            const headerText = $(this).text().trim().toLowerCase();
                            if (headerText === 'name' || headerText === 'rank' || headerText === 'points') {
                                isMemberTable = true;
                                return false; // break
                            }
                        });
                        
                        if (isMemberTable) {
                            // Process each row in the member table (skip header row)
                            $table.find('tr').slice(1).each(function() {
                                const $row = $(this);
                                const $firstCell = $row.find('td').first();
                                const $playerLink = $firstCell.find('a[href*="info_player"]').first();
                                
                                if ($playerLink.length > 0) {
                                    const playerName = $playerLink.text().trim();
                                    if (playerName && !members.includes(playerName)) {
                                        members.push(playerName);
                                    }
                                }
                            });
                            return false; // break out of table loop once we found the member table
                        }
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

    // Get player's villages by searching their profile
    const getPlayerVillages = (playerName) => {
        return new Promise((resolve, reject) => {
            // First validate the player exists and get their ID
            validatePlayer(playerName)
                .then(() => {
                    // Search for the player to get their ID
                    return $.get('/game.php?village=' + game_data.village.id + '&screen=ranking&mode=player&name=' + encodeURIComponent(playerName));
                })
                .then(html => {
                    const $html = $(html);
                    let playerId = null;
                    
                    // Find the player's ID from the ranking table
                    $html.find('#player_ranking_table tr').each(function() {
                        const $row = $(this);
                        const $nameCell = $row.find('td:nth-child(2)');
                        if ($nameCell.length > 0) {
                            const foundName = $nameCell.text().trim();
                            if (foundName.toLowerCase() === playerName.toLowerCase()) {
                                const $link = $nameCell.find('a[href*="info_player"]').first();
                                if ($link.length > 0) {
                                    const href = $link.attr('href');
                                    const match = href.match(/id=(\d+)/);
                                    if (match) {
                                        playerId = match[1];
                                    }
                                }
                                return false; // break
                            }
                        }
                    });
                    
                    if (!playerId) {
                        throw new Error(`Could not find player ID for "${playerName}"`);
                    }
                    
                    // Now get the player's village info
                    return $.get('/game.php?village=' + game_data.village.id + '&screen=info_player&id=' + playerId);
                })
                .then(html => {
                    const $html = $(html);
                    const villages = {};
                    
                    // Look for villages table in player info
                    $html.find('table').each(function() {
                        const $table = $(this);
                        const $headers = $table.find('th');
                        
                        // Check if this is the villages table
                        let isVillageTable = false;
                        $headers.each(function() {
                            const headerText = $(this).text().trim().toLowerCase();
                            if (headerText.includes('village') || headerText.includes('coordinates') || headerText.includes('points')) {
                                isVillageTable = true;
                                return false; // break
                            }
                        });
                        
                        if (isVillageTable) {
                            // Process village rows
                            $table.find('tr').slice(1).each(function() {
                                const $row = $(this);
                                const $cells = $row.find('td');
                                
                                if ($cells.length >= 2) {
                                    // First cell usually contains village name
                                    const villageName = $cells.eq(0).text().trim();
                                    
                                    // Look for coordinates in any cell
                                    let villageCoords = null;
                                    $cells.each(function() {
                                        const cellText = $(this).text().trim();
                                        const coordMatch = cellText.match(/(\d{1,3})\|(\d{1,3})/);
                                        if (coordMatch) {
                                            villageCoords = coordMatch[0];
                                            return false; // break
                                        }
                                    });
                                    
                                    if (villageName && villageCoords && villageName !== 'Village') {
                                        // Generate a village ID from coordinates for consistency
                                        const villageId = `${villageCoords.replace('|', '_')}_${playerName}`;
                                        
                                        villages[villageId] = {
                                            id: villageId,
                                            name: villageName,
                                            coords: villageCoords,
                                            player: playerName
                                        };
                                    }
                                }
                            });
                            return false; // break out of table loop
                        }
                    });
                    
                    if (Object.keys(villages).length === 0) {
                        reject(`No villages found for player "${playerName}". The player may have no villages or privacy settings may prevent access.`);
                    } else {
                        resolve(villages);
                    }
                })
                .catch(error => {
                    if (typeof error === 'string') {
                        reject(error);
                    } else {
                        reject(`Failed to fetch villages for player "${playerName}". ${error.message || 'Unknown error'}`);
                    }
                });
        });
    };

    return {
        validatePlayer,
        validateTribe,
        getPlayerVillages
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
            const addBtn = document.querySelector('#popup_box_AddTribe .cap-button:first-of-type');
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

        // Set attacking player
        const setAttackingPlayer = () => {
            const input = document.getElementById('cap-attacking-player-input');
            const playerName = input.value.trim();
            
            if (!playerName) {
                UI.ErrorMessage('Please enter a player name');
                return;
            }

            // Show loading indicator
            input.disabled = true;
            document.getElementById('cap-set-attacking-player').disabled = true;
            document.getElementById('cap-set-attacking-player').textContent = 'Checking...';

            // Validate player and get their villages
            window.CAP.Validation.validatePlayer(playerName)
                .then(() => {
                    return window.CAP.Validation.getPlayerVillages(playerName);
                })
                .then(villages => {
                    // Store the attacking player and their villages
                    window.CAP.State.setAttackingPlayer(playerName);
                    window.CAP.State.setPlayerVillages(playerName, villages);
                    
                    // Update UI
                    document.getElementById('cap-attacking-player-name').textContent = playerName;
                    document.getElementById('cap-attacking-player-input').style.display = 'none';
                    document.getElementById('cap-set-attacking-player').style.display = 'none';
                    document.getElementById('cap-attacking-player-display').style.display = 'block';
                    
                    // Enable other sections
                    window.CAP.UI.toggleSectionStates(true);
                    
                    // Update attacking villages display
                    window.CAP.UI.updateAttackingVillagesDisplay();
                    
                    UI.SuccessMessage(`Plan set for player "${playerName}" with ${Object.keys(villages).length} villages`);
                })
                .catch(error => {
                    UI.ErrorMessage(error);
                })
                .finally(() => {
                    // Re-enable controls
                    input.disabled = false;
                    document.getElementById('cap-set-attacking-player').disabled = false;
                    document.getElementById('cap-set-attacking-player').textContent = 'Set Player';
                });
        };

        // Change attacking player
        const changeAttackingPlayer = () => {
            // Reset state
            window.CAP.State.setAttackingPlayer(null);
            window.CAP.State.setAttackingVillages([]);
            
            // Reset UI
            document.getElementById('cap-attacking-player-input').value = '';
            document.getElementById('cap-attacking-player-input').style.display = 'inline-block';
            document.getElementById('cap-set-attacking-player').style.display = 'inline-block';
            document.getElementById('cap-attacking-player-display').style.display = 'none';
            
            // Disable other sections
            window.CAP.UI.toggleSectionStates(false);
            window.CAP.UI.updateAttackingVillagesDisplay();
        };

        // Select/deselect all attacking villages
        const selectAllAttackingVillages = (selectAll) => {
            const attackingPlayer = window.CAP.State.getAttackingPlayer();
            const playerVillages = window.CAP.State.getPlayerVillages(attackingPlayer);
            
            if (selectAll) {
                // Select all villages
                Object.keys(playerVillages).forEach(villageId => {
                    window.CAP.State.addAttackingVillage(villageId);
                });
            } else {
                // Clear all selections
                window.CAP.State.setAttackingVillages([]);
            }
            
            // Update UI
            window.CAP.UI.updateAttackingVillagesDisplay();
        };

        // Add target villages by coordinates
        const addTargetVillagesByCoords = () => {
            const input = document.getElementById('cap-target-coords');
            const coordsInput = input.value.trim();
            
            if (!coordsInput) {
                UI.ErrorMessage('Please enter coordinates');
                return;
            }

            // Parse comma-separated coordinates
            const coordsList = coordsInput.split(',').map(coord => coord.trim());
            let addedCount = 0;
            let invalidCoords = [];

            coordsList.forEach(coords => {
                // Validate coordinate format
                if (coords.match(/^\d{1,3}\|\d{1,3}$/)) {
                    if (!window.CAP.State.getTargetVillages().has(coords)) {
                        window.CAP.State.addTargetVillage(coords);
                        addedCount++;
                    }
                } else if (coords) {
                    invalidCoords.push(coords);
                }
            });

            // Clear input
            input.value = '';

            // Update display
            window.CAP.UI.updateTargetVillagesDisplay();

            // Show feedback
            if (addedCount > 0) {
                UI.SuccessMessage(`Added ${addedCount} target village${addedCount > 1 ? 's' : ''}`);
            }
            if (invalidCoords.length > 0) {
                UI.ErrorMessage(`Invalid coordinates: ${invalidCoords.join(', ')}`);
            }
            if (addedCount === 0 && invalidCoords.length === 0) {
                UI.ErrorMessage('No new coordinates to add');
            }
        };

        // Add all villages from all target players
        const addAllTargetVillages = () => {
            const targetPlayers = window.CAP.State.getTargetPlayers();
            
            if (targetPlayers.size === 0) {
                UI.ErrorMessage('Please select target players first');
                return;
            }

            let totalAdded = 0;
            let playersProcessed = 0;
            const totalPlayers = targetPlayers.size;

            // Function to process each player's villages
            const processPlayer = (playerName) => {
                return new Promise((resolve) => {
                    const existingVillages = window.CAP.State.getPlayerVillages(playerName);
                    
                    if (Object.keys(existingVillages).length > 0) {
                        // Use cached villages
                        Object.values(existingVillages).forEach(village => {
                            if (!window.CAP.State.getTargetVillages().has(village.coords)) {
                                window.CAP.State.addTargetVillage(village.coords);
                                totalAdded++;
                            }
                        });
                        resolve();
                    } else {
                        // Fetch villages for this player
                        window.CAP.Validation.getPlayerVillages(playerName)
                            .then(villages => {
                                window.CAP.State.setPlayerVillages(playerName, villages);
                                Object.values(villages).forEach(village => {
                                    if (!window.CAP.State.getTargetVillages().has(village.coords)) {
                                        window.CAP.State.addTargetVillage(village.coords);
                                        totalAdded++;
                                    }
                                });
                                resolve();
                            })
                            .catch(() => {
                                resolve(); // Continue even if one player fails
                            });
                    }
                });
            };

            // Process all players
            const promises = Array.from(targetPlayers).map(processPlayer);
            
            Promise.all(promises).then(() => {
                window.CAP.UI.updateTargetVillagesDisplay();
                UI.SuccessMessage(`Added ${totalAdded} target villages from ${totalPlayers} player${totalPlayers > 1 ? 's' : ''}`);
            });
        };

        // Add selected village from dropdown
        const addSelectedTargetVillage = () => {
            const villageCoords = document.getElementById('cap-target-village-dropdown').value;
            
            if (!villageCoords) {
                UI.ErrorMessage('Please select a village');
                return;
            }

            if (window.CAP.State.getTargetVillages().has(villageCoords)) {
                UI.ErrorMessage('Village already added');
                return;
            }

            window.CAP.State.addTargetVillage(villageCoords);
            window.CAP.UI.updateTargetVillagesDisplay();
            
            // Reset dropdown selection
            document.getElementById('cap-target-village-dropdown').value = '';
            
            UI.SuccessMessage(`Added target village ${villageCoords}`);
        };

        // Remove a target village
        const removeTargetVillage = (villageCoords) => {
            window.CAP.State.removeTargetVillage(villageCoords);
            window.CAP.UI.updateTargetVillagesDisplay();
        };

        // Bind events for plan design page
        const bindPlanDesignEvents = () => {
            // Back button
            document.getElementById('cap-back').onclick = function() {
                Dialog.close();
                window.CAP.UI.createModal();
                bindInitialEvents();
            };

            // Attacking player selection
            document.getElementById('cap-attacking-player-input').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    setAttackingPlayer();
                }
            });

            document.getElementById('cap-set-attacking-player').onclick = setAttackingPlayer;
            document.getElementById('cap-change-attacking-player').onclick = changeAttackingPlayer;

            // Attacking village selection
            document.getElementById('cap-select-all-attackers').onclick = function() {
                selectAllAttackingVillages(true);
            };

            document.getElementById('cap-clear-attackers').onclick = function() {
                selectAllAttackingVillages(false);
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

            // Target village selection
            document.getElementById('cap-add-coords').onclick = addTargetVillagesByCoords;
            
            document.getElementById('cap-target-coords').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addTargetVillagesByCoords();
                }
            });

            document.getElementById('cap-add-all-villages').onclick = addAllTargetVillages;

            document.getElementById('cap-target-player-dropdown').onchange = function() {
                window.CAP.UI.updateTargetVillageDropdown(this.value);
            };

            document.getElementById('cap-add-selected-village').onclick = addSelectedTargetVillage;

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
        window.CAP.removeTargetVillage = removeTargetVillage;
        window.CAP.addTribeMembers = addTribeMembers;

        return {
            init
        };
    })();

    // Run on script load
    window.CAP.Main.init();
})();

// Coordinated Attack Planner - Merged Build
// Generated on: 2025-09-05 19:43:33
// This file is auto-generated. Do not edit directly.

// ==================================================
// MODULE: modules\cap-state.js
// ==================================================

// CAP State Management Module
// Handles all application state and data structures

window.CAP = window.CAP || {};

window.CAP.State = (function() {
    // Application state
    let targetPlayers = new Set(); // Store selected target player names
    let targetVillages = new Map(); // Store selected target villages: coords -> {coords, name, player}
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
    const setTargetVillages = (villages) => { targetVillages = new Map(villages); };
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

    const addTargetVillage = (coords, name = null, player = null) => {
        targetVillages.set(coords, {
            coords: coords,
            name: name || coords,
            player: player || 'Unknown'
        });
    };

    const removeTargetVillage = (coords) => {
        targetVillages.delete(coords);
    };

    const clearTargetVillages = () => {
        targetVillages.clear();
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

    // Attack management functions
    const addAttack = (attack) => {
        attack.id = attack.id || 'attack_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        attacks.push(attack);
    };

    const removeAttack = (attackId) => {
        const index = attacks.findIndex(attack => attack.id === attackId);
        if (index !== -1) {
            attacks.splice(index, 1);
        }
    };

    const updateAttack = (attackId, updates) => {
        const index = attacks.findIndex(attack => attack.id === attackId);
        if (index !== -1) {
            attacks[index] = { ...attacks[index], ...updates };
        }
    };

    const clearAttacks = () => {
        attacks.length = 0;
    };

    const getAttackById = (attackId) => {
        return attacks.find(attack => attack.id === attackId);
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

    // Plan export function
    const exportPlan = (planName = '', description = '') => {
        // Validate prerequisites
        if (!attackingPlayer) {
            return { isValid: false, error: 'No attacking player selected' };
        }

        if (attacks.length === 0) {
            return { isValid: false, error: 'No attacks to export' };
        }

        try {
            // Create timestamps
            const now = new Date();
            const nowISO = now.toISOString();

            // Calculate distance for each attack
            const calculateDistance = (coords1, coords2) => {
                const [x1, y1] = coords1.split('|').map(Number);
                const [x2, y2] = coords2.split('|').map(Number);
                return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            };

            // Convert attacks to schema format
            const exportAttacks = attacks.map(attack => {
                // Convert landingTime to ISO format for arrivalTime
                const arrivalTime = new Date(attack.landingTime.replace(' ', 'T') + '.000Z').toISOString();
                
                // Calculate distance
                const distance = calculateDistance(
                    attack.attackingVillage.coords,
                    attack.targetVillage.coords
                );

                return {
                    id: attack.id,
                    attackingVillage: {
                        id: parseInt(attack.attackingVillage.id),
                        name: attack.attackingVillage.name,
                        coords: attack.attackingVillage.coords
                    },
                    targetVillage: {
                        coords: attack.targetVillage.coords,
                        name: attack.targetVillage.name,
                        player: attack.targetVillage.player
                    },
                    sendTime: "", // Empty - calculated at import time
                    template: "", // Empty - assigned during finalization
                    slowestUnit: "", // Empty - assigned during finalization
                    arrivalTime: arrivalTime,
                    distance: Math.round(distance * 1000) / 1000, // Round to 3 decimal places
                    notes: attack.notes || ""
                };
            });

            // Create plan data structure
            const planData = {
                version: "1.0",
                createdAt: nowISO,
                exportedAt: nowISO,
                planName: planName.trim(),
                description: description.trim(),
                attacks: exportAttacks
            };

            // Validate using version-specific validator
            const validator = window.CAP.Validation.PlanValidators["1.0"];
            if (!validator) {
                return { isValid: false, error: 'Plan validator not found' };
            }

            const validation = validator.validate(planData);
            if (!validation.isValid) {
                return { 
                    isValid: false, 
                    error: 'Plan validation failed: ' + validation.errors.join('; ') 
                };
            }

            // Convert to JSON and base64 encode
            const jsonString = JSON.stringify(planData, null, 0);
            const base64String = btoa(jsonString);

            return {
                isValid: true,
                planData: planData,
                base64: base64String,
                attackCount: attacks.length
            };

        } catch (error) {
            return { 
                isValid: false, 
                error: 'Export failed: ' + (error.message || 'Unknown error') 
            };
        }
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
        clearTargetVillages,
        addAttackingVillage,
        removeAttackingVillage,
        clearAll,
        getRecentTargets,
        addToRecentTargets,
        
        // Attack management
        addAttack,
        removeAttack,
        updateAttack,
        clearAttacks,
        getAttackById,
        
        // Plan export
        exportPlan
    };
})();

// ==================================================
// MODULE: modules\cap-validation.js
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

    // Version-specific Plan Validators
    const PlanValidators = {
        "1.0": class PlanValidator_v1_0 {
            static validate(planData) {
                const errors = [];

                // Check required fields
                if (!planData.version) errors.push('Missing required field: version');
                if (!planData.createdAt) errors.push('Missing required field: createdAt');
                if (!planData.exportedAt) errors.push('Missing required field: exportedAt');
                if (!planData.attacks || !Array.isArray(planData.attacks)) {
                    errors.push('Missing or invalid required field: attacks (must be array)');
                } else if (planData.attacks.length === 0) {
                    errors.push('Plan must contain at least one attack');
                }

                // Validate version format
                if (planData.version !== "1.0") {
                    errors.push('Invalid version: expected "1.0"');
                }

                // Validate timestamp formats (basic check)
                const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
                if (planData.createdAt && !timestampRegex.test(planData.createdAt)) {
                    errors.push('Invalid createdAt timestamp format');
                }
                if (planData.exportedAt && !timestampRegex.test(planData.exportedAt)) {
                    errors.push('Invalid exportedAt timestamp format');
                }

                // Validate optional fields (type checking)
                if (planData.planName !== undefined && typeof planData.planName !== 'string') {
                    errors.push('planName must be a string');
                }
                if (planData.description !== undefined && typeof planData.description !== 'string') {
                    errors.push('description must be a string');
                }

                // Validate each attack
                if (planData.attacks && Array.isArray(planData.attacks)) {
                    planData.attacks.forEach((attack, index) => {
                        const attackErrors = this.validateAttack(attack, index);
                        errors.push(...attackErrors);
                    });
                }

                return {
                    isValid: errors.length === 0,
                    errors: errors
                };
            }

            static validateAttack(attack, index) {
                const errors = [];
                const prefix = `Attack ${index + 1}: `;

                // Required fields
                if (!attack.id) errors.push(prefix + 'Missing required field: id');
                if (!attack.attackingVillage) errors.push(prefix + 'Missing required field: attackingVillage');
                if (!attack.targetVillage) errors.push(prefix + 'Missing required field: targetVillage');
                if (!attack.arrivalTime) errors.push(prefix + 'Missing required field: arrivalTime');

                // Validate ID pattern
                if (attack.id && !/^attack_\d+_[a-z0-9]+$/.test(attack.id)) {
                    errors.push(prefix + 'Invalid id format (expected: attack_\\d+_[a-z0-9]+)');
                }

                // Validate attacking village
                if (attack.attackingVillage) {
                    if (!attack.attackingVillage.coords) {
                        errors.push(prefix + 'Missing attackingVillage.coords');
                    } else if (!/^\d{1,3}\|\d{1,3}$/.test(attack.attackingVillage.coords)) {
                        errors.push(prefix + 'Invalid attackingVillage.coords format (expected: xxx|yyy)');
                    }
                    if (!attack.attackingVillage.name) {
                        errors.push(prefix + 'Missing attackingVillage.name');
                    }
                    if (attack.attackingVillage.id !== undefined && 
                        (!Number.isInteger(attack.attackingVillage.id) || attack.attackingVillage.id < 1)) {
                        errors.push(prefix + 'attackingVillage.id must be a positive integer');
                    }
                }

                // Validate target village
                if (attack.targetVillage) {
                    if (!attack.targetVillage.coords) {
                        errors.push(prefix + 'Missing targetVillage.coords');
                    } else if (!/^\d{1,3}\|\d{1,3}$/.test(attack.targetVillage.coords)) {
                        errors.push(prefix + 'Invalid targetVillage.coords format (expected: xxx|yyy)');
                    }
                    if (!attack.targetVillage.name) {
                        errors.push(prefix + 'Missing targetVillage.name');
                    }
                    if (!attack.targetVillage.player) {
                        errors.push(prefix + 'Missing targetVillage.player');
                    }
                }

                // Validate timestamp
                const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
                if (attack.arrivalTime && !timestampRegex.test(attack.arrivalTime)) {
                    errors.push(prefix + 'Invalid arrivalTime timestamp format');
                }

                // Validate sendTime (should be empty string or valid timestamp)
                if (attack.sendTime !== undefined && attack.sendTime !== "" && !timestampRegex.test(attack.sendTime)) {
                    errors.push(prefix + 'Invalid sendTime format (should be empty string or valid timestamp)');
                }

                // Validate template and slowestUnit (should be strings)
                if (attack.template !== undefined && typeof attack.template !== 'string') {
                    errors.push(prefix + 'template must be a string');
                }
                if (attack.slowestUnit !== undefined && typeof attack.slowestUnit !== 'string') {
                    errors.push(prefix + 'slowestUnit must be a string');
                }

                // Validate optional fields
                if (attack.notes !== undefined && typeof attack.notes !== 'string') {
                    errors.push(prefix + 'notes must be a string');
                }
                if (attack.distance !== undefined && (typeof attack.distance !== 'number' || attack.distance < 0)) {
                    errors.push(prefix + 'distance must be a non-negative number');
                }

                return errors;
            }
        }
    };

    return {
        validatePlayer,
        validateTribe,
        getPlayerVillages,
        PlanValidators
    };
})();

// ==================================================
// MODULE: modules\cap-ui.js
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
        showExportPlanModal
    };
})();

// ==================================================
// MAIN FILE
// ==================================================

(function() {
    // Utility to create modal
    function createModal() {
        // Remove any existing modal
        const oldModal = document.getElementById('tw-cap-modal');
        if (oldModal) oldModal.remove();

        window.CAP.UI.createModal();

        // Bind event handlers
        document.getElementById('cap-create-btn').onclick = function() {
            Dialog.close();
            showPlanDesignPage();
        };
        document.getElementById('cap-import-btn').onclick = function() {
            Dialog.close();
            alert('Import mode not yet implemented.');
        };
    }

    // Plan Design Page
    function showPlanDesignPage() {
        window.CAP.UI.showPlanDesignPage();
        bindPlanDesignEvents();
        loadPlayerData();
        // Initialize attack table
        window.CAP.UI.updateAttackTable();
    }

    // Bind events for plan design page (prevent double binding)
    function bindPlanDesignEvents() {
        // Clear old handlers
        [
            'cap-back', 'cap-create-btn', 'cap-import-btn',
            'cap-select-all-attackers', 'cap-clear-attackers',
            'cap-preview', 'cap-export', 'cap-add-attack',
            'cap-mass-add', 'cap-clear-attacks'
        ].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.replaceWith(el.cloneNode(true));
        });

        document.getElementById('cap-back').onclick = function() {
            Dialog.close();
            createModal();
        };

        setupAttackingPlayerEvents();
        setupTargetPlayerEvents();
        setupTargetVillageEvents();
        setupAttackingVillageEvents();

        // Attack management handlers
        document.getElementById('cap-add-attack').onclick   = showAddAttackDialog;
        document.getElementById('cap-mass-add').onclick     = showMassAddDialog;
        document.getElementById('cap-clear-attacks').onclick= clearAllAttacks;
        document.getElementById('cap-preview').onclick      = () => alert('Preview plan - not implemented');
        document.getElementById('cap-export').onclick       = exportPlan;
    }

    // Attacking player events
    function setupAttackingPlayerEvents() {
        const input = document.getElementById('cap-attacking-player-input');
        const setBtn = document.getElementById('cap-set-attacking-player');
        const changeBtn = document.getElementById('cap-change-attacking-player');

        setBtn.onclick = function() {
            const name = input.value.trim();
            if (!name) return UI.ErrorMessage('Please enter a player name');
            input.disabled = this.disabled = true;
            this.textContent = 'Checking...';

            window.CAP.Validation.validatePlayer(name)
                .then(() => {
                    window.CAP.State.setAttackingPlayer(name);
                    document.getElementById('cap-attacking-player-name').textContent = name;
                    document.getElementById('cap-attacking-player-display').style.display = 'block';
                    input.style.display = setBtn.style.display = 'none';
                    window.CAP.UI.toggleSectionStates(true);
                    loadAttackingPlayerVillages(name);
                    UI.SuccessMessage(`Player "${name}" set successfully`);
                })
                .catch(err => {
                    UI.ErrorMessage(err);
                    input.disabled = this.disabled = false;
                    this.textContent = 'Set Player';
                });
        };

        changeBtn.onclick = function() {
            window.CAP.State.setAttackingPlayer(null);
            window.CAP.State.setAttackingVillages(new Set());
            document.getElementById('cap-attacking-player-display').style.display = 'none';
            input.style.display = setBtn.style.display = 'inline';
            input.value = '';
            window.CAP.UI.toggleSectionStates(false);
            window.CAP.UI.updateAttackingVillagesDisplay();
        };

        input.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                setBtn.click();
            }
        });
    }

    // Target player events
    function setupTargetPlayerEvents() {
        const input = document.getElementById('cap-player-input');
        document.getElementById('cap-add-player').onclick = addTargetPlayer;
        input.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTargetPlayer();
            }
        });
        document.getElementById('cap-add-tribe').onclick = () => window.CAP.UI.showAddTribeDialog();
    }

    // Target village events
    function setupTargetVillageEvents() {
        document.getElementById('cap-add-all-villages').onclick = addAllVillagesFromPlayers;
        document.getElementById('cap-clear-all-villages').onclick = () => {
            window.CAP.State.clearTargetVillages();
            window.CAP.UI.updateTargetVillagesDisplay();
            UI.SuccessMessage('All target villages cleared');
        };
        document.getElementById('cap-add-coords').onclick = function() {
            const coords = document.getElementById('cap-target-coords').value.trim().split(',').map(c=>c.trim());
            let count = 0;
            coords.forEach(coord => {
                if (/^\d{1,3}\|\d{1,3}$/.test(coord)) {
                    window.CAP.State.addTargetVillage(coord);
                    count++;
                }
            });
            count
                ? (window.CAP.UI.updateTargetVillagesDisplay(), UI.SuccessMessage(`Added ${count} target villages`))
                : UI.ErrorMessage('No valid coordinates found');
            document.getElementById('cap-target-coords').value = '';
        };
        document.getElementById('cap-target-player-dropdown').onchange = function() {
            window.CAP.UI.updateTargetVillageDropdown(this.value);
        };
        document.getElementById('cap-add-selected-village').onclick = function() {
            const player = document.getElementById('cap-target-player-dropdown').value;
            const coords = document.getElementById('cap-target-village-dropdown').value;
            if (!player || !coords) return UI.ErrorMessage('Please select both player and village');
            const villages = window.CAP.State.getPlayerVillages(player);
            const v = Object.values(villages).find(x => x.coords === coords);
            if (v) {
                window.CAP.State.addTargetVillage(v.coords, v.name, v.player);
                window.CAP.UI.updateTargetVillagesDisplay();
                UI.SuccessMessage(`Added ${v.name} (${v.coords})`);
            } else UI.ErrorMessage('Village not found');
        };
        document.getElementById('cap-add-all-player-villages').onclick = function() {
            const player = document.getElementById('cap-target-player-dropdown').value;
            if (!player) return UI.ErrorMessage('Please select a player first');
            const villages = window.CAP.State.getPlayerVillages(player);
            let added=0;
            Object.values(villages).forEach(v => {
                if (!window.CAP.State.getTargetVillages().has(v.coords)) {
                    window.CAP.State.addTargetVillage(v.coords, v.name, v.player);
                    added++;
                }
            });
            added
                ? (window.CAP.UI.updateTargetVillagesDisplay(), UI.SuccessMessage(`Added ${added} villages from ${player}`))
                : UI.InfoMessage(`All villages from ${player} already added`);
        };
    }

    // Attacking village events
    function setupAttackingVillageEvents() {
        document.getElementById('cap-select-all-attackers').onclick = () => {
            const player = window.CAP.State.getAttackingPlayer();
            Object.values(window.CAP.State.getPlayerVillages(player)).forEach(v => {
                window.CAP.State.addAttackingVillage(v.id);
            });
            window.CAP.UI.updateAttackingVillagesDisplay();
            UI.SuccessMessage('All attacking villages selected');
        };
        document.getElementById('cap-clear-attackers').onclick = () => {
            window.CAP.State.setAttackingVillages(new Set());
            window.CAP.UI.updateAttackingVillagesDisplay();
            UI.SuccessMessage('All attacking villages cleared');
        };
    }

    // Helpers
    function loadAttackingPlayerVillages(name) {
        window.CAP.Validation.getPlayerVillages(name)
            .then(v => {
                window.CAP.State.setPlayerVillages(name, v);
                window.CAP.UI.updateAttackingVillagesDisplay();
            })
            .catch(err => UI.ErrorMessage(`Failed to load villages for ${name}: ${err}`));
    }

    function addAllVillagesFromPlayers() {
        const players = Array.from(window.CAP.State.getTargetPlayers());
        if (!players.length) return UI.ErrorMessage('Please select target players first');

        const btn = document.getElementById('cap-add-all-villages');
        btn.disabled = true; btn.textContent = 'Loading...';
        window.CAP.UI.showVillageLoadingIndicator(true);
        let idx=0, total=0, errors=[];

        function next() {
            if (idx >= players.length) {
                btn.disabled = false; btn.textContent = 'Add All Villages';
                window.CAP.UI.showVillageLoadingIndicator(false);
                errors.length
                    ? UI.ErrorMessage(`Completed with ${errors.length} errors. Added ${total} villages.`)
                    : UI.SuccessMessage(`Successfully added ${total} villages from ${players.length} players`);
                return;
            }
            const p = players[idx++];
            window.CAP.UI.updateVillageLoadingMessage(`Loading ${p} (${idx}/${players.length})...`);
            const cache = window.CAP.State.getPlayerVillages(p);
            const doAdd = villages => {
                Object.values(villages).forEach(v => {
                    if (!window.CAP.State.getTargetVillages().has(v.coords)) {
                        window.CAP.State.addTargetVillage(v.coords, v.name, v.player);
                        total++;
                    }
                });
                window.CAP.UI.updateTargetVillagesDisplay();
                setTimeout(next, cache.length ? 200 : 1000);
            };
            if (Object.keys(cache).length) {
                doAdd(cache);
            } else {
                window.CAP.Validation.getPlayerVillages(p)
                    .then(v => {
                        window.CAP.State.setPlayerVillages(p, v);
                        doAdd(v);
                    })
                    .catch(err => {
                        errors.push(`${p}: ${err}`);
                        console.error(err);
                        setTimeout(next, 1000);
                    });
            }
        }
        next();
    }

    function addTargetPlayer() {
        const input = document.getElementById('cap-player-input');
        const name = input.value.trim();
        if (!name) return UI.ErrorMessage('Please enter a player name');
        if (window.CAP.State.getTargetPlayers().has(name)) return UI.ErrorMessage('Player already added');

        input.disabled = true;
        const btn = document.getElementById('cap-add-player');
        btn.disabled = true; btn.textContent = 'Checking...';

        window.CAP.Validation.validatePlayer(name)
            .then(() => {
                window.CAP.State.addTargetPlayer(name);
                window.CAP.State.addToRecentTargets(name);
                input.value = '';
                window.CAP.UI.updateTargetPlayersDisplay();
                UI.SuccessMessage(`Player "${name}" added successfully`);
            })
            .catch(err => UI.ErrorMessage(err))
            .finally(() => {
                input.disabled = false;
                btn.disabled = false;
                btn.textContent = 'Add';
            });
    }

    // Global UI callbacks
    window.CAP = window.CAP || {};
    window.CAP.removeTargetPlayer = name => {
        window.CAP.State.removeTargetPlayer(name);
        window.CAP.UI.updateTargetPlayersDisplay();
    };
    window.CAP.removeTargetVillage = coords => {
        window.CAP.State.removeTargetVillage(coords);
        window.CAP.UI.updateTargetVillagesDisplay();
    };

    // Attack management callbacks
    window.CAP.removeAttack = attackId => {
        if (confirm('Are you sure you want to remove this attack?')) {
            window.CAP.State.removeAttack(attackId);
            window.CAP.UI.updateAttackTable();
            UI.SuccessMessage('Attack removed successfully');
        }
    };

    window.CAP.editAttack = attackId => {
        // For now, just show an alert - edit functionality can be implemented later
        UI.InfoMessage('Edit attack functionality will be implemented in a future update');
    };

    // Add tribe members
    window.CAP.addTribeMembers = function() {
        const tribeTag = document.getElementById('tribe-input').value.trim();
        if (!tribeTag) return UI.ErrorMessage('Please enter a tribe tag');

        const tribeInput = document.getElementById('tribe-input');
        const addBtn = document.getElementById('cap-add-tribe-confirm');
        tribeInput.disabled = true;
        if (addBtn) { addBtn.disabled = true; addBtn.textContent = 'Checking...'; }

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
                tribeInput.disabled = false;
                if (addBtn) {
                    addBtn.disabled = false;
                    addBtn.textContent = 'Add Tribe';
                }
            });
    };

    // Load player data
    function loadPlayerData() {
        console.log('Loading player data...');
    }

    // Helper functions for attack management
    function validatePrerequisites() {
        const attackingPlayer = window.CAP.State.getAttackingPlayer();
        if (!attackingPlayer) {
            return { isValid: false, message: 'Please select an attacking player first' };
        }

        const attackingVillages = window.CAP.State.getAttackingVillages();
        if (attackingVillages.size === 0) {
            return { isValid: false, message: 'Please select at least one attacking village first' };
        }

        const targetVillages = window.CAP.State.getTargetVillages();
        if (targetVillages.size === 0) {
            return { isValid: false, message: 'Please select at least one target village first' };
        }

        return { isValid: true };
    }

    function validateLandingTime(landingTime) {
        if (!landingTime) {
            return { isValid: false, message: 'Please enter a landing time' };
        }

        // Validate landing time format
        const timeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        if (!timeRegex.test(landingTime)) {
            return { isValid: false, message: 'Invalid landing time format. Please use YYYY-MM-DD HH:MM:SS' };
        }

        // Validate landing time is in the future
        const landingDate = new Date(landingTime.replace(' ', 'T'));
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
        
        if (landingDate <= serverTime) {
            return { isValid: false, message: 'Landing time must be in the future' };
        }

        return { isValid: true, serverTime: serverTime };
    }

    function createAttackObject(attackingVillageId, targetVillageCoords, landingTime, notes = '') {
        // Get village details
        const attackingPlayer = window.CAP.State.getAttackingPlayer();
        const playerVillages = window.CAP.State.getPlayerVillages(attackingPlayer);
        const attackingVillage = playerVillages[attackingVillageId];
        
        const targetVillages = window.CAP.State.getTargetVillages();
        const targetVillage = targetVillages.get(targetVillageCoords);

        if (!attackingVillage) {
            return { isValid: false, message: 'Selected attacking village not found' };
        }

        if (!targetVillage) {
            return { isValid: false, message: 'Selected target village not found' };
        }

        // Create attack object
        const attack = {
            attackingVillage: {
                id: attackingVillageId,
                name: attackingVillage.name,
                coords: attackingVillage.coords
            },
            targetVillage: {
                coords: targetVillage.coords,
                name: targetVillage.name,
                player: targetVillage.player
            },
            landingTime: landingTime,
            notes: notes,
            template: '' // Empty initially, filled during plan execution
        };

        return { isValid: true, attack: attack };
    }

    function checkDuplicateAttack(attackingVillageId, targetVillageCoords, landingTime) {
        const existingAttacks = window.CAP.State.getAttacks();
        return existingAttacks.find(attack => 
            attack.attackingVillage.id === attackingVillageId &&
            attack.targetVillage.coords === targetVillageCoords &&
            attack.landingTime === landingTime
        );
    }

    function generateAttackCombinations() {
        const attackingVillages = window.CAP.State.getAttackingVillages();
        const targetVillages = window.CAP.State.getTargetVillages();
        const attackingPlayer = window.CAP.State.getAttackingPlayer();
        const playerVillages = window.CAP.State.getPlayerVillages(attackingPlayer);
        
        const combinations = [];
        
        attackingVillages.forEach(attackingVillageId => {
            const attackingVillage = playerVillages[attackingVillageId];
            if (attackingVillage) {
                targetVillages.forEach((targetVillage, targetCoords) => {
                    combinations.push({
                        attackingVillageId: attackingVillageId,
                        attackingVillageName: attackingVillage.name,
                        attackingVillageCoords: attackingVillage.coords,
                        targetVillageCoords: targetCoords,
                        targetVillageName: targetVillage.name,
                        targetVillagePlayer: targetVillage.player
                    });
                });
            }
        });
        
        return combinations;
    }

    // Attack management functions
    function showAddAttackDialog() {
        // Validate prerequisites
        const validation = validatePrerequisites();
        if (!validation.isValid) {
            return UI.ErrorMessage(validation.message);
        }

        // Show the dialog
        window.CAP.UI.showAddAttackDialog();

        // Bind dialog events
        document.getElementById('cap-attack-cancel').onclick = function() {
            Dialog.close();
        };

        document.getElementById('cap-attack-save').onclick = function() {
            saveNewAttack();
        };
    }

    function saveNewAttack() {
        const attackingVillageId = document.getElementById('cap-attack-attacking-village').value;
        const targetVillageCoords = document.getElementById('cap-attack-target-village').value;
        const landingTime = document.getElementById('cap-attack-landing-time').value.trim();
        const notes = document.getElementById('cap-attack-notes').value.trim();

        // Validate landing time
        const landingTimeValidation = validateLandingTime(landingTime);
        if (!landingTimeValidation.isValid) {
            return UI.ErrorMessage(landingTimeValidation.message);
        }

        // Check for duplicate attacks
        const duplicate = checkDuplicateAttack(attackingVillageId, targetVillageCoords, landingTime);
        if (duplicate) {
            return UI.ErrorMessage('An identical attack (same attacking village, target, and time) already exists');
        }

        // Create attack object
        const attackObject = createAttackObject(attackingVillageId, targetVillageCoords, landingTime, notes);
        if (!attackObject.isValid) {
            return UI.ErrorMessage(attackObject.message);
        }

        // Add attack to state
        window.CAP.State.addAttack(attackObject.attack);
        
        // Update UI
        window.CAP.UI.updateAttackTable();
        
        // Close dialog and show success
        Dialog.close();
        UI.SuccessMessage('Attack added successfully');
    }

    function clearAllAttacks() {
        const attacks = window.CAP.State.getAttacks();
        if (attacks.length === 0) {
            return UI.InfoMessage('No attacks to clear');
        }

        if (confirm(`Are you sure you want to clear all ${attacks.length} attacks?`)) {
            window.CAP.State.clearAttacks();
            window.CAP.UI.updateAttackTable();
            UI.SuccessMessage('All attacks cleared');
        }
    }

    // Mass Add functions
    function showMassAddDialog() {
        // Validate prerequisites
        const validation = validatePrerequisites();
        if (!validation.isValid) {
            return UI.ErrorMessage(validation.message);
        }

        // Show the dialog
        window.CAP.UI.showMassAddDialog();

        // Bind dialog events
        document.getElementById('cap-mass-add-cancel').onclick = function() {
            Dialog.close();
        };

        document.getElementById('cap-mass-add-save').onclick = function() {
            saveMassAttacks();
        };

        // Bind preview update to time spread changes
        document.getElementById('cap-mass-add-time-spread').oninput = function() {
            window.CAP.UI.updateMassAddPreview();
        };
    }

    function saveMassAttacks() {
        const landingTime = document.getElementById('cap-mass-add-landing-time').value.trim();
        const timeSpread = parseInt(document.getElementById('cap-mass-add-time-spread').value) || 0;
        const globalNotes = document.getElementById('cap-mass-add-notes').value.trim();

        // Validate landing time
        const landingTimeValidation = validateLandingTime(landingTime);
        if (!landingTimeValidation.isValid) {
            return UI.ErrorMessage(landingTimeValidation.message);
        }

        // Generate all attack combinations
        const combinations = generateAttackCombinations();
        
        if (combinations.length === 0) {
            return UI.ErrorMessage('No attack combinations found');
        }

        // Show confirmation for large batches
        if (combinations.length > 20) {
            if (!confirm(`This will create ${combinations.length} attacks. Are you sure you want to continue?`)) {
                return;
            }
        }

        // Disable the save button and show progress
        const saveBtn = document.getElementById('cap-mass-add-save');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Creating attacks...';

        let createdCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process attacks in batches to avoid blocking UI
        let index = 0;
        
        function processNextBatch() {
            const batchSize = 10; // Process 10 attacks at a time
            const batchEnd = Math.min(index + batchSize, combinations.length);
            
            for (let i = index; i < batchEnd; i++) {
                const combo = combinations[i];
                
                // Calculate time offset
                const offsetSeconds = i * timeSpread;
                const attackLandingTime = new Date(landingTime.replace(' ', 'T'));
                attackLandingTime.setSeconds(attackLandingTime.getSeconds() + offsetSeconds);
                const formattedLandingTime = attackLandingTime.toISOString().slice(0, 19).replace('T', ' ');
                
                // Check for duplicates
                const duplicate = checkDuplicateAttack(combo.attackingVillageId, combo.targetVillageCoords, formattedLandingTime);
                if (duplicate) {
                    skippedCount++;
                    continue;
                }
                
                // Create attack object
                const attackObject = createAttackObject(
                    combo.attackingVillageId, 
                    combo.targetVillageCoords, 
                    formattedLandingTime, 
                    globalNotes
                );
                
                if (attackObject.isValid) {
                    window.CAP.State.addAttack(attackObject.attack);
                    createdCount++;
                } else {
                    errorCount++;
                    errors.push(`${combo.attackingVillageName} → ${combo.targetVillageName}: ${attackObject.message}`);
                }
            }
            
            index = batchEnd;
            
            // Update progress
            saveBtn.textContent = `Creating attacks... (${index}/${combinations.length})`;
            
            if (index < combinations.length) {
                // Continue processing next batch
                setTimeout(processNextBatch, 10);
            } else {
                // Finished processing all attacks
                finishMassAdd();
            }
        }
        
        function finishMassAdd() {
            // Re-enable button
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            
            // Update UI
            window.CAP.UI.updateAttackTable();
            
            // Close dialog
            Dialog.close();
            
            // Show summary
            let message = `Mass Add Complete: Created ${createdCount} attacks`;
            
            if (skippedCount > 0) {
                message += `, skipped ${skippedCount} duplicates`;
            }
            
            if (errorCount > 0) {
                message += `, ${errorCount} errors occurred`;
                console.warn('Mass Add Errors:', errors);
            }
            
            if (errorCount > 0) {
                UI.ErrorMessage(message + '. Check console for error details.');
            } else {
                UI.SuccessMessage(message);
            }
        }
        
        // Start processing
        processNextBatch();
    }

    // Export plan functionality
    function exportPlan() {
        // Get plan details from UI
        const planName = document.getElementById('cap-plan-name') ? 
            document.getElementById('cap-plan-name').value.trim() : '';
        const description = document.getElementById('cap-plan-description') ? 
            document.getElementById('cap-plan-description').value.trim() : '';

        // Call export function from state module
        const exportResult = window.CAP.State.exportPlan(planName, description);

        if (!exportResult.isValid) {
            return UI.ErrorMessage(`Export failed: ${exportResult.error}`);
        }

        // Show export modal with the base64 data
        window.CAP.UI.showExportPlanModal(
            exportResult.base64, 
            exportResult.attackCount, 
            planName || 'Unnamed Plan'
        );
    }

    // Run on script load
    createModal();
})();

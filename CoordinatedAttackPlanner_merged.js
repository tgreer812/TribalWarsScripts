// Coordinated Attack Planner - Merged Build
// Generated on: 2025-09-11 21:16:14
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

            // Convert attacks to schema format
            const exportAttacks = attacks.map(attack => {
                return {
                    id: attack.id,
                    attackingVillage: attack.attackingVillage.coords,
                    targetVillage: attack.targetVillage.coords,
                    template: attack.template || "", // Empty - assigned during finalization
                    slowestUnit: attack.slowestUnit || "", // Empty - assigned during finalization
                    arrivalTime: attack.arrivalTime,
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

    // Export existing plan data (for finalized plans)
    const exportExistingPlan = (planData) => {
        try {
            // Update export timestamp
            const updatedPlanData = {
                ...planData,
                exportedAt: new Date().toISOString()
            };

            // Validate using version-specific validator
            const validator = window.CAP.Validation.PlanValidators[updatedPlanData.version];
            if (!validator) {
                return { isValid: false, error: 'Plan validator not found' };
            }

            const validation = validator.validate(updatedPlanData);
            if (!validation.isValid) {
                return { 
                    isValid: false, 
                    error: 'Plan validation failed: ' + validation.errors.join('; ') 
                };
            }

            // Convert to JSON and base64 encode
            const jsonString = JSON.stringify(updatedPlanData, null, 0);
            const base64String = btoa(jsonString);

            return {
                isValid: true,
                planData: updatedPlanData,
                base64: base64String,
                json: jsonString
            };
        } catch (error) {
            return { isValid: false, error: 'Export failed: ' + error.message };
        }
    };

    // Plan import function
    const importPlan = (base64String) => {
        try {
            // Decode and parse
            const jsonString = atob(base64String);
            const planData = JSON.parse(jsonString);
            
            // Validate using version-specific validator
            const validator = window.CAP.Validation.PlanValidators[planData.version];
            if (!validator) {
                return { isValid: false, error: `Unsupported plan version: ${planData.version}` };
            }
            
            const validation = validator.validate(planData);
            if (!validation.isValid) {
                return { isValid: false, error: 'Invalid plan: ' + validation.errors.join('; ') };
            }
            
            return { isValid: true, planData: planData };
        } catch (error) {
            return { isValid: false, error: 'Invalid plan, unable to import.' };
        }
    };

    // Attack readiness functions (modular and reusable)
    const hasTemplateAssigned = (attack) => {
        return attack.template && attack.template !== "" && isValidTemplate(attack.template);
    };

    const hasSlowestUnitAssigned = (attack) => {
        return attack.slowestUnit && attack.slowestUnit !== "" && isValidUnit(attack.slowestUnit);
    };

    const isAttackReady = (attack) => {
        return hasTemplateAssigned(attack) || hasSlowestUnitAssigned(attack);
    };

    const isPlanReadyForExecution = (planData) => {
        return planData.attacks.every(attack => isAttackReady(attack));
    };

    const needsTemplateAssignment = (planData) => {
        return !isPlanReadyForExecution(planData);
    };

    const getAttacksNeedingTemplates = (planData) => {
        return planData.attacks.filter(attack => !isAttackReady(attack));
    };

    // Validation helper functions
    const isValidTemplate = (templateName) => {
        if (!templateName || templateName === "") return false;
        
        // Get user's templates and check if this one exists
        const userTemplates = getUserTemplates();
        return userTemplates.some(template => template.name === templateName);
    };

    const isValidUnit = (unitType) => {
        const validUnits = ["spear", "sword", "axe", "archer", "spy", "light", "marcher", "heavy", "ram", "catapult", "knight", "snob"];
        return validUnits.includes(unitType);
    };

    // Get user's available templates from Tribal Wars API
    const getUserTemplates = () => {
        try {
            // Try to fetch templates from the API
            const world = window.location.hostname.split('.')[0];
            const apiUrl = `/game.php?village=${game_data.village.id}&screen=api&ajax=templates`;
            
            // Make synchronous request (since this is needed immediately for UI)
            const xhr = new XMLHttpRequest();
            xhr.open('GET', apiUrl, false); // false = synchronous
            xhr.send();
            
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                
                // Parse templates from API response
                const templates = [];
                if (data && data.templates) {
                    for (const [templateId, templateData] of Object.entries(data.templates)) {
                        templates.push({
                            id: templateId,
                            name: templateData.name || `Template ${templateId}`,
                            units: templateData.units || {}
                        });
                    }
                }
                
                if (templates.length > 0) {
                    return templates;
                }
            }
        } catch (error) {
            console.warn('Could not fetch templates from API:', error);
        }
        
        try {
            // Fallback: try to get templates from game_data if available
            if (window.game_data && window.game_data.templates) {
                const templates = [];
                for (const [templateId, templateData] of Object.entries(window.game_data.templates)) {
                    templates.push({
                        id: templateId,
                        name: templateData.name || `Template ${templateId}`,
                        units: templateData.units || {}
                    });
                }
                return templates;
            }
        } catch (error) {
            console.warn('Could not load templates from game_data:', error);
        }
        
        // Mock data for development/testing when no templates are available
        console.warn('Using mock template data - please ensure you have templates created in-game');
        return [
            { id: "1", name: "Full Nuke", units: { axe: 8000, light: 3000, marcher: 1000, ram: 300, catapult: 100 } },
            { id: "2", name: "Fake", units: { spear: 1, spy: 5 } },
            { id: "3", name: "Noble Train", units: { axe: 6000, light: 2000, snob: 1 } },
            { id: "4", name: "Clear", units: { axe: 5000, light: 2000, ram: 50 } }
        ];
    };

    // Parse templates from the templates page (fallback method)
    const parseTemplatesFromPage = () => {
        try {
            // This would parse the templates from the current page HTML
            // Implementation depends on TW's template page structure
            const templates = [];
            // ... parsing logic would go here
            return templates;
        } catch (error) {
            console.warn('Could not parse templates from page:', error);
            return [];
        }
    };

    // Calculate slowest unit from a template
    const calculateSlowestUnit = (template) => {
        const unitSpeeds = {
            spear: 18, sword: 22, axe: 18, archer: 18, spy: 9,
            light: 10, marcher: 10, heavy: 11, ram: 30, catapult: 30,
            knight: 10, snob: 35
        };
        
        let slowestUnit = '';
        let slowestSpeed = 0;
        
        Object.keys(template.units || {}).forEach(unit => {
            if (template.units[unit] > 0 && unitSpeeds[unit] > slowestSpeed) {
                slowestSpeed = unitSpeeds[unit];
                slowestUnit = unit;
            }
        });
        
        return slowestUnit;
    };

    // Calculate send time based on arrival time, distance, and unit speed
    const calculateSendTime = (arrivalTime, attackingCoords, targetCoords, slowestUnit) => {
        try {
            const unitSpeeds = {
                spear: 18, sword: 22, axe: 18, archer: 18, spy: 9,
                light: 10, marcher: 10, heavy: 11, ram: 30, catapult: 30,
                knight: 10, snob: 35
            };
            
            // Calculate distance between villages
            const [x1, y1] = attackingCoords.split('|').map(Number);
            const [x2, y2] = targetCoords.split('|').map(Number);
            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            
            // Get unit speed and world settings
            const unitSpeed = unitSpeeds[slowestUnit] || 18;
            const worldSpeed = window.game_data ? (window.game_data.speed || 1) : 1;
            const unitSpeed_config = window.game_data ? (window.game_data.config?.speed || 1) : 1;
            
            // Calculate travel time in minutes
            const travelTimeMinutes = distance * unitSpeed / (worldSpeed * unitSpeed_config);
            
            // Calculate send time
            const arrivalDate = window.CAP.parseServerTimeString(arrivalTime);
            const sendDate = new Date(arrivalDate.getTime() - (travelTimeMinutes * 60 * 1000));
            
            return window.CAP.formatDateForDisplay(sendDate);
        } catch (error) {
            console.warn('Error calculating send time:', error);
            // Return current server time as fallback, not ISO
            return window.CAP.formatDateForDisplay(new Date());
        }
    };

    // Finalize plan with template and unit assignments
    const finalizePlan = (planData, templateAssignments, unitAssignments = null) => {
        try {
            const userTemplates = getUserTemplates();
            
            const finalizedAttacks = planData.attacks.map((attack, index) => {
                // Check if attack already has valid template or slowest unit
                if (isAttackReady(attack)) {
                    // Attack is already ready, no changes needed
                    return { ...attack };
                }
                
                // Attack needs finalization from assignments
                const templateAssignment = templateAssignments[index];
                const unitAssignment = unitAssignments ? unitAssignments[index] : null;
                
                if (!templateAssignment && !unitAssignment) {
                    throw new Error(`No template or unit assignment for attack ${index + 1}`);
                }
                
                let slowestUnit, template;
                
                if (templateAssignment) {
                    // Use template assignment
                    template = userTemplates.find(t => t.name === templateAssignment);
                    if (!template) {
                        throw new Error(`Template '${templateAssignment}' not found`);
                    }
                    slowestUnit = calculateSlowestUnit(template);
                } else if (unitAssignment) {
                    // Use unit assignment
                    slowestUnit = unitAssignment;
                    template = null;
                }
                
                return {
                    ...attack,
                    template: template ? template.name : attack.template,
                    slowestUnit: slowestUnit
                };
            });
            
            const finalizedPlan = {
                ...planData,
                attacks: finalizedAttacks,
                exportedAt: new Date().toISOString()
            };
            
            // Validate the finalized plan
            const validator = window.CAP.Validation.PlanValidators[finalizedPlan.version];
            if (validator) {
                const validation = validator.validate(finalizedPlan);
                if (!validation.isValid) {
                    return { isValid: false, error: 'Finalized plan validation failed: ' + validation.errors.join('; ') };
                }
            }
            
            return { isValid: true, planData: finalizedPlan };
        } catch (error) {
            return { isValid: false, error: 'Failed to finalize plan: ' + error.message };
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
        exportPlan,
        exportExistingPlan,
        
        // Plan import and template assignment
        importPlan,
        hasTemplateAssigned,
        hasSlowestUnitAssigned,
        isAttackReady,
        isPlanReadyForExecution,
        needsTemplateAssignment,
        getAttacksNeedingTemplates,
        getUserTemplates,
        finalizePlan
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

                // Validate attacking village coordinates
                if (attack.attackingVillage && !/^\d{1,3}\|\d{1,3}$/.test(attack.attackingVillage)) {
                    errors.push(prefix + 'Invalid attackingVillage format (expected: xxx|yyy)');
                }

                // Validate target village coordinates
                if (attack.targetVillage && !/^\d{1,3}\|\d{1,3}$/.test(attack.targetVillage)) {
                    errors.push(prefix + 'Invalid targetVillage format (expected: xxx|yyy)');
                }

                // Validate server time format (YYYY-MM-DD HH:MM:SS)
                const serverTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
                if (attack.arrivalTime && !serverTimeRegex.test(attack.arrivalTime)) {
                    errors.push(prefix + 'Invalid arrivalTime format (expected: YYYY-MM-DD HH:MM:SS)');
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
        const defaultTimeStr = window.CAP.formatDateForDisplay(defaultTime);

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

    // Show edit attack dialog
    const showEditAttackDialog = (attackId) => {
        // Get the existing attack data
        const attack = window.CAP.State.getAttackById(attackId);
        if (!attack) {
            alert('Attack not found');
            return;
        }

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
                .cap-edit-attack-dialog-buttons {
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
                const isSelected = attack.attackingVillage.id === villageId ? 'selected' : '';
                attackingVillageOptions += `<option value="${villageId}" ${isSelected}>${village.name} (${village.coords})</option>`;
            }
        });

        // Get available target villages
        const targetVillages = window.CAP.State.getTargetVillages();
        let targetVillageOptions = '';
        targetVillages.forEach((village, coords) => {
            const isSelected = attack.targetVillage.coords === coords ? 'selected' : '';
            targetVillageOptions += `<option value="${coords}" ${isSelected}>${village.name} (${coords}) - ${village.player}</option>`;
        });

        // Format the existing landing time for display (already a server time string)
        const landingTimeStr = attack.arrivalTime;

        const html = `
            ${styles}
            <div class="cap-attack-form">
                <h3>Edit Attack</h3>
                <div class="cap-attack-form-group">
                    <label for="cap-edit-attack-attacking-village">Attacking Village:</label>
                    <select id="cap-edit-attack-attacking-village">
                        <option value="">-- Select Attacking Village --</option>
                        ${attackingVillageOptions}
                    </select>
                </div>
                <div class="cap-attack-form-group">
                    <label for="cap-edit-attack-target-village">Target Village:</label>
                    <select id="cap-edit-attack-target-village">
                        <option value="">-- Select Target Village --</option>
                        ${targetVillageOptions}
                    </select>
                </div>
                <div class="cap-attack-form-group">
                    <label for="cap-edit-attack-landing-time">Landing Time (Server Time):</label>
                    <input type="text" id="cap-edit-attack-landing-time" value="${landingTimeStr}" placeholder="YYYY-MM-DD HH:MM:SS">
                    <small style="display: block; margin-top: 5px; color: #666;">Format: YYYY-MM-DD HH:MM:SS (e.g., 2025-09-05 15:30:00)</small>
                </div>
                <div class="cap-attack-form-group">
                    <label for="cap-edit-attack-notes">Notes (Optional):</label>
                    <textarea id="cap-edit-attack-notes" placeholder="Optional notes about this attack...">${attack.notes || ''}</textarea>
                </div>
                <div class="cap-edit-attack-dialog-buttons">
                    <button class="cap-button" id="cap-edit-attack-cancel">Cancel</button>
                    <button class="cap-button" id="cap-edit-attack-save">Save Changes</button>
                </div>
            </div>
        `;

        Dialog.show('EditAttack', html);

        // Bind dialog events
        document.getElementById('cap-edit-attack-cancel').onclick = function() {
            Dialog.close();
        };

        document.getElementById('cap-edit-attack-save').onclick = function() {
            saveEditedAttack(attackId);
        };
    };

    // Save edited attack
    const saveEditedAttack = (attackId) => {
        const attackingVillageId = document.getElementById('cap-edit-attack-attacking-village').value;
        const targetVillageCoords = document.getElementById('cap-edit-attack-target-village').value;
        const landingTime = document.getElementById('cap-edit-attack-landing-time').value.trim();
        const notes = document.getElementById('cap-edit-attack-notes').value.trim();

        // Basic validation
        if (!attackingVillageId) {
            alert('Please select an attacking village');
            return;
        }

        if (!targetVillageCoords) {
            alert('Please select a target village');
            return;
        }

        // Validate landing time format
        const timeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        if (!timeRegex.test(landingTime)) {
            alert('Invalid landing time format. Please use YYYY-MM-DD HH:MM:SS');
            return;
        }

        // Validate landing time is in the future
        const landingDate = window.CAP.parseServerTimeString(landingTime);
        let serverTime;
        
        try {
            serverTime = window.CAP.getCurrentServerTime();
        } catch (error) {
            alert('Cannot validate time - unable to determine server time. Please refresh the page.');
            return;
        }
        
        if (landingDate <= serverTime) {
            alert('Landing time must be in the future');
            return;
        }

        // Get village details for the updated attack
        const attackingPlayer = window.CAP.State.getAttackingPlayer();
        const playerVillages = window.CAP.State.getPlayerVillages(attackingPlayer);
        const attackingVillage = playerVillages[attackingVillageId];
        
        const targetVillages = window.CAP.State.getTargetVillages();
        const targetVillage = targetVillages.get(targetVillageCoords);

        if (!attackingVillage) {
            alert('Selected attacking village not found');
            return;
        }

        if (!targetVillage) {
            alert('Selected target village not found');
            return;
        }

        // Check for duplicate attacks (excluding the current attack being edited)
        const existingAttacks = window.CAP.State.getAttacks();
        // Compare server time strings directly, no conversion
        const duplicate = existingAttacks.find(attack => 
            attack.id !== attackId && // Exclude current attack
            attack.attackingVillage.id === attackingVillageId &&
            attack.targetVillage.coords === targetVillageCoords &&
            attack.arrivalTime === landingTime
        );
        
        if (duplicate) {
            alert('An identical attack (same attacking village, target, and time) already exists');
            return;
        }

        // Prepare the updates
        const updates = {
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
            arrivalTime: landingTime, // Keep as server time string
            notes: notes
        };

        // Update the attack
        window.CAP.State.updateAttack(attackId, updates);
        
        // Update UI
        updateAttackTable();
        
        // Close dialog and show success
        Dialog.close();
        
        // Show success message using the same pattern as other parts of the code
        if (typeof UI !== 'undefined' && UI.SuccessMessage) {
            UI.SuccessMessage('Attack updated successfully');
        } else {
            alert('Attack updated successfully');
        }
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
        const defaultTimeStr = window.CAP.formatDateForDisplay(defaultTime);

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
                    • For each attack, select a <strong>Slowest Unit</strong> to calculate send times<br>
                    • Use the mass assignment feature to quickly set all attacks to the same unit type<br>
                    • All attacks must be configured before the plan can be finalized
                </div>
                
                <!-- Mass Assignment Section -->
                <div style="margin-bottom: 20px; padding: 15px; background: rgba(76,175,80,0.1); border: 1px solid #4CAF50; border-radius: 4px;">
                    <h3 style="margin: 0 0 10px 0; color: #2E7D32; font-size: 14px;">Mass Assignment</h3>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <label for="cap-mass-unit-select" style="font-weight: bold; color: #5D4037;">Set all attacks to:</label>
                        <select id="cap-mass-unit-select" style="width: 180px; font-size: 12px;">
                            <option value="">Select Unit...</option>
                            <option value="spear">Spear fighter</option>
                            <option value="sword">Swordsman</option>
                            <option value="axe">Axeman</option>
                            <option value="archer">Archer</option>
                            <option value="spy">Scout</option>
                            <option value="light">Light cavalry</option>
                            <option value="marcher">Mounted archer</option>
                            <option value="heavy">Heavy cavalry</option>
                            <option value="ram">Ram</option>
                            <option value="catapult">Catapult</option>
                            <option value="knight">Paladin</option>
                            <option value="snob">Nobleman</option>
                        </select>
                        <button class="cap-button" id="cap-mass-assign-btn" style="font-size: 12px; padding: 8px 16px;">Apply to All</button>
                        <button class="cap-button" id="cap-clear-all-btn" style="font-size: 12px; padding: 8px 16px; background: #f44336;">Clear All</button>
                    </div>
                </div>
                
                <div style="margin: 20px 0; max-height: 400px; overflow-y: auto;">
                    <table class="vis" style="width: 100%; font-size: 12px;">
                        <thead>
                            <tr>
                                <th style="text-align: center; width: 40px;">#</th>
                                <th style="width: 180px;">From</th>
                                <th style="width: 180px;">To</th>
                                <th style="width: 140px;">Landing Time</th>
                                <th style="width: 120px;">Current Status</th>
                                <th style="width: 180px;">Slowest Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${planData.attacks.map((attack, index) => {
                                const isReady = window.CAP.State.isAttackReady(attack);
                                const hasUnit = window.CAP.State.hasSlowestUnitAssigned(attack);
                                
                                let statusText = 'Needs Configuration';
                                let statusColor = 'red';
                                
                                if (hasUnit) {
                                    statusText = `Unit: ${attack.slowestUnit}`;
                                    statusColor = 'green';
                                }
                                
                                // Determine current selection for UI state
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
                                            <select id="slowest-unit-${index}" class="cap-unit-select" 
                                                    style="width: 160px; font-size: 11px;"
                                                    onchange="handleUnitSelection(${index}, this.value)">
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
        
        // Add the simplified unit selection handler function to global scope
        window.handleUnitSelection = function(attackIndex, value) {
            // Update the attack data with the selected unit
            if (planData.attacks[attackIndex]) {
                if (value) {
                    planData.attacks[attackIndex].slowestUnit = value;
                } else {
                    delete planData.attacks[attackIndex].slowestUnit;
                }
                console.log(`Attack ${attackIndex} unit set to: ${value || 'none'}`);
            }
        };
        
        // Add mass assignment handler
        window.handleMassAssign = function() {
            const selectedUnit = document.getElementById('cap-mass-unit-select').value;
            if (!selectedUnit) {
                alert('Please select a unit type first.');
                return;
            }
            
            // Apply to all unit selects and update attack data
            const unitSelects = document.querySelectorAll('.cap-unit-select');
            unitSelects.forEach((select, index) => {
                select.value = selectedUnit;
                // Update the corresponding attack data
                if (planData.attacks[index]) {
                    planData.attacks[index].slowestUnit = selectedUnit;
                }
            });
            
            console.log(`Mass assigned all attacks to: ${selectedUnit}`);
        };
        
        // Add clear all handler
        window.handleClearAll = function() {
            if (confirm('Are you sure you want to clear all unit assignments?')) {
                const unitSelects = document.querySelectorAll('.cap-unit-select');
                unitSelects.forEach((select, index) => {
                    select.value = '';
                    // Clear the attack data
                    if (planData.attacks[index]) {
                        delete planData.attacks[index].slowestUnit;
                    }
                });
                console.log('Cleared all unit assignments');
            }
        };
        
        // Bind events
        document.getElementById('cap-mass-assign-btn').onclick = window.handleMassAssign;
        document.getElementById('cap-clear-all-btn').onclick = window.handleClearAll;
        document.getElementById('cap-finalize-plan').onclick = () => handleFinalizePlan(planData);
        document.getElementById('cap-template-cancel').onclick = () => {
            Dialog.close();
            showInitialScreen();
        };
    };

    // Handle plan finalization
    const handleFinalizePlan = (planData) => {
        // Check that all attacks have required configurations
        let missingConfigurations = [];
        
        for (let i = 0; i < planData.attacks.length; i++) {
            const attack = planData.attacks[i];
            
            if (!window.CAP.State.isAttackReady(attack)) {
                // Attack needs slowest unit assignment
                if (!window.CAP.State.hasSlowestUnitAssigned(attack)) {
                    missingConfigurations.push(i + 1);
                }
            }
        }
        
        // Check if any configurations are missing
        if (missingConfigurations.length > 0) {
            const attackText = missingConfigurations.length === 1 ? 'attack' : 'attacks';
            const attackList = missingConfigurations.length <= 3 ? 
                missingConfigurations.join(', ') : 
                `${missingConfigurations.slice(0, 3).join(', ')} and ${missingConfigurations.length - 3} more`;
            
            alert(`Please configure ${attackText} ${attackList} with a slowest unit before finalizing the plan.`);
            return;
        }
        
        // Create unit assignments array based on current attack data
        const unitAssignments = planData.attacks.map(attack => {
            return window.CAP.State.isAttackReady(attack) ? null : attack.slowestUnit || '';
        });
        
        // Finalize the plan with unit assignments only (no templates)
        const finalizeResult = window.CAP.State.finalizePlan(planData, [], unitAssignments);
        
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
                                        sendTimeTarget = sendTime; // Keep as server time string
                                        
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
                
                // Parse server time string to Date object
                const target = window.CAP.parseServerTimeString(targetTime);
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
        showEditAttackDialog,
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

// ==================================================
// MAIN FILE
// ==================================================

/**
 * Coordinated Attack Planner v ALPHA 0.1.0
 */

(function() {
    // Utility function to get current server time
    function getCurrentServerTime() {
        try {
            // Try to get server time from the DOM element that displays it
            const serverTimeElement = document.getElementById('serverTime');
            if (serverTimeElement) {
                const timeText = serverTimeElement.closest('p').textContent;
                const timeMatch = timeText.match(/\d+/g);
                
                if (timeMatch && timeMatch.length >= 6) {
                    const [hour, min, sec, day, month, year] = timeMatch;
                    return new Date(year, month - 1, day, hour, min, sec);
                }
            }
            
            // Fallback: try to find server time in other common locations
            const timeElements = document.querySelectorAll('td, span, div');
            for (const element of timeElements) {
                const text = element.textContent;
                // Look for time format like "12:34:56 01/02/2025" or similar
                const timeMatch = text.match(/(\d{1,2}):(\d{2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (timeMatch) {
                    const [, hour, min, sec, day, month, year] = timeMatch;
                    return new Date(year, month - 1, day, hour, min, sec);
                }
            }
            
            // If we can't find server time, this is a critical error
            showServerTimeError();
            throw new Error('Cannot find server time - coordinated attack timing would be inaccurate');
        } catch (e) {
            showServerTimeError();
            throw new Error('Error getting server time: ' + e.message);
        }
    }

    // Show critical error banner when server time cannot be determined
    function showServerTimeError() {
        // Remove any existing error banner
        const existingBanner = document.getElementById('cap-server-time-error');
        if (existingBanner) existingBanner.remove();

        // Create error banner
        const errorBanner = document.createElement('div');
        errorBanner.id = 'cap-server-time-error';
        errorBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background-color: #d32f2f;
            color: white;
            padding: 15px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            z-index: 999999;
            border-bottom: 3px solid #b71c1c;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        errorBanner.innerHTML = `
            ⚠️ CRITICAL ERROR: Cannot determine server time! 
            Coordinated Attack Planner cannot function safely. 
            Please refresh the page and try again. 
            <button onclick="this.parentElement.remove()" style="margin-left: 15px; background: white; color: #d32f2f; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Dismiss</button>
        `;

        // Insert at the beginning of the body
        document.body.insertBefore(errorBanner, document.body.firstChild);

        console.error('CAP: Critical error - cannot determine server time for coordinated attacks');
    }

    // Make the utility function globally available
    window.CAP = window.CAP || {};
    window.CAP.getCurrentServerTime = getCurrentServerTime;

    // Utility function to calculate send time based on arrival time, distance, and unit speed
    function calculateSendTime(arrivalTime, attackingCoords, targetCoords, slowestUnit) {
        try {
            const unitSpeeds = {
                spear: 18, sword: 22, axe: 18, archer: 18, spy: 9,
                light: 10, marcher: 10, heavy: 11, ram: 30, catapult: 30,
                knight: 10, snob: 35
            };
            
            // Calculate distance between villages
            const [x1, y1] = attackingCoords.split('|').map(Number);
            const [x2, y2] = targetCoords.split('|').map(Number);
            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            
            // Get unit speed and world settings
            const unitSpeed = unitSpeeds[slowestUnit] || 18;
            const worldSpeed = window.game_data ? (window.game_data.speed || 1) : 1;
            const unitSpeed_config = window.game_data ? (window.game_data.config?.speed || 1) : 1;
            
            // Calculate travel time in minutes
            const travelTimeMinutes = distance * unitSpeed / (worldSpeed * unitSpeed_config);
            
            // Calculate send time
            const arrivalDate = parseServerTimeString(arrivalTime);
            const sendDate = new Date(arrivalDate.getTime() - (travelTimeMinutes * 60 * 1000));
            
            return formatDateForDisplay(sendDate);
        } catch (error) {
            console.warn('Error calculating send time:', error);
            throw new Error('Cannot calculate send time: ' + error.message);
        }
    }

    // Make the calculateSendTime function globally available
    window.CAP.calculateSendTime = calculateSendTime;

    // Utility function to calculate travel time in minutes
    function calculateTravelTime(attackingCoords, targetCoords, slowestUnit) {
        try {
            const unitSpeeds = {
                spear: 18, sword: 22, axe: 18, archer: 18, spy: 9,
                light: 10, marcher: 10, heavy: 11, ram: 30, catapult: 30,
                knight: 10, snob: 35
            };
            
            // Calculate distance between villages
            const [x1, y1] = attackingCoords.split('|').map(Number);
            const [x2, y2] = targetCoords.split('|').map(Number);
            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            
            // Get unit speed and world settings
            const unitSpeed = unitSpeeds[slowestUnit] || 18;
            const worldSpeed = window.game_data ? (window.game_data.speed || 1) : 1;
            const unitSpeed_config = window.game_data ? (window.game_data.config?.speed || 1) : 1;
            
            // Calculate travel time in minutes
            const travelTimeMinutes = distance * unitSpeed / (worldSpeed * unitSpeed_config);
            
            return travelTimeMinutes;
        } catch (error) {
            console.warn('Error calculating travel time:', error);
            return 0;
        }
    }

    // Utility function to format travel time for display
    function formatTravelTime(minutes) {
        if (minutes === 0) return '--';
        
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        const secs = Math.floor((minutes % 1) * 60);
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        } else if (mins > 0) {
            return `${mins}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    // Utility function to get village display name with link
    function getVillageDisplayName(coords, villageName = null, playerName = null) {
        const displayName = villageName || coords;
        // Extract x and y coordinates for the info_village URL
        const [x, y] = coords.split('|');
        const linkUrl = `/game.php?screen=info_village&x=${x}&y=${y}`;
        
        if (playerName) {
            return `<a href="${linkUrl}" target="_blank" title="View village info">${displayName}</a> <span style="color: #666;">(${playerName})</span>`;
        } else {
            return `<a href="${linkUrl}" target="_blank" title="View village info">${displayName}</a>`;
        }
    }

    // Helper function to get full village information with proper ID-based link
    async function getVillageFullInfo(coords) {
        try {
            const currentVillageId = game_data.village.id;
            const encodedCoords = encodeURIComponent(coords);
            const apiUrl = `/game.php?village=${currentVillageId}&screen=api&ajax=target_selection&input=${encodedCoords}&type=coord&request_id=${Date.now()}&limit=8&offset=0`;
            
            const response = await $.get(apiUrl);
            let data;
            if (typeof response === 'string') {
                data = JSON.parse(response);
            } else {
                data = response;
            }
            
            if (data && data.villages && Array.isArray(data.villages)) {
                const village = data.villages.find(v => 
                    v.x && v.y && `${v.x}|${v.y}` === coords
                );
                
                if (village && village.id) {
                    // Format the full name like "002 Aegis (307|441)"
                    const fullName = `${village.name} (${coords})`;
                    const linkUrl = `/game.php?screen=info_village&id=${village.id}#${coords.replace('|', ';')}`;
                    
                    return {
                        id: village.id,
                        name: village.name,
                        fullName: fullName,
                        coords: coords,
                        playerName: village.player_name || null,
                        linkUrl: linkUrl,
                        found: true
                    };
                }
            }
            
            // Fallback if village not found
            return {
                id: null,
                name: null,
                fullName: coords,
                coords: coords,
                playerName: null,
                linkUrl: `/game.php?screen=info_village&x=${coords.split('|')[0]}&y=${coords.split('|')[1]}`,
                found: false
            };
        } catch (error) {
            console.warn('Error looking up village info:', error);
            return {
                id: null,
                name: null,
                fullName: coords,
                coords: coords,
                playerName: null,
                linkUrl: `/game.php?screen=info_village&x=${coords.split('|')[0]}&y=${coords.split('|')[1]}`,
                found: false
            };
        }
    }

    // Utility function to create village display with proper link and full name
    async function getVillageDisplayNameWithLookup(coords, cachedVillageName = null, cachedPlayerName = null) {
        // If we already have the village name from cache, use it to create the full display
        if (cachedVillageName) {
            const fullName = `${cachedVillageName} (${coords})`;
            // Try to get the ID for a proper link, but don't wait for it
            getVillageFullInfo(coords).then(info => {
                if (info.found) {
                    // Update the link in the DOM if possible
                    const linkElement = document.querySelector(`a[data-coords="${coords}"]`);
                    if (linkElement) {
                        linkElement.href = info.linkUrl;
                    }
                }
            }).catch(() => {
                // Ignore errors for async updates
            });
            
            const fallbackUrl = `/game.php?screen=info_village&x=${coords.split('|')[0]}&y=${coords.split('|')[1]}`;
            const playerDisplay = cachedPlayerName ? ` <span style="color: #666;">(${cachedPlayerName})</span>` : '';
            return `<a href="${fallbackUrl}" target="_blank" title="View village info" data-coords="${coords}">${fullName}</a>${playerDisplay}`;
        }
        
        // Otherwise, do a full lookup
        const villageInfo = await getVillageFullInfo(coords);
        const playerDisplay = villageInfo.playerName ? ` <span style="color: #666;">(${villageInfo.playerName})</span>` : '';
        return `<a href="${villageInfo.linkUrl}" target="_blank" title="View village info" data-coords="${coords}">${villageInfo.fullName}</a>${playerDisplay}`;
    }

    // Make utility functions globally available
    window.CAP.calculateTravelTime = calculateTravelTime;
    window.CAP.formatTravelTime = formatTravelTime;
    window.CAP.getVillageDisplayName = getVillageDisplayName;
    window.CAP.getVillageFullInfo = getVillageFullInfo;
    window.CAP.getVillageDisplayNameWithLookup = getVillageDisplayNameWithLookup;
    window.CAP.getVillageDisplayNameWithLookup = getVillageDisplayNameWithLookup;

    // Centralized time handling utilities to ensure consistent behavior
    // All times are kept as server time strings (YYYY-MM-DD HH:MM:SS format)
    // NO conversion to UTC/ISO should ever happen for attack times
    
    // Convert YYYY-MM-DD HH:MM:SS format to Date object (server time as local time)
    function parseServerTimeString(timeString) {
        return new Date(timeString.replace(' ', 'T'));
    }

    // Format Date object to YYYY-MM-DD HH:MM:SS for display (NO ISO conversion)
    function formatDateForDisplay(dateObject) {
        const year = dateObject.getFullYear();
        const month = String(dateObject.getMonth() + 1).padStart(2, '0');
        const day = String(dateObject.getDate()).padStart(2, '0');
        const hours = String(dateObject.getHours()).padStart(2, '0');
        const minutes = String(dateObject.getMinutes()).padStart(2, '0');
        const seconds = String(dateObject.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // Validate server time string format
    function validateServerTimeString(timeString) {
        const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        return regex.test(timeString);
    }

    // Make time utilities globally available
    window.CAP.parseServerTimeString = parseServerTimeString;
    window.CAP.formatDateForDisplay = formatDateForDisplay;
    window.CAP.validateServerTimeString = validateServerTimeString;
    window.CAP.formatDateForDisplay = formatDateForDisplay;

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
            window.CAP.UI.showImportDialog();
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
        window.CAP.UI.showEditAttackDialog(attackId);
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
        const landingDate = window.CAP.parseServerTimeString(landingTime);
        let serverTime;
        
        try {
            serverTime = window.CAP.getCurrentServerTime();
        } catch (error) {
            return { isValid: false, message: 'Cannot validate time - unable to determine server time. Please refresh the page.' };
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
            arrivalTime: landingTime, // Keep as server time string
            notes: notes,
            template: '', // Empty initially, filled during plan execution
            slowestUnit: '' // Empty initially, filled during plan execution
        };

        return { isValid: true, attack: attack };
    }

    function checkDuplicateAttack(attackingVillageId, targetVillageCoords, landingTime) {
        const existingAttacks = window.CAP.State.getAttacks();
        // Compare server time strings directly, no conversion
        return existingAttacks.find(attack => 
            attack.attackingVillage.id === attackingVillageId &&
            attack.targetVillage.coords === targetVillageCoords &&
            attack.arrivalTime === landingTime
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
                const attackLandingTime = window.CAP.parseServerTimeString(landingTime);
                attackLandingTime.setSeconds(attackLandingTime.getSeconds() + offsetSeconds);
                const formattedLandingTime = window.CAP.formatDateForDisplay(attackLandingTime);
                
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

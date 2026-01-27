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
            const worldSpeed = window.CAP.getWorldSpeed();
            const unitSpeed_config = window.CAP.getUnitSpeedModifier();
            
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

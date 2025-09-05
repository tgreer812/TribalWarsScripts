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
                // Convert landingTime to ISO format for arrivalTime
                const arrivalTime = new Date(attack.landingTime.replace(' ', 'T') + '.000Z').toISOString();
                
                return {
                    id: attack.id,
                    attackingVillage: attack.attackingVillage.coords,
                    targetVillage: attack.targetVillage.coords,
                    sendTime: "", // Empty - calculated at import time
                    template: "", // Empty - assigned during finalization
                    slowestUnit: "", // Empty - assigned during finalization
                    arrivalTime: arrivalTime,
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

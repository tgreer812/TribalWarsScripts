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

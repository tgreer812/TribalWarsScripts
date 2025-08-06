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

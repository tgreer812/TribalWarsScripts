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
        document.getElementById('cap-export').onclick       = () => alert('Export plan - not implemented');
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

    // Run on script load
    createModal();
})();

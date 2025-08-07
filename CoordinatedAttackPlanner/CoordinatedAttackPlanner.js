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

        // Placeholder handlers
        document.getElementById('cap-add-attack').onclick   = () => alert('Add attack - not implemented');
        document.getElementById('cap-mass-add').onclick     = () => alert('Mass add - not implemented');
        document.getElementById('cap-clear-attacks').onclick= () => alert('Clear attacks - not implemented');
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

    // Run on script load
    createModal();
})();

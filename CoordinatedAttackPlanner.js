(function() {
    // Utility to create modal
    function createModal() {
        // Remove any existing modal
        const oldModal = document.getElementById('tw-cap-modal');
        if (oldModal) oldModal.remove();

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
                .cap-form-group select, .cap-form-group input {
                    padding: 4px;
                    border: 1px solid #7D510F;
                    border-radius: 2px;
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
                
                <!-- Player Selection -->
                <div class="cap-section">
                    <h3>1. Select Target Player</h3>
                    <div class="cap-form-group">
                        <label>Player Name:</label>
                        <select id="cap-target-player">
                            <option value="">Loading players...</option>
                        </select>
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
                        <input type="text" id="cap-target-coords" placeholder="XXX|YYY,XXX|YYY">
                        <button class="cap-button cap-button-small" id="cap-add-coords">Add</button>
                    </div>
                    <div class="cap-form-group">
                        <label>Target Player:</label>
                        <select id="cap-target-player-villages">
                            <option value="">Select a player...</option>
                        </select>
                        <button class="cap-button cap-button-small" id="cap-add-player-villages">Add All Villages</button>
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
        bindPlanDesignEvents();
        loadPlayerData();
    }

    // Bind events for plan design page
    function bindPlanDesignEvents() {
        // Back button
        document.getElementById('cap-back').onclick = function() {
            Dialog.close();
            createModal();
        };

        // Placeholder event handlers
        document.getElementById('cap-select-all-attackers').onclick = function() {
            alert('Select all attackers - not implemented');
        };

        document.getElementById('cap-clear-attackers').onclick = function() {
            alert('Clear attackers - not implemented');
        };

        document.getElementById('cap-add-coords').onclick = function() {
            alert('Add coordinates - not implemented');
        };

        document.getElementById('cap-add-player-villages').onclick = function() {
            alert('Add player villages - not implemented');
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
    }

    // Load player and village data
    function loadPlayerData() {
        // Placeholder - load current player's villages for attacking
        document.getElementById('cap-attacker-villages').innerHTML = 'Loading your villages...';
        
        // Placeholder - populate player dropdown
        document.getElementById('cap-target-player').innerHTML = '<option value="">Select target player...</option>';
        document.getElementById('cap-target-player-villages').innerHTML = '<option value="">Select target player...</option>';
    }

    // Run on script load
    createModal();
})();
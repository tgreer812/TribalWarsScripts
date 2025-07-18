// TRIBAL WARS SNIPE TIMING CALC
// Script registration and initialization following FarmingGod pattern
let DEBUG = true;
let branch = "main";
let scriptHost = "https://raw.githubusercontent.com"
let sdkPath = `${scriptHost}/tgreer812/TribalWarsScripts/refs/heads/${branch}/twsdk.js`

console.log("script ran");
// if (!DEBUG && typeof ScriptAPI !== 'undefined' && ScriptAPI.register) {
//     ScriptAPI.register('SnipeTiming', true, 'YourName', 'your.email@example.com');
// }

// Load TWSDK if not already loaded
if (typeof window.TWSDK === 'undefined') {
    fetch(sdkPath)
        .then(response => response.text())
        .then(script => {
            eval(script);
            console.log('TWSDK loaded successfully');
            // Initialize SDK before using it
            return window.TWSDK.Core.init();
        })
        .then(() => {
            console.log('TWSDK initialized successfully');
            initializeSnipeTiming();
        })
        .catch(error => {
            UI.ErrorMessage('Failed to load TWSDK. Please try again.');
            console.log('TWSDK load error:', error);
        });
} else {
    // SDK already loaded, ensure it's initialized
    window.TWSDK.Core.init().then(() => {
        initializeSnipeTiming();
    });
}

function initializeSnipeTiming() {
    // Main module structure
    window.SnipeTiming = {};

    // Library module - script-specific utilities
    window.SnipeTiming.Library = (function() {
        // Calculate travel time using TWSDK
        const calculateTravelTime = function(origin, target, unitName) {
            const unitSpeed = window.TWSDK.Units.getSpeed(unitName);
            const worldSpeed = window.TWSDK.Core.getWorldSpeed();
            const unitModifier = window.TWSDK.Core.getUnitSpeed();
            
            return window.TWSDK.Coords.travelTime(origin, target, unitSpeed, worldSpeed, unitModifier);
        };
        
        // Parse incoming attack time from various formats
        const parseIncomingTime = function(timeString) {
            // Try to parse using TWSDK first
            try {
                return window.TWSDK.Core.timestampFromString(timeString);
            } catch (e) {
                // Fallback for simple HH:MM:SS:mmm format
                const parts = timeString.split(':');
                if (parts.length >= 3) {
                    const now = new Date();
                    now.setHours(parseInt(parts[0]));
                    now.setMinutes(parseInt(parts[1]));
                    now.setSeconds(parseInt(parts[2]));
                    if (parts[3]) {
                        now.setMilliseconds(parseInt(parts[3]));
                    }
                    return now.getTime();
                }
                return new Date().getTime() + 3600000; // 1 hour from now as fallback
            }
        };
        
        return {
            calculateTravelTime,
            parseIncomingTime
        };
    })();

    // Translation module for multi-language support
    window.SnipeTiming.Translation = (function() {
        const messages = {
            en_US: {
                title: 'Snipe Timing Calculator',
                targetCoords: 'Target coordinates:',
                arrivalTime: 'Incoming arrival time:',
                snipeOffset: 'Snipe offset (ms):',
                ownVillages: 'Your villages:',
                calculateBtn: 'Calculate Timings',
                selectAll: 'Select All',
                deselectAll: 'Deselect All',
                unitSelection: 'Unit Selection:',
                villageSelection: 'Village Selection:',
                results: {
                    village: 'Village',
                    unit: 'Unit',
                    sendTime: 'Send Time',
                    travelTime: 'Travel Time',
                    arrival: 'Arrival',
                    actions: 'Actions',
                    copy: 'Copy'
                },
                units: {
                    snob: 'Noble',
                    heavy: 'Heavy Cavalry',
                    light: 'Light Cavalry',
                    marcher: 'Mounted Archer',
                    axe: 'Axe',
                    sword: 'Sword',
                    spear: 'Spear',
                    archer: 'Archer'
                },
                debug: 'Debug mode',
                debugInfo: 'Debug Information',
                worldSpeed: 'World Speed',
                unitSpeed: 'Unit Speed',
                serverTime: 'Server Time',
                morale: 'Morale',
                nightBonus: 'Night Bonus',
                church: 'Church',
                watchtower: 'Watchtower',
                worldSettings: 'World Settings',
            }
        };
        
        const get = function() {
            let lang = messages.hasOwnProperty(game_data.locale) ? game_data.locale : 'en_US';
            return messages[lang];
        };
        
        return { get };
    })();

    // Main application module
    window.SnipeTiming.Main = (function(Library, Translation) {
        const t = Translation.get();
        const lib = Library;
        
        // State management
        let targetData = {
            coords: null,
            arrivalTime: null,
            snipeOffset: 50  // Default 50ms after incoming
        };
        
        let villageData = {};  // Store user's villages and available troops
        let calculatedTimings = [];  // Store calculated snipe timings
        let worldSpeed = 1;  // Store world speed
        let unitSpeedModifier = 1;  // Store unit speed modifier
        let debugMode = false;  // Debug mode flag
        let worldSettings = {};  // Store all world settings
        
        // Initialize function - entry point
        const init = function() {
            // Check for premium features if needed
            if (!game_data.features.Premium.active) {
                UI.ErrorMessage('This script requires a premium account');
                return;
            }
            
            // World settings should already be loaded from SDK init
            fetchWorldSpeed();
            // Show main dialog
            buildMainDialog();
        };
        
        // Fetch world speed from SDK
        const fetchWorldSpeed = function() {
            worldSpeed = window.TWSDK.Core.getWorldSpeed();
            unitSpeedModifier = window.TWSDK.Core.getUnitSpeed();
            worldSettings = window.TWSDK.Core.getWorldSettings();
            updateDebugInfo();
        };
        
        // Update debug information display
        const updateDebugInfo = function() {
            if (debugMode && $('#debug-info').length) {
                const serverTime = window.TWSDK.Core.getCurrentServerTime();
                const debugHtml = `
                    <div style="padding: 10px; background: #f4f4f4; border: 1px solid #ccc; font-size: 12px;">
                        <strong>${t.debugInfo}:</strong><br>
                        ${t.worldSpeed}: ${worldSpeed}x<br>
                        ${t.unitSpeed}: ${unitSpeedModifier}x<br>
                        ${t.morale}: ${window.TWSDK.Core.getMorale() ? 'Enabled' : 'Disabled'}<br>
                        ${t.nightBonus}: ${window.TWSDK.Core.getNightBonus() ? 'Enabled' : 'Disabled'}<br>
                        ${t.church}: ${window.TWSDK.Core.getChurch() ? 'Enabled' : 'Disabled'}<br>
                        ${t.watchtower}: ${window.TWSDK.Core.getWatchtower() ? 'Enabled' : 'Disabled'}<br>
                        ${t.serverTime}: ${new Date(serverTime).toLocaleString()}<br>
                        Target Coords: ${targetData.coords || 'Not set'}<br>
                        Villages Loaded: ${Object.keys(villageData).length}<br>
                        <details style="margin-top: 5px;">
                            <summary style="cursor: pointer;">${t.worldSettings}</summary>
                            <pre style="font-size: 10px; margin: 5px 0;">${JSON.stringify(worldSettings, null, 2)}</pre>
                        </details>
                    </div>
                `;
                $('#debug-info').html(debugHtml);
            }
        };
        
        // Build main UI dialog
        const buildMainDialog = function() {
            const styles = `
                <style>
                    #popup_box_SnipeTiming {
                        width: 700px;
                        position: relative;
                    }
                    .snipe-content {
                        padding: 10px;
                    }
                    .snipe-section {
                        margin-bottom: 15px;
                        padding: 10px;
                        background: url('graphic/index/main_bg.jpg') 100% 0% #E3D5B3;
                        border: 1px solid #7D510F;
                    }
                    .snipe-input-group {
                        margin: 5px 0;
                    }
                    .snipe-input-group label {
                        display: inline-block;
                        width: 150px;
                        font-weight: bold;
                    }
                    .snipe-input-group input[type="text"] {
                        width: 200px;
                    }
                    .snipe-slider {
                        width: 300px;
                        display: inline-block;
                        margin: 0 10px;
                    }
                    .snipe-slider-value {
                        display: inline-block;
                        width: 50px;
                        font-weight: bold;
                    }
                    .village-selection-table {
                        width: 100%;
                        margin-top: 10px;
                    }
                    .village-selection-table th {
                        background: #c1a264;
                        padding: 5px;
                    }
                    .unit-selection {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        margin-top: 10px;
                    }
                    .unit-checkbox {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }
                    .unit-checkbox img {
                        width: 20px;
                        height: 20px;
                    }
                    .snipe-results {
                        margin-top: 20px;
                        max-height: 400px;
                        overflow-y: auto;
                    }
                    .calculate-button {
                        margin: 20px auto;
                        display: block;
                        font-size: 14px;
                        padding: 10px 20px;
                    }
                    .debug-section {
                        margin-top: 10px;
                        padding: 10px;
                        background: #f9f9f9;
                        border: 1px dashed #999;
                    }
                </style>
            `;
            
            const html = `
                ${styles}
                <div class="snipe-content">
                    <h2>${t.title}</h2>
                    
                    <!-- Debug checkbox -->
                    <div style="text-align: right; margin-bottom: 10px;">
                        <label>
                            <input type="checkbox" id="debug-mode"> ${t.debug}
                        </label>
                    </div>
                    
                    <!-- Debug section (initially hidden) -->
                    <div class="debug-section" id="debug-info" style="display: none;"></div>
                    
                    <!-- Target Information Section -->
                    <div class="snipe-section">
                        <h3>Target Information</h3>
                        <div class="snipe-input-group">
                            <label>${t.targetCoords}</label>
                            <input type="text" id="snipe-target-coords" placeholder="XXX|YYY" pattern="\\d{1,3}\\|\\d{1,3}">
                        </div>
                        <div class="snipe-input-group">
                            <label>${t.arrivalTime}</label>
                            <input type="text" id="snipe-arrival-time" placeholder="HH:MM:SS:mmm">
                        </div>
                        <div class="snipe-input-group">
                            <label>${t.snipeOffset}</label>
                            <input type="range" class="snipe-slider" id="snipe-offset" min="0" max="1000" value="50" step="10">
                            <span class="snipe-slider-value">50ms</span>
                        </div>
                    </div>
                    
                    <!-- Unit Selection Section -->
                    <div class="snipe-section">
                        <h3>${t.unitSelection}</h3>
                        <div class="unit-selection">
                            ${buildUnitCheckboxes()}
                        </div>
                    </div>
                    
                    <!-- Village Selection Section -->
                    <div class="snipe-section">
                        <h3>${t.villageSelection}</h3>
                        <div>
                            <button class="btn" id="select-all-villages">${t.selectAll}</button>
                            <button class="btn" id="deselect-all-villages">${t.deselectAll}</button>
                        </div>
                        <table class="vis village-selection-table">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" id="select-all-checkbox"></th>
                                    <th>Village</th>
                                    <th>Coordinates</th>
                                    <th>Distance</th>
                                    <th>Available Troops</th>
                                </tr>
                            </thead>
                            <tbody id="village-list">
                                ${buildVillageRows()}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Calculate Button -->
                    <button class="btn calculate-button">${t.calculateBtn}</button>
                    
                    <!-- Results Section (initially hidden) -->
                    <div class="snipe-section snipe-results" id="snipe-results" style="display: none;">
                        <h3>Snipe Timings</h3>
                        <table class="vis" style="width: 100%;">
                            <thead>
                                <tr>
                                    <th>${t.results.village}</th>
                                    <th>${t.results.unit}</th>
                                    <th>${t.results.sendTime}</th>
                                    <th>${t.results.travelTime}</th>
                                    <th>${t.results.arrival}</th>
                                    <th>${t.results.actions}</th>
                                </tr>
                            </thead>
                            <tbody id="results-tbody">
                                <!-- Results will be populated here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            Dialog.show('SnipeTiming', html);
            bindEventHandlers();
            
            // Fetch user's villages after dialog is shown
            fetchUserVillages();
        };
        
        // Build unit checkboxes
        const buildUnitCheckboxes = function() {
            const units = ['snob', 'heavy', 'light', 'marcher', 'axe', 'sword', 'spear', 'archer'];
            let html = '';
            
            units.forEach(unit => {
                html += `
                    <div class="unit-checkbox">
                        <input type="checkbox" id="unit-${unit}" value="${unit}" ${unit === 'snob' ? 'checked' : ''}>
                        <img src="/graphic/unit/unit_${unit}.png" alt="${unit}">
                        <label for="unit-${unit}">${t.units[unit]}</label>
                    </div>
                `;
            });
            
            return html;
        };
        
        // Build village rows from actual village data
        const buildVillageRows = function(villages) {
            if (!villages || villages.length === 0) {
                return '<tr><td colspan="5" style="text-align: center;">Loading villages...</td></tr>';
            }
            
            let html = '';
            villages.forEach(village => {
                const distance = targetData.coords ? 
                    window.TWSDK.Coords.distance(village.coords, targetData.coords).toFixed(1) : 
                    '0.0';
                    
                html += `
                    <tr>
                        <td><input type="checkbox" class="village-checkbox" data-id="${village.id}"></td>
                        <td><a href="/game.php?village=${village.id}&screen=overview">${village.name}</a></td>
                        <td>${village.coords}</td>
                        <td class="distance-cell" data-coords="${village.coords}">${distance}</td>
                        <td>
                            ${village.troops.snob > 0 ? `<img src="/graphic/unit/unit_snob.png" title="Noble"> ${village.troops.snob}` : ''}
                            ${village.troops.heavy > 0 ? `<img src="/graphic/unit/unit_heavy.png" title="Heavy"> ${village.troops.heavy}` : ''}
                            ${village.troops.light > 0 ? `<img src="/graphic/unit/unit_light.png" title="Light"> ${village.troops.light}` : ''}
                        </td>
                    </tr>
                `;
            });
            
            return html;
        };
        
        // Fetch user's villages and troop counts
        const fetchUserVillages = function() {
            // Show loading indicator
            $('#village-list').html('<tr><td colspan="5" style="text-align: center;">Loading villages...</td></tr>');
            
            // Use TWSDK's page processing to get all villages
            window.TWSDK.Page.processAllPages(
                TribalWars.buildURL('GET', 'overview_villages', {
                    mode: 'combined',
                    group: 0 // All villages
                }),
                function($html) {
                    // Process each page of villages
                    processVillageData($html);
                }
            ).then(function() {
                // Update the village table with fetched data
                updateVillageTable();
            }).fail(function() {
                $('#village-list').html('<tr><td colspan="5" style="text-align: center; color: red;">Failed to load villages</td></tr>');
            });
        };
        
        // Process village data from overview page
        const processVillageData = function($html) {
            const skipUnits = ['ram', 'catapult', 'knight', 'militia']; // Skip non-sniping units
            
            $html.find('#combined_table').find('.row_a, .row_b').each(function() {
                const $row = $(this);
                const $villageLink = $row.find('.quickedit-label').first();
                const villageId = $row.find('.quickedit-vn').first().data('id');
                const villageName = $villageLink.data('text');
                const villageCoords = $villageLink.text().match(/\d{1,3}\|\d{1,3}/)[0];
                
                // Get troop counts
                const troops = {};
                $row.find('.unit-item').each(function(index) {
                    const unitType = game_data.units[index];
                    if (unitType && skipUnits.indexOf(unitType) === -1) {
                        const count = parseInt($(this).text()) || 0;
                        if (count > 0) {
                            troops[unitType] = count;
                        }
                    }
                });
                
                // Store village data
                villageData[villageId] = {
                    id: villageId,
                    name: villageName,
                    coords: villageCoords,
                    troops: troops
                };
            });
        };
        
        // Update the village table with fetched data
        const updateVillageTable = function() {
            const villages = Object.values(villageData);
            const html = buildVillageRows(villages);
            $('#village-list').html(html);
        };
        
        // Event handlers
        const bindEventHandlers = function() {
            // Slider update
            $('#snipe-offset').on('input', function() {
                $(this).next('.snipe-slider-value').text($(this).val() + 'ms');
            });
            
            // Select all villages
            $('#select-all-checkbox, #select-all-villages').on('click', function() {
                $('.village-checkbox').prop('checked', true);
                $('#select-all-checkbox').prop('checked', true);
            });
            
            // Deselect all villages
            $('#deselect-all-villages').on('click', function() {
                $('.village-checkbox').prop('checked', false);
                $('#select-all-checkbox').prop('checked', false);
            });
            
            // Debug mode toggle
            $('#debug-mode').on('change', function() {
                debugMode = $(this).is(':checked');
                if (debugMode) {
                    $('#debug-info').show();
                    updateDebugInfo();
                } else {
                    $('#debug-info').hide();
                }
            });
            
            // Target coordinates input - real-time distance update
            $('#snipe-target-coords').on('input', function() {
                const coords = $(this).val();
                const parsed = window.TWSDK.Coords.parse(coords);
                
                if (parsed) {
                    targetData.coords = coords;
                    updateDistances();
                    updateDebugInfo();
                } else {
                    targetData.coords = null;
                    updateDistances();
                    updateDebugInfo();
                }
            });
            
            // Arrival time input
            $('#snipe-arrival-time').on('input', function() {
                const timeStr = $(this).val();
                if (timeStr) {
                    targetData.arrivalTime = lib.parseIncomingTime(timeStr);
                    updateDebugInfo();
                }
            });
            
            // Snipe offset slider
            $('#snipe-offset').on('input', function() {
                targetData.snipeOffset = parseInt($(this).val());
                $(this).next('.snipe-slider-value').text($(this).val() + 'ms');
                updateDebugInfo();
            });
            
            // Calculate button
            $('.calculate-button').on('click', function() {
                calculateTimings();
            });
        };
        
        // Update all distance cells when target coordinates change
        const updateDistances = function() {
            if (!targetData.coords) {
                $('.distance-cell').text('0.0');
                return;
            }
            
            $('.distance-cell').each(function() {
                const villageCoords = $(this).data('coords');
                const distance = window.TWSDK.Coords.distance(villageCoords, targetData.coords);
                $(this).text(distance ? distance.toFixed(1) : '0.0');
            });
        };
        
        // Calculate snipe timings
        const calculateTimings = function() {
            // Get selected units
            const selectedUnits = [];
            $('.unit-checkbox input:checked').each(function() {
                selectedUnits.push($(this).val());
            });
            
            // Get selected villages
            const selectedVillages = [];
            $('.village-checkbox:checked').each(function() {
                const villageId = $(this).data('id');
                if (villageData[villageId]) {
                    selectedVillages.push(villageData[villageId]);
                }
            });
            
            // Validate inputs
            if (!targetData.coords) {
                UI.ErrorMessage('Please enter target coordinates');
                return;
            }
            
            if (!targetData.arrivalTime) {
                UI.ErrorMessage('Please enter incoming arrival time');
                return;
            }
            
            if (selectedUnits.length === 0) {
                UI.ErrorMessage('Please select at least one unit type');
                return;
            }
            
            if (selectedVillages.length === 0) {
                UI.ErrorMessage('Please select at least one village');
                return;
            }
            
            // Calculate timings
            calculatedTimings = [];
            
            selectedVillages.forEach(village => {
                selectedUnits.forEach(unitType => {
                    // Check if village has this unit
                    if (!village.troops[unitType] || village.troops[unitType] === 0) {
                        return;
                    }
                    
                    // Calculate travel time
                    const travelTime = lib.calculateTravelTime(village.coords, targetData.coords, unitType);
                    
                    // Calculate send time (arrival time - travel time - offset)
                    const sendTime = targetData.arrivalTime - (travelTime * 1000) - targetData.snipeOffset;
                    const arrivalTime = sendTime + (travelTime * 1000);
                    
                    calculatedTimings.push({
                        village: village,
                        unit: unitType,
                        sendTime: sendTime,
                        travelTime: travelTime,
                        arrivalTime: arrivalTime
                    });
                });
            });
            
            // Sort by send time
            calculatedTimings.sort((a, b) => a.sendTime - b.sendTime);
            
            // Display results
            displayResults();
        };
        
        // Display calculation results
        const displayResults = function() {
            if (calculatedTimings.length === 0) {
                $('#results-tbody').html('<tr><td colspan="6" style="text-align: center;">No valid snipe timings found</td></tr>');
                $('#snipe-results').show();
                return;
            }
            
            let html = '';
            calculatedTimings.forEach(timing => {
                const arrivalDiff = timing.arrivalTime - targetData.arrivalTime;
                const isGood = Math.abs(arrivalDiff - targetData.snipeOffset) < 100; // Within 100ms tolerance
                
                html += `
                    <tr>
                        <td><a href="/game.php?village=${timing.village.id}&screen=overview">${timing.village.name}</a></td>
                        <td><img src="/graphic/unit/unit_${timing.unit}.png" title="${t.units[timing.unit]}"> ${t.units[timing.unit]}</td>
                        <td style="font-family: monospace;">${window.TWSDK.Core.formatDateTime(timing.sendTime, true)}</td>
                        <td>${window.TWSDK.Core.formatDuration(timing.travelTime)}</td>
                        <td style="color: ${isGood ? 'green' : 'red'};">
                            ${isGood ? '✓' : '✗'} ${window.TWSDK.Core.formatDateTime(timing.arrivalTime, true)}
                        </td>
                        <td>
                            <button class="btn btn-small copy-time" data-time="${timing.sendTime}">${t.results.copy}</button>
                        </td>
                    </tr>
                `;
            });
            
            $('#results-tbody').html(html);
            $('#snipe-results').show();
            
            // Bind copy buttons
            $('.copy-time').on('click', function() {
                const time = new Date($(this).data('time'));
                const timeStr = window.TWSDK.Core.formatDateTime(time.getTime(), true);
                
                // Copy to clipboard
                const temp = $('<input>');
                $('body').append(temp);
                temp.val(timeStr).select();
                document.execCommand('copy');
                temp.remove();
                
                UI.SuccessMessage('Time copied to clipboard: ' + timeStr);
            });
        };
        
        return {
            init: init
        };
    })(window.SnipeTiming.Library, window.SnipeTiming.Translation);

    // Auto-execute on script load
    (function() {
        // Initialize the script
        window.SnipeTiming.Main.init();
    })();
}

// Simple URL test - paste this in console
// fetch('https://raw.githubusercontent.com/tgreer812/TribalWarsScripts/refs/heads/main/snipeTiming.js')
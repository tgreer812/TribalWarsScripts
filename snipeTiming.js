// TRIBAL WARS SNIPE TIMING CALC
// Script registration and initialization following FarmingGod pattern
let DEBUG = true;
console.log("script ran");
// if (!DEBUG && typeof ScriptAPI !== 'undefined' && ScriptAPI.register) {
//     ScriptAPI.register('SnipeTiming', true, 'YourName', 'your.email@example.com');
// }

// Load TWSDK if not already loaded
if (typeof window.TWSDK === 'undefined') {
    $.getScript('https://raw.githubusercontent.com/tgreer812/TribalWarsScripts/refs/heads/main/twsdk.js')
        .done(function() {
            console.log('TWSDK loaded successfully');
            initializeSnipeTiming();
        })
        .fail(function(jqxhr, settings, exception) {
            UI.ErrorMessage('Failed to load TWSDK. Please try again.');
            console.log('TWSDK load error:', exception, 'Status:', jqxhr.status, 'Response:', jqxhr.responseText);
        });
} else {
    initializeSnipeTiming();
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
                    copy: 'Copy',
                    setTimer: 'Set Timer'
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
                }
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
        
        // Initialize function - entry point
        const init = function() {
            // Check for premium features if needed
            if (!game_data.features.Premium.active) {
                UI.ErrorMessage('This script requires a premium account');
                return;
            }
            
            // Show main dialog
            buildMainDialog();
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
                </style>
            `;
            
            const html = `
                ${styles}
                <div class="snipe-content">
                    <h2>${t.title}</h2>
                    
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
        
        // Build village rows (placeholder data for now)
        const buildVillageRows = function() {
            // Placeholder village data
            const villages = [
                { name: 'Village 001', coords: '500|500', id: 1, troops: { snob: 1, heavy: 50, light: 100 } },
                { name: 'Village 002', coords: '505|502', id: 2, troops: { snob: 0, heavy: 30, light: 80 } },
                { name: 'Village 003', coords: '498|505', id: 3, troops: { snob: 2, heavy: 100, light: 200 } }
            ];
            
            let html = '';
            villages.forEach(village => {
                html += `
                    <tr>
                        <td><input type="checkbox" class="village-checkbox" data-id="${village.id}"></td>
                        <td><a href="/game.php?village=${village.id}&screen=overview">${village.name}</a></td>
                        <td>${village.coords}</td>
                        <td>0.0</td>
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
            
            // Calculate button
            $('.calculate-button').on('click', function() {
                // Show placeholder results
                showPlaceholderResults();
            });
        };
        
        // Show placeholder results
        const showPlaceholderResults = function() {
            const resultsHtml = `
                <tr>
                    <td><a href="#">Village 001</a></td>
                    <td><img src="/graphic/unit/unit_snob.png" title="Noble"> Noble</td>
                    <td style="font-family: monospace;">${window.TWSDK.Core.formatDateTime(new Date().getTime() + 3600000, true)}</td>
                    <td>${window.TWSDK.Core.formatDuration(8100)}</td>
                    <td style="color: green;">✓ ${window.TWSDK.Core.formatDateTime(new Date().getTime() + 7200000, true)}</td>
                    <td>
                        <button class="btn btn-small">${t.results.copy}</button>
                        <button class="btn btn-small">${t.results.setTimer}</button>
                    </td>
                </tr>
                <tr>
                    <td><a href="#">Village 003</a></td>
                    <td><img src="/graphic/unit/unit_heavy.png" title="Heavy"> Heavy</td>
                    <td style="font-family: monospace;">${window.TWSDK.Core.formatDateTime(new Date().getTime() + 4500000, true)}</td>
                    <td>${window.TWSDK.Core.formatDuration(6780)}</td>
                    <td style="color: green;">✓ ${window.TWSDK.Core.formatDateTime(new Date().getTime() + 7200000, true)}</td>
                    <td>
                        <button class="btn btn-small">${t.results.copy}</button>
                        <button class="btn btn-small">${t.results.setTimer}</button>
                    </td>
                </tr>
            `;
            
            $('#results-tbody').html(resultsHtml);
            $('#snipe-results').show();
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

// Simple URL test - paste this in browser URL bar:
// fetch('https://raw.githubusercontent.com/tgreer812/TribalWarsScripts/refs/heads/main/snipeTiming.js')
//     .then(response => response.text())
//     .then(text => {
//     console.log("Script content:", text.substring(0, 100));
//     eval(text);
//     });
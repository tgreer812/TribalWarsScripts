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

// COMMENTED OUT - SDK is now embedded below
// Load TWSDK if not already loaded
// if (typeof window.TWSDK === 'undefined' || !window.TWSDK._ready) {
//     fetch(sdkPath)
//         .then(response => response.text())
//         .then(script => {
//             console.log('SDK script fetched, executing...');
//             
//             // Execute the SDK script
//             try {
//                 eval(script);
//                 console.log('SDK script executed');
//             } catch (e) {
//                 console.error('Error executing SDK:', e);
//                 throw e;
//             }
//             
//             // Check if TWSDK was created
//             if (typeof window.TWSDK === 'undefined') {
//                 throw new Error('TWSDK object was not created after eval');
//             }
//             
//             console.log('TWSDK object exists:', window.TWSDK);
//             console.log('TWSDK._ready:', window.TWSDK._ready);
//             console.log('TWSDK.Core:', window.TWSDK.Core);
//             
//             // If SDK is marked as ready immediately, we can proceed
//             if (window.TWSDK._ready && window.TWSDK.Core && typeof window.TWSDK.Core.init === 'function') {
//                 return Promise.resolve();
//             }
//             
//             // Otherwise wait for it to be ready
//             const checkSDKReady = function() {
//                 return new Promise((resolve, reject) => {
//                     let attempts = 0;
//                     const maxAttempts = 50; // 5 seconds max wait
//                     
//                     const checkInterval = setInterval(() => {
//                         attempts++;
//                         
//                         if (window.TWSDK && window.TWSDK._ready && window.TWSDK.Core && typeof window.TWSDK.Core.init === 'function') {
//                             clearInterval(checkInterval);
//                             console.log('SDK is ready after', attempts, 'attempts');
//                             resolve();
//                         } else if (attempts >= maxAttempts) {
//                             clearInterval(checkInterval);
//                             console.error('SDK state after timeout:', {
//                                 TWSDK: window.TWSDK,
//                                 ready: window.TWSDK ? window.TWSDK._ready : 'no TWSDK',
//                                 Core: window.TWSDK ? window.TWSDK.Core : 'no TWSDK'
//                             });
//                             reject(new Error('TWSDK failed to load properly after 5 seconds'));
//                         }
//                     }, 100); // Check every 100ms
//                 });
//             };
//             
//             return checkSDKReady();
//         })
//         .then(() => {
//             console.log('TWSDK is ready, initializing...');
//             // Initialize SDK before using it
//             return window.TWSDK.Core.init();
//         })
//         .then(() => {
//             console.log('TWSDK initialized successfully');
//             initializeSnipeTiming();
//         })
//         .catch(error => {
//             UI.ErrorMessage('Failed to load TWSDK. Please try again.');
//             console.error('TWSDK load error:', error);
//         });
// } else {
//     console.log('TWSDK already loaded, checking if initialized...');
//     console.log('TWSDK state:', {
//         ready: window.TWSDK._ready,
//         initialized: window.TWSDK._initialized,
//         Core: window.TWSDK.Core ? 'exists' : 'missing'
//     });
//     
//     // SDK already loaded, ensure it's initialized
//     if (window.TWSDK._initialized) {
//         console.log('TWSDK already initialized');
//         initializeSnipeTiming();
//     } else {
//         console.log('TWSDK loaded but not initialized, initializing now...');
//         window.TWSDK.Core.init().then(() => {
//             console.log('TWSDK initialized successfully');
//             initializeSnipeTiming();
//         });
//     }
// }

// ========================= SDK CODE ==============================================================================

// TRIBAL WARS SDK - Reusable utility functions
// Version: 1.0.0

window.TWSDK = window.TWSDK || {};

// World settings cache
window.TWSDK._worldSettings = null;
window.TWSDK._initialized = false;
window.TWSDK._initPromise = null;

// Core utilities
window.TWSDK.Core = (function() {
    // Fetch world settings from config XML
    const fetchWorldSettings = function() {
        if (window.TWSDK._worldSettings) {
            return Promise.resolve(window.TWSDK._worldSettings);
        }
        
        // Build config URL based on current game URL
        const configUrl = '/interface.php?func=get_config';
        
        return $.get(configUrl).then(xml => {
            const $xml = $(xml);
            const settings = {};
            
            // Parse XML into flat JSON structure
            const parseElement = function($element, parentKey = '') {
                $element.children().each(function() {
                    const $child = $(this);
                    const key = parentKey ? `${parentKey}.${$child.prop('nodeName')}` : $child.prop('nodeName');
                    
                    if ($child.children().length > 0) {
                        // Has children, recurse
                        parseElement($child, key);
                    } else {
                        // Leaf node, get the value
                        const value = $child.text().trim();
                        
                        // Convert to appropriate type
                        if (value.match(/^\d+(\.\d+)?$/)) {
                            settings[key] = parseFloat(value);
                        } else if (value === '1') {
                            settings[key] = true;
                        } else if (value === '0') {
                            settings[key] = false;
                        } else {
                            settings[key] = value;
                        }
                    }
                });
            };
            
            parseElement($xml.find('config'));
            
            // Cache the settings
            window.TWSDK._worldSettings = settings;
            localStorage.setItem('TWSDK_worldSettings', JSON.stringify(settings));
            localStorage.setItem('TWSDK_worldSettings_timestamp', Date.now());
            
            console.log('World settings parsed:', settings);
            return settings;
        }).catch(() => {
            // Fallback to localStorage if available and fresh (less than 1 hour old)
            const cached = localStorage.getItem('TWSDK_worldSettings');
            const timestamp = localStorage.getItem('TWSDK_worldSettings_timestamp');
            
            if (cached && timestamp && (Date.now() - parseInt(timestamp) < 3600000)) {
                window.TWSDK._worldSettings = JSON.parse(cached);
                return window.TWSDK._worldSettings;
            }
            
            // Ultimate fallback to game_data
            return {
                'speed': game_data.speed || 1,
                'unit_speed': game_data.unit_speed || 1
            };
        });
    };
    
    // Get all world settings
    const getWorldSettings = function() {
        return window.TWSDK._worldSettings || JSON.parse(localStorage.getItem('TWSDK_worldSettings')) || {};
    };
    
    // Get world speed from settings
    const getWorldSpeed = function() {
        const settings = getWorldSettings();
        return settings['speed'] || game_data.speed || 1;
    };
    
    // Get unit speed from settings
    const getUnitSpeed = function() {
        const settings = getWorldSettings();
        return settings['unit_speed'] || game_data.unit_speed || 1;
    };
    
    // Get morale setting (0=disabled, 1=points based, 2=time based)
    const getMorale = function() {
        const settings = getWorldSettings();
        return settings['moral'] || 0;
    };
    
    // Get night bonus setting (0=disabled, 1=classic, 2=only def bonus)
    const getNightBonus = function() {
        const settings = getWorldSettings();
        return settings['night.active'] || 0;
    };
    
    // Get church setting
    const getChurch = function() {
        const settings = getWorldSettings();
        return settings['game.church'] || false;
    };
    
    // Get watchtower setting
    const getWatchtower = function() {
        const settings = getWorldSettings();
        return settings['game.watchtower'] || false;
    };
    
    // Get sigil bonus setting (returns percentage, e.g., 20 for 20%)
    const getSigilBonus = function() {
        const settings = getWorldSettings();
        // This would need to be added to the config XML parsing if sigils are in world config
        // For now, we'll return 0 as default since sigils are typically player-specific items
        return 0;
    };
    
    // Get current server time
    const getCurrentServerTime = function() {
        const [hour, min, sec, day, month, year] = $('#serverTime')
            .closest('p')
            .text()
            .match(/\d+/g);
        return new Date(year, month - 1, day, hour, min, sec).getTime();
    };
    
    // Parse time string to timestamp
    const timestampFromString = function(timestr) {
        const d = $('#serverDate')
            .text()
            .split('/')
            .map((x) => +x);
        const todayPattern = new RegExp(
            window.lang['aea2b0aa9ae1534226518faaefffdaad'].replace(
                '%s',
                '([\\d+|:]+)'
            )
        ).exec(timestr);
        const tomorrowPattern = new RegExp(
            window.lang['57d28d1b211fddbb7a499ead5bf23079'].replace(
                '%s',
                '([\\d+|:]+)'
            )
        ).exec(timestr);
        const laterDatePattern = new RegExp(
            window.lang['0cb274c906d622fa8ce524bcfbb7552d']
                .replace('%1', '([\\d+|\\.]+)')
                .replace('%2', '([\\d+|:]+)')
        ).exec(timestr);
        let t, date;

        if (todayPattern !== null) {
            t = todayPattern[1].split(':');
            date = new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2], t[3] || 0);
        } else if (tomorrowPattern !== null) {
            t = tomorrowPattern[1].split(':');
            date = new Date(
                d[2],
                d[1] - 1,
                d[0] + 1,
                t[0],
                t[1],
                t[2],
                t[3] || 0
            );
        } else {
            d = (laterDatePattern[1] + d[2]).split('.').map((x) => +x);
            t = laterDatePattern[2].split(':');
            date = new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2], t[3] || 0);
        }

        return date.getTime();
    };
    
    // Format timestamp for display
    const formatDateTime = function(timestamp, includeMs = false) {
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        if (includeMs) {
            const ms = String(date.getMilliseconds()).padStart(3, '0');
            return `${hours}:${minutes}:${seconds}:${ms}`;
        }
        
        return `${hours}:${minutes}:${seconds}`;
    };
    
    // Format duration in seconds to human readable
    const formatDuration = function(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        // Format as hh:mm:ss for consistent spacing
        const hoursStr = String(hours).padStart(2, '0');
        const minutesStr = String(minutes).padStart(2, '0');
        const secsStr = String(secs).padStart(2, '0');
        
        return `${hoursStr}:${minutesStr}:${secsStr}`;
    };
    
    // Initialize the SDK
    const init = function() {
        if (window.TWSDK._initPromise) {
            return window.TWSDK._initPromise;
        }
        
        window.TWSDK._initPromise = Promise.all([
            fetchWorldSettings(),
            window.TWSDK.Units.fetchUnitSpeeds()
        ]).then(() => {
            window.TWSDK._initialized = true;
            console.log('TWSDK: Initialization complete');
        }).catch(error => {
            console.error('TWSDK: Initialization error', error);
            // Still mark as initialized even if there's an error
            window.TWSDK._initialized = true;
        });
        
        return window.TWSDK._initPromise;
    };
    
    return {
        init,
        fetchWorldSettings,
        getWorldSettings,
        getWorldSpeed,
        getUnitSpeed,
        getMorale,
        getNightBonus,
        getChurch,
        getWatchtower,
        getSigilBonus,
        getCurrentServerTime,
        timestampFromString,
        formatDateTime,
        formatDuration
    };
})();

// Coordinate utilities
window.TWSDK.Coords = (function() {
    // Parse coordinates from string
    const parse = function(coordStr) {
        const match = coordStr.match(/(\d{1,3})\|(\d{1,3})/);
        if (!match) return null;
        
        return {
            x: parseInt(match[1]),
            y: parseInt(match[2]),
            toString: function() {
                return `${this.x}|${this.y}`;
            }
        };
    };
    
    // Calculate distance between two coordinates
    const distance = function(coord1, coord2) {
        const c1 = typeof coord1 === 'string' ? parse(coord1) : coord1;
        const c2 = typeof coord2 === 'string' ? parse(coord2) : coord2;
        
        if (!c1 || !c2) return null;
        
        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        
        return Math.sqrt(dx * dx + dy * dy);
    };
    
    // Calculate travel time between coordinates
    const travelTime = function(origin, target, unitSpeed, worldSpeed = 1, unitModifier = 1, sigilBonus = 0) {
        const dist = distance(origin, target);
        if (!dist) return null;
        
        // Calculate sigil ratio (sigil reduces travel time)
        const sigilRatio = 1 + (sigilBonus / 100);
        
        // Travel time in minutes = (distance * unit speed) / (world speed * unit speed modifier * sigil ratio)
        const timeInMinutes = (dist * unitSpeed) / (worldSpeed * unitModifier * sigilRatio);
        
        // Return in seconds
        return Math.round(timeInMinutes * 60);
    };
    
    return {
        parse,
        distance,
        travelTime
    };
})();

// Unit data utilities
window.TWSDK.Units = (function() {
    const unitSpeeds = {
        spear: 18,
        sword: 22,
        axe: 18,
        archer: 18,
        spy: 9,
        light: 10,
        marcher: 10,
        heavy: 11,
        ram: 30,
        catapult: 30,
        knight: 10,
        snob: 35
    };
    
    // Get unit speeds from localStorage or use defaults
    const getUnitSpeeds = function() {
        const stored = localStorage.getItem('TWSDK_unitSpeeds');
        if (stored) {
            return JSON.parse(stored);
        }
        return unitSpeeds;
    };
    
    // Fetch and store unit speeds from game
    const fetchUnitSpeeds = function() {
        return $.get('/interface.php?func=get_unit_info')
            .then((xml) => {
                const speeds = {};
                $(xml)
                    .find('config')
                    .children()
                    .each((i, el) => {
                        const unitName = $(el).prop('nodeName');
                        const speed = $(el).find('speed').text();
                        if (speed) {
                            speeds[unitName] = parseFloat(speed);
                        }
                    });
                
                localStorage.setItem('TWSDK_unitSpeeds', JSON.stringify(speeds));
                return speeds;
            })
            .catch(error => {
                console.error('TWSDK: Failed to fetch unit speeds', error);
                return unitSpeeds; // Return defaults on error
            });
    };
    
    // Get speed for specific unit
    const getSpeed = function(unitName) {
        const speeds = getUnitSpeeds();
        return speeds[unitName] || null;
    };
    
    return {
        getUnitSpeeds,
        fetchUnitSpeeds,
        getSpeed
    };
})();

// Page processing utilities
window.TWSDK.Page = (function() {
    // Process all pages of a paginated view
    const processAllPages = function(url, processorFn) {
        const processPage = function(pageUrl, page, wrapFn) {
            const pageText = pageUrl.match('am_farm') ? `&Farm_page=${page}` : `&page=${page}`;
            
            return $.ajax({
                url: pageUrl + pageText,
            }).then((html) => {
                return wrapFn(page, $(html));
            });
        };
        
        const determineNextPage = function(page, $html) {
            const villageLength = $html.find('#scavenge_mass_screen').length > 0
                ? $html.find('tr[id*="scavenge_village"]').length
                : $html.find('tr.row_a, tr.row_ax, tr.row_b, tr.row_bx').length;
                
            const navSelect = $html
                .find('.paged-nav-item')
                .first()
                .closest('td')
                .find('select')
                .first();
                
            const navLength = $html.find('#am_widget_Farm').length > 0
                ? parseInt(
                    $('#plunder_list_nav')
                        .first()
                        .find('a.paged-nav-item, strong.paged-nav-item')
                        .last()
                        .text()
                        .replace(/\D/g, '')
                ) - 1
                : navSelect.length > 0
                    ? navSelect.find('option').length - 1
                    : $html.find('.paged-nav-item').not('[href*="page=-1"]').length;
                    
            const pageSize = $('#mobileHeader').length > 0
                ? 10
                : parseInt($html.find('input[name="page_size"]').val());
                
            if (page == -1 && villageLength == 1000) {
                return Math.floor(1000 / pageSize);
            } else if (page < navLength) {
                return page + 1;
            }
            
            return false;
        };
        
        let page = url.match('am_farm') || url.match('scavenge_mass') ? 0 : -1;
        const wrapFn = function(page, $html) {
            const dnp = determineNextPage(page, $html);
            
            if (dnp) {
                processorFn($html);
                return processPage(url, dnp, wrapFn);
            } else {
                return processorFn($html);
            }
        };
        
        return processPage(url, page, wrapFn);
    };
    
    return {
        processAllPages
    };
})();

// String prototype extensions
String.prototype.toCoord = function(objectified) {
    const c = (this.match(/\d{1,3}\|\d{1,3}/g) || [false]).pop();
    return c && objectified
        ? { x: c.split('|')[0], y: c.split('|')[1] }
        : c;
};

String.prototype.toNumber = function() {
    return parseFloat(this);
};

Number.prototype.toNumber = function() {
    return parseFloat(this);
};

// Mark SDK as ready - ensure window.TWSDK exists
if (typeof window.TWSDK !== 'undefined') {
    window.TWSDK._ready = true;
    console.log('TWSDK: Script loaded and ready');
} else {
    console.error('TWSDK: window.TWSDK is undefined at end of script!');
}

// =============== END SDK ================================================


// Initialize SDK and then the main script - MOVED HERE AFTER SDK DEFINITION
console.log('TWSDK is ready, initializing...');
window.TWSDK.Core.init().then(() => {
    console.log('TWSDK initialized successfully');
    initializeSnipeTiming();
}).catch(error => {
    console.error('TWSDK initialization failed:', error);
    // Still try to initialize the script with fallback data
    initializeSnipeTiming();
});

function initializeSnipeTiming() {
    // Main module structure
    window.SnipeTiming = {};

    // Library module - script-specific utilities
    window.SnipeTiming.Library = (function() {
        // Calculate travel time using TWSDK
        const calculateTravelTime = function(origin, target, unitName, sigilBonus = 0) {
            const unitSpeed = window.TWSDK.Units.getSpeed(unitName);
            const worldSpeed = window.TWSDK.Core.getWorldSpeed();
            const unitModifier = window.TWSDK.Core.getUnitSpeed();
            
            return window.TWSDK.Coords.travelTime(origin, target, unitSpeed, worldSpeed, unitModifier, sigilBonus);
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
                arrivalTime: 'Desired arrival time:',
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
        const init = async function() {
            // Check for premium features if needed
            if (!game_data.features.Premium.active) {
                UI.ErrorMessage('This script requires a premium account');
                return;
            }
            
            // Show main dialog with loading state
            buildMainDialog();
            
            // Wait for world settings to be loaded, then populate UI
            await fetchWorldSpeed();
            
            // Fetch user's villages after world settings are loaded
            fetchUserVillages();
        };
        
        // Fetch world speed from SDK - now properly async
        const fetchWorldSpeed = async function() {
            try {
                // Ensure world settings are loaded
                await window.TWSDK.Core.fetchWorldSettings();
                
                worldSpeed = window.TWSDK.Core.getWorldSpeed();
                unitSpeedModifier = window.TWSDK.Core.getUnitSpeed();
                worldSettings = window.TWSDK.Core.getWorldSettings();
                
                console.log('World settings loaded:', worldSettings);
                updateDebugInfo();
            } catch (error) {
                console.error('Failed to fetch world settings:', error);
                // Use fallbacks
                worldSpeed = game_data.speed || 1;
                unitSpeedModifier = game_data.unit_speed || 1;
                worldSettings = {
                    'Game speed': worldSpeed,
                    'Unit speed': unitSpeedModifier
                };
                updateDebugInfo();
            }
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
                    .loading-indicator {
                        text-align: center;
                        padding: 20px;
                        font-style: italic;
                        color: #666;
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
                    <div class="debug-section" id="debug-info" style="display: none;">
                        <div class="loading-indicator">Loading world settings...</div>
                    </div>
                    
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
                        <div class="snipe-input-group">
                            <label>Sigil bonus (%):</label>
                            <input type="number" id="sigil-bonus" value="0" min="0" max="100" step="1" style="width: 80px;">
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
                                <tr><td colspan="5" class="loading-indicator">Loading villages...</td></tr>
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
                
                // Build troops display dynamically from all available troops
                let troopsHtml = '';
                for (const [unitType, count] of Object.entries(village.troops)) {
                    if (count > 0) {
                        const unitName = t.units[unitType] || unitType; // fallback to unit key if translation missing
                        troopsHtml += `<img src="/graphic/unit/unit_${unitType}.png" title="${unitName}"> ${count} `;
                    }
                }
                
                html += `
                    <tr>
                        <td><input type="checkbox" class="village-checkbox" data-id="${village.id}"></td>
                        <td><a href="/game.php?village=${village.id}&screen=overview">${village.name}</a></td>
                        <td>${village.coords}</td>
                        <td class="distance-cell" data-coords="${village.coords}">${distance}</td>
                        <td>${troopsHtml}</td>
                    </tr>
                `;
            });
            
            return html;
        };
        
        // Fetch user's villages and troop counts
        const fetchUserVillages = function() {
            // Show loading indicator (already shown in buildMainDialog)
            $('#village-list').html('<tr><td colspan="5" class="loading-indicator">Loading villages...</td></tr>');
            
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
            
            // Get sigil bonus
            const sigilBonus = parseFloat($('#sigil-bonus').val()) || 0;
            
            // Calculate timings
            calculatedTimings = [];
            
            selectedVillages.forEach(village => {
                selectedUnits.forEach(unitType => {
                    // Check if village has this unit
                    if (!village.troops[unitType] || village.troops[unitType] === 0) {
                        return;
                    }
                    
                    // Calculate travel time with sigil bonus
                    const travelTime = lib.calculateTravelTime(village.coords, targetData.coords, unitType, sigilBonus);
                    
                    // Calculate send time (arrival time - travel time - offset)
                    const sendTime = targetData.arrivalTime - (travelTime * 1000) - targetData.snipeOffset;
                    const arrivalTime = sendTime + (travelTime * 1000) + targetData.snipeOffset;
                    
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

// ========================= SDK CODE ==============================================================================

// TRIBAL WARS SDK - Reusable utility functions
// Version: 1.0.0

window.TWSDK = window.TWSDK || {};

// World settings cache
window.TWSDK._worldSettings = null;
window.TWSDK._initialized = false;
window.TWSDK._initPromise = null;

// Core utilities
window.TWSDK.Core = (function() {
    // Fetch world settings from config XML
    const fetchWorldSettings = function() {
        if (window.TWSDK._worldSettings) {
            return Promise.resolve(window.TWSDK._worldSettings);
        }
        
        // Build config URL based on current game URL
        const configUrl = '/interface.php?func=get_config';
        
        return $.get(configUrl).then(xml => {
            const $xml = $(xml);
            const settings = {};
            
            // Parse XML into flat JSON structure
            const parseElement = function($element, parentKey = '') {
                $element.children().each(function() {
                    const $child = $(this);
                    const key = parentKey ? `${parentKey}.${$child.prop('nodeName')}` : $child.prop('nodeName');
                    
                    if ($child.children().length > 0) {
                        // Has children, recurse
                        parseElement($child, key);
                    } else {
                        // Leaf node, get the value
                        const value = $child.text().trim();
                        
                        // Convert to appropriate type
                        if (value.match(/^\d+(\.\d+)?$/)) {
                            settings[key] = parseFloat(value);
                        } else if (value === '1') {
                            settings[key] = true;
                        } else if (value === '0') {
                            settings[key] = false;
                        } else {
                            settings[key] = value;
                        }
                    }
                });
            };
            
            parseElement($xml.find('config'));
            
            // Cache the settings
            window.TWSDK._worldSettings = settings;
            localStorage.setItem('TWSDK_worldSettings', JSON.stringify(settings));
            localStorage.setItem('TWSDK_worldSettings_timestamp', Date.now());
            
            console.log('World settings parsed:', settings);
            return settings;
        }).catch(() => {
            // Fallback to localStorage if available and fresh (less than 1 hour old)
            const cached = localStorage.getItem('TWSDK_worldSettings');
            const timestamp = localStorage.getItem('TWSDK_worldSettings_timestamp');
            
            if (cached && timestamp && (Date.now() - parseInt(timestamp) < 3600000)) {
                window.TWSDK._worldSettings = JSON.parse(cached);
                return window.TWSDK._worldSettings;
            }
            
            // Ultimate fallback to game_data
            return {
                'speed': game_data.speed || 1,
                'unit_speed': game_data.unit_speed || 1
            };
        });
    };
    
    // Get all world settings
    const getWorldSettings = function() {
        return window.TWSDK._worldSettings || JSON.parse(localStorage.getItem('TWSDK_worldSettings')) || {};
    };
    
    // Get world speed from settings
    const getWorldSpeed = function() {
        const settings = getWorldSettings();
        return settings['speed'] || game_data.speed || 1;
    };
    
    // Get unit speed from settings
    const getUnitSpeed = function() {
        const settings = getWorldSettings();
        return settings['unit_speed'] || game_data.unit_speed || 1;
    };
    
    // Get morale setting (0=disabled, 1=points based, 2=time based)
    const getMorale = function() {
        const settings = getWorldSettings();
        return settings['moral'] || 0;
    };
    
    // Get night bonus setting (0=disabled, 1=classic, 2=only def bonus)
    const getNightBonus = function() {
        const settings = getWorldSettings();
        return settings['night.active'] || 0;
    };
    
    // Get church setting
    const getChurch = function() {
        const settings = getWorldSettings();
        return settings['game.church'] || false;
    };
    
    // Get watchtower setting
    const getWatchtower = function() {
        const settings = getWorldSettings();
        return settings['game.watchtower'] || false;
    };
    
    // Get sigil bonus setting (returns percentage, e.g., 20 for 20%)
    const getSigilBonus = function() {
        const settings = getWorldSettings();
        // This would need to be added to the config XML parsing if sigils are in world config
        // For now, we'll return 0 as default since sigils are typically player-specific items
        return 0;
    };
    
    // Get current server time
    const getCurrentServerTime = function() {
        const [hour, min, sec, day, month, year] = $('#serverTime')
            .closest('p')
            .text()
            .match(/\d+/g);
        return new Date(year, month - 1, day, hour, min, sec).getTime();
    };
    
    // Parse time string to timestamp
    const timestampFromString = function(timestr) {
        const d = $('#serverDate')
            .text()
            .split('/')
            .map((x) => +x);
        const todayPattern = new RegExp(
            window.lang['aea2b0aa9ae1534226518faaefffdaad'].replace(
                '%s',
                '([\\d+|:]+)'
            )
        ).exec(timestr);
        const tomorrowPattern = new RegExp(
            window.lang['57d28d1b211fddbb7a499ead5bf23079'].replace(
                '%s',
                '([\\d+|:]+)'
            )
        ).exec(timestr);
        const laterDatePattern = new RegExp(
            window.lang['0cb274c906d622fa8ce524bcfbb7552d']
                .replace('%1', '([\\d+|\\.]+)')
                .replace('%2', '([\\d+|:]+)')
        ).exec(timestr);
        let t, date;

        if (todayPattern !== null) {
            t = todayPattern[1].split(':');
            date = new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2], t[3] || 0);
        } else if (tomorrowPattern !== null) {
            t = tomorrowPattern[1].split(':');
            date = new Date(
                d[2],
                d[1] - 1,
                d[0] + 1,
                t[0],
                t[1],
                t[2],
                t[3] || 0
            );
        } else {
            d = (laterDatePattern[1] + d[2]).split('.').map((x) => +x);
            t = laterDatePattern[2].split(':');
            date = new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2], t[3] || 0);
        }

        return date.getTime();
    };
    
    // Format timestamp for display
    const formatDateTime = function(timestamp, includeMs = false) {
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        if (includeMs) {
            const ms = String(date.getMilliseconds()).padStart(3, '0');
            return `${hours}:${minutes}:${seconds}:${ms}`;
        }
        
        return `${hours}:${minutes}:${seconds}`;
    };
    
    // Format duration in seconds to human readable
    const formatDuration = function(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };
    
    // Initialize the SDK
    const init = function() {
        if (window.TWSDK._initPromise) {
            return window.TWSDK._initPromise;
        }
        
        window.TWSDK._initPromise = Promise.all([
            fetchWorldSettings(),
            window.TWSDK.Units.fetchUnitSpeeds()
        ]).then(() => {
            window.TWSDK._initialized = true;
            console.log('TWSDK: Initialization complete');
        }).catch(error => {
            console.error('TWSDK: Initialization error', error);
            // Still mark as initialized even if there's an error
            window.TWSDK._initialized = true;
        });
        
        return window.TWSDK._initPromise;
    };
    
    return {
        init,
        fetchWorldSettings,
        getWorldSettings,
        getWorldSpeed,
        getUnitSpeed,
        getMorale,
        getNightBonus,
        getChurch,
        getWatchtower,
        getSigilBonus,
        getCurrentServerTime,
        timestampFromString,
        formatDateTime,
        formatDuration
    };
})();

// Coordinate utilities
window.TWSDK.Coords = (function() {
    // Parse coordinates from string
    const parse = function(coordStr) {
        const match = coordStr.match(/(\d{1,3})\|(\d{1,3})/);
        if (!match) return null;
        
        return {
            x: parseInt(match[1]),
            y: parseInt(match[2]),
            toString: function() {
                return `${this.x}|${this.y}`;
            }
        };
    };
    
    // Calculate distance between two coordinates
    const distance = function(coord1, coord2) {
        const c1 = typeof coord1 === 'string' ? parse(coord1) : coord1;
        const c2 = typeof coord2 === 'string' ? parse(coord2) : coord2;
        
        if (!c1 || !c2) return null;
        
        const dx = c1.x - c2.x;
        const dy = c1.y - c2.y;
        
        return Math.sqrt(dx * dx + dy * dy);
    };
    
    // Calculate travel time between coordinates
    const travelTime = function(origin, target, unitSpeed, worldSpeed = 1, unitModifier = 1, sigilBonus = 0) {
        const dist = distance(origin, target);
        if (!dist) return null;
        
        // Calculate sigil ratio (sigil reduces travel time)
        const sigilRatio = 1 + (sigilBonus / 100);
        
        // Travel time in minutes = (distance * unit speed) / (world speed * unit speed modifier * sigil ratio)
        const timeInMinutes = (dist * unitSpeed) / (worldSpeed * unitModifier * sigilRatio);
        
        // Return in seconds
        return Math.round(timeInMinutes * 60);
    };
    
    return {
        parse,
        distance,
        travelTime
    };
})();

// Unit data utilities
window.TWSDK.Units = (function() {
    const unitSpeeds = {
        spear: 18,
        sword: 22,
        axe: 18,
        archer: 18,
        spy: 9,
        light: 10,
        marcher: 10,
        heavy: 11,
        ram: 30,
        catapult: 30,
        knight: 10,
        snob: 35
    };
    
    // Get unit speeds from localStorage or use defaults
    const getUnitSpeeds = function() {
        const stored = localStorage.getItem('TWSDK_unitSpeeds');
        if (stored) {
            return JSON.parse(stored);
        }
        return unitSpeeds;
    };
    
    // Fetch and store unit speeds from game
    const fetchUnitSpeeds = function() {
        return $.get('/interface.php?func=get_unit_info')
            .then((xml) => {
                const speeds = {};
                $(xml)
                    .find('config')
                    .children()
                    .each((i, el) => {
                        const unitName = $(el).prop('nodeName');
                        const speed = $(el).find('speed').text();
                        if (speed) {
                            speeds[unitName] = parseFloat(speed);
                        }
                    });
                
                localStorage.setItem('TWSDK_unitSpeeds', JSON.stringify(speeds));
                return speeds;
            })
            .catch(error => {
                console.error('TWSDK: Failed to fetch unit speeds', error);
                return unitSpeeds; // Return defaults on error
            });
    };
    
    // Get speed for specific unit
    const getSpeed = function(unitName) {
        const speeds = getUnitSpeeds();
        return speeds[unitName] || null;
    };
    
    return {
        getUnitSpeeds,
        fetchUnitSpeeds,
        getSpeed
    };
})();

// Page processing utilities
window.TWSDK.Page = (function() {
    // Process all pages of a paginated view
    const processAllPages = function(url, processorFn) {
        const processPage = function(pageUrl, page, wrapFn) {
            const pageText = pageUrl.match('am_farm') ? `&Farm_page=${page}` : `&page=${page}`;
            
            return $.ajax({
                url: pageUrl + pageText,
            }).then((html) => {
                return wrapFn(page, $(html));
            });
        };
        
        const determineNextPage = function(page, $html) {
            const villageLength = $html.find('#scavenge_mass_screen').length > 0
                ? $html.find('tr[id*="scavenge_village"]').length
                : $html.find('tr.row_a, tr.row_ax, tr.row_b, tr.row_bx').length;
                
            const navSelect = $html
                .find('.paged-nav-item')
                .first()
                .closest('td')
                .find('select')
                .first();
                
            const navLength = $html.find('#am_widget_Farm').length > 0
                ? parseInt(
                    $('#plunder_list_nav')
                        .first()
                        .find('a.paged-nav-item, strong.paged-nav-item')
                        .last()
                        .text()
                        .replace(/\D/g, '')
                ) - 1
                : navSelect.length > 0
                    ? navSelect.find('option').length - 1
                    : $html.find('.paged-nav-item').not('[href*="page=-1"]').length;
                    
            const pageSize = $('#mobileHeader').length > 0
                ? 10
                : parseInt($html.find('input[name="page_size"]').val());
                
            if (page == -1 && villageLength == 1000) {
                return Math.floor(1000 / pageSize);
            } else if (page < navLength) {
                return page + 1;
            }
            
            return false;
        };
        
        let page = url.match('am_farm') || url.match('scavenge_mass') ? 0 : -1;
        const wrapFn = function(page, $html) {
            const dnp = determineNextPage(page, $html);
            
            if (dnp) {
                processorFn($html);
                return processPage(url, dnp, wrapFn);
            } else {
                return processorFn($html);
            }
        };
        
        return processPage(url, page, wrapFn);
    };
    
    return {
        processAllPages
    };
})();

// String prototype extensions
String.prototype.toCoord = function(objectified) {
    const c = (this.match(/\d{1,3}\|\d{1,3}/g) || [false]).pop();
    return c && objectified
        ? { x: c.split('|')[0], y: c.split('|')[1] }
        : c;
};

String.prototype.toNumber = function() {
    return parseFloat(this);
};

Number.prototype.toNumber = function() {
    return parseFloat(this);
};

// Mark SDK as ready - ensure window.TWSDK exists
if (typeof window.TWSDK !== 'undefined') {
    window.TWSDK._ready = true;
    console.log('TWSDK: Script loaded and ready');
} else {
    console.error('TWSDK: window.TWSDK is undefined at end of script!');
}
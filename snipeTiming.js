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
                filterByGroup: 'Filter by group:',  // Add this
                allGroups: 'All',  // Add this
                yourVillas: 'Your villas',  // Add this
                results: {
                    village: 'Village',
                    unit: 'Unit',
                    sendTime: 'Send Time',
                    travelTime: 'Travel Time',
                    arrival: 'Arrival',
                    actions: 'Actions',
                    copy: 'Copy',
                    sendIn: 'Send In'  // Add this new translation
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
        let timerInterval = null;  // Store timer update interval
        let groupsData = {};  // Store groups data
        let selectedGroup = 0;  // Currently selected group filter
        
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
            
            // Fetch groups
            await fetchGroups();
            
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
                            <select id="villa-dropdown" style="width: 150px; display: none;">
                                <option value="">${t.yourVillas}</option>
                            </select>
                            <button class="btn btn-small" id="toggle-villa-dropdown" style="margin-left: 5px;">▼</button>
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
                        <div style="margin-bottom: 10px;">
                            <label style="font-weight: bold;">${t.filterByGroup}</label>
                            <select id="group-filter" style="margin-left: 10px;">
                                <option value="0">${t.allGroups}</option>
                            </select>
                        </div>
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
                                    <th>${t.results.sendIn}</th>
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
            
            // Clean up timer when dialog closes
            $('#popup_box_SnipeTiming').on('dialogclose', function() {
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
            });
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
                
                // Get group memberships from row classes
                const groups = [];
                const classList = $row.attr('class');
                if (classList) {
                    const groupMatches = classList.match(/group_\d+/g);
                    if (groupMatches) {
                        groupMatches.forEach(groupClass => {
                            groups.push(parseInt(groupClass.replace('group_', '')));
                        });
                    }
                }
                
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
                    troops: troops,
                    groups: groups
                };
            });
        };
        
        // Update the village table with fetched data
        const updateVillageTable = function() {
            let villages = Object.values(villageData);
            
            // Filter by selected group if not "All"
            if (selectedGroup > 0) {
                villages = villages.filter(village => village.groups.includes(selectedGroup));
            }
            
            const html = buildVillageRows(villages);
            $('#village-list').html(html);
            populateVillaDropdown();
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
            
            // Villa dropdown toggle
            $('#toggle-villa-dropdown').on('click', function() {
                const $dropdown = $('#villa-dropdown');
                $dropdown.toggle();
                $(this).text($dropdown.is(':visible') ? '▲' : '▼');
            });
            
            // Villa dropdown selection
            $('#villa-dropdown').on('change', function() {
                const coords = $(this).val();
                if (coords) {
                    $('#snipe-target-coords').val(coords).trigger('input');
                    $(this).val(''); // Reset selection
                    $(this).hide();
                    $('#toggle-villa-dropdown').text('▼');
                }
            });
            
            // Group filter change
            $('#group-filter').on('change', function() {
                selectedGroup = parseInt($(this).val());
                updateVillageTable();
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
        
        // Update send timers
        const updateSendTimers = function() {
            const currentTime = window.TWSDK.Core.getCurrentServerTime();
            
            $('.send-timer').each(function() {
                const sendTime = parseInt($(this).data('send-time'));
                const timeUntilSend = Math.floor((sendTime - currentTime) / 1000); // in seconds
                
                if (timeUntilSend > 0) {
                    const hours = Math.floor(timeUntilSend / 3600);
                    const minutes = Math.floor((timeUntilSend % 3600) / 60);
                    const seconds = timeUntilSend % 60;
                    
                    const timerStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                    $(this).text(timerStr);
                    
                    // Color coding based on urgency
                    if (timeUntilSend < 60) {
                        $(this).css('color', 'red').css('font-weight', 'bold');
                    } else if (timeUntilSend < 300) {
                        $(this).css('color', 'orange');
                    } else {
                        $(this).css('color', 'green');
                    }
                } else {
                    $(this).text('SEND NOW!').css('color', 'red').css('font-weight', 'bold');
                }
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
                        <td class="send-timer" data-send-time="${timing.sendTime}" style="font-family: monospace;">--:--:--</td>
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
            
            // Start timer updates
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            updateSendTimers();
            timerInterval = setInterval(updateSendTimers, 1000);
            
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
        
        // Fetch user groups
        const fetchGroups = function() {
            return $.get(TribalWars.buildURL('GET', 'groups', { ajax: 'load_group_menu' }))
                .then(response => {
                    if (response && response.result) {
                        groupsData = {};
                        const $groupFilter = $('#group-filter');
                        
                        response.result.forEach(group => {
                            if (group.type !== 'separator' && group.group_id !== undefined) {
                                groupsData[group.group_id] = group;
                                $groupFilter.append(`<option value="${group.group_id}">${group.name}</option>`);
                            }
                        });
                    }
                })
                .catch(error => {
                    console.error('Failed to fetch groups:', error);
                });
        };
        
        // Populate villa dropdown
        const populateVillaDropdown = function() {
            const $dropdown = $('#villa-dropdown');
            $dropdown.empty();
            $dropdown.append(`<option value="">${t.yourVillas}</option>`);
            
            // Sort villages by name
            const sortedVillages = Object.values(villageData).sort((a, b) => a.name.localeCompare(b.name));
            
            sortedVillages.forEach(village => {
                $dropdown.append(`<option value="${village.coords}">${village.name} (${village.coords})</option>`);
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
                filterByGroup: 'Filter by group:',  // Add this
                allGroups: 'All',  // Add this
                yourVillas: 'Your villas',  // Add this
                results: {
                    village: 'Village',
                    unit: 'Unit',
                    sendTime: 'Send Time',
                    travelTime: 'Travel Time',
                    arrival: 'Arrival',
                    actions: 'Actions',
                    copy: 'Copy',
                    sendIn: 'Send In'  // Add this new translation
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
        let timerInterval = null;  // Store timer update interval
        let groupsData = {};  // Store groups data
        let selectedGroup = 0;  // Currently selected group filter
        
        // Initialize function - entry point
        const init = async function() {
            // Check for premium features if needed
            if (!game_data.features.Premium.active) {
                UI.ErrorMessage('This script requires a premium account');
                return;
            }
            
            // Show main dialog with loading state






































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































                .catch                })                    }                        });                            }                                $groupFilter.append(`<option value="${group.group_id}">${group.name}</option>`);                                groupsData[group.group_id] = group;                            if (group.type !== 'separator' && group.group_id !== undefined) {                        response.result.forEach(group => {                                                const $groupFilter = $('#group-filter');                        groupsData = {};                    if (response && response.result) {                .then(response => {            return $.get(TribalWars.buildURL('GET', 'groups', { ajax: 'load_group_menu' }))        const fetchGroups = function() {        // Fetch user groups                };            });                UI.SuccessMessage('Time copied to clipboard: ' + timeStr);                                temp.remove();                document.execCommand('copy');                temp.val(timeStr).select();                $('body').append(temp);                const temp = $('<input>');                // Copy to clipboard                                const timeStr = window.TWSDK.Core.formatDateTime(time.getTime(), true);                const time = new Date($(this).data('time'));            $('.copy-time').on('click', function() {            // Bind copy buttons                        timerInterval = setInterval(updateSendTimers, 1000);            updateSendTimers();            }                clearInterval(timerInterval);            if (timerInterval) {            // Start timer updates                        $('#snipe-results').show();            $('#results-tbody').html(html);                        });                `;                    </tr>                        </td>                            <button class="btn btn-small copy-time" data-time="${timing.sendTime}">${t.results.copy}</button>                        <td>                        </td>                            ${isGood ? '✓' : '✗'} ${window.TWSDK.Core.formatDateTime(timing.arrivalTime, true)}                        <td style="color: ${isGood ? 'green' : 'red'};">                        <td>${window.TWSDK.Core.formatDuration(timing.travelTime)}</td>                        <td style="font-family: monospace;">${window.TWSDK.Core.formatDateTime(timing.sendTime, true)}</td>                        <td class="send-timer" data-send-time="${timing.sendTime}" style="font-family: monospace;">--:--:--</td>                        <td><img src="/graphic/unit/unit_${timing.unit}.png" title="${t.units[timing.unit]}"> ${t.units[timing.unit]}</td>                        <td><a href="/game.php?village=${timing.village.id}&screen=overview">${timing.village.name}</a></td>                    <tr>                html += `                                const isGood = Math.abs(arrivalDiff - targetData.snipeOffset) < 100; // Within 100ms tolerance                const arrivalDiff = timing.arrivalTime - targetData.arrivalTime;            calculatedTimings.forEach(timing => {            let html = '';                        }                return;                $('#snipe-results').show();                $('#results-tbody').html('<tr><td colspan="6" style="text-align: center;">No valid snipe timings found</td></tr>');            if (calculatedTimings.length === 0) {        const displayResults = function() {        // Display calculation results                };            displayResults();            // Display results                        calculatedTimings.sort((a, b) => a.sendTime - b.sendTime);            // Sort by send time                        });                });                    });                        arrivalTime: arrivalTime                        travelTime: travelTime,                        sendTime: sendTime,                        unit: unitType,                        village: village,                    calculatedTimings.push({                                        const arrivalTime = sendTime + (travelTime * 1000) + targetData.snipeOffset;                    const sendTime = targetData.arrivalTime - (travelTime * 1000) - targetData.snipeOffset;                    // Calculate send time (arrival time - travel time - offset)                                        const travelTime = lib.calculateTravelTime(village.coords, targetData.coords, unitType, sigilBonus);                    // Calculate travel time with sigil bonus                                        }                        return;                    if (!village.troops[unitType] || village.troops[unitType] === 0) {                    // Check if village has this unit                selectedUnits.forEach(unitType => {            selectedVillages.forEach(village => {                        calculatedTimings = [];            // Calculate timings                        const sigilBonus = parseFloat($('#sigil-bonus').val()) || 0;            // Get sigil bonus                        }                return;                UI.ErrorMessage('Please select at least one village');            if (selectedVillages.length === 0) {                        }                return;                UI.ErrorMessage('Please select at least one unit type');            if (selectedUnits.length === 0) {                        }                return;                UI.ErrorMessage('Please enter incoming arrival time');            if (!targetData.arrivalTime) {                        }                return;                UI.ErrorMessage('Please enter target coordinates');            if (!targetData.coords) {            // Validate inputs                        });                }                    selectedVillages.push(villageData[villageId]);                if (villageData[villageId]) {                const villageId = $(this).data('id');            $('.village-checkbox:checked').each(function() {            const selectedVillages = [];            // Get selected villages                        });                selectedUnits.push($(this).val());            $('.unit-checkbox input:checked').each(function() {            const selectedUnits = [];            // Get selected units        const calculateTimings = function() {        // Calculate snipe timings                };            });                }                    $(this).text('SEND NOW!').css('color', 'red').css('font-weight', 'bold');                } else {                    }                        $(this).css('color', 'green');                    } else {                        $(this).css('color', 'orange');                    } else if (timeUntilSend < 300) {                        $(this).css('color', 'red').css('font-weight', 'bold');                    if (timeUntilSend < 60) {                    // Color coding based on urgency                                        $(this).text(timerStr);                    const timerStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;                                        const seconds = timeUntilSend % 60;                    const minutes = Math.floor((timeUntilSend % 3600) / 60);                    const hours = Math.floor(timeUntilSend / 3600);                if (timeUntilSend > 0) {                                const timeUntilSend = Math.floor((sendTime - currentTime) / 1000); // in seconds                const sendTime = parseInt($(this).data('send-time'));            $('.send-timer').each(function() {                        const currentTime = window.TWSDK.Core.getCurrentServerTime();        const updateSendTimers = function() {        // Update send timers                };            });                $(this).text(distance ? distance.toFixed(1) : '0.0');                const distance = window.TWSDK.Coords.distance(villageCoords, targetData.coords);                const villageCoords = $(this).data('coords');            $('.distance-cell').each(function() {                        }                return;                $('.distance-cell').text('0.0');            if (!targetData.coords) {        const updateDistances = function() {        // Update all distance cells when target coordinates change                };            });                updateVillageTable();                selectedGroup = parseInt($(this).val());            $('#group-filter').on('change', function() {            // Group filter change                        });                }                    $('#toggle-villa-dropdown').text('▼');                    $(this).hide();                    $(this).val(''); // Reset selection                    $('#snipe-target-coords').val(coords).trigger('input');                if (coords) {                const coords = $(this).val();            $('#villa-dropdown').on('change', function() {            // Villa dropdown selection                        });                $(this).text($dropdown.is(':visible') ? '▲' : '▼');                $dropdown.toggle();                const $dropdown = $('#villa-dropdown');            $('#toggle-villa-dropdown').on('click', function() {            // Villa dropdown toggle                        });                calculateTimings();            $('.calculate-button').on('click', function() {            // Calculate button                        });                updateDebugInfo();                $(this).next('.snipe-slider-value').text($(this).val() + 'ms');                targetData.snipeOffset = parseInt($(this).val());            $('#snipe-offset').on('input', function() {            // Snipe offset slider                        });                }                    updateDebugInfo();                    targetData.arrivalTime = lib.parseIncomingTime(timeStr);                if (timeStr) {                const timeStr = $(this).val();            $('#snipe-arrival-time').on('input', function() {            // Arrival time input                        });                }                    updateDebugInfo();                    updateDistances();                    targetData.coords = null;                } else {                    updateDebugInfo();                    updateDistances();                    targetData.coords = coords;                if (parsed) {                                const parsed = window.TWSDK.Coords.parse(coords);                const coords = $(this).val();            $('#snipe-target-coords').on('input', function() {            // Target coordinates input - real-time distance update                        });                }                    $('#debug-info').hide();                } else {                    updateDebugInfo();                    $('#debug-info').show();                if (debugMode) {                debugMode = $(this).is(':checked');            $('#debug-mode').on('change', function() {            // Debug mode toggle                        });                $('#select-all-checkbox').prop('checked', false);                $('.village-checkbox').prop('checked', false);            $('#deselect-all-villages').on('click', function() {            // Deselect all villages                        });                $('#select-all-checkbox').prop('checked', true);                $('.village-checkbox').prop('checked', true);            $('#select-all-checkbox, #select-all-villages').on('click', function() {            // Select all villages                        });                $(this).next('.snipe-slider-value').text($(this).val() + 'ms');            $('#snipe-offset').on('input', function() {            // Slider update        const bindEventHandlers = function() {        // Event handlers                };            populateVillaDropdown();            $('#village-list').html(html);            const html = buildVillageRows(villages);                        }                villages = villages.filter(village => village.groups.includes(selectedGroup));            if (selectedGroup > 0) {            // Filter by selected group if not "All"                        let villages = Object.values(villageData);        const updateVillageTable = function() {        // Update the village table with fetched data                };            });                };                    groups: groups                    troops: troops,                    coords: villageCoords,                    name: villageName,                    id: villageId,                villageData[villageId] = {                // Store village data                                });                    }                        }                            troops[unitType] = count;                        if (count > 0) {                        const count = parseInt($(this).text()) || 0;                    if (unitType && skipUnits.indexOf(unitType) === -1) {                    const unitType = game_data.units[index];                $row.find('.unit-item').each(function(index) {                const troops = {};                // Get troop counts                                }                    }                        });                            groups.push(parseInt(groupClass.replace('group_', '')));                        groupMatches.forEach(groupClass => {                    if (groupMatches) {                    const groupMatches = classList.match(/group_\d+/g);                if (classList) {                const classList = $row.attr('class');                const groups = [];                // Get group memberships from row classes                                const villageCoords = $villageLink.text().match(/\d{1,3}\|\d{1,3}/)[0];                const villageName = $villageLink.data('text');                const villageId = $row.find('.quickedit-vn').first().data('id');                const $villageLink = $row.find('.quickedit-label').first();                const $row = $(this);            $html.find('#combined_table').find('.row_a, .row_b').each(function() {                        const skipUnits = ['ram', 'catapult', 'knight', 'militia']; // Skip non-sniping units        const processVillageData = function($html) {        // Process village data from overview page                };            });                $('#village-list').html('<tr><td colspan="5" style="text-align: center; color: red;">Failed to load villages</td></tr>');            }).fail(function() {                updateVillageTable();                // Update the village table with fetched data            ).then(function() {                }                    processVillageData($html);                    // Process each page of villages                function($html) {                }),                    group: 0 // All villages                    mode: 'combined',                TribalWars.buildURL('GET', 'overview_villages', {            window.TWSDK.Page.processAllPages(            // Use TWSDK's page processing to get all villages                        $('#village-list').html('<tr><td colspan="5" class="loading-indicator">Loading villages...</td></tr>');            // Show loading indicator (already shown in buildMainDialog)        const fetchUserVillages = function() {        // Fetch user's villages and troop counts                };            return html;                        });                `;                    </tr>                        <td>${troopsHtml}</td>                        <td class="distance-cell" data-coords="${village.coords}">${distance}</td>                        <td>${village.coords}</td>                        <td><a href="/game.php?village=${village.id}&screen=overview">${village.name}</a></td>                        <td><input type="checkbox" class="village-checkbox" data-id="${village.id}"></td>                    <tr>                html += `                                }                    }                        troopsHtml += `<img src="/graphic/unit/unit_${unitType}.png" title="${unitName}"> ${count} `;                        const unitName = t.units[unitType] || unitType; // fallback to unit key if translation missing                    if (count > 0) {                for (const [unitType, count] of Object.entries(village.troops)) {                let troopsHtml = '';                // Build troops display dynamically from all available troops                                    '0.0';                    window.TWSDK.Coords.distance(village.coords, targetData.coords).toFixed(1) :                 const distance = targetData.coords ?             villages.forEach(village => {            let html = '';                        }                return '<tr><td colspan="5" style="text-align: center;">Loading villages...</td></tr>';            if (!villages || villages.length === 0) {        const buildVillageRows = function(villages) {        // Build village rows from actual village data                };            return html;                        });                `;                    </div>                        <label for="unit-${unit}">${t.units[unit]}</label>                        <img src="/graphic/unit/unit_${unit}.png" alt="${unit}">                        <input type="checkbox" id="unit-${unit}" value="${unit}" ${unit === 'snob' ? 'checked' : ''}>                    <div class="unit-checkbox">                html += `            units.forEach(unit => {                        let html = '';            const units = ['snob', 'heavy', 'light', 'marcher', 'axe', 'sword', 'spear', 'archer'];        const buildUnitCheckboxes = function() {        // Build unit checkboxes                };            });                }                    timerInterval = null;                    clearInterval(timerInterval);                if (timerInterval) {            $('#popup_box_SnipeTiming').on('dialogclose', function() {            // Clean up timer when dialog closes                        bindEventHandlers();            Dialog.show('SnipeTiming', html);                        `;                </div>                    </div>                        </table>                            </tbody>                                <!-- Results will be populated here -->                            <tbody id="results-tbody">                            </thead>                                </tr>                                    <th>${t.results.actions}</th>                                    <th>${t.results.arrival}</th>                                    <th>${t.results.travelTime}</th>                                    <th>${t.results.sendTime}</th>                                    <th>${t.results.sendIn}</th>                                    <th>${t.results.unit}</th>                                    <th>${t.results.village}</th>                                <tr>                            <thead>                        <table class="vis" style="width: 100%;">                        <h3>Snipe Timings</h3>                    <div class="snipe-section snipe-results" id="snipe-results" style="display: none;">                    <!-- Results Section (initially hidden) -->                                        <button class="btn calculate-button">${t.calculateBtn}</button>                    <!-- Calculate Button -->                                        </div>                        </table>                            </tbody>                                <tr><td colspan="5" class="loading-indicator">Loading villages...</td></tr>                            <tbody id="village-list">                            </thead>                                </tr>                                    <th>Available Troops</th>                                    <th>Distance</th>                                    <th>Coordinates</th>                                    <th>Village</th>                                    <th><input type="checkbox" id="select-all-checkbox"></th>                                <tr>                            <thead>                        <table class="vis village-selection-table">                        </div>                            <button class="btn" id="deselect-all-villages">${t.deselectAll}</button>                            <button class="btn" id="select-all-villages">${t.selectAll}</button>                        <div>                        </div>                            </select>                                <option value="0">${t.allGroups}</option>                            <select id="group-filter" style="margin-left: 10px;">                            <label style="font-weight: bold;">${t.filterByGroup}</label>                        <div style="margin-bottom: 10px;">                        <h3>${t.villageSelection}</h3>                    <div class="snipe-section">                    <!-- Village Selection Section -->                                        </div>                        </div>                            ${buildUnitCheckboxes()}                        <div class="unit-selection">                        <h3>${t.unitSelection}</h3>                    <div class="snipe-section">                    <!-- Unit Selection Section -->                                        </div>                        </div>                            <input type="number" id="sigil-bonus" value="0" min="0" max="100" step="1" style="width: 80px;">                            <label>Sigil bonus (%):</label>                        <div class="snipe-input-group">                        </div>                            <span class="snipe-slider-value">50ms</span>                            <input type="range" class="snipe-slider" id="snipe-offset" min="0" max="1000" value="50" step="10">                            <label>${t.snipeOffset}</label>                        <div class="snipe-input-group">                        </div>                            <input type="text" id="snipe-arrival-time" placeholder="HH:MM:SS:mmm">                            <label>${t.arrivalTime}</label>                        <div class="snipe-input-group">                        </div>                            <button class="btn btn-small" id="toggle-villa-dropdown" style="margin-left: 5px;">▼</button>                            </select>                                <option value="">${t.yourVillas}</option>                            <select id="villa-dropdown" style="width: 150px; display: none;">                            <input type="text" id="snipe-target-coords" placeholder="XXX|YYY" pattern="\\d{1,3}\\|\\d{1,3}">                            <label>${t.targetCoords}</label>                        <div class="snipe-input-group">                        <h3>Target Information</h3>                    <div class="snipe-section">                    <!-- Target Information Section -->                                        </div>                        <div class="loading-indicator">Loading world settings...</div>                    <div class="debug-section" id="debug-info" style="display: none;">                    <!-- Debug section (initially hidden) -->                                        </div>                        </label>                            <input type="checkbox" id="debug-mode"> ${t.debug}                        <label>                    <div style="text-align: right; margin-bottom: 10px;">                    <!-- Debug checkbox -->                                        <h2>${t.title}</h2>                <div class="snipe-content">                ${styles}            const html = `                        `;                </style>                    }                        color: #666;                        font-style: italic;                        padding: 20px;                        text-align: center;                    .loading-indicator {                    }                        border: 1px dashed #999;                        background: #f9f9f9;                        padding: 10px;                        margin-top: 10px;                    .debug-section {                    }                        padding: 10px 20px;                        font-size: 14px;                        display: block;                        margin: 20px auto;                    .calculate-button {                    }                        overflow-y: auto;                        max-height: 400px;                        margin-top: 20px;                    .snipe-results {                    }                        height: 20px;                        width: 20px;                    .unit-checkbox img {                    }                        gap: 5px;                        align-items: center;                        display: flex;                    .unit-checkbox {                    }                        margin-top: 10px;                        gap: 10px;                        flex-wrap: wrap;                        display: flex;                    .unit-selection {                    }                        padding: 5px;                        background: #c1a264;                    .village-selection-table th {                    }                        margin-top: 10px;                        width: 100%;                    .village-selection-table {                    }                        font-weight: bold;                        width: 50px;                        display: inline-block;                    .snipe-slider-value {                    }                        margin: 0 10px;                        display: inline-block;                        width: 300px;                    .snipe-slider {                    }                        width: 200px;                    .snipe-input-group input[type="text"] {                    }                        font-weight: bold;                        width: 150px;                        display: inline-block;                    .snipe-input-group label {                    }                        margin: 5px 0;                    .snipe-input-group {                    }                        border: 1px solid #7D510F;                        background: url('graphic/index/main_bg.jpg') 100% 0% #E3D5B3;                        padding: 10px;                        margin-bottom: 15px;                    .snipe-section {                    }                        padding: 10px;                    .snipe-content {                    }                        position: relative;                        width: 700px;                    #popup_box_SnipeTiming {                <style>            const styles = `        const buildMainDialog = function() {        // Build main UI dialog                };            }                $('#debug-info').html(debugHtml);                `;                    </div>                        </details>                            <pre style="font-size: 10px; margin: 5px 0;">${JSON.stringify(worldSettings, null, 2)}</pre>                            <summary style="cursor: pointer;">${t.worldSettings}</summary>                        <details style="margin-top: 5px;">                        Villages Loaded: ${Object.keys(villageData).length}<br>                        Target Coords: ${targetData.coords || 'Not set'}<br>                        ${t.serverTime}: ${new Date(serverTime).toLocaleString()}<br>                        ${t.watchtower}: ${window.TWSDK.Core.getWatchtower() ? 'Enabled' : 'Disabled'}<br>                        ${t.church}: ${window.TWSDK.Core.getChurch() ? 'Enabled' : 'Disabled'}<br>                        ${t.nightBonus}: ${window.TWSDK.Core.getNightBonus() ? 'Enabled' : 'Disabled'}<br>                        ${t.morale}: ${window.TWSDK.Core.getMorale() ? 'Enabled' : 'Disabled'}<br>                        ${t.unitSpeed}: ${unitSpeedModifier}x<br>                        ${t.worldSpeed}: ${worldSpeed}x<br>                        <strong>${t.debugInfo}:</strong><br>                    <div style="padding: 10px; background: #f4f4f4; border: 1px solid #ccc; font-size: 12px;">                const debugHtml = `                const serverTime = window.TWSDK.Core.getCurrentServerTime();            if (debugMode && $('#debug-info').length) {        const updateDebugInfo = function() {        // Update debug information display                };            }                updateDebugInfo();                };                    'Unit speed': unitSpeedModifier                    'Game speed': worldSpeed,                worldSettings = {                unitSpeedModifier = game_data.unit_speed || 1;                worldSpeed = game_data.speed || 1;                // Use fallbacks                console.error('Failed to fetch world settings:', error);            } catch (error) {                updateDebugInfo();                console.log('World settings loaded:', worldSettings);                                worldSettings = window.TWSDK.Core.getWorldSettings();                unitSpeedModifier = window.TWSDK.Core.getUnitSpeed();                worldSpeed = window.TWSDK.Core.getWorldSpeed();                                await window.TWSDK.Core.fetchWorldSettings();                // Ensure world settings are loaded            try {        const fetchWorldSpeed = async function() {        // Fetch world speed from SDK - now properly async                };            fetchUserVillages();            // Fetch user's villages after world settings are loaded                        await fetchGroups();            // Fetch groups                        await fetchWorldSpeed();            // Wait for world settings to be loaded, then populate UI                        buildMainDialog();            // Show main dialog with loading state                        }                return;                UI.ErrorMessage('This script requires a premium account');            if (!game_data.features.Premium.active) {            // Check for premium features if needed        const init = async function() {        // Initialize function - entry point                let selectedGroup = 0;  // Currently selected group filter        let groupsData = {};  // Store groups data        let timerInterval = null;  // Store timer update interval        let worldSettings = {};  // Store all world settings        let debugMode = false;  // Debug mode flag        let unitSpeedModifier = 1;  // Store unit speed modifier        let worldSpeed = 1;  // Store world speed        let calculatedTimings = [];  // Store calculated snipe timings        let villageData = {};  // Store user's villages and available troops                };            snipeOffset: 50  // Default 50ms after incoming            arrivalTime: null,            coords: null,        let targetData = {        // State management                const lib = Library;        const t = Translation.get();    window.SnipeTiming.Main = (function(Library, Translation) {    // Main application module    })();        return { get };                };            return messages[lang];            let lang = messages.hasOwnProperty(game_data.locale) ? game_data.locale : 'en_US';        const get = function() {                };            }                worldSettings: 'World Settings',                watchtower: 'Watchtower',                church: 'Church',                nightBonus: 'Night Bonus',                morale: 'Morale',                serverTime: 'Server Time',                unitSpeed: 'Unit Speed',                worldSpeed: 'World Speed',                debugInfo: 'Debug Information',                debug: 'Debug mode',                },                    archer: 'Archer'                    spear: 'Spear',                    sword: 'Sword',                    axe: 'Axe',                    marcher: 'Mounted Archer',                    light: 'Light Cavalry',                    heavy: 'Heavy Cavalry',                    snob: 'Noble',                units: {                },                    sendIn: 'Send In'  // Add this new translation                    copy: 'Copy',                    actions: 'Actions',                    arrival: 'Arrival',                    travelTime: 'Travel Time',                    sendTime: 'Send Time',                    unit: 'Unit',                    village: 'Village',                results: {                yourVillas: 'Your villas',  // Add this                allGroups: 'All',  // Add this                filterByGroup: 'Filter by group:',  // Add this                villageSelection: 'Village Selection:',                unitSelection: 'Unit Selection:',                deselectAll: 'Deselect All',                selectAll: 'Select All',                calculateBtn: 'Calculate Timings',                ownVillages: 'Your villages:',                snipeOffset: 'Snipe offset (ms):',                arrivalTime: 'Desired arrival time:',                targetCoords: 'Target coordinates:',                title: 'Snipe Timing Calculator',            en_US: {        const messages = {    window.SnipeTiming.Translation = (function() {    // Translation module for multi-language support    })();        };            parseIncomingTime            calculateTravelTime,        return {                };            }                return new Date().getTime() + 3600000; // 1 hour from now as fallback                }                    return now.getTime();                    }                        now.setMilliseconds(parseInt(parts[3]));                    if (parts[3]) {                    now.setSeconds(parseInt(parts[2]));                    now.setMinutes(parseInt(parts[1]));                    now.setHours(parseInt(parts[0]));                    const now = new Date();                if (parts.length >= 3) {                const parts = timeString.split(':');                // Fallback for simple HH:MM:SS:mmm format            } catch (e) {                return window.TWSDK.Core.timestampFromString(timeString);            try {            // Try to parse using TWSDK first        const parseIncomingTime = function(timeString) {        // Parse incoming attack time from various formats                };            return window.TWSDK.Coords.travelTime(origin, target, unitSpeed, worldSpeed, unitModifier, sigilBonus);                        const unitModifier = window.TWSDK.Core.getUnitSpeed();            const worldSpeed = window.TWSDK.Core.getWorldSpeed();            const unitSpeed = window.TWSDK.Units.getSpeed(unitName);        const calculateTravelTime = function(origin, target, unitName, sigilBonus = 0) {        // Calculate travel time using TWSDK    window.SnipeTiming.Library = (function() {    // Library module - script-specific utilities    window.SnipeTiming = {};    // Main module structurefunction initializeSnipeTiming() {});    initializeSnipeTiming();    // Still try to initialize the script with fallback data    console.error('TWSDK initialization failed:', error);}).catch(error => {    initializeSnipeTiming();    console.log('TWSDK initialized successfully');window.TWSDK.Core.init().then(() => {console.log('TWSDK is ready, initializing...');// Initialize SDK and then the main script - MOVED HERE AFTER SDK DEFINITION// =============== END SDK ================================================}    console.error('TWSDK: window.TWSDK is undefined at end of script!');} else {    console.log('TWSDK: Script loaded and ready');    window.TWSDK._ready = true;if (typeof window.TWSDK !== 'undefined') {// Mark SDK as ready - ensure window.TWSDK exists};    return parseFloat(this);Number.prototype.toNumber = function() {};    return parseFloat(this);String.prototype.toNumber = function() {};        : c;        ? { x: c.split('|')[0], y: c.split('|')[1] }    return c && objectified    const c = (this.match(/\d{1,3}\|\d{1,3}/g) || [false]).pop();String.prototype.toCoord = function(objectified) {// String prototype extensions})();    };        processAllPages    return {        };        return processPage(url, page, wrapFn);                };            }                return processorFn($html);            } else {                return processPage(url, dnp, wrapFn);                processorFn($html);            if (dnp) {                        const dnp = determineNextPage(page, $html);        const wrapFn = function(page, $html) {        let page = url.match('am_farm') || url.match('scavenge_mass') ? 0 : -1;                };            return false;                        }                return page + 1;            } else if (page < navLength) {                return Math.floor(1000 / pageSize);            if (page == -1 && villageLength == 1000) {                                : parseInt($html.find('input[name="page_size"]').val());                ? 10            const pageSize = $('#mobileHeader').length > 0                                        : $html.find('.paged-nav-item').not('[href*="page=-1"]').length;                    ? navSelect.find('option').length - 1                : navSelect.length > 0                ) - 1                        .replace(/\D/g, '')                        .text()                        .last()                        .find('a.paged-nav-item, strong.paged-nav-item')                        .first()                    $('#plunder_list_nav')                ? parseInt(            const navLength = $html.find('#am_widget_Farm').length > 0                                .first();                .find('select')                .closest('td')                .first()                .find('.paged-nav-item')            const navSelect = $html                                : $html.find('tr.row_a, tr.row_ax, tr.row_b, tr.row_bx').length;                ? $html.find('tr[id*="scavenge_village"]').length            const villageLength = $html.find('#scavenge_mass_screen').length > 0        const determineNextPage = function(page, $html) {                };            });                return wrapFn(page, $(html));            }).then((html) => {                url: pageUrl + pageText,            return $.ajax({                        const pageText = pageUrl.match('am_farm') ? `&Farm_page=${page}` : `&page=${page}`;        const processPage = function(pageUrl, page, wrapFn) {    const processAllPages = function(url, processorFn) {    // Process all pages of a paginated viewwindow.TWSDK.Page = (function() {// Page processing utilities})();    };        getSpeed        fetchUnitSpeeds,        getUnitSpeeds,    return {        };        return speeds[unitName] || null;        const speeds = getUnitSpeeds();    const getSpeed = function(unitName) {    // Get speed for specific unit        };            });                return unitSpeeds; // Return defaults on error                console.error('TWSDK: Failed to fetch unit speeds', error);            .catch(error => {            })                return speeds;                localStorage.setItem('TWSDK_unitSpeeds', JSON.stringify(speeds));                                    });                        }                            speeds[unitName] = parseFloat(speed);                        if (speed) {                        const speed = $(el).find('speed').text();                        const unitName = $(el).prop('nodeName');                    .each((i, el) => {                    .children()                    .find('config')                $(xml)                const speeds = {};            .then((xml) => {        return $.get('/interface.php?func=get_unit_info')    const fetchUnitSpeeds = function() {    // Fetch and store unit speeds from game        };        return unitSpeeds;        }            return JSON.parse(stored);        if (stored) {        const stored = localStorage.getItem('TWSDK_unitSpeeds');    const getUnitSpeeds = function() {    // Get unit speeds from localStorage or use defaults        };        snob: 35        knight: 10,        catapult: 30,        ram: 30,        heavy: 11,        marcher: 10,        light: 10,        spy: 9,        archer: 18,        axe: 18,        sword: 22,        spear: 18,    const unitSpeeds = {window.TWSDK.Units = (function() {// Unit data utilities})();    };        travelTime        distance,        parse,    return {        };        return Math.round(timeInMinutes * 60);        // Return in seconds                const timeInMinutes = (dist * unitSpeed) / (worldSpeed * unitModifier * sigilRatio);        // Travel time in minutes = (distance * unit speed) / (world speed * unit speed modifier * sigil ratio)                const sigilRatio = 1 + (sigilBonus / 100);        // Calculate sigil ratio (sigil reduces travel time)                if (!dist) return null;        const dist = distance(origin, target);    const travelTime = function(origin, target, unitSpeed, worldSpeed = 1, unitModifier = 1, sigilBonus = 0) {    // Calculate travel time between coordinates        };        return Math.sqrt(dx * dx + dy * dy);                const dy = c1.y - c2.y;        const dx = c1.x - c2.x;                if (!c1 || !c2) return null;                const c2 = typeof coord2 === 'string' ? parse(coord2) : coord2;        const c1 = typeof coord1 === 'string' ? parse(coord1) : coord1;    const distance = function(coord1, coord2) {    // Calculate distance between two coordinates        };        };            }                return `${this.x}|${this.y}`;            toString: function() {            y: parseInt(match[2]),            x: parseInt(match[1]),        return {                if (!match) return null;        const match = coordStr.match(/(\d{1,3})\|(\d{1,3})/);    const parse = function(coordStr) {    // Parse coordinates from stringwindow.TWSDK.Coords = (function() {// Coordinate utilities})();    };        formatDuration        formatDateTime,        timestampFromString,        getCurrentServerTime,        getSigilBonus,        getWatchtower,        getChurch,        getNightBonus,        getMorale,        getUnitSpeed,        getWorldSpeed,        getWorldSettings,        fetchWorldSettings,        init,    return {        };        return window.TWSDK._initPromise;                });            window.TWSDK._initialized = true;            // Still mark as initialized even if there's an error            console.error('TWSDK: Initialization error', error);        }).catch(error => {            console.log('TWSDK: Initialization complete');            window.TWSDK._initialized = true;        ]).then(() => {            window.TWSDK.Units.fetchUnitSpeeds()            fetchWorldSettings(),        window.TWSDK._initPromise = Promise.all([                }            return window.TWSDK._initPromise;        if (window.TWSDK._initPromise) {    const init = function() {    // Initialize the SDK        };        }            return `${secs}s`;        } else {            return `${minutes}m ${secs}s`;        } else if (minutes > 0) {            return `${hours}h ${minutes}m`;        if (hours > 0) {                const secs = seconds % 60;        const minutes = Math.floor((seconds % 3600) / 60);        const hours = Math.floor(seconds / 3600);    const formatDuration = function(seconds) {    // Format duration in seconds to human readable        };        return `${hours}:${minutes}:${seconds}`;                }            return `${hours}:${minutes}:${seconds}:${ms}`;            const ms = String(date.getMilliseconds()).padStart(3, '0');        if (includeMs) {                const seconds = String(date.getSeconds()).padStart(2, '0');        const minutes = String(date.getMinutes()).padStart(2, '0');        const hours = String(date.getHours()).padStart(2, '0');        const date = new Date(timestamp);    const formatDateTime = function(timestamp, includeMs = false) {    // Format timestamp for display        };        return date.getTime();        }            date = new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2], t[3] || 0);            t = laterDatePattern[2].split(':');            d = (laterDatePattern[1] + d[2]).split('.').map((x) => +x);        } else {            );                t[3] || 0                t[2],                t[1],                t[0],                d[0] + 1,                d[1] - 1,                d[2],            date = new Date(            t = tomorrowPattern[1].split(':');        } else if (tomorrowPattern !== null) {            date = new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2], t[3] || 0);            t = todayPattern[1].split(':');        if (todayPattern !== null) {        let t, date;        ).exec(timestr);                .replace('%2', '([\\d+|:]+)')                .replace('%1', '([\\d+|\\.]+)')            window.lang['0cb274c906d622fa8ce524bcfbb7552d']        const laterDatePattern = new RegExp(        ).exec(timestr);            )                '([\\d+|:]+)'                '%s',            window.lang['57d28d1b211fddbb7a499ead5bf23079'].replace(        const tomorrowPattern = new RegExp(        ).exec(timestr);            )                '([\\d+|:]+)'                '%s',            window.lang['aea2b0aa9ae1534226518faaefffdaad'].replace(        const todayPattern = new RegExp(            .map((x) => +x);            .split('/')            .text()        const d = $('#serverDate')    const timestampFromString = function(timestr) {    // Parse time string to timestamp        };        return new Date(year, month - 1, day, hour, min, sec).getTime();            .match(/\d+/g);            .text()            .closest('p')        const [hour, min, sec, day, month, year] = $('#serverTime')    const getCurrentServerTime = function() {    // Get current server time        };        return 0;        // For now, we'll return 0 as default since sigils are typically player-specific items        // This would need to be added to the config XML parsing if sigils are in world config        const settings = getWorldSettings();    const getSigilBonus = function() {    // Get sigil bonus setting (returns percentage, e.g., 20 for 20%)        };        return settings['game.watchtower'] || false;        const settings = getWorldSettings();    const getWatchtower = function() {    // Get watchtower setting        };        return settings['game.church'] || false;        const settings = getWorldSettings();    const getChurch = function() {    // Get church setting        };        return settings['night.active'] || 0;        const settings = getWorldSettings();    const getNightBonus = function() {    // Get night bonus setting (0=disabled, 1=classic, 2=only def bonus)        };        return settings['moral'] || 0;        const settings = getWorldSettings();    const getMorale = function() {    // Get morale setting (0=disabled, 1=points based, 2=time based)        };        return settings['unit_speed'] || game_data.unit_speed || 1;        const settings = getWorldSettings();    const getUnitSpeed = function() {    // Get unit speed from settings        };        return settings['speed'] || game_data.speed || 1;        const settings = getWorldSettings();    const getWorldSpeed = function() {    // Get world speed from settings        };        return window.TWSDK._worldSettings || JSON.parse(localStorage.getItem('TWSDK_worldSettings')) || {};    const getWorldSettings = function() {    // Get all world settings        };        });            };                'unit_speed': game_data.unit_speed || 1                'speed': game_data.speed || 1,            return {            // Ultimate fallback to game_data                        }                return window.TWSDK._worldSettings;                window.TWSDK._worldSettings = JSON.parse(cached);            if (cached && timestamp && (Date.now() - parseInt(timestamp) < 3600000)) {                        const timestamp = localStorage.getItem('TWSDK_worldSettings_timestamp');            const cached = localStorage.getItem('TWSDK_worldSettings');            // Fallback to localStorage if available and fresh (less than 1 hour old)        }).catch(() => {            return settings;            console.log('World settings parsed:', settings);                        localStorage.setItem('TWSDK_worldSettings_timestamp', Date.now());            localStorage.setItem('TWSDK_worldSettings', JSON.stringify(settings));            window.TWSDK._worldSettings = settings;            // Cache the settings                        parseElement($xml.find('config'));                        };                });                    }                        }                            settings[key] = value;                        } else {                            settings[key] = false;                        } else if (value === '0') {                            settings[key] = true;                        } else if (value === '1') {                            settings[key] = parseFloat(value);                        if (value.match(/^\d+(\.\d+)?$/)) {                        // Convert to appropriate type                                                const value = $child.text().trim();                        // Leaf node, get the value                    } else {                        parseElement($child, key);                        // Has children, recurse                    if ($child.children().length > 0) {                                        const key = parentKey ? `${parentKey}.${$child.prop('nodeName')}` : $child.prop('nodeName');                    const $child = $(this);                $element.children().each(function() {            const parseElement = function($element, parentKey = '') {            // Parse XML into flat JSON structure                        const settings = {};            const $xml = $(xml);        return $.get(configUrl).then(xml => {                const configUrl = '/interface.php?func=get_config';        // Build config URL based on current game URL                }            return Promise.resolve(window.TWSDK._worldSettings);        if (window.TWSDK._worldSettings) {    const fetchWorldSettings = function() {    // Fetch world settings from config XMLwindow.TWSDK.Core = (function() {// Core utilitieswindow.TWSDK._initPromise = null;window.TWSDK._initialized = false;window.TWSDK._worldSettings = null;// World settings cachewindow.TWSDK = window.TWSDK || {};// Version: 1.0.0// TRIBAL WARS SDK - Reusable utility functions// ========================= SDK CODE ==============================================================================// fetch('https://raw.githubusercontent.com/tgreer812/TribalWarsScripts/refs/heads/main/snipeTiming.js')// Simple URL test - paste this in console}    })();        window.SnipeTiming.Main.init();        // Initialize the script    (function() {    // Auto-execute on script load    })(window.SnipeTiming.Library, window.SnipeTiming.Translation);        };            init: init        return {                };            });                $dropdown.append(`<option value="${village.coords}">${village.name} (${village.coords})</option>`);            sortedVillages.forEach(village => {                        const sortedVillages = Object.values(villageData).sort((a, b) => a.name.localeCompare(b.name));            // Sort villages by name                        $dropdown.append(`<option value="">${t.yourVillas}</option>`);            $dropdown.empty();            const $dropdown = $('#villa-dropdown');        const populateVillaDropdown = function() {        // Populate villa dropdown                };                });                    console.error('Failed to fetch groups:', error);                .catch(error => {                })                    }                        });                            }                                $groupFilter.append(`<option value="${group.group_id}">${group.name}</option>`);                                groupsData[group.group_id] = group;                            if (group.type !== 'separator' && group.group_id !== undefined) {                        response.result.forEach(group => {                                                const $groupFilter = $('#group-filter');                        groupsData = {};                    if (response && response.result) {                .then(response => {            return $.get(TribalWars.buildURL('GET', 'groups', { ajax: 'load_group_menu' }))        const fetchGroups = function() {        // Fetch user groups                };            });                UI.SuccessMessage('Time copied to clipboard: ' + timeStr);                                temp.remove();                document.execCommand('copy');                temp.val(timeStr).select();                $('body').append(temp);                const temp = $('<input>');                // Copy to clipboard                                const timeStr = window.TWSDK.Core.formatDateTime(time.getTime(), true);                const time = new Date($(this).data('time'));            $('.copy-time').on('click', function() {            // Bind copy buttons                        timerInterval = setInterval(updateSendTimers, 1000);            updateSendTimers();            }                clearInterval(timerInterval);            if (timerInterval) {            // Start timer updates                        $('#snipe-results').show();            $('#results-tbody').html(html);                        });                `;                    </tr>                        </td>                            <button class="btn btn-small copy-time" data-time="${timing.sendTime}">${t.results.copy}</button>                        <td>                        </td>                            ${isGood ? '✓' : '✗'} ${window.TWSDK.Core.formatDateTime(timing.arrivalTime, true)}                        <td style="color: ${isGood ? 'green' : 'red'};">                        <td>${window.TWSDK.Core.formatDuration(timing.travelTime)}</td>                        <td style="font-family: monospace;">${window.TWSDK.Core.formatDateTime(timing.sendTime, true)}</td>                        <td class="send-timer" data-send-time="${timing.sendTime}" style="font-family: monospace;">--:--:--</td>                        <td><img src="/graphic/unit/unit_${timing.unit}.png" title="${t.units[timing.unit]}"> ${t.units[timing.unit]}</td>                        <td><a href="/game.php?village=${timing.village.id}&screen=overview">${timing.village.name}</a></td>                    <tr>                html += `                                const isGood = Math.abs(arrivalDiff - targetData.snipeOffset) < 100; // Within 100ms tolerance                const arrivalDiff = timing.arrivalTime - targetData.arrivalTime;            calculatedTimings.forEach(timing => {            let html = '';                        }                return;                $('#snipe-results').show();                $('#results-tbody').html('<tr><td colspan="6" style="text-align: center;">No valid snipe timings found</td></tr>');            if (calculatedTimings.length === 0) {        const displayResults = function() {        // Display calculation results                };            displayResults();            // Display results                        calculatedTimings.sort((a, b) => a.sendTime - b.sendTime);            // Sort by send time                        });                });                    });                        arrivalTime: arrivalTime                        travelTime: travelTime,                        sendTime: sendTime,                        unit: unitType,                        village: village,                    calculatedTimings.push({                                        const arrivalTime = sendTime + (travelTime * 1000) + targetData.snipeOffset;                    const sendTime = targetData.arrivalTime - (travelTime * 1000) - targetData.snipeOffset;                    // Calculate send time (arrival time - travel time - offset)                                        const travelTime = lib.calculateTravelTime(village.coords, targetData.coords, unitType, sigilBonus);                    // Calculate travel time with sigil bonus                                        }                        return;                    if (!village.troops[unitType] || village.troops[unitType] === 0) {                    // Check if village has this unit                selectedUnits.forEach(unitType => {            selectedVillages.forEach(village => {                        calculatedTimings = [];            // Calculate timings                        const sigilBonus = parseFloat($('#sigil-bonus').val()) || 0;            // Get sigil bonus                        }                return;                UI.ErrorMessage('Please select at least one village');            if (selectedVillages.length === 0) {                        }                return;                UI.ErrorMessage('Please select at least one unit type');            if (selectedUnits.length === 0) {                        }                return;                UI.ErrorMessage('Please enter incoming arrival time');            if (!targetData.arrivalTime) {                        }                return;                UI.ErrorMessage('Please enter target coordinates');            if (!targetData.coords) {            // Validate inputs                        });                }                    selectedVillages.push(villageData[villageId]);                if (villageData[villageId]) {                const villageId = $(this).data('id');            $('.village-checkbox:checked').each(function() {            const selectedVillages = [];            // Get selected villages                        });                selectedUnits.push($(this).val());            $('.unit-checkbox input:checked').each(function() {            const selectedUnits = [];            // Get selected units        const calculateTimings = function() {        // Calculate snipe timings                };            });                }                    $(this).text('SEND NOW!').css('color', 'red').css('font-weight', 'bold');                } else {                    }                        $(this).css('color', 'green');                    } else {                        $(this).css('color', 'orange');                    } else if (timeUntilSend < 300) {                        $(this).css('color', 'red').css('font-weight', 'bold');                    if (timeUntilSend < 60) {                    // Color coding based on urgency                                        $(this).text(timerStr);                    const timerStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;                                        const seconds = timeUntilSend % 60;                    const minutes = Math.floor((timeUntilSend % 3600) / 60);                    const hours = Math.floor(timeUntilSend / 3600);                if (timeUntilSend > 0) {                                const timeUntilSend = Math.floor((sendTime - currentTime) / 1000); // in seconds                const sendTime = parseInt($(this).data('send-time'));            $('.send-timer').each(function() {                        const currentTime = window.TWSDK.Core.getCurrentServerTime();        const updateSendTimers = function() {        // Update send timers                };            });                $(this).text(distance ? distance.toFixed(1) : '0.0');                const distance = window.TWSDK.Coords.distance(villageCoords, targetData.coords);                const villageCoords = $(this).data('coords');            $('.distance-cell').each(function() {                        }                return;                $('.distance-cell').text('0.0');            if (!targetData.coords) {        const updateDistances = function() {        // Update all distance cells when target coordinates change                };            });                updateVillageTable();                selectedGroup = parseInt($(this).val());            $('#group-filter').on('change', function() {            // Group filter change                        });                }                    $('#toggle-villa-dropdown').text('▼');                    $(this).hide();                    $(this).val(''); // Reset selection                    $('#snipe-target-coords').val(coords).trigger('input');                if (coords) {                const coords = $(this).val();            $('#villa-dropdown').on('change', function() {            // Villa dropdown selection                        });                $(this).text($dropdown.is(':visible') ? '▲' : '▼');                $dropdown.toggle();                const $dropdown = $('#villa-dropdown');            $('#toggle-villa-dropdown').on('click', function() {            // Villa dropdown toggle                        });                calculateTimings();            $('.calculate-button').on('click', function() {            // Calculate button                        });                updateDebugInfo();                $(this).next('.snipe-slider-value').text($(this).val() + 'ms');                targetData.snipeOffset = parseInt($(this).val());            $('#snipe-offset').on('input', function() {            // Snipe offset slider                        });                }                    updateDebugInfo();                    targetData.arrivalTime = lib.parseIncomingTime(timeStr);                if (timeStr) {                const timeStr = $(this).val();            $('#snipe-arrival-time').on('input', function() {            // Arrival time input                        });                }                    updateDebugInfo();                    updateDistances();                    targetData.coords = null;                } else {                    updateDebugInfo();                    updateDistances();                    targetData.coords = coords;                if (parsed) {                                const parsed = window.TWSDK.Coords.parse(coords);                const coords = $(this).val();            $('#snipe-target-coords').on('input', function() {            // Target coordinates input - real-time distance update                        });                }                    $('#debug-info').hide();                } else {                    updateDebugInfo();                    $('#debug-info').show();                if (debugMode) {                debugMode = $(this).is(':checked');            $('#debug-mode').on('change', function() {            // Debug mode toggle                        });                $('#select-all-checkbox').prop('checked', false);                $('.village-checkbox').prop('checked', false);            $('#deselect-all-villages').on('click', function() {            // Deselect all villages                        });                $('#select-all-checkbox').prop('checked', true);                $('.village-checkbox').prop('checked', true);            $('#select-all-checkbox, #select-all-villages').on('click', function() {            // Select all villages                        });                $(this).next('.snipe-slider-value').text($(this).val() + 'ms');            $('#snipe-offset').on('input', function() {            // Slider update        const bindEventHandlers = function() {        // Event handlers                };            populateVillaDropdown();            $('#village-list').html(html);            const html = buildVillageRows(villages);                        }                villages = villages.filter(village => village.groups.includes(selectedGroup));            if (selectedGroup > 0) {            // Filter by selected group if not "All"                        let villages = Object.values(villageData);        const updateVillageTable = function() {        // Update the village table with fetched data                };            });                };                    groups: groups                    troops: troops,                    coords: villageCoords,                    name: villageName,                    id: villageId,                villageData[villageId] = {                // Store village data                                });                    }                        }                            troops[unitType] = count;                        if (count > 0) {                        const count = parseInt($(this).text()) || 0;                    if (unitType && skipUnits.indexOf(unitType) === -1) {                    const unitType = game_data.units[index];                $row.find('.unit-item').each(function(index) {                const troops = {};                // Get troop counts                                }                    }                        });                            groups.push(parseInt(groupClass.replace('group_', '')));                        groupMatches.forEach(groupClass => {                    if (groupMatches) {                    const groupMatches = classList.match(/group_\d+/g);                if (classList) {                const classList = $row.attr('class');                const groups = [];                // Get group memberships from row classes                                const villageCoords = $villageLink.text().match(/\d{1,3}\|\d{1,3}/)[0];                const villageName = $villageLink.data('text');                const villageId = $row.find('.quickedit-vn').first().data('id');                const $villageLink = $row.find('.quickedit-label').first();                const $row = $(this);            $html.find('#combined_table').find('.row_a, .row_b').each(function() {                        const skipUnits = ['ram', 'catapult', 'knight', 'militia']; // Skip non-sniping units        const processVillageData = function($html) {        // Process village data from overview page                };            });                $('#village-list').html('<tr><td colspan="5" style="text-align: center; color: red;">Failed to load villages</td></tr>');            }).fail(function() {                updateVillageTable();                // Update the village table with fetched data            ).then(function() {                }                    processVillageData($html);                    // Process each page of villages                function($html) {                }),                    group: 0 // All villages                    mode: 'combined',                TribalWars.buildURL('GET', 'overview_villages', {            window.TWSDK.Page.processAllPages(            // Use TWSDK's page processing to get all villages                        $('#village-list').html('<tr><td colspan="5" class="loading-indicator">Loading villages...</td></tr>');            // Show loading indicator (already shown in buildMainDialog)        const fetchUserVillages = function() {        // Fetch user's villages and troop counts                };            return html;                        });                `;                    </tr>                        <td>${troopsHtml}</td>                        <td class="distance-cell" data-coords="${village.coords}">${distance}</td>                        <td>${village.coords}</td>                        <td><a href="/game.php?village=${village.id}&screen=overview">${village.name}</a></td>                        <td><input type="checkbox" class="village-checkbox" data-id="${village.id}"></td>                    <tr>                html += `                                }                    }                        troopsHtml += `<img src="/graphic/unit/unit_${unitType}.png" title="${unitName}"> ${count} `;                        const unitName = t.units[unitType] || unitType; // fallback to unit key if translation missing                    if (count > 0) {                for (const [unitType, count] of Object.entries(village.troops)) {                let troopsHtml = '';                // Build troops display dynamically from all available troops                                    '0.0';                    window.TWSDK.Coords.distance(village.coords, targetData.coords).toFixed(1) :                 const distance = targetData.coords ?             villages.forEach(village => {            let html = '';                        }                return '<tr><td colspan="5" style="text-align: center;">Loading villages...</td></tr>';            if (!villages || villages.length === 0) {        const buildVillageRows = function(villages) {        // Build village rows from actual village data                };            return html;                        });                `;                    </div>                        <label for="unit-${unit}">${t.units[unit]}</label>                        <img src="/graphic/unit/unit_${unit}.png" alt="${unit}">                        <input type="checkbox" id="unit-${unit}" value="${unit}" ${unit === 'snob' ? 'checked' : ''}>                    <div class="unit-checkbox">                html += `            units.forEach(unit => {                        let html = '';            const units = ['snob', 'heavy', 'light', 'marcher', 'axe', 'sword', 'spear', 'archer'];        const buildUnitCheckboxes = function() {        // Build unit checkboxes                };            });                }                    timerInterval = null;                    clearInterval(timerInterval);                if (timerInterval) {            $('#popup_box_SnipeTiming').on('dialogclose', function() {            // Clean up timer when dialog closes                        bindEventHandlers();            Dialog.show('SnipeTiming', html);                        `;                </div>                    </div>                        </table>                            </tbody>                                <!-- Results will be populated here -->                            <tbody id="results-tbody">                            </thead>                                </tr>                                    <th>${t.results.actions}</th>                                    <th>${t.results.arrival}</th>                                    <th>${t.results.travelTime}</th>                                    <th>${t.results.sendTime}</th>                                    <th>${t.results.sendIn}</th>                                    <th>${t.results.unit}</th>                                    <th>${t.results.village}</th>                                <tr>                            <thead>                        <table class="vis" style="width: 100%;">                        <h3>Snipe Timings</h3>                    <div class="snipe-section snipe-results" id="snipe-results" style="display: none;">                    <!-- Results Section (initially hidden) -->                                        <button class="btn calculate-button">${t.calculateBtn}</button>                    <!-- Calculate Button -->                                        </div>                        </table>                            </tbody>                                <tr><td colspan="5" class="loading-indicator">Loading villages...</td></tr>                            <tbody id="village-list">                            </thead>                                </tr>                                    <th>Available Troops</th>                                    <th>Distance</th>                                    <th>Coordinates</th>                                    <th>Village</th>                                    <th><input type="checkbox" id="select-all-checkbox"></th>                                <tr>                            <thead>                        <table class="vis village-selection-table">                        </div>                            <button class="btn" id="deselect-all-villages">${t.deselectAll}</button>                            <button class="btn" id="select-all-villages">${t.selectAll}</button>                        <div>                        </div>                            </select>                                <option value="0">${t.allGroups}</option>                            <select id="group-filter" style="margin-left: 10px;">                            <label style="font-weight: bold;">${t.filterByGroup}</label>                        <div style="margin-bottom: 10px;">                        <h3>${t.villageSelection}</h3>                    <div class="snipe-section">                    <!-- Village Selection Section -->                                        </div>                        </div>                            ${buildUnitCheckboxes()}                        <div class="unit-selection">                        <h3>${t.unitSelection}</h3>                    <div class="snipe-section">                    <!-- Unit Selection Section -->                                        </div>                        </div>                            <input type="number" id="sigil-bonus" value="0" min="0" max="100" step="1" style="width: 80px;">                            <label>Sigil bonus (%):</label>                        <div class="snipe-input-group">                        </div>                            <span class="snipe-slider-value">50ms</span>                            <input type="range" class="snipe-slider" id="snipe-offset" min="0" max="1000" value="50" step="10">                            <label>${t.snipeOffset}</label>                        <div class="snipe-input-group">                        </div>                            <input type="text" id="snipe-arrival-time" placeholder="HH:MM:SS:mmm">                            <label>${t.arrivalTime}</label>                        <div class="snipe-input-group">                        </div>                            <button class="btn btn-small" id="toggle-villa-dropdown" style="margin-left: 5px;">▼</button>                            </select>                                <option value="">${t.yourVillas}</option>                            <select id="villa-dropdown" style="width: 150px; display: none;">                            <input type="text" id="snipe-target-coords" placeholder="XXX|YYY" pattern="\\d{1,3}\\|\\d{1,3}">                            <label>${t.targetCoords}</label>                        <div class="snipe-input-group">                        <h3>Target Information</h3>                    <div class="snipe-section">                    <!-- Target Information Section -->                                        </div>                        <div class="loading-indicator">Loading world settings...</div>                    <div class="debug-section" id="debug-info" style="display: none;">                    <!-- Debug section (initially hidden) -->                                        </div>                        </label>                            <input type="checkbox" id="debug-mode"> ${t.debug}                        <label>                    <div style="text-align: right; margin-bottom: 10px;">                    <!-- Debug checkbox -->                                        <h2>${t.title}</h2>                <div class="snipe-content">                ${styles}            const html = `                        `;                </style>                    }                        color: #666;                        font-style: italic;                        padding: 20px;                        text-align: center;                    .loading-indicator {                    }                        border: 1px dashed #999;                        background: #f9f9f9;                        padding: 10px;                        margin-top: 10px;                    .debug-section {                    }                        padding: 10px 20px;                        font-size: 14px;                        display: block;                        margin: 20px auto;                    .calculate-button {                    }                        overflow-y: auto;                        max-height: 400px;                        margin-top: 20px;                    .snipe-results {                    }                        height: 20px;                        width: 20px;                    .unit-checkbox img {                    }                        gap: 5px;                        align-items: center;                        display: flex;                    .unit-checkbox {                    }                        margin-top: 10px;                        gap: 10px;                        flex-wrap: wrap;                        display: flex;                    .unit-selection {                    }                        padding: 5px;                        background: #c1a264;                    .village-selection-table th {                    }                        margin-top: 10px;                        width: 100%;                    .village-selection-table {                    }                        font-weight: bold;                        width: 50px;                        display: inline-block;                    .snipe-slider-value {                    }                        margin: 0 10px;                        display: inline-block;                        width: 300px;                    .snipe-slider {                    }                        width: 200px;                    .snipe-input-group input[type="text"] {                    }                        font-weight: bold;                        width: 150px;                        display: inline-block;                    .snipe-input-group label {                    }                        margin: 5px 0;                    .snipe-input-group {                    }                        border: 1px solid #7D510F;                        background: url('graphic/index/main_bg.jpg') 100% 0% #E3D5B3;                        padding: 10px;                        margin-bottom: 15px;                    .snipe-section {                    }                        padding: 10px;                    .snipe-content {                    }                        position: relative;                        width: 700px;                    #popup_box_SnipeTiming {                <style>            const styles = `        const buildMainDialog = function() {        // Build main UI dialog                };            }                $('#debug-info').html(debugHtml);                `;                    </div>                        </details>                            <pre style="font-size: 10px; margin: 5px 0;">${JSON.stringify(worldSettings, null, 2)}</pre>                            <summary style="cursor: pointer;">${t.worldSettings}</summary>                        <details style="margin-top: 5px;">                        Villages Loaded: ${Object.keys(villageData).length}<br>                        Target Coords: ${targetData.coords || 'Not set'}<br>                        ${t.serverTime}: ${new Date(serverTime).toLocaleString()}<br>                        ${t.watchtower}: ${window.TWSDK.Core.getWatchtower() ? 'Enabled' : 'Disabled'}<br>                        ${t.church}: ${window.TWSDK.Core.getChurch() ? 'Enabled' : 'Disabled'}<br>                        ${t.nightBonus}: ${window.TWSDK.Core.getNightBonus() ? 'Enabled' : 'Disabled'}<br>                        ${t.morale}: ${window.TWSDK.Core.getMorale() ? 'Enabled' : 'Disabled'}<br>                        ${t.unitSpeed}: ${unitSpeedModifier}x<br>                        ${t.worldSpeed}: ${worldSpeed}x<br>                        <strong>${t.debugInfo}:</strong><br>                    <div style="padding: 10px; background: #f4f4f4; border: 1px solid #ccc; font-size: 12px;">                const debugHtml = `                const serverTime = window.TWSDK.Core.getCurrentServerTime();            if (debugMode && $('#debug-info').length) {        const updateDebugInfo = function() {        // Update debug information display                };            }                updateDebugInfo();                };                    'Unit speed': unitSpeedModifier                    'Game speed': worldSpeed,                worldSettings = {                unitSpeedModifier = game_data.unit_speed || 1;                worldSpeed = game_data.speed || 1;                // Use fallbacks                console.error('Failed to fetch world settings:', error);            } catch (error) {                updateDebugInfo();                console.log('World settings loaded:', worldSettings);                                worldSettings = window.TWSDK.Core.getWorldSettings();                unitSpeedModifier = window.TWSDK.Core.getUnitSpeed();                worldSpeed = window.TWSDK.Core.getWorldSpeed();                                await window.TWSDK.Core.fetchWorldSettings();                // Ensure world settings are loaded            try {        const fetchWorldSpeed = async function() {        // Fetch world speed from SDK - now properly async                };            fetchUserVillages();            // Fetch user's villages after world settings are loaded                        await fetchGroups();            // Fetch groups                        await fetchWorldSpeed();            // Wait for world settings to be loaded, then populate UI                        buildMainDialog();            // Fetch user's villages after world settings are loaded
            fetchUserVillages();
        };
        
        // Fetch world speed from SDK - now properly async
        const fetchWorldSpeed = async function() {
            try {
               
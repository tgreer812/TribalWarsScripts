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

    // Format duration in seconds as hh:mm:ss
    const formatDurationHMS = function(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        const hStr = String(h).padStart(2, '0');
        const mStr = String(m).padStart(2, '0');
        const sStr = String(s).padStart(2, '0');
        return `${hStr}:${mStr}:${sStr}`;
    };

    // Format date as DD.MM.YYYY
    const formatDate = function(timestamp) {
        const d = new Date(timestamp);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
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
        formatDuration,
        formatDurationHMS,
        formatDate
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
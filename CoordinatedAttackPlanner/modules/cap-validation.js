// CAP Validation Module
// Handles player and tribe validation logic

window.CAP = window.CAP || {};

window.CAP.Validation = (function() {
    
    // Validate that a player exists
    const validatePlayer = (playerName) => {
        return new Promise((resolve, reject) => {
            // Use the ranking system to check if player exists
            $.get('/game.php?village=' + game_data.village.id + '&screen=ranking&mode=player&name=' + encodeURIComponent(playerName))
                .done(function(html) {
                    const $html = $(html);
                    const $table = $html.find('#player_ranking_table');
                    
                    if ($table.length === 0) {
                        reject(`Player "${playerName}" not found`);
                        return;
                    }

                    // Check if any row contains the exact player name
                    let playerFound = false;
                    $table.find('tr').each(function() {
                        const $nameCell = $(this).find('td:nth-child(2)');
                        if ($nameCell.length > 0) {
                            const foundName = $nameCell.text().trim();
                            if (foundName.toLowerCase() === playerName.toLowerCase()) {
                                playerFound = true;
                                return false; // break
                            }
                        }
                    });

                    if (playerFound) {
                        resolve();
                    } else {
                        reject(`Player "${playerName}" not found`);
                    }
                })
                .fail(function() {
                    reject(`Failed to verify player "${playerName}". Please check the name and try again.`);
                });
        });
    };

    // Validate that a tribe exists and get its members
    const validateTribe = (tribeTag) => {
        return new Promise((resolve, reject) => {
            // First check if tribe exists
            $.get('/game.php?village=' + game_data.village.id + '&screen=ranking&mode=ally&name=' + encodeURIComponent(tribeTag))
                .done(function(html) {
                    const $html = $(html);
                    const $table = $html.find('#ally_ranking_table');
                    
                    if ($table.length === 0) {
                        reject(`Tribe "${tribeTag}" not found`);
                        return;
                    }

                    // Check if any row contains the exact tribe tag
                    let tribeFound = false;
                    let tribeId = null;
                    
                    $table.find('tr').each(function() {
                        const $nameCell = $(this).find('td:nth-child(2)');
                        if ($nameCell.length > 0) {
                            const foundTag = $nameCell.text().trim();
                            if (foundTag.toLowerCase() === tribeTag.toLowerCase()) {
                                tribeFound = true;
                                // Try to extract tribe ID from any links in the row
                                const $link = $(this).find('a[href*="info_ally"]').first();
                                if ($link.length > 0) {
                                    const href = $link.attr('href');
                                    const match = href.match(/id=(\d+)/);
                                    if (match) {
                                        tribeId = match[1];
                                    }
                                }
                                return false; // break
                            }
                        }
                    });

                    if (!tribeFound) {
                        reject(`Tribe "${tribeTag}" not found`);
                        return;
                    }

                    // If we have tribe ID, get members, otherwise use fallback
                    if (tribeId) {
                        getTribeMembers(tribeId, tribeTag).then(resolve).catch(reject);
                    } else {
                        // Fallback: try to get members by searching player rankings
                        getTribeMembersBySearch(tribeTag).then(resolve).catch(reject);
                    }
                })
                .fail(function() {
                    reject(`Failed to verify tribe "${tribeTag}". Please check the tag and try again.`);
                });
        });
    };

    // Get tribe members by tribe ID
    const getTribeMembers = (tribeId, tribeTag) => {
        return new Promise((resolve, reject) => {
            $.get('/game.php?village=' + game_data.village.id + '&screen=info_ally&id=' + tribeId)
                .done(function(html) {
                    const $html = $(html);
                    const members = [];
                    
                    // Look for the specific member table with headers: Name, Rank, Points, Global Rank, Villages
                    $html.find('table.vis').each(function() {
                        const $table = $(this);
                        const $headers = $table.find('th');
                        
                        // Check if this is the member table by looking for specific headers
                        let isMemberTable = false;
                        $headers.each(function() {
                            const headerText = $(this).text().trim().toLowerCase();
                            if (headerText === 'name' || headerText === 'rank' || headerText === 'points') {
                                isMemberTable = true;
                                return false; // break
                            }
                        });
                        
                        if (isMemberTable) {
                            // Process each row in the member table (skip header row)
                            $table.find('tr').slice(1).each(function() {
                                const $row = $(this);
                                const $firstCell = $row.find('td').first();
                                const $playerLink = $firstCell.find('a[href*="info_player"]').first();
                                
                                if ($playerLink.length > 0) {
                                    const playerName = $playerLink.text().trim();
                                    if (playerName && !members.includes(playerName)) {
                                        members.push(playerName);
                                    }
                                }
                            });
                            return false; // break out of table loop once we found the member table
                        }
                    });

                    if (members.length === 0) {
                        reject(`No members found for tribe "${tribeTag}"`);
                    } else {
                        resolve(members);
                    }
                })
                .fail(function() {
                    reject(`Failed to load members for tribe "${tribeTag}"`);
                });
        });
    };

    // Fallback method to get tribe members by searching player rankings
    const getTribeMembersBySearch = (tribeTag) => {
        return new Promise((resolve, reject) => {
            // This is a more limited approach - we'll search the current world's player rankings
            // and filter by tribe. This may not get all members if the tribe is large.
            $.get('/game.php?village=' + game_data.village.id + '&screen=ranking&mode=player')
                .done(function(html) {
                    const $html = $(html);
                    const members = [];
                    
                    // Look through player ranking table for tribe members
                    $html.find('#player_ranking_table tr').each(function() {
                        const $row = $(this);
                        const $tribeCell = $row.find('td:nth-child(4)'); // Tribe column is usually 4th
                        const $nameCell = $row.find('td:nth-child(2)'); // Name column is usually 2nd
                        
                        if ($tribeCell.length > 0 && $nameCell.length > 0) {
                            const tribeName = $tribeCell.text().trim();
                            const playerName = $nameCell.text().trim();
                            
                            if (tribeName.toLowerCase() === tribeTag.toLowerCase() && playerName) {
                                members.push(playerName);
                            }
                        }
                    });

                    if (members.length === 0) {
                        reject(`No members found for tribe "${tribeTag}" (limited search)`);
                    } else {
                        resolve(members);
                    }
                })
                .fail(function() {
                    reject(`Failed to search for tribe "${tribeTag}" members`);
                });
        });
    };

    // Get player's villages by searching their profile
    const getPlayerVillages = (playerName) => {
        return new Promise((resolve, reject) => {
            // First validate the player exists and get their ID
            validatePlayer(playerName)
                .then(() => {
                    // Search for the player to get their ID
                    return $.get('/game.php?village=' + game_data.village.id + '&screen=ranking&mode=player&name=' + encodeURIComponent(playerName));
                })
                .then(html => {
                    const $html = $(html);
                    let playerId = null;
                    
                    // Find the player's ID from the ranking table
                    $html.find('#player_ranking_table tr').each(function() {
                        const $row = $(this);
                        const $nameCell = $row.find('td:nth-child(2)');
                        if ($nameCell.length > 0) {
                            const foundName = $nameCell.text().trim();
                            if (foundName.toLowerCase() === playerName.toLowerCase()) {
                                const $link = $nameCell.find('a[href*="info_player"]').first();
                                if ($link.length > 0) {
                                    const href = $link.attr('href');
                                    const match = href.match(/id=(\d+)/);
                                    if (match) {
                                        playerId = match[1];
                                    }
                                }
                                return false; // break
                            }
                        }
                    });
                    
                    if (!playerId) {
                        throw new Error(`Could not find player ID for "${playerName}"`);
                    }
                    
                    // Now get the player's village info
                    return $.get('/game.php?village=' + game_data.village.id + '&screen=info_player&id=' + playerId);
                })
                .then(html => {
                    const $html = $(html);
                    const villages = {};
                    
                    // Look for villages table in player info
                    $html.find('table').each(function() {
                        const $table = $(this);
                        const $headers = $table.find('th');
                        
                        // Check if this is the villages table
                        let isVillageTable = false;
                        $headers.each(function() {
                            const headerText = $(this).text().trim().toLowerCase();
                            if (headerText.includes('village') || headerText.includes('coordinates') || headerText.includes('points')) {
                                isVillageTable = true;
                                return false; // break
                            }
                        });
                        
                        if (isVillageTable) {
                            // Process village rows
                            $table.find('tr').slice(1).each(function() {
                                const $row = $(this);
                                const $cells = $row.find('td');
                                
                                if ($cells.length >= 2) {
                                    // First cell usually contains village name
                                    const villageName = $cells.eq(0).text().trim();
                                    
                                    // Look for coordinates in any cell
                                    let villageCoords = null;
                                    $cells.each(function() {
                                        const cellText = $(this).text().trim();
                                        const coordMatch = cellText.match(/(\d{1,3})\|(\d{1,3})/);
                                        if (coordMatch) {
                                            villageCoords = coordMatch[0];
                                            return false; // break
                                        }
                                    });
                                    
                                    if (villageName && villageCoords && villageName !== 'Village') {
                                        // Generate a village ID from coordinates for consistency
                                        const villageId = `${villageCoords.replace('|', '_')}_${playerName}`;
                                        
                                        villages[villageId] = {
                                            id: villageId,
                                            name: villageName,
                                            coords: villageCoords,
                                            player: playerName
                                        };
                                    }
                                }
                            });
                            return false; // break out of table loop
                        }
                    });
                    
                    if (Object.keys(villages).length === 0) {
                        reject(`No villages found for player "${playerName}". The player may have no villages or privacy settings may prevent access.`);
                    } else {
                        resolve(villages);
                    }
                })
                .catch(error => {
                    if (typeof error === 'string') {
                        reject(error);
                    } else {
                        reject(`Failed to fetch villages for player "${playerName}". ${error.message || 'Unknown error'}`);
                    }
                });
        });
    };

    // Version-specific Plan Validators
    const PlanValidators = {
        "1.0": class PlanValidator_v1_0 {
            static validate(planData) {
                const errors = [];

                // Check required fields
                if (!planData.version) errors.push('Missing required field: version');
                if (!planData.createdAt) errors.push('Missing required field: createdAt');
                if (!planData.exportedAt) errors.push('Missing required field: exportedAt');
                if (!planData.attacks || !Array.isArray(planData.attacks)) {
                    errors.push('Missing or invalid required field: attacks (must be array)');
                } else if (planData.attacks.length === 0) {
                    errors.push('Plan must contain at least one attack');
                }

                // Validate version format
                if (planData.version !== "1.0") {
                    errors.push('Invalid version: expected "1.0"');
                }

                // Validate timestamp formats (basic check)
                const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
                if (planData.createdAt && !timestampRegex.test(planData.createdAt)) {
                    errors.push('Invalid createdAt timestamp format');
                }
                if (planData.exportedAt && !timestampRegex.test(planData.exportedAt)) {
                    errors.push('Invalid exportedAt timestamp format');
                }

                // Validate optional fields (type checking)
                if (planData.planName !== undefined && typeof planData.planName !== 'string') {
                    errors.push('planName must be a string');
                }
                if (planData.description !== undefined && typeof planData.description !== 'string') {
                    errors.push('description must be a string');
                }

                // Validate each attack
                if (planData.attacks && Array.isArray(planData.attacks)) {
                    planData.attacks.forEach((attack, index) => {
                        const attackErrors = this.validateAttack(attack, index);
                        errors.push(...attackErrors);
                    });
                }

                return {
                    isValid: errors.length === 0,
                    errors: errors
                };
            }

            static validateAttack(attack, index) {
                const errors = [];
                const prefix = `Attack ${index + 1}: `;

                // Required fields
                if (!attack.id) errors.push(prefix + 'Missing required field: id');
                if (!attack.attackingVillage) errors.push(prefix + 'Missing required field: attackingVillage');
                if (!attack.targetVillage) errors.push(prefix + 'Missing required field: targetVillage');
                if (!attack.arrivalTime) errors.push(prefix + 'Missing required field: arrivalTime');

                // Validate ID pattern
                if (attack.id && !/^attack_\d+_[a-z0-9]+$/.test(attack.id)) {
                    errors.push(prefix + 'Invalid id format (expected: attack_\\d+_[a-z0-9]+)');
                }

                // Validate attacking village
                if (attack.attackingVillage) {
                    if (!attack.attackingVillage.coords) {
                        errors.push(prefix + 'Missing attackingVillage.coords');
                    } else if (!/^\d{1,3}\|\d{1,3}$/.test(attack.attackingVillage.coords)) {
                        errors.push(prefix + 'Invalid attackingVillage.coords format (expected: xxx|yyy)');
                    }
                    if (!attack.attackingVillage.name) {
                        errors.push(prefix + 'Missing attackingVillage.name');
                    }
                    if (attack.attackingVillage.id !== undefined && 
                        (!Number.isInteger(attack.attackingVillage.id) || attack.attackingVillage.id < 1)) {
                        errors.push(prefix + 'attackingVillage.id must be a positive integer');
                    }
                }

                // Validate target village
                if (attack.targetVillage) {
                    if (!attack.targetVillage.coords) {
                        errors.push(prefix + 'Missing targetVillage.coords');
                    } else if (!/^\d{1,3}\|\d{1,3}$/.test(attack.targetVillage.coords)) {
                        errors.push(prefix + 'Invalid targetVillage.coords format (expected: xxx|yyy)');
                    }
                    if (!attack.targetVillage.name) {
                        errors.push(prefix + 'Missing targetVillage.name');
                    }
                    if (!attack.targetVillage.player) {
                        errors.push(prefix + 'Missing targetVillage.player');
                    }
                }

                // Validate timestamp
                const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
                if (attack.arrivalTime && !timestampRegex.test(attack.arrivalTime)) {
                    errors.push(prefix + 'Invalid arrivalTime timestamp format');
                }

                // Validate sendTime (should be empty string or valid timestamp)
                if (attack.sendTime !== undefined && attack.sendTime !== "" && !timestampRegex.test(attack.sendTime)) {
                    errors.push(prefix + 'Invalid sendTime format (should be empty string or valid timestamp)');
                }

                // Validate template and slowestUnit (should be strings)
                if (attack.template !== undefined && typeof attack.template !== 'string') {
                    errors.push(prefix + 'template must be a string');
                }
                if (attack.slowestUnit !== undefined && typeof attack.slowestUnit !== 'string') {
                    errors.push(prefix + 'slowestUnit must be a string');
                }

                // Validate optional fields
                if (attack.notes !== undefined && typeof attack.notes !== 'string') {
                    errors.push(prefix + 'notes must be a string');
                }
                if (attack.distance !== undefined && (typeof attack.distance !== 'number' || attack.distance < 0)) {
                    errors.push(prefix + 'distance must be a non-negative number');
                }

                return errors;
            }
        }
    };

    return {
        validatePlayer,
        validateTribe,
        getPlayerVillages,
        PlanValidators
    };
})();
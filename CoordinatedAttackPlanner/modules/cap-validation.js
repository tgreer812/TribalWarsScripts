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

    return {
        validatePlayer,
        validateTribe
    };
})();

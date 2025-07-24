// TRIBE NIGHT BONUS VIEWER
// Shows night bonus hours for tribe members

(function() {
    'use strict';
    
    // Check if we're on a tribe info screen
    if (!location.href.match(/screen=info_ally/) && !location.href.match(/screen=info_member/)) {
        UI.ErrorMessage('This script must be run on a tribe page');
        return;
    }
    
    // Find the members table
    let $membersTable = $('#ally_content table.vis').first();
    if (!$membersTable.length) {
        // Try alternative selector
        $membersTable = $('table.vis:has(a[href*="screen=info_player"])').first();
    }
    
    if (!$membersTable.length) {
        UI.ErrorMessage('No members table found on this page');
        return;
    }
    
    // State management
    const memberData = {};
    let isProcessing = false;
    
    // Add night bonus column header
    const addNightBonusColumn = function() {
        const $headerRow = $membersTable.find('tr').first();
        
        // Check if column already exists
        if ($headerRow.find('th:contains("Night Bonus")').length > 0) {
            return;
        }
        
        // Find the best position (after name or rank)
        let insertAfterIndex = 1; // Default after name column
        $headerRow.find('th').each(function(index) {
            const text = $(this).text().toLowerCase();
            if (text.includes('name') || text.includes('player')) {
                insertAfterIndex = index;
                return false;
            }
        });
        
        // Add header
        $headerRow.find('th').eq(insertAfterIndex).after('<th>Night Bonus</th>');
        
        // Add empty cells to all data rows
        $membersTable.find('tr').slice(1).each(function() {
            const $row = $(this);
            const $cells = $row.find('td');
            if ($cells.length > insertAfterIndex) {
                $cells.eq(insertAfterIndex).after('<td class="night-bonus-cell"><span class="grey">...</span></td>');
            }
        });
    };
    
    // Fetch player's night bonus from their profile
    const fetchPlayerNightBonus = async function(playerId, playerName) {
        try {
            const response = await $.get(`/game.php?screen=info_player&id=${playerId}`);
            const $html = $(response);
            
            // Find the night bonus info in the player info table
            let nightBonusText = '';
            $html.find('#player_info tr').each(function() {
                const $row = $(this);
                const label = $row.find('td').first().text().trim();
                
                if (label.toLowerCase().includes('night bonus')) {
                    // Get the time range from the second cell
                    const $bonusCell = $row.find('td').eq(1);
                    const fullText = $bonusCell.text().trim();
                    
                    // Extract time range (e.g., "Current: 04:00-12:00" → "04:00-12:00")
                    const match = fullText.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
                    if (match) {
                        nightBonusText = `${match[1]}-${match[2]}`;
                    } else {
                        nightBonusText = 'Not set';
                    }
                    return false; // break the each loop
                }
            });
            
            return {
                playerId: playerId,
                playerName: playerName,
                nightBonus: nightBonusText || 'Not found',
                error: false
            };
            
        } catch (error) {
            console.error(`Failed to fetch data for player ${playerName}:`, error);
            return {
                playerId: playerId,
                playerName: playerName,
                nightBonus: 'Error',
                error: true
            };
        }
    };
    
    // Update the table cell for a player
    const updatePlayerCell = function(playerId, data) {
        const $playerLink = $membersTable.find(`a[href*="screen=info_player"][href*="id=${playerId}"]`);
        if (!$playerLink.length) return;
        
        const $row = $playerLink.closest('tr');
        const $cell = $row.find('.night-bonus-cell');
        
        if (data.error) {
            $cell.html('<span style="color: red;">Error</span>');
        } else if (data.nightBonus === 'Not set' || data.nightBonus === 'Not found') {
            $cell.html('<span class="grey">-</span>');
        } else {
            // Check if currently in night bonus
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeMinutes = currentHour * 60 + currentMinute;
            
            // Parse night bonus times
            const match = data.nightBonus.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
            if (match) {
                const startHour = parseInt(match[1]);
                const startMinute = parseInt(match[2]);
                const endHour = parseInt(match[3]);
                const endMinute = parseInt(match[4]);
                
                const startMinutes = startHour * 60 + startMinute;
                const endMinutes = endHour * 60 + endMinute;
                
                let isActive = false;
                if (startMinutes <= endMinutes) {
                    // Normal range (doesn't cross midnight)
                    isActive = currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
                } else {
                    // Crosses midnight
                    isActive = currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes;
                }
                
                const color = isActive ? 'green' : '';
                const style = isActive ? 'color: green; font-weight: bold;' : '';
                $cell.html(`<span style="${style}">${data.nightBonus}</span>`);
            } else {
                $cell.html(`<span>${data.nightBonus}</span>`);
            }
        }
    };
    
    // Process all members with rate limiting
    const processAllMembers = async function() {
        if (isProcessing) {
            return;
        }
        
        isProcessing = true;
        const $memberLinks = $membersTable.find('a[href*="screen=info_player"]');
        const totalMembers = $memberLinks.length;
        let processed = 0;
        
        // Show progress
        UI.SuccessMessage(`Fetching night bonus for ${totalMembers} members...`, 3000);
        
        for (let i = 0; i < $memberLinks.length; i++) {
            const $link = $($memberLinks[i]);
            const href = $link.attr('href');
            const playerIdMatch = href.match(/id=(\d+)/);
            
            if (!playerIdMatch) continue;
            
            const playerId = playerIdMatch[1];
            const playerName = $link.text().trim();
            
            // Skip if already processed
            if (memberData[playerId]) {
                updatePlayerCell(playerId, memberData[playerId]);
                continue;
            }
            
            // Fetch and process
            const data = await fetchPlayerNightBonus(playerId, playerName);
            memberData[playerId] = data;
            updatePlayerCell(playerId, data);
            
            processed++;
            
            // Update progress every 5 players
            if (processed % 5 === 0) {
                UI.SuccessMessage(`Processed ${processed}/${totalMembers} members...`, 2000);
            }
            
            // Rate limiting - wait 100ms between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        isProcessing = false;
        UI.SuccessMessage('Night bonus data loaded!', 3000);
        
        // Add refresh button
        addRefreshButton();
    };
    
    // Add refresh button to update data
    const addRefreshButton = function() {
        if ($('#night-bonus-refresh').length > 0) {
            return;
        }
        
        const $button = $('<button id="night-bonus-refresh" class="btn" style="margin: 10px 0;">Refresh Night Bonus</button>');
        $membersTable.before($button);
        
        $button.on('click', function() {
            $(this).prop('disabled', true).text('Refreshing...');
            
            // Clear cache and reprocess
            Object.keys(memberData).forEach(key => delete memberData[key]);
            
            // Reset all cells to loading state
            $('.night-bonus-cell').html('<span class="grey">...</span>');
            
            processAllMembers().then(() => {
                $(this).prop('disabled', false).text('Refresh Night Bonus');
            });
        });
    };
    
    // Export functionality
    const addExportButton = function() {
        const $button = $('<button class="btn" style="margin: 10px 5px;">Export CSV</button>');
        $membersTable.before($button);
        
        $button.on('click', function() {
            let csv = 'Player,Night Bonus Start,Night Bonus End,Currently Active\n';
            
            Object.values(memberData).forEach(data => {
                if (!data.error && data.nightBonus !== 'Not set' && data.nightBonus !== 'Not found') {
                    const match = data.nightBonus.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
                    if (match) {
                        const now = new Date();
                        const currentHour = now.getHours();
                        const currentMinute = now.getMinutes();
                        const currentTimeMinutes = currentHour * 60 + currentMinute;
                        
                        const [startH, startM] = match[1].split(':').map(n => parseInt(n));
                        const [endH, endM] = match[2].split(':').map(n => parseInt(n));
                        const startMinutes = startH * 60 + startM;
                        const endMinutes = endH * 60 + endM;
                        
                        let isActive = false;
                        if (startMinutes <= endMinutes) {
                            isActive = currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
                        } else {
                            isActive = currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes;
                        }
                        
                        csv += `"${data.playerName}",${match[1]},${match[2]},${isActive ? 'Yes' : 'No'}\n`;
                    }
                }
            });
            
            // Download CSV
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tribe_night_bonus_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            UI.SuccessMessage('Night bonus data exported!');
        });
    };
    
    // Initialize
    const init = function() {
        // Add styles
        const styles = `
            <style>
                .night-bonus-cell {
                    text-align: center;
                    white-space: nowrap;
                }
            </style>
        `;
        $('head').append(styles);
        
        // Add column and start processing
        addNightBonusColumn();
        addExportButton();
        processAllMembers();
    };
    
    // Run initialization
    init();
    
})();
// USER VILLAGE FILTER
// Adds filtering functionality to player info screen

(function() {
    'use strict';
    
    // Check if we're on the player info screen
    if (!location.href.match(/screen=info_player/)) {
        UI.ErrorMessage('This script must be run on the player info screen');
        return;
    }
    
    // Find the villages table
    const $villageTable = $('#villages_list');
    if (!$villageTable.length) {
        UI.ErrorMessage('No villages table found on this page');
        return;
    }
    
    // Parse filter expression
    const parseFilter = function(filterStr) {
        filterStr = filterStr.trim();
        
        // Empty filter means show all
        if (!filterStr) {
            return null;
        }
        
        // Match patterns like: >1000, < 2000, >= 500, <= 3000, = 1500, 1000
        const match = filterStr.match(/^([<>]=?|=)?\s*(\d+)$/);
        if (!match) {
            return { valid: false };
        }
        
        const operator = match[1] || '=';
        const value = parseInt(match[2], 10);
        
        return {
            valid: true,
            operator: operator,
            value: value
        };
    };
    
    // Apply filter to a points value
    const matchesFilter = function(points, filter) {
        if (!filter || !filter.valid) {
            return true;
        }
        
        switch (filter.operator) {
            case '>':
                return points > filter.value;
            case '>=':
                return points >= filter.value;
            case '<':
                return points < filter.value;
            case '<=':
                return points <= filter.value;
            case '=':
                return points === filter.value;
            default:
                return true;
        }
    };
    
    // Apply filter to table
    const applyFilter = function(filterStr) {
        const filter = parseFilter(filterStr);
        let visibleCount = 0;
        let totalCount = 0;
        
        // Process each village row
        $villageTable.find('tr').each(function(index) {
            const $row = $(this);
            
            // Skip header row
            if (index === 0) {
                return;
            }
            
            totalCount++;
            
            // Get points from the row - points are in column 4 (index 4)
            const $pointsCell = $row.find('td').eq(4);
            const pointsText = $pointsCell.text().trim();
            // Remove all non-digits (including the period separator used in TW, e.g., "1.234" → "1234")
            const points = parseInt(pointsText.replace(/\D/g, ''), 10);
            
            // Check if row matches filter
            if (!filter || matchesFilter(points, filter)) {
                $row.show();
                visibleCount++;
            } else {
                $row.hide();
            }
        });
        
        // Update status
        updateStatus(visibleCount, totalCount, filter);
    };
    
    // Update filter status display
    const updateStatus = function(visible, total, filter) {
        const $status = $('#filter-status');
        
        if (!filter) {
            $status.text(`Showing all ${total} villages`);
            $status.css('color', '');
        } else if (!filter.valid) {
            $status.text('Invalid filter expression');
            $status.css('color', 'red');
        } else {
            $status.text(`Showing ${visible} of ${total} villages`);
            $status.css('color', visible === 0 ? 'orange' : 'green');
        }
    };
    
    // Build and inject filter UI
    const buildFilterUI = function() {
        const filterHTML = `
            <div id="village-filter-container" style="margin: 10px 0; padding: 10px; background: #f4e4bc; border: 1px solid #c1a264;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <strong>Filter Villages by Points:</strong>
                    <input type="text" id="points-filter" placeholder="e.g. >1000, <2000, =1500" style="width: 200px;">
                    <button class="btn" id="clear-filter">Clear</button>
                    <span id="filter-status" style="margin-left: 10px;"></span>
                </div>
                <div style="margin-top: 5px; font-size: 11px; color: #666;">
                    Examples: >1000 (greater than), <2000 (less than), >=500 (greater or equal), <=3000 (less or equal), =1500 (exactly)
                </div>
            </div>
        `;
        
        // Insert before the villages table
        $villageTable.before(filterHTML);
    };
    
    // Bind event handlers
    const bindEvents = function() {
        // Real-time filtering as user types
        $('#points-filter').on('input', function() {
            const filterValue = $(this).val();
            applyFilter(filterValue);
        });
        
        // Clear filter button
        $('#clear-filter').on('click', function() {
            $('#points-filter').val('');
            applyFilter('');
        });
        
        // Handle enter key
        $('#points-filter').on('keypress', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                $(this).blur();
            }
        });
    };
    
    // Initialize
    const init = function() {
        buildFilterUI();
        bindEvents();
        
        // Show initial status
        const totalVillages = $villageTable.find('tr').length - 1; // Subtract header row
        updateStatus(totalVillages, totalVillages, null);
    };
    
    // Run initialization
    init();
    
})();
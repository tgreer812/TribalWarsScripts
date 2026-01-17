// Premium Points Log Scraper
// Scrapes the PP transaction log and exports to CSV (with extensible export strategies)
// Quickbar entry: javascript: $.getScript('https://raw.githubusercontent.com/tgreer812/TribalWarsScripts/refs/heads/main/ppLogScraper.js');

(function() {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        PP_LOG_SCREEN: 'premium',
        PP_LOG_MODE: 'log',
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000, // ms
        REQUEST_DELAY: 500, // ms between page fetches to avoid rate limiting
    };

    // ==========================================
    // EXPORT STRATEGIES
    // ==========================================
    const ExportStrategies = {
        csv: {
            name: 'CSV',
            extension: '.csv',
            mimeType: 'text/csv',
            
            // Convert normalized date string to ISO 8601 format for Kusto
            toISODate: function(normalizedDateStr) {
                const months = {
                    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
                    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                };
                
                // Expected format: "Jan 17, 2026 21:56"
                const match = normalizedDateStr.match(/^(\w{3})\s+(\d{1,2}),\s*(\d{4})\s+(\d{1,2}):(\d{2})$/);
                if (match) {
                    const [, month, day, year, hour, minute] = match;
                    const mm = months[month];
                    const dd = day.padStart(2, '0');
                    const hh = hour.padStart(2, '0');
                    // Format: yyyy-MM-ddTHH:mm:ss
                    return `${year}-${mm}-${dd}T${hh}:${minute}:00`;
                }
                
                // Fallback - return as-is if parsing fails
                return normalizedDateStr;
            },
            
            export: function(data) {
                const headers = ['Date', 'World', 'Transaction', 'Change', 'NewPremiumPoints', 'MoreInformation'];
                const csvRows = [headers.join(',')];
                
                data.forEach(row => {
                    const isoDate = this.toISODate(row.date);
                    const csvRow = [
                        `"${isoDate}"`,
                        `"${row.world.replace(/"/g, '""')}"`,
                        `"${row.transaction.replace(/"/g, '""')}"`,
                        row.change,
                        row.newPremiumPoints,
                        `"${row.moreInformation.replace(/"/g, '""')}"`
                    ];
                    csvRows.push(csvRow.join(','));
                });
                
                return csvRows.join('\n');
            },
            
            download: function(data, filename) {
                const content = this.export(data);
                const blob = new Blob([content], { type: this.mimeType });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = filename + this.extension;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        }
        
        // Future strategies can be added here, e.g.:
        // kusto: { ... }
        // json: { ... }
    };

    // ==========================================
    // DATE UTILITIES
    // ==========================================
    const DateUtils = {
        debugMode: true, // Toggle for debug logging
        
        log: function(...args) {
            if (this.debugMode) {
                console.log('[PPScraper Debug]', ...args);
            }
        },
        
        // Get current year from server time
        getCurrentYear: function() {
            const serverDate = document.getElementById('serverDate');
            this.log('serverDate element:', serverDate ? serverDate.textContent : 'NOT FOUND');
            if (serverDate) {
                const parts = serverDate.textContent.split('/');
                if (parts.length === 3) {
                    return parseInt(parts[2], 10);
                }
            }
            return new Date().getFullYear();
        },
        
        // Parse the TW date format and normalize to include year
        // Format examples: "Jan 17, 21:56" (current year) or "Oct 30,2024 21:47" (different year)
        normalizeDate: function(dateStr) {
            const originalStr = dateStr;
            // Replace non-breaking spaces (char 160) with regular spaces, then trim
            dateStr = dateStr.replace(/\u00A0/g, ' ').trim();
            const currentYear = this.getCurrentYear();
            
            // DEBUG: Log the raw input and its character codes to see hidden chars
            this.log('--- normalizeDate called ---');
            this.log('Original (raw):', JSON.stringify(originalStr));
            this.log('Cleaned:', JSON.stringify(dateStr));
            this.log('Length:', dateStr.length);
            this.log('Char codes:', [...dateStr].map(c => c.charCodeAt(0)).join(', '));
            
            // Check if year is present - pattern: "Oct 30,2024 21:47" or "Oct 30, 2024 21:47"
            // No year pattern: "Jan 17, 21:56"
            const withYearMatch = dateStr.match(/^(\w{3})\s+(\d{1,2}),\s*(\d{4})\s+(\d{1,2}:\d{2})$/);
            const noYearMatch = dateStr.match(/^(\w{3})\s+(\d{1,2}),\s*(\d{1,2}:\d{2})$/);
            
            this.log('withYearMatch:', withYearMatch);
            this.log('noYearMatch:', noYearMatch);
            
            if (withYearMatch) {
                // Already has year: "Oct 30,2024 21:47" -> "Oct 30, 2024 21:47"
                const [, month, day, year, time] = withYearMatch;
                const result = `${month} ${day}, ${year} ${time}`;
                this.log('Matched WITH year, result:', result);
                return result;
            } else if (noYearMatch) {
                // No year: "Jan 17, 21:56" -> "Jan 17, 2026 21:56"
                const [, month, day, time] = noYearMatch;
                const result = `${month} ${day}, ${currentYear} ${time}`;
                this.log('Matched NO year, result:', result);
                return result;
            }
            
            // Fallback - return original with current year appended if no year found
            console.warn('[PPScraper] Could not parse date format:', JSON.stringify(dateStr));
            console.warn('[PPScraper] Char codes:', [...dateStr].map(c => c.charCodeAt(0)).join(', '));
            return dateStr;
        },
        
        // Parse date string to Date object for comparison
        parseToDate: function(normalizedDateStr) {
            const months = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            
            this.log('--- parseToDate called ---');
            this.log('Input:', JSON.stringify(normalizedDateStr));
            
            const match = normalizedDateStr.match(/^(\w{3})\s+(\d{1,2}),\s*(\d{4})\s+(\d{1,2}):(\d{2})$/);
            this.log('parseToDate match:', match);
            
            if (match) {
                const [, month, day, year, hour, minute] = match;
                const date = new Date(parseInt(year), months[month], parseInt(day), parseInt(hour), parseInt(minute));
                this.log('Parsed date:', date.toISOString());
                return date;
            }
            
            this.log('parseToDate FAILED to parse');
            return null;
        }
    };

    // ==========================================
    // PAGE NAVIGATION & DETECTION
    // ==========================================
    const Navigation = {
        isOnPPLogPage: function() {
            const params = new URLSearchParams(window.location.search);
            return params.get('screen') === CONFIG.PP_LOG_SCREEN && 
                   params.get('mode') === CONFIG.PP_LOG_MODE;
        },
        
        redirectToPPLogPage: function() {
            const params = new URLSearchParams(window.location.search);
            params.set('screen', CONFIG.PP_LOG_SCREEN);
            params.set('mode', CONFIG.PP_LOG_MODE);
            params.set('page', '0');
            
            const newUrl = window.location.pathname + '?' + params.toString();
            window.location.href = newUrl;
        },
        
        buildPageUrl: function(pageNum) {
            const params = new URLSearchParams(window.location.search);
            params.set('screen', CONFIG.PP_LOG_SCREEN);
            params.set('mode', CONFIG.PP_LOG_MODE);
            params.set('page', pageNum.toString());
            
            return window.location.pathname + '?' + params.toString();
        },
        
        getTotalPages: function() {
            // Look for pagination info in the current page
            const paginationLinks = document.querySelectorAll('.paged-nav-item');
            let maxPage = 0;
            
            paginationLinks.forEach(link => {
                const pageMatch = link.href && link.href.match(/page=(\d+)/);
                if (pageMatch) {
                    const pageNum = parseInt(pageMatch[1], 10);
                    if (pageNum > maxPage) maxPage = pageNum;
                }
            });
            
            // Also check the last page link if available
            const lastPageLink = document.querySelector('a[class*="paged-nav-item"]:last-of-type');
            if (lastPageLink && lastPageLink.href) {
                const match = lastPageLink.href.match(/page=(\d+)/);
                if (match) {
                    maxPage = Math.max(maxPage, parseInt(match[1], 10));
                }
            }
            
            return maxPage;
        }
    };

    // ==========================================
    // TABLE SCRAPING
    // ==========================================
    const Scraper = {
        // Check if a string looks like a date (starts with a month abbreviation)
        looksLikeDate: function(str) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const trimmed = str.trim();
            return months.some(month => trimmed.startsWith(month));
        },
        
        // Find the PP log table by looking for the one with the expected headers
        findPPLogTable: function(doc) {
            const tables = doc.querySelectorAll('table.vis');
            DateUtils.log('Found', tables.length, 'tables with class "vis"');
            
            for (const table of tables) {
                const headerRow = table.querySelector('tr');
                if (!headerRow) continue;
                
                const headers = headerRow.querySelectorAll('th');
                if (headers.length < 5) continue;
                
                // Check if this looks like the PP log table
                // Headers should be: Date, World, Transaction, Change, New premium points, More Information
                const headerTexts = [...headers].map(h => h.textContent.trim().toLowerCase());
                DateUtils.log('Table headers:', headerTexts);
                
                const hasDateHeader = headerTexts.some(h => h.includes('date'));
                const hasWorldHeader = headerTexts.some(h => h.includes('world'));
                const hasTransactionHeader = headerTexts.some(h => h.includes('transaction'));
                const hasChangeHeader = headerTexts.some(h => h.includes('change'));
                
                if (hasDateHeader && hasWorldHeader && hasTransactionHeader && hasChangeHeader) {
                    DateUtils.log('Found PP log table!');
                    return table;
                }
            }
            
            DateUtils.log('PP log table not found, falling back to first table');
            return tables[0] || null;
        },
        
        // Parse a single page's table and return array of transaction objects
        parseTable: function(tableElement) {
            const rows = [];
            const tbody = tableElement.querySelector('tbody');
            if (!tbody) return rows;
            
            const trs = tbody.querySelectorAll('tr');
            
            // Skip header row (first tr with th elements)
            for (let i = 0; i < trs.length; i++) {
                const tr = trs[i];
                const tds = tr.querySelectorAll('td');
                
                // Skip if this is a header row or doesn't have enough columns
                if (tds.length < 6) continue;
                
                const rawDate = tds[0].textContent.trim();
                
                // Skip rows where the first cell doesn't look like a date
                // (e.g., section headers like "Subscriptions")
                if (!this.looksLikeDate(rawDate)) {
                    DateUtils.log('Skipping non-date row:', rawDate);
                    continue;
                }
                
                const world = tds[1].textContent.trim();
                const transaction = tds[2].textContent.trim();
                const change = parseInt(tds[3].textContent.trim(), 10);
                const newPremiumPoints = parseInt(tds[4].textContent.trim(), 10);
                const moreInformation = tds[5].textContent.trim();
                
                rows.push({
                    date: DateUtils.normalizeDate(rawDate),
                    world: world,
                    transaction: transaction,
                    change: isNaN(change) ? 0 : change,
                    newPremiumPoints: isNaN(newPremiumPoints) ? 0 : newPremiumPoints,
                    moreInformation: moreInformation
                });
            }
            
            return rows;
        },
        
        // Fetch a page and parse its table
        fetchAndParsePage: function(pageNum) {
            const self = this;
            return new Promise((resolve, reject) => {
                const url = Navigation.buildPageUrl(pageNum);
                
                $.get(url)
                    .done(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const table = self.findPPLogTable(doc);
                        
                        if (table) {
                            const rows = self.parseTable(table);
                            resolve(rows);
                        } else {
                            DateUtils.log('No PP log table found on page', pageNum);
                            resolve([]);
                        }
                    })
                    .fail((xhr, status, error) => {
                        reject(new Error(`Failed to fetch page ${pageNum}: ${error}`));
                    });
            });
        },
        
        // Flag to allow external stopping
        _stopRequested: false,
        
        requestStop: function() {
            this._stopRequested = true;
        },
        
        // Scrape multiple pages with progress callback
        scrapePages: async function(startPage, endPage, progressCallback, stopCondition = null) {
            const allRows = [];
            let shouldStop = false;
            this._stopRequested = false; // Reset stop flag
            
            for (let page = startPage; page <= endPage && !shouldStop; page++) {
                // Check stop flag at the START of each iteration (before fetching)
                if (this._stopRequested) {
                    DateUtils.log('Stop requested before fetching page', page);
                    shouldStop = true;
                    break;
                }
                
                try {
                    if (progressCallback) {
                        progressCallback(page, endPage, allRows.length);
                    }
                    
                    const rows = await this.fetchAndParsePage(page);
                    DateUtils.log('Page', page, 'returned', rows.length, 'rows');
                    
                    // Check stop condition for each row
                    for (const row of rows) {
                        // Check if user requested stop
                        if (this._stopRequested) {
                            DateUtils.log('Stop requested during row processing');
                            shouldStop = true;
                            break;
                        }
                        if (stopCondition && stopCondition(row)) {
                            DateUtils.log('Stop condition met for row:', row.date);
                            shouldStop = true;
                            break;
                        }
                        allRows.push(row);
                    }
                    
                    // Add delay between requests to be respectful to the server
                    if (page < endPage && !shouldStop && !this._stopRequested) {
                        await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY));
                    }
                } catch (error) {
                    console.error(`Error scraping page ${page}:`, error);
                    // Continue with next page on error
                }
            }
            
            DateUtils.log('Scraping finished. Total rows:', allRows.length);
            return allRows;
        },
        
        // Scrape current page only
        scrapeCurrentPage: function() {
            const table = this.findPPLogTable(document);
            if (table) {
                return this.parseTable(table);
            }
            return [];
        }
    };

    // ==========================================
    // USER INTERFACE
    // ==========================================
    const UI = {
        containerId: 'pp-scraper-container',
        
        styles: `
            <style>
                #pp-scraper-container {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 10000;
                    width: 450px;
                    font-family: Verdana, Arial, sans-serif;
                    font-size: 12px;
                }
                .pp-scraper-content {
                    padding: 20px;
                    background: url('graphic/index/main_bg.jpg') 100% 0% #E3D5B3;
                    border: 2px solid #7D510F;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                }
                .pp-scraper-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #7D510F;
                }
                .pp-scraper-title {
                    color: #7D510F;
                    font-weight: bold;
                    font-size: 16px;
                    margin: 0;
                }
                .pp-scraper-close {
                    background: #c44;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    padding: 2px 8px;
                    cursor: pointer;
                    font-weight: bold;
                }
                .pp-scraper-close:hover {
                    background: #a33;
                }
                .pp-scraper-section {
                    margin-bottom: 15px;
                    padding: 10px;
                    background: rgba(255,255,255,0.3);
                    border: 1px solid #c1a264;
                    border-radius: 4px;
                }
                .pp-scraper-section h3 {
                    color: #5D4037;
                    margin: 0 0 10px 0;
                    font-size: 13px;
                }
                .pp-scraper-option {
                    margin: 8px 0;
                    display: flex;
                    align-items: center;
                }
                .pp-scraper-option label {
                    margin-left: 8px;
                    cursor: pointer;
                }
                .pp-scraper-input-group {
                    margin: 10px 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .pp-scraper-input-group label {
                    min-width: 100px;
                    color: #5D4037;
                    font-weight: bold;
                }
                .pp-scraper-input-group input {
                    padding: 5px 8px;
                    border: 1px solid #7D510F;
                    border-radius: 3px;
                    width: 150px;
                }
                .pp-scraper-input-group input:disabled {
                    background: #ddd;
                    color: #888;
                }
                .pp-scraper-button {
                    background: linear-gradient(to bottom, #f4e4bc 0%, #c9b576 100%);
                    border: 2px solid #7D510F;
                    border-radius: 4px;
                    color: #5D4037;
                    font-weight: bold;
                    padding: 10px 20px;
                    cursor: pointer;
                    font-size: 12px;
                    text-shadow: 1px 1px 1px rgba(255,255,255,0.5);
                    margin: 5px;
                }
                .pp-scraper-button:hover {
                    background: linear-gradient(to bottom, #f8e8c0 0%, #d4c07e 100%);
                }
                .pp-scraper-button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                .pp-scraper-button-container {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 15px;
                }
                .pp-scraper-progress {
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(255,255,255,0.5);
                    border: 1px solid #7D510F;
                    border-radius: 4px;
                    text-align: center;
                    display: none;
                }
                .pp-scraper-progress-bar {
                    height: 20px;
                    background: #ddd;
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 10px 0;
                }
                .pp-scraper-progress-fill {
                    height: 100%;
                    background: linear-gradient(to right, #7D510F, #c9b576);
                    width: 0%;
                    transition: width 0.3s ease;
                }
                .pp-scraper-status {
                    color: #5D4037;
                    font-size: 11px;
                }
                .pp-scraper-results {
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(255,255,255,0.5);
                    border: 1px solid #7D510F;
                    border-radius: 4px;
                    display: none;
                }
                .pp-scraper-results-summary {
                    color: #5D4037;
                    margin-bottom: 10px;
                }
                .pp-scraper-preview {
                    max-height: 150px;
                    overflow-y: auto;
                    font-size: 10px;
                    background: white;
                    padding: 5px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                }
                .pp-scraper-preview table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .pp-scraper-preview th, .pp-scraper-preview td {
                    border: 1px solid #ddd;
                    padding: 3px 5px;
                    text-align: left;
                }
                .pp-scraper-preview th {
                    background: #f0f0f0;
                }
                .pp-scraper-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 9999;
                }
            </style>
        `,
        
        show: function() {
            // Remove existing if present
            this.remove();
            
            const totalPages = Navigation.getTotalPages();
            
            const html = `
                ${this.styles}
                <div class="pp-scraper-overlay" id="pp-scraper-overlay"></div>
                <div id="${this.containerId}">
                    <div class="pp-scraper-content">
                        <div class="pp-scraper-header">
                            <h2 class="pp-scraper-title">📊 PP Log Scraper</h2>
                            <button class="pp-scraper-close" id="pp-scraper-close">✕</button>
                        </div>
                        
                        <div class="pp-scraper-section">
                            <h3>Scraping Method</h3>
                            <div class="pp-scraper-option">
                                <input type="radio" name="scrapeMethod" id="method-pages" value="pages" checked>
                                <label for="method-pages">Scrape by number of pages</label>
                            </div>
                            <div class="pp-scraper-input-group" id="pages-input-group">
                                <label for="num-pages">Pages to scrape:</label>
                                <input type="number" id="num-pages" min="1" max="${totalPages + 1}" value="1">
                                <span style="color: #888; font-size: 10px;">(Max: ${totalPages + 1})</span>
                            </div>
                            
                            <div class="pp-scraper-option">
                                <input type="radio" name="scrapeMethod" id="method-date" value="date">
                                <label for="method-date">Scrape until date</label>
                            </div>
                            <div class="pp-scraper-input-group" id="date-input-group">
                                <label for="stop-date">Stop at date:</label>
                                <input type="date" id="stop-date" disabled>
                            </div>
                        </div>
                        
                        <div class="pp-scraper-section">
                            <h3>Export Format</h3>
                            <div class="pp-scraper-option">
                                <input type="radio" name="exportFormat" id="export-csv" value="csv" checked>
                                <label for="export-csv">CSV (Excel/Kusto compatible)</label>
                            </div>
                        </div>
                        
                        <div class="pp-scraper-button-container">
                            <button class="pp-scraper-button" id="pp-scraper-start">Start Scraping</button>
                            <button class="pp-scraper-button" id="pp-scraper-preview-current">Preview Current Page</button>
                        </div>
                        
                        <div class="pp-scraper-progress" id="pp-scraper-progress">
                            <div class="pp-scraper-status" id="pp-scraper-status">Initializing...</div>
                            <div class="pp-scraper-progress-bar">
                                <div class="pp-scraper-progress-fill" id="pp-scraper-progress-fill"></div>
                            </div>
                            <button class="pp-scraper-button" id="pp-scraper-stop" style="background: linear-gradient(to bottom, #f4bcbc 0%, #c97676 100%); margin-top: 10px;">⏹ Stop Scraping</button>
                        </div>
                        
                        <div class="pp-scraper-results" id="pp-scraper-results">
                            <div class="pp-scraper-results-summary" id="pp-scraper-summary"></div>
                            <div class="pp-scraper-preview" id="pp-scraper-preview"></div>
                            <div class="pp-scraper-button-container">
                                <button class="pp-scraper-button" id="pp-scraper-download">Download</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', html);
            this.bindEvents();
        },
        
        remove: function() {
            const container = document.getElementById(this.containerId);
            const overlay = document.getElementById('pp-scraper-overlay');
            if (container) container.remove();
            if (overlay) overlay.remove();
        },
        
        bindEvents: function() {
            const self = this;
            
            // Close button
            document.getElementById('pp-scraper-close').addEventListener('click', () => {
                self.remove();
            });
            
            // Overlay click to close
            document.getElementById('pp-scraper-overlay').addEventListener('click', () => {
                self.remove();
            });
            
            // Radio button toggles
            document.getElementById('method-pages').addEventListener('change', () => {
                document.getElementById('num-pages').disabled = false;
                document.getElementById('stop-date').disabled = true;
            });
            
            document.getElementById('method-date').addEventListener('change', () => {
                document.getElementById('num-pages').disabled = true;
                document.getElementById('stop-date').disabled = false;
            });
            
            // Preview current page button
            document.getElementById('pp-scraper-preview-current').addEventListener('click', () => {
                const rows = Scraper.scrapeCurrentPage();
                self.showPreview(rows);
            });
            
            // Start scraping button
            document.getElementById('pp-scraper-start').addEventListener('click', () => {
                self.startScraping();
            });
            
            // Stop scraping button
            document.getElementById('pp-scraper-stop').addEventListener('click', () => {
                Scraper.requestStop();
                document.getElementById('pp-scraper-status').textContent = 'Stopping...';
                document.getElementById('pp-scraper-stop').disabled = true;
            });
        },
        
        startScraping: async function() {
            const method = document.querySelector('input[name="scrapeMethod"]:checked').value;
            const progressDiv = document.getElementById('pp-scraper-progress');
            const progressFill = document.getElementById('pp-scraper-progress-fill');
            const statusText = document.getElementById('pp-scraper-status');
            const startButton = document.getElementById('pp-scraper-start');
            
            // Disable buttons during scraping
            startButton.disabled = true;
            document.getElementById('pp-scraper-preview-current').disabled = true;
            
            // Show progress
            progressDiv.style.display = 'block';
            
            let stopCondition = null;
            let endPage = Navigation.getTotalPages();
            
            if (method === 'pages') {
                const numPages = parseInt(document.getElementById('num-pages').value, 10);
                endPage = Math.min(numPages - 1, endPage); // Pages are 0-indexed
            } else if (method === 'date') {
                const stopDateStr = document.getElementById('stop-date').value;
                if (stopDateStr) {
                    const stopDate = new Date(stopDateStr);
                    stopDate.setHours(0, 0, 0, 0);
                    
                    stopCondition = (row) => {
                        const rowDate = DateUtils.parseToDate(row.date);
                        if (rowDate) {
                            return rowDate < stopDate;
                        }
                        return false;
                    };
                }
            }
            
            const progressCallback = (currentPage, totalPages, rowCount) => {
                const percent = ((currentPage + 1) / (totalPages + 1)) * 100;
                progressFill.style.width = percent + '%';
                statusText.textContent = `Scraping page ${currentPage + 1} of ${totalPages + 1}... (${rowCount} rows collected)`;
            };
            
            try {
                const rows = await Scraper.scrapePages(0, endPage, progressCallback, stopCondition);
                
                // Store scraped data for download
                this.scrapedData = rows;
                
                const stoppedEarly = Scraper._stopRequested;
                statusText.textContent = stoppedEarly 
                    ? `Stopped! ${rows.length} transactions scraped.`
                    : `Completed! ${rows.length} transactions scraped.`;
                progressFill.style.width = '100%';
                
                this.showPreview(rows);
                this.showResults(rows);
            } catch (error) {
                statusText.textContent = `Error: ${error.message}`;
                console.error('Scraping error:', error);
            } finally {
                startButton.disabled = false;
                document.getElementById('pp-scraper-preview-current').disabled = false;
            }
        },
        
        showPreview: function(rows) {
            const previewDiv = document.getElementById('pp-scraper-preview');
            const resultsDiv = document.getElementById('pp-scraper-results');
            const summaryDiv = document.getElementById('pp-scraper-summary');
            
            resultsDiv.style.display = 'block';
            summaryDiv.textContent = `Preview (showing first ${Math.min(10, rows.length)} of ${rows.length} rows):`;
            
            if (rows.length === 0) {
                previewDiv.innerHTML = '<p>No data found.</p>';
                return;
            }
            
            const previewRows = rows.slice(0, 10);
            let tableHtml = `
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>World</th>
                            <th>Transaction</th>
                            <th>Change</th>
                            <th>PP</th>
                            <th>Info</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            previewRows.forEach(row => {
                tableHtml += `
                    <tr>
                        <td>${row.date}</td>
                        <td>${row.world}</td>
                        <td>${row.transaction}</td>
                        <td>${row.change}</td>
                        <td>${row.newPremiumPoints}</td>
                        <td title="${row.moreInformation}">${row.moreInformation.substring(0, 30)}${row.moreInformation.length > 30 ? '...' : ''}</td>
                    </tr>
                `;
            });
            
            tableHtml += '</tbody></table>';
            previewDiv.innerHTML = tableHtml;
            
            // Store data and bind download button
            this.scrapedData = rows;
            
            const downloadBtn = document.getElementById('pp-scraper-download');
            downloadBtn.onclick = () => {
                const format = document.querySelector('input[name="exportFormat"]:checked').value;
                const strategy = ExportStrategies[format];
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const filename = `pp_log_${timestamp}`;
                strategy.download(this.scrapedData, filename);
            };
        },
        
        showResults: function(rows) {
            const resultsDiv = document.getElementById('pp-scraper-results');
            resultsDiv.style.display = 'block';
        }
    };

    // ==========================================
    // MAIN ENTRY POINT
    // ==========================================
    const init = function() {
        // Check if we're on the PP log page
        if (!Navigation.isOnPPLogPage()) {
            if (confirm('You are not on the Premium Points log page. Redirect there now?')) {
                Navigation.redirectToPPLogPage();
            }
            return;
        }
        
        // Show the UI
        UI.show();
    };

    // Start the script
    init();
    
})();

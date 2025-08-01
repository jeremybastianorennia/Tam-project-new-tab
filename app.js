// Password Authentication - EXACT COPY FROM ORIGINAL
const correctPassword = "flames";
function checkPassword() {
    const enteredPassword = prompt("This dashboard is protected. Please enter the password:");
    if (enteredPassword === correctPassword) {
        document.body.style.display = 'block';
        return true;
    } else if (enteredPassword !== null) {
        alert("Incorrect password. Please try again.");
        checkPassword();
    } else {
        document.body.style.display = 'none';
    }
}
document.body.style.display = 'none';
document.addEventListener('DOMContentLoaded', function() { 
    checkPassword(); 
    // Initialize dashboard after authentication
    new ZoomInfoDashboard();
});

// ZoomInfo Dashboard Application
class ZoomInfoDashboard {
    constructor() {
        this.csvData = [];
        this.filteredData = [];
        this.currentSort = { column: '', direction: 'asc' };
        this.init();
    }

    init() {
        console.log('Initializing ZoomInfo Dashboard...');
        this.setupEventListeners();
        // NEW: Auto-load data.csv instead of file upload
        this.autoLoadCSV();
    }

    autoLoadCSV() {
        this.showLoading(true);
        Papa.parse('data.csv', {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                console.log('CSV parsed successfully, rows:', results.data.length);
                this.csvData = results.data;
                this.filteredData = [...this.csvData];
                this.processData();
                this.showLoading(false);

                const fileInfo = document.getElementById('file-info');
                if (fileInfo) {
                    fileInfo.innerHTML = `✓ Loaded ${this.csvData.length} records from data.csv`;
                    fileInfo.classList.remove('hidden');
                }

                // Show sections
                const sections = ['filters-section', 'search-section', 'results-section'];
                sections.forEach(sectionId => {
                    const section = document.getElementById(sectionId);
                    if (section) section.classList.remove('hidden');
                });

                this.renderResults();
            },
            error: (error) => {
                console.error('Error parsing CSV:', error);
                this.showLoading(false);
                alert('Error parsing data.csv. Please check the file presence and format.');
            }
        });
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Tab navigation
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = btn.getAttribute('data-tab');
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });

        // Filters
        const revenueFilter = document.getElementById('revenue-filter');
        if (revenueFilter) {
            revenueFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        const employeeMin = document.getElementById('employee-min');
        if (employeeMin) {
            employeeMin.addEventListener('input', () => {
                this.applyFilters();
            });
        }

        const employeeMax = document.getElementById('employee-max');
        if (employeeMax) {
            employeeMax.addEventListener('input', () => {
                this.applyFilters();
            });
        }

        const segmentationFilter = document.getElementById('segmentation-filter');
        if (segmentationFilter) {
            segmentationFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        const assignedFilter = document.getElementById('assigned-filter');
        if (assignedFilter) {
            assignedFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Clear filters
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Export CSV
        const exportCsv = document.getElementById('export-csv');
        if (exportCsv) {
            exportCsv.addEventListener('click', () => {
                this.exportCSV();
            });
        }

        // Table sorting
        const sortHeaders = document.querySelectorAll('#results-table th[data-sort]');
        sortHeaders.forEach(th => {
            th.addEventListener('click', (e) => {
                const sortColumn = th.getAttribute('data-sort');
                if (sortColumn) {
                    this.sortTable(sortColumn);
                }
            });
        });

        // Company dropdown for account details
        const companyDropdown = document.getElementById('company-dropdown');
        if (companyDropdown) {
            companyDropdown.addEventListener('change', (e) => {
                this.showAccountDetails(e.target.value);
            });
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        const activeTab = document.getElementById(`tab-${tabName}`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Update tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        const activeContent = document.getElementById(`tab-content-${tabName}`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }

    processData() {
        this.populateFilters();
        this.populateCompanyDropdown();
    }

    populateFilters() {
        // Populate segmentation filter
        const segmentations = [...new Set(this.csvData.map(row => row.Segmentation).filter(Boolean))];
        const segmentationSelect = document.getElementById('segmentation-filter');
        if (segmentationSelect) {
            segmentationSelect.innerHTML = '';
            segmentations.sort().forEach(seg => {
                const option = document.createElement('option');
                option.value = seg;
                option.textContent = seg;
                segmentationSelect.appendChild(option);
            });
        }

        // Populate assigned to filter
        const assignedTo = [...new Set(this.csvData.map(row => row['Assigned To']).filter(Boolean))];
        const assignedSelect = document.getElementById('assigned-filter');
        if (assignedSelect) {
            assignedSelect.innerHTML = '';
            assignedTo.sort().forEach(person => {
                const option = document.createElement('option');
                option.value = person;
                option.textContent = person;
                assignedSelect.appendChild(option);
            });
        }
    }

    populateCompanyDropdown() {
        const companies = [...new Set(this.csvData.map(row => row['Company Name']).filter(Boolean))];
        const companySelect = document.getElementById('company-dropdown');

        if (companySelect) {
            companySelect.innerHTML = '<option value="">Choose a company...</option>';
            companies.sort().forEach(company => {
                const option = document.createElement('option');
                option.value = company;
                option.textContent = company;
                companySelect.appendChild(option);
            });
        }
    }

    applyFilters() {
        let filtered = [...this.csvData];

        // Revenue filter
        const revenueFilter = document.getElementById('revenue-filter');
        if (revenueFilter) {
            const revenueValues = Array.from(revenueFilter.selectedOptions).map(option => option.value);
            if (revenueValues.length > 0) {
                filtered = filtered.filter(row =>
                    revenueValues.includes(row['Revenue Estimate'])
                );
            }
        }

        // Employee count filter
        const employeeMin = document.getElementById('employee-min');
        const employeeMax = document.getElementById('employee-max');
        if (employeeMin && employeeMax) {
            const minVal = parseInt(employeeMin.value) || 0;
            const maxVal = parseInt(employeeMax.value) || Infinity;
            filtered = filtered.filter(row => {
                const employees = parseInt(row.Employees) || 0;
                return employees >= minVal && employees <= maxVal;
            });
        }

        // Segmentation filter
        const segmentationFilter = document.getElementById('segmentation-filter');
        if (segmentationFilter) {
            const segmentationValues = Array.from(segmentationFilter.selectedOptions)
                .map(option => option.value);
            if (segmentationValues.length > 0) {
                filtered = filtered.filter(row =>
                    segmentationValues.includes(row.Segmentation)
                );
            }
        }

        // Assigned To filter
        const assignedFilter = document.getElementById('assigned-filter');
        if (assignedFilter) {
            const assignedValues = Array.from(assignedFilter.selectedOptions)
                .map(option => option.value);
            if (assignedValues.length > 0) {
                filtered = filtered.filter(row =>
                    assignedValues.includes(row['Assigned To'])
                );
            }
        }

        this.filteredData = filtered;
        this.renderResults();
    }

    handleSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.applyFilters();
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        this.filteredData = this.filteredData.filter(row =>
            Object.values(row).some(value =>
                value && value.toString().toLowerCase().includes(searchLower)
            )
        );

        this.renderResults();
    }

    clearFilters() {
        const revenueFilter = document.getElementById('revenue-filter');
        const employeeMin = document.getElementById('employee-min');
        const employeeMax = document.getElementById('employee-max');
        const segmentationFilter = document.getElementById('segmentation-filter');
        const assignedFilter = document.getElementById('assigned-filter');
        const searchInput = document.getElementById('search-input');

        if (revenueFilter) revenueFilter.selectedIndex = -1;
        if (employeeMin) employeeMin.value = '';
        if (employeeMax) employeeMax.value = '';
        if (segmentationFilter) segmentationFilter.selectedIndex = -1;
        if (assignedFilter) assignedFilter.selectedIndex = -1;
        if (searchInput) searchInput.value = '';

        this.filteredData = [...this.csvData];
        this.renderResults();
    }

    sortTable(column) {
        const columnMap = {
            'company': 'Company Name',
            'assigned': 'Assigned To',
            'type': 'Account Type',
            'score': 'Prospect Score',
            'website': 'Website',
            'revenue': 'Revenue Estimate',
            'employees': 'Employees',
            'location': 'Location',
            'segmentation': 'Segmentation'
        };

        const actualColumn = columnMap[column];

        if (this.currentSort.column === actualColumn) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.column = actualColumn;
            this.currentSort.direction = 'asc';
        }

        this.filteredData.sort((a, b) => {
            let aVal = a[actualColumn] || '';
            let bVal = b[actualColumn] || '';

            // Handle numeric columns
            if (column === 'employees' || column === 'score') {
                aVal = parseInt(aVal) || 0;
                bVal = parseInt(bVal) || 0;
            }

            if (aVal < bVal) return this.currentSort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        this.updateSortIndicators(column);
        this.renderResults();
    }

    updateSortIndicators(activeColumn) {
        const headers = document.querySelectorAll('#results-table th[data-sort]');
        headers.forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });

        const activeHeader = document.querySelector(`#results-table th[data-sort="${activeColumn}"]`);
        if (activeHeader) {
            activeHeader.classList.add(`sort-${this.currentSort.direction}`);
        }
    }

    renderResults() {
        const tbody = document.getElementById('results-tbody');
        const countElement = document.getElementById('results-count');

        if (countElement) {
            countElement.textContent = `${this.filteredData.length} companies found`;
        }

        if (tbody) {
            tbody.innerHTML = '';

            this.filteredData.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${this.escapeHtml(row['Company Name'] || '')}</td>
                    <td>${this.escapeHtml(row['Assigned To'] || '')}</td>
                    <td>${this.escapeHtml(row['Account Type'] || '')}</td>
                    <td>${this.escapeHtml(row['Prospect Score'] || '')}</td>
                    <td>${row['Website'] ? `<a href="${this.escapeHtml(row['Website'])}" target="_blank">${this.escapeHtml(row['Website'])}</a>` : ''}</td>
                    <td>${this.escapeHtml(row['Revenue Estimate'] || '')}</td>
                    <td>${this.escapeHtml(row['Employees'] || '')}</td>
                    <td>${this.escapeHtml(row['Location'] || '')}</td>
                    <td>${this.escapeHtml(row['Segmentation'] || '')}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    showAccountDetails(companyName) {
        const accountInfo = document.getElementById('account-info');

        if (!companyName || !accountInfo) {
            if (accountInfo) accountInfo.classList.add('hidden');
            return;
        }

        // In data, some fields may have alternate or duplicate names
        // For Account Notes and Drop Notes, prefer first non-empty or fallback to alternate header
        const company = this.csvData.find(row => row['Company Name'] === companyName);
        if (!company) {
            accountInfo.classList.add('hidden');
            return;
        }

        // Update account details
        const salesforceId = document.getElementById('salesforce-id');
        const activityScore = document.getElementById('activity-score');
        const generationScore = document.getElementById('generation-score');
        const location = document.getElementById('location');
        const accountNotes = document.getElementById('account-notes');
        const dropNotes = document.getElementById('drop-notes');

        if (salesforceId) salesforceId.textContent = company['SalesforceID'] || '-';

        if (activityScore) {
            const activity = company['Activity'] ? `${company['Activity']}/10` : '-';
            activityScore.textContent = activity;
        }

        if (generationScore) {
            const generation = company['Generation'] ? `${company['Generation']}/10` : '-';
            generationScore.textContent = generation;
        }

        // Try Location first, fall back to Head Office if needed
        if (location) location.textContent = company['Location'] || company['Head Office'] || '-';

        // Show first non-empty Account Notes (there are two in the data)
        let accountNotesValue = company['Account Notes'] || company['Account Notes '] || (company['Account Notes'] === "" ? company['Account Notes '] : "");
        if (!accountNotesValue || accountNotesValue === "Placeholder") accountNotesValue = "-";
        if (accountNotes) accountNotes.textContent = accountNotesValue;

        // Similarly for Drop Notes/DropNotes
        let dropNotesValue = company['Drop Notes'] || company['DropNotes'] || (company['Drop Notes'] === "" ? company['DropNotes'] : "");
        if (!dropNotesValue || dropNotesValue === "Placeholder") dropNotesValue = "-";
        if (dropNotes) dropNotes.textContent = dropNotesValue;

        accountInfo.classList.remove('hidden');
    }

    exportCSV() {
        if (this.filteredData.length === 0) {
            alert('No data to export');
            return;
        }

        const csv = Papa.unparse(this.filteredData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `zoominfo_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            if (show) {
                loading.classList.remove('hidden');
            } else {
                loading.classList.add('hidden');
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

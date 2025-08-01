let zoomInfoData = [];
let filteredData = [];
let currentSortColumn = null;
let currentSortDirection = 'asc';
let revenueFilter, minEmployeesInput, maxEmployeesInput, segmentationFilter,
  assignedToFilter, searchInput, resultsBody, resultsCount,
  clearFiltersBtn, exportDataBtn, loadingIndicator;

document.addEventListener('DOMContentLoaded', function () {
  Papa.parse('data.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      zoomInfoData = results.data;
      initializeDashboard();
    },
    error: function(err) {
      alert('Failed to load data: ' + err);
    }
  });
});

function initializeDashboard() {
  revenueFilter = document.getElementById('revenueFilter');
  minEmployeesInput = document.getElementById('minEmployees');
  maxEmployeesInput = document.getElementById('maxEmployees');
  segmentationFilter = document.getElementById('segmentationFilter');
  assignedToFilter = document.getElementById('assignedToFilter');
  searchInput = document.getElementById('searchInput');
  resultsBody = document.getElementById('resultsBody');
  resultsCount = document.getElementById('resultsCount');
  clearFiltersBtn = document.getElementById('clearFilters');
  exportDataBtn = document.getElementById('exportData');
  loadingIndicator = document.getElementById('loadingIndicator');

  populateSegmentationFilter();
  populateAssignedToFilter();
  attachEventListeners();
  filteredData = [...zoomInfoData];
  renderTable();
}

function handleFilterChange() {
  showLoading();
  setTimeout(() => {
    applyAllFilters();
    hideLoading();
  }, 50);
}

function applyAllFilters() {
  let data = [...zoomInfoData];
  const selectedRevenues = getSelectedOptions(revenueFilter);
  if (selectedRevenues.length > 0) {
    data = data.filter(item => selectedRevenues.includes(item['Revenue Estimate']));
  }
  const minEmployees = parseInt(minEmployeesInput.value) || 0;
  const maxEmployees = parseInt(maxEmployeesInput.value) || Number.MAX_SAFE_INTEGER;
  data = data.filter(item => {
    const empCount = parseInt(item['Employees']) || 0;
    return empCount >= minEmployees && empCount <= maxEmployees;
  });
  const selectedSegments = getSelectedOptions(segmentationFilter);
  if (selectedSegments.length > 0) {
    data = data.filter(item => selectedSegments.includes(item['Segmentation']));
  }
  const selectedAssignedTos = getSelectedOptions(assignedToFilter);
  if (selectedAssignedTos.length > 0) {
    data = data.filter(item => selectedAssignedTos.includes(item['Assigned To']));
  }
  const searchTerm = searchInput.value.trim().toLowerCase();
  if (searchTerm) {
    data = data.filter(item => {
      return Object.values(item).some(
        value => String(value).toLowerCase().includes(searchTerm)
      );
    });
  }
  filteredData = data;
  if (currentSortColumn) applySorting();
  renderTable();
}

function getSelectedOptions(selectElement) {
  return Array.from(selectElement.selectedOptions).map(option => option.value);
}

function clearAllFilters() {
  revenueFilter.selectedIndex = -1;
  segmentationFilter.selectedIndex = -1;
  assignedToFilter.selectedIndex = -1;
  minEmployeesInput.value = '';
  maxEmployeesInput.value = '';
  searchInput.value = '';
  currentSortColumn = null;
  currentSortDirection = 'asc';
  updateSortIndicators();
  filteredData = [...zoomInfoData];
  renderTable();
}

function sortTable(column) {
  if (currentSortColumn === column) {
    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortColumn = column;
    currentSortDirection = 'asc';
  }
  applySorting();
  renderTable();
  updateSortIndicators();
}

function applySorting() {
  filteredData.sort((a, b) => {
    let aVal, bVal;
    if (currentSortColumn === 'Employees') {
      aVal = parseInt(a['Employees']);
      bVal = parseInt(b['Employees']);
    } else if (currentSortColumn === 'Prospect Score') {
      aVal = parseFloat(a['Prospect Score']);
      bVal = parseFloat(b['Prospect Score']);
    } else {
      aVal = (a[currentSortColumn] || '').toLowerCase();
      bVal = (b[currentSortColumn] || '').toLowerCase();
    }
    if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

function updateSortIndicators() {
  document.querySelectorAll('.sort-indicator').forEach(indicator => {
    indicator.className = 'sort-indicator';
  });
  if (currentSortColumn) {
    const indicator = document.querySelector(`[data-sort="${currentSortColumn}"] .sort-indicator`);
    if (indicator) indicator.classList.add(currentSortDirection);
  }
}

// ---- NEW: PILL STYLES ----
function getScoreStyle(score) {
  let num = parseFloat(score);
  if (isNaN(num)) num = 0;
  let normalized = Math.max(0, Math.min(100, num)) / 100;
  let hue = 0 + 120 * normalized;
  let saturation = 38;
  let lightness = 91;
  let textColor = '#1a1a1a';
  return `background-color: hsl(${hue},${saturation}%,${lightness}%); color: ${textColor}; font-weight: bold; font-size: 1.05em; padding:6px 10px; border-radius: 14px; min-width: 38px; display: inline-block; text-align: center; letter-spacing: 0.5px;`;
}

function getSegStyle(seg) {
  seg = (seg || '').toLowerCase();
  let color = '#4f46e5'; // Enterprise: Indigo
  if (seg === 'mid-market') color = '#14b8a6'; // Mid-Market: Teal
  if (seg === 'smb') color = '#f59e42';        // SMB: Orange
  let text = seg === 'smb' ? '#22223b' : '#fff';
  return `background: ${color}; color: ${text}; border-radius: 9999px; font-weight: 600; padding: 6px 16px; display: inline-block; text-transform: uppercase; font-size: 0.93em;`;
}

// ---------------

function renderTable() {
  if (!resultsBody) return;
  resultsBody.innerHTML = '';
  if (filteredData.length === 0) {
    resultsBody.innerHTML = `<tr><td colspan="13" class="no-results"><h3>No Results</h3><p>Try adjusting your filters to see more results.</p></td></tr>`;
    if (resultsCount) resultsCount.textContent = "0 accounts found";
    return;
  }
  if (resultsCount) resultsCount.textContent = `${filteredData.length} accounts found`;
  filteredData.forEach(row => {
    const tr = document.createElement('tr');
    // Score pill
    const score = row['Prospect Score'] || '';
    const scoreHtml = `<span style="${getScoreStyle(score)}">${escapeHtml(score)}</span>`;
    // Segment pill
    const seg = row['Segmentation'] || '';
    const segHtml = `<span style="${getSegStyle(seg)}">${escapeHtml(seg)}</span>`;

    tr.innerHTML = `
      <td>${escapeHtml(row['Company Name'] || '')}</td>
      <td>${escapeHtml(row['Assigned To'] || '')}</td>
      <td>${escapeHtml(row['Account Type'] || '')}</td>
      <td>${scoreHtml}</td>
      <td>${escapeHtml(row['Account Notes'] || '')}</td>
      <td>${escapeHtml(row['Drop Notes'] || '')}</td>
      <td>${row['Website'] ? `<a href="${escapeHtml(row['Website'])}" target="_blank">${escapeHtml(row['Website'])}</a>` : ''}</td>
      <td>${row['LinkedIn URL'] ? `<a href="${escapeHtml(row['LinkedIn URL'])}" target="_blank">LinkedIn</a>` : ''}</td>
      <td>${escapeHtml(row['Revenue Estimate'] || '')}</td>
      <td>${escapeHtml(row['Employees'] || '')}</td>
      <td>${escapeHtml(row['Head Office'] || '')}</td>
      <td>${escapeHtml(row['Country'] || '')}</td>
      <td>${segHtml}</td>
    `;
    resultsBody.appendChild(tr);
  });
}

function populateSegmentationFilter() {
  if (!segmentationFilter) return;
  let segments = Array.from(new Set(zoomInfoData.map(row => row['Segmentation'] ?? '').filter(Boolean)));
  segmentationFilter.innerHTML = '';
  segments.forEach(seg => {
    const opt = document.createElement('option');
    opt.value = seg;
    opt.textContent = seg;
    segmentationFilter.appendChild(opt);
  });
}

function populateAssignedToFilter() {
  if (!assignedToFilter) return;
  let assigned = Array.from(new Set(zoomInfoData.map(row => row['Assigned To'] ?? '').filter(Boolean)));
  assignedToFilter.innerHTML = '';
  assigned.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    assignedToFilter.appendChild(opt);
  });
}

function attachEventListeners() {
  if (revenueFilter) revenueFilter.addEventListener('change', handleFilterChange);
  if (minEmployeesInput) minEmployeesInput.addEventListener('input', handleFilterChange);
  if (maxEmployeesInput) maxEmployeesInput.addEventListener('input', handleFilterChange);
  if (segmentationFilter) segmentationFilter.addEventListener('change', handleFilterChange);
  if (assignedToFilter) assignedToFilter.addEventListener('change', handleFilterChange);
  if (searchInput) searchInput.addEventListener('input', handleFilterChange);
  if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearAllFilters);
  if (exportDataBtn) exportDataBtn.addEventListener('click', exportData);
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => sortTable(th.getAttribute('data-sort')));
  });
}

function exportData() {
  if (filteredData.length === 0) {
    alert('No data to export.');
    return;
  }
  const csv = Papa.unparse(filteredData);
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
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

function showLoading() {
  if (loadingIndicator) loadingIndicator.style.display = 'flex';
}

function hideLoading() {
  if (loadingIndicator) loadingIndicator.style.display = 'none';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// CONFIGURATION
// ============================================
const FEEDBACK_EMAIL = 'vbehric@gmail.com'; 
const WINDOW_WIDTH = 600;
const WINDOW_HEIGHT = 950;
const AUTOSAVE_DELAY = 500;

// Default LOB data
const defaultLOBs = [
    { name: 'Property & Casualty', email: 'pc-help@company.com' },
    { name: 'Life Insurance', email: 'life-help@company.com' },
    { name: 'Health Insurance', email: 'health-help@company.com' },
    { name: 'Commercial Lines', email: 'commercial-help@company.com' },
    { name: 'Claims', email: 'claims-help@company.com' },
    { name: 'Other/General', email: 'it-help@company.com' }
];
// v3.6: FLDC removed from default LOBs

// Default Priorities
const defaultPriorities = [
    'Low', 'Normal', 'High', 'Critical', 'System Down'
];

// LOB Abbreviations (for subject line space-saving)
const LOB_ABBREVIATIONS = {
    'Property & Casualty': 'Prop',
    'Property': 'Prop',
    'Life Insurance': 'Life',
    'Life': 'Life',
    'Health Insurance': 'Health',
    'Health': 'Health',
    'Commercial Lines': 'Comm',
    'Commercial': 'Comm',
    'Claims': 'Claims',
    'Liability': 'Liab',
    'Workers Compensation': 'WC',
    'Workers Comp': 'WC',
    'Auto': 'Auto',
    'Homeowners': 'Home',
    'Other/General': 'Other',
    'General': 'Gen'
};

// Function to get LOB abbreviation
function abbreviateLOB(lobName) {
    if (!lobName) return '';
    // Check exact match first
    if (LOB_ABBREVIATIONS[lobName]) {
        return LOB_ABBREVIATIONS[lobName];
    }
    // Check if LOB name contains any key
    for (const [full, abbr] of Object.entries(LOB_ABBREVIATIONS)) {
        if (lobName.includes(full)) {
            return abbr;
        }
    }
    // If no match, return first 4 characters
    return lobName.substring(0, 4);
}

// Default Transaction Types (v3.4)
const defaultTransactions = [
    'New Business',
    'Renewal',
    'Rewrite',
    'Endorsement',
    'Cancellation',
    'Reinstatement',
    'Other'
];

// ============================================
// PRESET TEMPLATES (v3.5)
// ============================================
const PRESET_TEMPLATES = {
    full: {
        name: 'Full (All Fields)',
        description: 'Detailed report format',
        subject: '{priority} | {transaction} | {lob} | {pol.#} | {insured} | {date} | {premium}',
        body: `Priority: {priority}
Transaction Type: {transaction}
Line of Business: {lob}
Policy/Control Number: {pol.#}
Named Insured: {insured}
Effective Date: {date}
Premium: {premium}

Issue Description:
{issue}`
    },
    detailed: {
        name: 'Detailed (No Premium/Date)',
        description: 'Most common fields',
        subject: '{priority} | {transaction} | {lob} | {pol.#} | {insured}',
        body: `Priority: {priority}
Transaction Type: {transaction}
Line of Business: {lob}
Policy/Control Number: {pol.#}
Named Insured: {insured}

Issue Description:
{issue}`
    },
    minimal: {
        name: 'Minimal (Policy Focus)',
        description: 'Compact, policy-first',
        subject: '{pol.#} - {priority} - {transaction}',
        body: `POLICY: {pol.#}
PRIORITY: {priority} | TRANSACTION: {transaction}
LOB: {lob} | INSURED: {insured}

Issue Description:
{issue}`
    },
    compact: {
        name: 'Compact (Bracketed)',
        description: 'IT-friendly format',
        subject: '[{priority}] {transaction} Issue - {pol.#}',
        body: `PRIORITY: {priority}
TYPE: {transaction}
POLICY: {pol.#}
INSURED: {insured}
DEPARTMENT: {lob}

Issue Description:
{issue}`
    },
    itStandard: {
        name: 'IT Standard',
        description: 'Department-first format',
        subject: '{lob}: {priority} Priority {transaction}',
        body: `DEPARTMENT: {lob}
PRIORITY LEVEL: {priority}
TRANSACTION TYPE: {transaction}

Policy/Control Number: {pol.#}
Named Insured: {insured}
Effective Date: {date}
Premium: {premium}

Issue Description:
{issue}`
    }
};

let currentReportPlain = ''; 
let currentReportRich = ''; 
let currentEmail = '';
let saveTimeout = null;

// ============================================
// ERROR LOGGING SYSTEM
// ============================================

class ErrorLogger {
    static log(error, context = {}) {
        const errorData = {
            timestamp: new Date().toISOString(),
            timestampReadable: new Date().toLocaleString(),
            message: error.message,
            stack: error.stack,
            name: error.name,
            file: this.parseStackFile(error.stack),
            line: this.parseStackLine(error.stack),
            browser: this.getBrowserInfo(),
            extensionVersion: chrome.runtime.getManifest().version,
            context: context,
            formState: this.captureFormState()
        };
        
        chrome.storage.local.get(['errorLog'], (result) => {
            const log = result.errorLog || [];
            log.push(errorData);
            if (log.length > 100) log.shift();
            chrome.storage.local.set({ errorLog: log, lastError: errorData });
        });
        
        console.error('Error logged:', errorData);
        this.notifyUser(error);
    }
    
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown', version = 'Unknown';
        if (ua.includes('Edg/')) {
            browser = 'Edge';
            version = ua.match(/Edg\/(\d+)/)?.[1];
        } else if (ua.includes('Chrome/')) {
            browser = 'Chrome';
            version = ua.match(/Chrome\/(\d+)/)?.[1];
        }
        return `${browser} ${version}`;
    }
    
    static parseStackFile(stack) {
        const match = stack.match(/\((.*?\.js)/);
        return match ? match[1] : 'unknown';
    }
    
    static parseStackLine(stack) {
        const match = stack.match(/:(\d+):/);
        return match ? parseInt(match[1]) : 0;
    }
    
    static captureFormState() {
        return {
            hasPriority: !!document.getElementById('priority')?.value,
            hasLOB: !!document.getElementById('lob')?.value,
            hasPolicy: !!document.getElementById('policy')?.value,
            hasInsured: !!document.getElementById('insured')?.value,
            hasEffective: !!document.getElementById('effective')?.value,
            hasPremium: !!document.getElementById('premium')?.value,
            issueLength: document.getElementById('issue')?.innerText?.length || 0
        };
    }
    
    static notifyUser(error) {
        const userMessage = 'Something went wrong. An error report has been saved. Click Settings > Export Errors to report this issue.';
        showToast(userMessage);
    }
    
    static export() {
        chrome.storage.local.get(['errorLog'], (result) => {
            const log = result.errorLog || [];
            if (log.length === 0) {
                showToast('No errors to export');
                return;
            }
            
            const report = {
                exportDate: new Date().toISOString(),
                exportDateReadable: new Date().toLocaleString(),
                totalErrors: log.length,
                extensionVersion: chrome.runtime.getManifest().version,
                errors: log
            };
            
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `send-it-errors-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(`Exported ${log.length} error(s)`);
        });
    }
    
    static clear() {
        if (confirm('Clear all error logs? This cannot be undone.')) {
            chrome.storage.local.remove(['errorLog', 'lastError']);
            showToast('Error log cleared');
            updateErrorCount();
        }
    }
    
    static getCount(callback) {
        chrome.storage.local.get(['errorLog'], (result) => {
            callback(result.errorLog?.length || 0);
        });
    }
    
    static view() {
        chrome.storage.local.get(['errorLog'], (result) => {
            console.table(result.errorLog || []);
            showToast('Error log displayed in console (F12)');
        });
    }
}

function updateErrorCount() {
    ErrorLogger.getCount((count) => {
        const countEl = document.getElementById('errorCount');
        if (countEl) {
            if (count === 0) {
                countEl.textContent = '✅ No errors logged';
                countEl.style.color = '#4caf50';
            } else {
                countEl.textContent = `⚠️ ${count} error(s) logged`;
                countEl.style.color = '#ff9800';
            }
        }
    });
}

// Add pulse animation for feedback button
if (!document.getElementById('pulseAnimation')) {
    const style = document.createElement('style');
    style.id = 'pulseAnimation';
    style.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
    `;
    document.head.appendChild(style);
}

// Initialize extension
document.addEventListener('DOMContentLoaded', function() {
    migrateToV35(); // NEW: Migrate LOBs to include templates
    loadLOBs();
    loadPriorities();
    loadTransactions(); // NEW: Load transaction types
    setupDarkModeToggle();
    setupEventListeners();
    initializeTemplateEditor(); // NEW: Initialize template editor
});

// ============================================
// MIGRATION TO v3.5 (Template System)
// ============================================
function migrateToV35() {
    chrome.storage.local.get(['lobs', 'migrated_v35'], function(result) {
        if (result.migrated_v35) return; // Already migrated
        
        const lobs = result.lobs || defaultLOBs;
        
        // Add template fields to all existing LOBs
        const migratedLOBs = lobs.map(lob => ({
            ...lob,
            templateMode: lob.templateMode || 'preset',
            templatePreset: lob.templatePreset || 'detailed',
            customSubjectTemplate: lob.customSubjectTemplate || null,
            customBodyTemplate: lob.customBodyTemplate || null
        }));
        
        chrome.storage.local.set({ 
            lobs: migratedLOBs,
            migrated_v35: true
        }, function() {
            console.log('✅ Migrated to v3.5 template system');
        });
    });
}

// Load Priorities
function loadPriorities() {
    chrome.storage.local.get(['priorities'], function(result) {
        const priorities = result.priorities || defaultPriorities;
        populatePriorityDropdown(priorities);
        // Render settings list if element exists
        if(document.getElementById('priorityList')) {
            renderPriorityList(priorities); 
        }
    });
}

function populatePriorityDropdown(priorities) {
    const select = document.getElementById('priority');
    if(!select) return;
    
    const currentVal = select.value;
    select.innerHTML = '';
    priorities.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        if (p === 'Normal') option.selected = true;
        select.appendChild(option);
    });

    if (currentVal && priorities.includes(currentVal)) {
        select.value = currentVal;
    }
}

// ============================================
// TRANSACTION TYPES (v3.4+)
// ============================================

function loadTransactions() {
    chrome.storage.local.get(['transactions'], function(result) {
        const transactions = result.transactions || defaultTransactions;
        populateTransactionDropdown(transactions);
    });
}

function populateTransactionDropdown(transactions) {
    const select = document.getElementById('transaction');
    if(!select) return;
    
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Select --</option>';
    
    transactions.forEach(t => {
        const option = document.createElement('option');
        option.value = t;
        option.textContent = t;
        select.appendChild(option);
    });

    if (currentVal && transactions.includes(currentVal)) {
        select.value = currentVal;
    }
}

// Load LOBs
function loadLOBs() {
    chrome.storage.local.get(['lobs'], function(result) {
        const lobs = result.lobs || defaultLOBs;
        populateLOBDropdown(lobs);
        loadDraft();
        loadDefaultLOB();
    });
}

function loadDefaultLOB() {
    chrome.storage.local.get(['defaultLOB'], function(result) {
        if (result.defaultLOB) {
            const lobSelect = document.getElementById('lob');
            if(lobSelect) {
                lobSelect.value = result.defaultLOB;
                const event = new Event('change');
                lobSelect.dispatchEvent(event);
                updateDefaultStatusDisplay();
            }
        }
    });
}

function updateDefaultStatusDisplay() {
    chrome.storage.local.get(['defaultLOB'], function(result) {
        const statusDiv = document.getElementById('defaultStatus');
        const lobSelect = document.getElementById('lob');
        
        if (!statusDiv || !lobSelect) return;

        if (result.defaultLOB && lobSelect.value === result.defaultLOB) {
            const selectedOption = lobSelect.options[lobSelect.selectedIndex];
            const lobName = selectedOption ? selectedOption.textContent : result.defaultLOB;
            statusDiv.textContent = `✓ Default: ${lobName}`;
            statusDiv.style.display = 'block';
        } else {
            statusDiv.style.display = 'none';
        }
    });
}

function populateLOBDropdown(lobs) {
    const select = document.getElementById('lob');
    if(!select) return;

    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = "";
    placeholder.textContent = "-- Select --";
    select.appendChild(placeholder);

    const customOption = document.createElement('option');
    customOption.value = "custom";
    customOption.textContent = "Custom";
    select.appendChild(customOption);
    
    lobs.forEach((lob, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = lob.name;
        option.dataset.email = lob.email;
        select.appendChild(option);
    });
}

// Setup listeners with safety checks
function setupEventListeners() {
    // Helper to safely add listener
    const addListener = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    };

    // SECTION TOGGLING LOGIC
    function toggleSection(headerId, contentId) {
        const header = document.getElementById(headerId);
        const content = document.getElementById(contentId);
        if (header && content) {
            header.addEventListener('click', () => {
                content.classList.toggle('collapsed');
                header.classList.toggle('collapsed');
            });
        }
    }
    
    // Only applied to Settings sections now
    toggleSection('headerSettingsMaster', 'contentSettingsMaster');
    toggleSection('headerSettingsPriority', 'contentSettingsPriority');
    toggleSection('headerSettingsTransaction', 'contentSettingsTransaction');
    toggleSection('headerSettingsLOB', 'contentSettingsLOB');
    toggleSection('headerSettingsErrors', 'contentSettingsErrors');


    addListener('feedbackBtn', 'click', () => {
        window.open(`mailto:${FEEDBACK_EMAIL}?subject=Send It Feedback`);
    });
    
    // Error logging buttons
    addListener('exportErrorsBtn', 'click', () => ErrorLogger.export());
    addListener('viewErrorsBtn', 'click', () => ErrorLogger.view());
    addListener('clearErrorsBtn', 'click', () => ErrorLogger.clear());

    addListener('viewBtn', 'click', toggleViewMode);

    const lobEl = document.getElementById('lob');
    if(lobEl) {
        lobEl.addEventListener('change', function() {
            const customGroup = document.getElementById('customEmailGroup');
            if (this.value === 'custom') {
                customGroup.style.display = 'block';
            } else {
                customGroup.style.display = 'none';
            }
            updateDefaultStatusDisplay();
        });
    }

    const dateInput = document.getElementById('effective');
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }

    addListener('setDefaultBtn', 'click', setDefaultLOB);
    addListener('setupBtn', 'click', openConfirmModal);
    addListener('clearBtn', 'click', clearForm);
    addListener('generateBtn', 'click', generateReport);
    addListener('copyBtn', 'click', copyToClipboard);
    addListener('downloadBtn', 'click', downloadReport);
    addListener('outlookBtn', 'click', () => openEmailClient(currentEmail));
    
    addListener('closeConfirmBtn', 'click', closeConfirmModal);
    addListener('cancelConfirmBtn', 'click', closeConfirmModal);
    addListener('yesConfirmBtn', 'click', () => {
        closeConfirmModal();
        openSetupModal();
    });
    
    addListener('closeSetupBtn', 'click', closeSetupModal);
    addListener('addLobBtn', 'click', addNewLOB);
    addListener('addPriorityBtn', 'click', addNewPriority);
    addListener('addTransactionBtn', 'click', addNewTransaction);

    addListener('exportBtn', 'click', exportMasterList);
    addListener('importBtn', 'click', () => {
        document.getElementById('importFile').click();
    });
    addListener('restoreDefaultsBtn', 'click', restoreDefaults);
    
    const importFile = document.getElementById('importFile');
    if(importFile) importFile.addEventListener('change', importMasterList);

    document.querySelectorAll('.tool-btn').forEach(btn => {
        if(btn.id !== 'fsCopyBtn') {
            btn.addEventListener('click', handleToolbarClick);
        }
    });

    // Formatting listeners
    addListener('fontSizeBtn', 'change', function(e) {
        document.execCommand('fontSize', false, e.target.value);
        document.getElementById('issue').focus();
    });
    addListener('textColorBtn', 'input', function(e) {
        document.execCommand('foreColor', false, e.target.value);
        document.getElementById('issue').focus();
    });
    addListener('fsCopyBtn', 'click', function() {
        const content = document.getElementById('issue').innerText;
        navigator.clipboard.writeText(content).then(() => {
            const originalText = this.innerHTML;
            this.innerHTML = '✓ Copied!';
            setTimeout(() => { this.innerHTML = originalText; }, 1500);
        });
    });
    addListener('fullscreenBtn', 'click', toggleFullscreen);

    // Auto-save
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', saveDraftDebounced);
    });
    const issueEl = document.getElementById('issue');
    if(issueEl) issueEl.addEventListener('input', saveDraftDebounced);
    
    setupKeyboardShortcuts();
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            generateReport();
        }
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            if (confirm('Clear all fields?')) clearForm();
        }
    });
}

function handleToolbarClick(e) {
    if (e.currentTarget.id === 'fsCopyBtn') return;
    e.preventDefault();
    const command = e.currentTarget.getAttribute('data-cmd');
    if (!command) return;
    document.getElementById('issue').focus();
    document.execCommand(command, false, null);
}

function toggleFullscreen() {
    const container = document.getElementById('editorContainer');
    const btn = document.getElementById('fullscreenBtn');
    container.classList.toggle('fullscreen');
    btn.textContent = container.classList.contains('fullscreen') ? '⛶' : '⛶';
}

async function toggleViewMode() {
    try {
        const result = await chrome.storage.local.get(['viewMode']);
        const newMode = (result.viewMode === 'sidePanel') ? 'window' : 'sidePanel';
        await chrome.storage.local.set({ viewMode: newMode });
        
        if (newMode === 'sidePanel') {
            const windowObj = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
            await chrome.sidePanel.open({ windowId: windowObj.id });
            window.close(); 
        } else {
            chrome.windows.create({
                url: "popup.html", type: "popup", width: WINDOW_WIDTH, height: WINDOW_HEIGHT
            });
            window.close();
        }
    } catch (err) {
        console.error("View mode error:", err);
    }
}

function exportMasterList() {
    chrome.storage.local.get([
        'lobs', 
        'priorities',
        'transactions',
        'defaultLOB', 
        'viewMode', 
        'darkMode'
    ], function(result) {
        // Prompt for description
        const description = prompt(
            'Enter a description for this settings file:\n(e.g., "Property & Casualty Department - Updated Feb 2026")',
            'Send It Extension Settings'
        );
        
        if (description === null) return; // User cancelled
        
        const data = {
            version: chrome.runtime.getManifest().version,
            exportDate: new Date().toISOString(),
            exportDateReadable: new Date().toLocaleString(),
            description: description || 'Send It Extension Settings',
            settings: {
                lobs: result.lobs || defaultLOBs,
                priorities: result.priorities || defaultPriorities,
                transactions: result.transactions || defaultTransactions,
                defaultLOB: result.defaultLOB || null,
                viewMode: result.viewMode || 'popup',
                darkMode: result.darkMode || false
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SendIt_Settings_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('All settings exported successfully!');
    });
}

function importMasterList(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            
            // Check if this is a full settings file (v3.5.2+)
            if (json.settings && json.version) {
                // Show description to user
                const description = json.description || 'Settings file';
                const confirmMsg = `Import settings?\n\n` +
                    `Description: ${description}\n` +
                    `Exported: ${json.exportDateReadable || json.exportDate}\n` +
                    `Version: ${json.version}\n\n` +
                    `⚠️ This will OVERWRITE all current settings including:\n` +
                    `• Lines of Business\n` +
                    `• Priorities\n` +
                    `• Transaction Types\n` +
                    `• Default LOB\n` +
                    `• View mode\n` +
                    `• Dark mode\n\n` +
                    `Continue?`;
                
                if (!confirm(confirmMsg)) {
                    showToast('Import cancelled');
                    return;
                }
                
                // Import all settings
                const settings = json.settings;
                chrome.storage.local.set({
                    lobs: settings.lobs || defaultLOBs,
                    priorities: settings.priorities || defaultPriorities,
                    transactions: settings.transactions || defaultTransactions,
                    defaultLOB: settings.defaultLOB || null,
                    viewMode: settings.viewMode || 'popup',
                    darkMode: settings.darkMode || false
                }, function() {
                    // Reload UI with new settings
                    loadLOBs();
                    loadPriorities();
                    loadTransactions();
                    
                    // Apply dark mode if imported
                    if (settings.darkMode) {
                        document.documentElement.setAttribute('data-theme', 'dark');
                    } else {
                        document.documentElement.removeAttribute('data-theme');
                    }
                    
                    showToast('✅ All settings imported successfully!');
                    setTimeout(() => {
                        showToast(`Loaded: ${description}`);
                    }, 1500);
                });
                
            } else {
                // Legacy format (just LOBs or lobs+priorities)
                let newLobs = null;
                let newPriorities = null;

                if (Array.isArray(json)) {
                    newLobs = json.filter(item => item.name && item.email);
                } else if (json.lobs) {
                    newLobs = json.lobs;
                    if (json.priorities) newPriorities = json.priorities;
                }

                if (!newLobs || newLobs.length === 0) throw new Error("Invalid configuration file.");

                const updates = { lobs: newLobs };
                if (newPriorities) updates.priorities = newPriorities;

                chrome.storage.local.set(updates, function() {
                    loadLOBs(); 
                    if (newPriorities) loadPriorities();
                    showToast('Configuration imported successfully!');
                });
            }
        } catch (err) {
            showToast(`Import failed: ${err.message}`);
        }
    };
    reader.readAsText(file);
}

function restoreDefaults() {
    const confirmMsg = `⚠️ RESTORE ALL DEFAULTS?\n\n` +
        `This will reset:\n` +
        `• Lines of Business (back to default)\n` +
        `• Priorities (back to default)\n` +
        `• Transaction Types (back to default)\n` +
        `• Default LOB (cleared)\n` +
        `• View mode (popup)\n` +
        `• Dark mode (off)\n` +
        `• All drafts (cleared)\n\n` +
        `❌ This CANNOT be undone!\n\n` +
        `Are you sure?`;
    
    if (!confirm(confirmMsg)) {
        showToast('Restore cancelled');
        return;
    }
    
    // Double confirmation for safety
    if (!confirm('Are you REALLY sure? This will erase all customizations!')) {
        showToast('Restore cancelled');
        return;
    }
    
    // Clear all settings and restore defaults
    chrome.storage.local.set({
        lobs: defaultLOBs,
        priorities: defaultPriorities,
        transactions: defaultTransactions,
        defaultLOB: null,
        viewMode: 'popup',
        darkMode: false,
        draft: null
    }, function() {
        // Reload UI
        loadLOBs();
        loadPriorities();
        loadTransactions();
        clearForm();
        
        // Reset dark mode
        document.documentElement.removeAttribute('data-theme');
        
        showToast('✅ All settings restored to defaults!');
        setTimeout(() => {
            showToast('Extension reset complete');
        }, 1500);
    });
}

function setupDarkModeToggle() {
    chrome.storage.local.get(['darkMode'], function(result) {
        if (result.darkMode) document.documentElement.setAttribute('data-theme', 'dark');
    });
    
    const dmBtn = document.getElementById('darkModeBtn');
    if(dmBtn) {
        dmBtn.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            if (newTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                chrome.storage.local.set({ darkMode: true });
            } else {
                document.documentElement.removeAttribute('data-theme');
                chrome.storage.local.set({ darkMode: false });
            }
        });
    }
}

function saveDraftDebounced() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveDraft, AUTOSAVE_DELAY);
}

function saveDraft() {
    const priorityEl = document.getElementById('priority');
    const transactionEl = document.getElementById('transaction');
    const lobEl = document.getElementById('lob');
    const customEmailEl = document.getElementById('customEmail');
    const policyEl = document.getElementById('policy');
    const insuredEl = document.getElementById('insured');
    const effectiveEl = document.getElementById('effective');
    const premiumEl = document.getElementById('premium');
    const issueEl = document.getElementById('issue');

    const draft = {
        priority: priorityEl ? priorityEl.value : '',
        transaction: transactionEl ? transactionEl.value : '',
        lob: lobEl ? lobEl.value : '',
        customEmail: customEmailEl ? customEmailEl.value : '',
        policy: policyEl ? policyEl.value : '',
        insured: insuredEl ? insuredEl.value : '',
        effective: effectiveEl ? effectiveEl.value : '',
        premium: premiumEl ? premiumEl.value : '',
        issue: issueEl ? issueEl.innerHTML : ''
    };
    chrome.storage.local.set({ draft });
}

function loadDraft() {
    chrome.storage.local.get(['draft'], function(result) {
        if (result.draft) {
            const d = result.draft;
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if(el && val) el.value = val;
            };
            
            setVal('priority', d.priority);
            setVal('transaction', d.transaction);
            setVal('lob', d.lob);
            setVal('customEmail', d.customEmail);
            setVal('policy', d.policy);
            setVal('insured', d.insured);
            setVal('effective', d.effective);
            setVal('premium', d.premium);
            
            const issueEl = document.getElementById('issue');
            if(issueEl) issueEl.innerHTML = d.issue || '';
            
            const lobSelect = document.getElementById('lob');
            if (lobSelect && lobSelect.value === 'custom') {
                document.getElementById('customEmailGroup').style.display = 'block';
            }
        }
    });
}

function clearForm() {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if(el) el.value = val;
    };
    
    // Reset Priority to Normal (assuming "Normal" is a default option)
    const priorityEl = document.getElementById('priority');
    if(priorityEl) {
        for(let i=0; i<priorityEl.options.length; i++) {
            if(priorityEl.options[i].text === 'Normal') {
                priorityEl.selectedIndex = i;
                break;
            }
        }
    }
    
    setVal('lob', '');
    setVal('customEmail', '');
    setVal('policy', '');
    setVal('insured', '');
    
    const dateInput = document.getElementById('effective');
    if(dateInput) dateInput.valueAsDate = new Date();
    
    setVal('premium', '');
    
    const issueEl = document.getElementById('issue');
    if(issueEl) issueEl.innerHTML = '';
    
    const customGroup = document.getElementById('customEmailGroup');
    if(customGroup) customGroup.style.display = 'none';
    
    document.getElementById('reportPreview').style.display = 'none';
    document.getElementById('outputOptions').style.display = 'none';
    
    clearValidationStates();
    chrome.storage.local.remove(['draft']);
    showToast('Form cleared');
}

function validateForm() {
    const fields = [
        { id: 'lob', name: 'Line of Business', type: 'select' },
        { id: 'priority', name: 'Priority', type: 'select' },
        { id: 'transaction', name: 'Transaction Type', type: 'select' },
        { id: 'policy', name: 'Policy Number', type: 'input' },
        { id: 'insured', name: 'Named Insured', type: 'input' },
        { id: 'effective', name: 'Effective Date', type: 'input' },
        { id: 'premium', name: 'Premium', type: 'input' },
        { id: 'issue', name: 'Issue Description', type: 'editor' }
    ];
    
    let isValid = true;
    let firstInvalidField = null;
    
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if(!element) return;

        let value = (field.type === 'editor') ? element.innerText?.trim() : element.value?.trim();
        
        if (field.id === 'lob' && value === '') {
            markFieldInvalid(element);
            isValid = false;
            if (!firstInvalidField) firstInvalidField = element;
        }
        else if (field.id === 'lob' && value === 'custom') {
            const customEmail = document.getElementById('customEmail');
            if (customEmail && (!customEmail.value.trim() || !isValidEmail(customEmail.value.trim()))) {
                markFieldInvalid(customEmail);
                isValid = false;
                if (!firstInvalidField) firstInvalidField = customEmail;
            } else if(customEmail) {
                markFieldValid(customEmail);
            }
            markFieldValid(element);
        }
        else if (!value) {
            markFieldInvalid(element);
            isValid = false;
            if (!firstInvalidField) firstInvalidField = element;
        } else {
            markFieldValid(element);
        }
    });
    
    if (!isValid && firstInvalidField) {
        firstInvalidField.focus();
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return isValid;
}

function markFieldInvalid(element) {
    if(element) {
        element.style.borderColor = '#e74c3c';
        element.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
    }
}

function markFieldValid(element) {
    if(element) {
        element.style.borderColor = '';
        element.style.boxShadow = '';
    }
}

function clearValidationStates() {
    document.querySelectorAll('input, select, .editor').forEach(markFieldValid);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateReport() {
    const btn = document.getElementById('generateBtn');
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Generating...';
    
    try {
        clearValidationStates();
        if (!validateForm()) {
            showToast('Please fill in all required fields.');
            return;
        }
        
        // Get form data
        const priorityEl = document.getElementById('priority');
        const transactionEl = document.getElementById('transaction');
        const lobSelect = document.getElementById('lob');
        
        const data = {
            priority: priorityEl ? priorityEl.value : 'Normal',
            transaction: transactionEl ? transactionEl.value : '',
            lobName: lobSelect.options[lobSelect.selectedIndex].textContent,
            policy: sanitizeInput(document.getElementById('policy').value.trim()),
            insured: sanitizeInput(document.getElementById('insured').value.trim()),
            effective: formatDateUS(document.getElementById('effective').value),
            premium: sanitizeInput(document.getElementById('premium').value.trim()),
            issueText: document.getElementById('issue').innerText,
            issueHtml: document.getElementById('issue').innerHTML
        };
        
        const lobValue = lobSelect.value;
        const lobEmail = (lobValue === 'custom') ? 
            sanitizeInput(document.getElementById('customEmail').value.trim()) : 
            lobSelect.options[lobSelect.selectedIndex].dataset.email;
        
        // Get LOB configuration to determine template
        chrome.storage.local.get(['lobs'], function(result) {
            const lobs = result.lobs || defaultLOBs;
            const selectedLOB = lobs.find(l => l.email === lobEmail || l.name === data.lobName);
            
            // Get templates for this LOB
            const templates = getTemplatesForLOB(selectedLOB);
            
            // Parse templates with data
            const subject = parseTemplate(templates.subject, data);
            const body = parseTemplate(templates.body, data);
            
            // Store for email functions
            currentReportPlain = `SEND IT REPORT
Subject: ${subject}
=============================================

${body}

=============================================
Report Generated: ${new Date().toLocaleString()}
Route To: ${lobEmail}

⚠️ REMINDER: Please attach relevant screenshots.`;

            // Create rich HTML version
            const bodyWithoutIssue = body.replace(data.issueText, '').trim();
            currentReportRich = `
                <div style="font-family: sans-serif; color: #333;">
                    <h3>SEND IT REPORT</h3>
                    <p style="font-size: 14px; background-color: #f0f0f0; padding: 8px; border-left: 4px solid #667eea;">
                        <strong>Subject:</strong> ${escapeHtml(subject)}
                    </p>
                    <hr>
                    <pre style="white-space: pre-wrap; font-family: sans-serif; margin: 0;">${escapeHtml(bodyWithoutIssue)}</pre>
                    <div style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-left: 3px solid #667eea;">
                        <strong>Issue Description:</strong>
                        <div style="margin-top: 10px;">${data.issueHtml}</div>
                    </div>
                    <hr>
                    <p><small>Generated: ${new Date().toLocaleString()}<br>To: ${escapeHtml(lobEmail)}</small></p>
                    <p style="background-color: #fff3cd; padding: 5px;">⚠️ REMINDER: Please attach screenshots.</p>
                </div>
            `;

            currentEmail = lobEmail;
            document.getElementById('reportPreview').style.display = 'none';
            document.getElementById('outputOptions').style.display = 'flex';
            showToast('Report generated!');
            
            btn.disabled = false;
            btn.textContent = originalText;
        });
        
    } catch (error) {
        ErrorLogger.log(error, {
            action: 'generateReport',
            userAction: 'Clicked Generate Report button'
        });
        showToast('Error generating report. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function sanitizeInput(input) { return input.replace(/[<>]/g, ''); }
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function formatDateUS(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
}

async function copyToClipboard() {
    try {
        const textBlob = new Blob([currentReportPlain], { type: 'text/plain' });
        const htmlBlob = new Blob([currentReportRich], { type: 'text/html' });
        await navigator.clipboard.write([new ClipboardItem({'text/plain': textBlob, 'text/html': htmlBlob})]);
        showToast('Report copied (Rich Text)!');
    } catch (err) {
        await navigator.clipboard.writeText(currentReportPlain);
        showToast('Report copied (Plain Text)');
    }
}

function downloadReport() {
    const blob = new Blob([currentReportPlain], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Send_It_Report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function openEmailClient(targetAddress) {
    if (!targetAddress) { showToast('No email address found.'); return; }
    
    const priority = document.getElementById('priority').value;
    const lobSelect = document.getElementById('lob');
    const lobName = lobSelect.options[lobSelect.selectedIndex].textContent;
    const policy = sanitizeInput(document.getElementById('policy').value.trim());
    const insured = sanitizeInput(document.getElementById('insured').value.trim());
    const effective = formatDateUS(document.getElementById('effective').value);
    const issueText = document.getElementById('issue').innerText.trim();

    const subject = encodeURIComponent(`${priority} | ${lobName} | ${policy} | ${insured} | ${effective}`);
    const body = encodeURIComponent(`Priority: ${priority}\n\n${issueText}\n\n⚠️ REMINDER: Please attach screenshots.`);

    window.open(`mailto:${targetAddress}?subject=${subject}&body=${body}`);
    showToast('Opening email client...');
}

function openConfirmModal() { 
    const el = document.getElementById('confirmModal');
    if(el) el.classList.add('active'); 
}
function closeConfirmModal() { 
    const el = document.getElementById('confirmModal');
    if(el) el.classList.remove('active'); 
}

function openSetupModal() {
    chrome.storage.local.get(['lobs', 'priorities', 'transactions'], function(result) {
        const lobs = result.lobs || defaultLOBs;
        const priorities = result.priorities || defaultPriorities;
        const transactions = result.transactions || defaultTransactions;
        
        renderLOBList(lobs);
        
        if(document.getElementById('priorityList')) {
            renderPriorityList(priorities);
        }
        
        if(document.getElementById('transactionList')) {
            renderTransactionList(transactions);
        }
        
        updateErrorCount();
        document.getElementById('setupModal').classList.add('active');
    });
}
function closeSetupModal() { 
    const el = document.getElementById('setupModal');
    if(el) el.classList.remove('active'); 
}

// --- Settings: Priority List ---
function renderPriorityList(priorities) {
    const listContainer = document.getElementById('priorityList');
    if(!listContainer) return;

    listContainer.innerHTML = '';
    priorities.forEach((p, index) => {
        const item = document.createElement('div');
        item.className = 'lob-item';
        item.innerHTML = `
            <div class="lob-info">
                <div class="lob-name">${escapeHtml(p)}</div>
            </div>
            <button class="delete-btn" data-type="priority" data-index="${index}">Delete</button>
        `;
        listContainer.appendChild(item);
    });

    listContainer.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() { deletePriority(parseInt(this.dataset.index)); });
    });
}

function addNewPriority() {
    const nameInput = document.getElementById('newPriorityName');
    const name = nameInput.value.trim();
    if (!name) { showToast('Please enter a priority name.'); return; }
    
    chrome.storage.local.get(['priorities'], function(result) {
        const priorities = result.priorities || defaultPriorities;
        priorities.push(name);
        chrome.storage.local.set({ priorities }, function() {
            renderPriorityList(priorities);
            loadPriorities();
            nameInput.value = '';
            showToast('Priority added!');
        });
    });
}

function deletePriority(index) {
    chrome.storage.local.get(['priorities'], function(result) {
        const priorities = result.priorities || defaultPriorities;
        if (priorities.length <= 1) { showToast('Must have at least one priority.'); return; }
        
        priorities.splice(index, 1);
        chrome.storage.local.set({ priorities }, function() {
            renderPriorityList(priorities);
            loadPriorities();
            showToast('Priority deleted!');
        });
    });
}

// ============================================
// TRANSACTION MANAGEMENT (v3.5.2)
// ============================================

function renderTransactionList(transactions) {
    const listContainer = document.getElementById('transactionList');
    if(!listContainer) return;

    listContainer.innerHTML = '';
    transactions.forEach((t, index) => {
        const item = document.createElement('div');
        item.className = 'lob-item';
        item.innerHTML = `
            <div class="lob-info">
                <div class="lob-name">${escapeHtml(t)}</div>
            </div>
            <button class="delete-btn" data-type="transaction" data-index="${index}">Delete</button>
        `;
        listContainer.appendChild(item);
    });

    listContainer.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() { deleteTransaction(parseInt(this.dataset.index)); });
    });
}

function addNewTransaction() {
    const nameInput = document.getElementById('newTransactionName');
    const name = nameInput.value.trim();
    if (!name) { showToast('Please enter a transaction type.'); return; }
    
    chrome.storage.local.get(['transactions'], function(result) {
        const transactions = result.transactions || defaultTransactions;
        
        // Check for duplicates
        if (transactions.includes(name)) {
            showToast('Transaction type already exists!');
            return;
        }
        
        transactions.push(name);
        chrome.storage.local.set({ transactions }, function() {
            renderTransactionList(transactions);
            loadTransactions();
            nameInput.value = '';
            showToast('Transaction type added!');
        });
    });
}

function deleteTransaction(index) {
    chrome.storage.local.get(['transactions'], function(result) {
        const transactions = result.transactions || defaultTransactions;
        if (transactions.length <= 1) { showToast('Must have at least one transaction type.'); return; }
        
        transactions.splice(index, 1);
        chrome.storage.local.set({ transactions }, function() {
            renderTransactionList(transactions);
            loadTransactions();
            showToast('Transaction type deleted!');
        });
    });
}

function loadTransactionSettings() {
    chrome.storage.local.get(['transactions'], function(result) {
        const transactions = result.transactions || defaultTransactions;
        if(document.getElementById('transactionList')) {
            renderTransactionList(transactions);
        }
    });
}

// --- Settings: LOB List ---
function renderLOBList(lobs) {
    const listContainer = document.getElementById('lobList');
    if(!listContainer) return;
    
    listContainer.innerHTML = '';
    lobs.forEach((lob, index) => {
        // Determine template display
        const templateMode = lob.templateMode || 'preset';
        const templatePreset = lob.templatePreset || 'detailed';
        const templateDisplay = templateMode === 'custom' ? 'Custom Template' : PRESET_TEMPLATES[templatePreset]?.name || 'Detailed';
        
        const item = document.createElement('div');
        item.className = 'lob-item';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'flex-start';
        item.innerHTML = `
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="lob-info">
                    <div class="lob-name">${escapeHtml(lob.name)}</div>
                    <div class="lob-email">${escapeHtml(lob.email)}</div>
                    <div style="font-size: 11px; color: #667eea; margin-top: 4px;">
                        📧 Template: ${templateDisplay}
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="edit-template-btn" data-index="${index}" style="padding: 6px 12px; font-size: 12px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ✏️ Edit Template
                    </button>
                    <button class="delete-btn" data-type="lob" data-index="${index}">Delete</button>
                </div>
            </div>
        `;
        listContainer.appendChild(item);
    });
    
    // Add event listeners for Edit Template buttons
    listContainer.querySelectorAll('.edit-template-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            openTemplateEditor(parseInt(this.dataset.index));
        });
    });
    
    listContainer.querySelectorAll('.delete-btn').forEach(btn => {
        if(btn.dataset.type === 'lob') {
            btn.addEventListener('click', function() { deleteLOB(parseInt(this.dataset.index)); });
        }
    });
}

function addNewLOB() {
    const nameInput = document.getElementById('newLobName');
    const emailInput = document.getElementById('newLobEmail');
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!name || !email) { showToast('Enter name and email.'); return; }
    
    chrome.storage.local.get(['lobs'], function(result) {
        const lobs = result.lobs || defaultLOBs;
        lobs.push({ name, email });
        chrome.storage.local.set({ lobs }, function() {
            renderLOBList(lobs);
            loadLOBs();
            nameInput.value = '';
            emailInput.value = '';
            showToast('LOB added!');
        });
    });
}

function deleteLOB(index) {
    chrome.storage.local.get(['lobs'], function(result) {
        const lobs = result.lobs || defaultLOBs;
        lobs.splice(index, 1);
        chrome.storage.local.set({ lobs }, function() {
            renderLOBList(lobs);
            loadLOBs();
            showToast('LOB deleted!');
        });
    });
}

function setDefaultLOB() {
    const lobSelect = document.getElementById('lob');
    const selectedValue = lobSelect.value;
    if (!selectedValue) return;
    const lobName = lobSelect.options[lobSelect.selectedIndex].textContent;
    
    chrome.storage.local.set({ defaultLOB: selectedValue }, function() {
        showToast(`Default: ${lobName}`);
        updateDefaultStatusDisplay();
    });
}

// ============================================
// TEMPLATE ENGINE (v3.5)
// ============================================

// Parse template with actual data
function parseTemplate(template, data) {
    if (!template) return '';
    
    // Determine if we should abbreviate LOB (only in subject lines)
    const isSubjectLine = !template.includes('\n'); // Subject lines don't have newlines
    const lobValue = isSubjectLine ? abbreviateLOB(data.lobName) : (data.lobName || '');
    
    const tokens = {
        '{priority}': data.priority || '',
        '{transaction}': data.transaction || '',
        '{lob}': lobValue,
        '{pol.#}': data.policy || '', // New token name
        '{policy}': data.policy || '', // Keep for backwards compatibility
        '{insured}': data.insured || '',
        '{date}': data.effective || '',
        '{premium}': data.premium || '',
        '{issue}': data.issueText || '',
        '{timestamp}': new Date().toLocaleString()
    };
    
    let result = template;
    for (const [token, value] of Object.entries(tokens)) {
        const escaped = token.replace(/[{}]/g, '\\$&').replace(/\./g, '\\.');
        result = result.replace(new RegExp(escaped, 'g'), value);
    }
    
    // Clean up empty separators
    result = result.replace(/\s*\|\s*\|\s*/g, ' | ');
    result = result.replace(/\s*\|\s*$/g, '');
    result = result.replace(/^\s*\|\s*/g, '');
    result = result.replace(/\s+/g, ' ');
    
    return result.trim();
}

// Get templates for a specific LOB
function getTemplatesForLOB(lob) {
    if (!lob) return PRESET_TEMPLATES.detailed;
    
    if (lob.templateMode === 'custom') {
        return {
            subject: lob.customSubjectTemplate || PRESET_TEMPLATES.detailed.subject,
            body: lob.customBodyTemplate || PRESET_TEMPLATES.detailed.body
        };
    } else {
        const preset = PRESET_TEMPLATES[lob.templatePreset] || PRESET_TEMPLATES.detailed;
        return {
            subject: preset.subject,
            body: preset.body
        };
    }
}

// Validate template
function validateTemplate(subjectTemplate, bodyTemplate) {
    const errors = [];
    
    if (!subjectTemplate || !subjectTemplate.trim()) {
        errors.push("Subject template cannot be empty");
    }
    
    if (!bodyTemplate || !bodyTemplate.trim()) {
        errors.push("Body template cannot be empty");
    }
    
    if (!bodyTemplate.includes('{issue}')) {
        errors.push("Body template must include {issue} token");
    }
    
    // Test with sample data
    const sampleData = {
        priority: "Critical",
        transaction: "Cancellation",
        lobName: "Property & Casualty Insurance",
        policy: "POL-2024-123456",
        insured: "John Michael Doe",
        effective: "02/07/2026",
        premium: "$5,000.00"
    };
    
    const subjectPreview = parseTemplate(subjectTemplate, sampleData);
    if (subjectPreview.length > 80) {
        errors.push(`Warning: Subject is ${subjectPreview.length} chars (recommended <80)`);
    }
    
    return errors;
}

// Preview template with sample data
function previewTemplate(subjectTemplate, bodyTemplate) {
    const sampleData = {
        priority: "High",
        transaction: "Renewal",
        lobName: "Property & Casualty",
        policy: "123456",
        insured: "John Doe",
        effective: "02/07/2026",
        premium: "$5,000.00",
        issueText: "System froze when trying to save renewal. Error message: Database connection lost - ERR_502"
    };
    
    return {
        subject: parseTemplate(subjectTemplate, sampleData),
        body: parseTemplate(bodyTemplate, sampleData)
    };
}

// ============================================
// TEMPLATE EDITOR UI (v3.5)
// ============================================

let currentEditingLOBIndex = null;

// Open template editor for a specific LOB
function openTemplateEditor(lobIndex) {
    chrome.storage.local.get(['lobs'], function(result) {
        const lobs = result.lobs || defaultLOBs;
        const lob = lobs[lobIndex];
        if (!lob) return;
        
        currentEditingLOBIndex = lobIndex;
        
        // Set title
        document.getElementById('templateEditorTitle').textContent = `✏️ Edit Email Template - ${lob.name}`;
        
        // Set mode
        const mode = lob.templateMode || 'preset';
        const preset = lob.templatePreset || 'detailed';
        
        if (mode === 'preset') {
            document.getElementById('templateModePreset').checked = true;
            document.getElementById('templateModeCustom').checked = false;
            document.getElementById('presetSelection').style.display = 'block';
            document.getElementById('customTemplateEditor').style.display = 'none';
            document.getElementById('templatePresetSelect').value = preset;
        } else {
            document.getElementById('templateModePreset').checked = false;
            document.getElementById('templateModeCustom').checked = true;
            document.getElementById('presetSelection').style.display = 'none';
            document.getElementById('customTemplateEditor').style.display = 'block';
            document.getElementById('customSubjectTemplate').value = lob.customSubjectTemplate || '';
            document.getElementById('customBodyTemplate').value = lob.customBodyTemplate || '';
        }
        
        // Update preview
        updateTemplatePreview();
        
        // Show modal
        document.getElementById('templateEditorModal').style.display = 'flex';
    });
}

// Close template editor
function closeTemplateEditor() {
    document.getElementById('templateEditorModal').style.display = 'none';
    currentEditingLOBIndex = null;
}

// Save template
function saveTemplate() {
    if (currentEditingLOBIndex === null) return;
    
    chrome.storage.local.get(['lobs'], function(result) {
        const lobs = result.lobs || defaultLOBs;
        const lob = lobs[currentEditingLOBIndex];
        
        const mode = document.getElementById('templateModePreset').checked ? 'preset' : 'custom';
        
        if (mode === 'preset') {
            const preset = document.getElementById('templatePresetSelect').value;
            lob.templateMode = 'preset';
            lob.templatePreset = preset;
            lob.customSubjectTemplate = null;
            lob.customBodyTemplate = null;
        } else {
            const subjectTemplate = document.getElementById('customSubjectTemplate').value;
            const bodyTemplate = document.getElementById('customBodyTemplate').value;
            
            // Validate
            const errors = validateTemplate(subjectTemplate, bodyTemplate);
            if (errors.length > 0) {
                showTemplateErrors(errors);
                return;
            }
            
            lob.templateMode = 'custom';
            lob.templatePreset = null;
            lob.customSubjectTemplate = subjectTemplate;
            lob.customBodyTemplate = bodyTemplate;
        }
        
        chrome.storage.local.set({ lobs }, function() {
            showToast('✅ Template saved!');
            closeTemplateEditor();
            renderLOBList(lobs);
        });
    });
}

// Update live preview
function updateTemplatePreview() {
    const mode = document.getElementById('templateModePreset').checked ? 'preset' : 'custom';
    
    let subjectTemplate, bodyTemplate;
    
    if (mode === 'preset') {
        const preset = document.getElementById('templatePresetSelect').value;
        const presetData = PRESET_TEMPLATES[preset] || PRESET_TEMPLATES.detailed;
        subjectTemplate = presetData.subject;
        bodyTemplate = presetData.body;
    } else {
        subjectTemplate = document.getElementById('customSubjectTemplate').value;
        bodyTemplate = document.getElementById('customBodyTemplate').value;
    }
    
    const preview = previewTemplate(subjectTemplate, bodyTemplate);
    
    document.getElementById('subjectPreview').textContent = preview.subject;
    document.getElementById('bodyPreview').textContent = preview.body;
    
    // Update character count
    const subjectLengthEl = document.getElementById('subjectLength');
    const subjectWarningEl = document.getElementById('subjectLengthWarning');
    if (subjectLengthEl) {
        subjectLengthEl.textContent = preview.subject.length;
        if (preview.subject.length > 80) {
            subjectWarningEl.style.display = 'inline';
        } else {
            subjectWarningEl.style.display = 'none';
        }
    }
    
    // Clear errors on update
    document.getElementById('templateErrors').style.display = 'none';
}

// Show template validation errors
function showTemplateErrors(errors) {
    const errorDiv = document.getElementById('templateErrors');
    const errorList = document.getElementById('templateErrorsList');
    
    errorList.innerHTML = '';
    errors.forEach(error => {
        const li = document.createElement('li');
        li.textContent = error;
        errorList.appendChild(li);
    });
    
    errorDiv.style.display = 'block';
}

// Insert token at cursor
function insertToken(token, target) {
    const textarea = target === 'body' ? 
        document.getElementById('customBodyTemplate') : 
        document.getElementById('customSubjectTemplate');
    
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    textarea.value = text.substring(0, start) + token + text.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + token.length, start + token.length);
    
    updateTemplatePreview();
}

// Reset to default preset
function resetTemplate() {
    if (confirm('Reset to default "Detailed" preset template?')) {
        document.getElementById('templateModePreset').checked = true;
        document.getElementById('templateModeCustom').checked = false;
        document.getElementById('templatePresetSelect').value = 'detailed';
        document.getElementById('presetSelection').style.display = 'block';
        document.getElementById('customTemplateEditor').style.display = 'none';
        updateTemplatePreview();
    }
}

// Initialize template editor event listeners
function initializeTemplateEditor() {
    // Mode toggle
    document.querySelectorAll('input[name="templateMode"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'preset') {
                document.getElementById('presetSelection').style.display = 'block';
                document.getElementById('customTemplateEditor').style.display = 'none';
            } else {
                document.getElementById('presetSelection').style.display = 'none';
                document.getElementById('customTemplateEditor').style.display = 'block';
                
                // Populate with default template if empty
                const subjectField = document.getElementById('customSubjectTemplate');
                const bodyField = document.getElementById('customBodyTemplate');
                
                if (!subjectField.value.trim()) {
                    subjectField.value = '{priority} | {lob} | {pol.#} | {insured} | {date} | {premium}';
                }
                
                if (!bodyField.value.trim()) {
                    bodyField.value = `Priority: {priority}
Line of Business: {lob}
Policy/Control Number: {pol.#}
Named Insured: {insured}
Effective Date: {date}
Premium: {premium}

Issue Description:
{issue}`;
                }
            }
            updateTemplatePreview();
        });
    });
    
    // Preset selection change
    const presetSelect = document.getElementById('templatePresetSelect');
    if (presetSelect) {
        presetSelect.addEventListener('change', updateTemplatePreview);
    }
    
    // Custom template change
    const customSubject = document.getElementById('customSubjectTemplate');
    const customBody = document.getElementById('customBodyTemplate');
    if (customSubject) customSubject.addEventListener('input', updateTemplatePreview);
    if (customBody) customBody.addEventListener('input', updateTemplatePreview);
    
    // Token buttons
    document.querySelectorAll('.token-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const token = this.dataset.token;
            const target = this.dataset.target;
            insertToken(token, target);
        });
    });
    
    // Modal buttons
    const closeBtn = document.getElementById('closeTemplateEditorBtn');
    const cancelBtn = document.getElementById('cancelTemplateBtn');
    const saveBtn = document.getElementById('saveTemplateBtn');
    const resetBtn = document.getElementById('resetTemplateBtn');
    
    if (closeBtn) closeBtn.addEventListener('click', closeTemplateEditor);
    if (cancelBtn) cancelBtn.addEventListener('click', closeTemplateEditor);
    if (saveBtn) saveBtn.addEventListener('click', saveTemplate);
    if (resetBtn) resetBtn.addEventListener('click', resetTemplate);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if(toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }
}
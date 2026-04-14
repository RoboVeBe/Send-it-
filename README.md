# Send It v3.6 - Smart Issue Routing

> A Chrome extension that streamlines IT help desk reporting for insurance operations. Fill out a structured form, generate a formatted report, and route it to the right team — in seconds.

---

## 📸 Screenshots

### Main Form — Light Mode
<img src="screenshots/11-main-form-empty-light.png" width="400" alt="Main Form Light Mode"/>

*Clean, structured form with smart routing fields*

### Main Form — Dark Mode (Filled)
<img src="screenshots/08-main-form-filled-dark.png" width="400" alt="Main Form Dark Mode Filled"/>

*Dark mode with a fully filled Critical priority ticket ready to generate*

### Main Form — Dark Mode (Empty)
<img src="screenshots/13-main-form-empty-dark.png" width="400" alt="Main Form Dark Mode Empty"/>

*Default state on open — dark mode*

### Generated Report Output
<img src="screenshots/09-report-output-notepadpp.png" width="650" alt="Generated Report Output"/>

*Structured report output — copy and paste directly into Outlook, Gmail, or any email client. Format is also ServiceNow-ingestible with no additional formatting required.*

### Floating Popup Mode
<img src="screenshots/01-floating-popup-mode.png" width="650" alt="Floating Popup Mode"/>

*Default floating window mode — works alongside any active browser tab*

### Side Panel — Docked Mode
<img src="screenshots/14-side-panel-docked.png" width="650" alt="Side Panel Docked"/>

*Docked side panel mode — stay on your workflow while filing a report*

### Settings — Overview
<img src="screenshots/03-settings-overview.png" width="400" alt="Settings Overview"/>

*Collapsible settings sections — Master List, Priority, Transaction, LOB, Error Logs*

### Settings — Priority Configuration
<img src="screenshots/04-settings-priority-config.png" width="400" alt="Priority Configuration"/>

*Add, remove, and manage priority levels*

### Settings — Transaction Type Configuration
<img src="screenshots/05-settings-transaction-config.png" width="400" alt="Transaction Type Configuration"/>

*Fully configurable transaction type list — add your own types*

### Settings — Line of Business Configuration
<img src="screenshots/12-settings-lob-config-v36.png" width="400" alt="LOB Configuration"/>

*Manage LOBs, help desk emails, and per-LOB email templates*

### Settings — Error Logs & Debugging
<img src="screenshots/07-settings-error-logs.png" width="400" alt="Error Logs"/>

*Built-in error logging with export for faster support troubleshooting*

---

## 🧹 What's New in v3.6

This release focuses on cleanup and making Send It ready for public distribution.

**Changes in v3.6:**
- ✅ Removed internal FLDC LOB entry from defaults and `master_list.json`
- ✅ `defaultLOBs` in `popup.js` and `master_list.json` now in sync (6 entries)
- ✅ Updated contact email to public address
- ✅ Version bump to 3.6 across all files
- ✅ Added `.gitignore` for public repo hygiene
- ✅ Screenshots added to repo

---

## 📦 What's Inside

```
send-it/
├── popup.html          Main extension UI
├── popup.js            Core logic, templates, settings
├── styles.css          Light + dark mode styling
├── background.js       Service worker (popup vs side panel routing)
├── manifest.json       Extension manifest (v3)
├── master_list.json    Default LOB reference list
├── icon16.png
├── icon48.png
├── icon128.png
└── screenshots/        README screenshots
```

---

## 🚀 Quick Start

### Installation
1. Go to `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load Unpacked**
4. Select this folder
5. Done — the Send It icon will appear in your toolbar

---

## ✨ Features

- **Smart LOB Routing** — Select a Line of Business and the email routes automatically to the right help desk
- **Outlook & ServiceNow Ready** — Generated reports copy directly into any email client and are structured for ServiceNow ingestion with no reformatting needed
- **Transaction Types** — Configurable dropdown (New Business, Renewal, Endorsement, etc.)
- **Priority Levels** — Low / Normal / High / Critical / System Down
- **Rich Text Editor** — Bold, italic, underline, bullet lists, fullscreen mode
- **Email Templates** — 5 presets + custom template builder with live preview
- **Auto-Save Draft** — Form state persists between sessions
- **Dark Mode** — Full dark theme support
- **Side Panel or Popup** — Switch between docked and floating window modes
- **Export / Import Settings** — Share config across installs or back up your setup
- **Error Logging** — Built-in error capture and export for troubleshooting

---

## ⚙️ Configuration

### Managing LOBs (Lines of Business)
1. Click the ⚙️ Settings icon
2. Expand **Line of Business Configuration**
3. Add custom LOBs with name + help desk email
4. Delete unused entries

### Managing Transaction Types
1. Click ⚙️ Settings
2. Expand **Transaction Type Configuration**
3. Add or remove transaction types as needed

### Email Templates
Each LOB can have its own email template — choose from 5 presets (Detailed, Full, Minimal, Compact, IT Standard) or build a custom template using token placeholders like `{priority}`, `{pol.#}`, `{insured}`, `{issue}`.

### Import / Export
Settings → File Management → Export/Import to back up or share your configuration. Includes LOBs, priorities, transaction types, and templates.

---

## 📋 Default LOBs

| Name | Placeholder Email |
|---|---|
| Property & Casualty | pc-help@company.com |
| Life Insurance | life-help@company.com |
| Health Insurance | health-help@company.com |
| Commercial Lines | commercial-help@company.com |
| Claims | claims-help@company.com |
| Other/General | it-help@company.com |

> Update these with your actual help desk addresses after installing.

---

## 📋 Default Transaction Types

New Business, Renewal, Rewrite, Endorsement, Cancellation, Reinstatement, Other

---

## 💡 Tips

1. Set a **Default LOB** for your most common department — it pre-selects on every open
2. **Export your settings** after customizing so you can restore after reinstalls
3. Use the **Fullscreen editor** for longer issue descriptions
4. Keep transaction type labels short (2–3 words) for cleaner subject lines
5. The **Compact** or **IT Standard** templates work best for high-volume reporting
6. Generated reports are pre-formatted for **ServiceNow** — no cleanup needed

---

## 🆘 Support

**Email:** vbehric@gmail.com  
**Subject:** `Send It v3.6`

---

## 📝 Changelog

| Version | Date | Notes |
|---|---|---|
| 3.6 | April 2026 | Public release cleanup, FLDC removed, screenshots added |
| 3.5.2 | February 2026 | Transaction Type Configuration UI added |
| 3.5 | — | Template system introduced (presets + custom) |
| 3.4 | — | Transaction types added |

---

**Version:** 3.6  
**Manifest:** v3  
**Browser:** Chrome / Chromium-based (Edge compatible)

# Send It v3.6 - GitHub Public Release

## 🧹 What's New in v3.6 — Public Release Prep

This release focuses on cleanup, consistency, and making Send It ready for public distribution. No new features — just a leaner, cleaner, GitHub-ready package.

**Changes in v3.6:**
- ✅ Removed internal FLDC LOB entry from defaults and `master_list.json`
- ✅ `defaultLOBs` in `popup.js` and `master_list.json` are now in sync (6 entries)
- ✅ Updated contact email to public address
- ✅ Version bump to 3.6 across all files
- ✅ General public release cleanup

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
└── icon128.png
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

- **Smart LOB Routing** — Select a Line of Business and the email routes automatically
- **Transaction Types** — Configurable dropdown (New Business, Renewal, Endorsement, etc.)
- **Priority Levels** — Low / Normal / High / Critical / System Down
- **Rich Text Editor** — Bold, italic, underline, bullet lists, fullscreen mode
- **Email Templates** — 5 presets + custom template builder with live preview
- **Auto-Save Draft** — Form state persists between sessions
- **Dark Mode** — Full dark theme support
- **Side Panel or Popup** — Switch between docked and floating window modes
- **Export / Import Settings** — Share config across installs
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

---

## 🆘 Support

**Email:** vbehric@gmail.com  
**Subject:** `Send It v3.6`

---

## 📝 Changelog

| Version | Date | Notes |
|---|---|---|
| 3.6 | April 2026 | Public release cleanup, FLDC removed, email updated |
| 3.5.2 | February 2026 | Transaction Type Configuration UI added |
| 3.5 | — | Template system introduced (presets + custom) |
| 3.4 | — | Transaction types added |

---

**Version:** 3.6  
**Manifest:** v3  
**Browser:** Chrome / Chromium-based (Edge compatible)

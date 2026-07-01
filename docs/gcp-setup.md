# GCP Setup for Singapore 2026 Bot

## Google Sheets Expense Tracking (Service Account)

### Step 1: Create GCP Project
1. Go to https://console.cloud.google.com
2. Create project: "singapore2026-bot" (or use existing)
3. Enable APIs:
   - Google Sheets API
   - Google Drive API

### Step 2: Create Service Account
1. IAM & Admin → Service Accounts → Create
2. Name: `sg-expense-bot`
3. No roles needed (we share the sheet directly)
4. Create Key → JSON → Download

### Step 3: Create Google Sheet
1. Create new Sheet: "Singapore 2026 Expenses"
2. Header row (Row 1): `Date | Category | Amount | Currency | Description | Location | Recorder | Timestamp`
3. Share the sheet with the service account email (e.g. `sg-expense-bot@project-id.iam.gserviceaccount.com`) — Editor access
4. Copy the Sheet ID from URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

### Step 4: Store in AWS Secrets Manager
```bash
# Update the existing secret to add SA key + sheet ID
aws secretsmanager update-secret \
  --secret-id telegram-kiro-singapore-qCH629 \
  --secret-string '{
    "TELEGRAM_BOT_TOKEN": "<existing-token>",
    "GOOGLE_SA_KEY_JSON": "<paste-entire-json-key-content>",
    "EXPENSE_SHEET_ID": "<sheet-id-from-url>"
  }' \
  --profile ivco-admin --region us-east-1
```

### Step 5: Update ECS Task Definition
Add to the openab container's environment:
- `GOOGLE_SA_KEY_JSON` from secret
- `EXPENSE_SHEET_ID` from secret

---

## Google Photos Upload (OAuth2 — Phase 3)

### Prerequisites
- Same GCP project as above
- Enable: Google Photos Library API

### Step 1: Create OAuth2 Client
1. APIs & Services → Credentials → Create Credentials → OAuth Client ID
2. Type: Desktop application (for device flow)
3. Name: "sg-bot-photos"
4. Download client_secret.json

### Step 2: One-time Authorization (Allen does this)
```bash
# Run locally on Mac Mini or phone browser
python3 ops/photos_auth.py --client-secret client_secret.json
# Follow the URL, login, authorize
# Script outputs refresh_token → store in Secrets Manager
```

### Step 3: Store in Secrets Manager
Add `GOOGLE_PHOTOS_CLIENT_ID`, `GOOGLE_PHOTOS_CLIENT_SECRET`, `GOOGLE_PHOTOS_REFRESH_TOKEN` to the same secret.

---

## Scopes Used
- `https://www.googleapis.com/auth/spreadsheets` (read/write sheets)
- `https://www.googleapis.com/auth/drive` (share discovery)
- `https://www.googleapis.com/auth/photoslibrary.appendonly` (upload only)
- `https://www.googleapis.com/auth/photoslibrary.edit.appcreateddata` (manage app-created)

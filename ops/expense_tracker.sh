#!/bin/sh
# Singapore 2026 Expense Tracker (shell/curl version)
# Uses Google Sheets API directly via curl + OAuth2 refresh token
# 
# Usage:
#   ./ops/expense_tracker.sh add "2026-07-04" "食" "15.50" "S$" "松發肉骨茶" "Clarke Quay" "Allen"
#   ./ops/expense_tracker.sh total

# Get access token from refresh token
get_token() {
  curl -s -X POST https://oauth2.googleapis.com/token \
    -d "client_id=${GOOGLE_CLIENT_ID}" \
    -d "client_secret=${GOOGLE_CLIENT_SECRET}" \
    -d "refresh_token=${GOOGLE_REFRESH_TOKEN}" \
    -d "grant_type=refresh_token" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4
}

CMD="$1"
shift

case "$CMD" in
  add)
    DATE="${1:-$(date +%Y-%m-%d)}"
    CATEGORY="$2"
    AMOUNT="$3"
    CURRENCY="${4:-S\$}"
    DESCRIPTION="$5"
    LOCATION="${6:-}"
    RECORDER="${7:-Bot}"
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    SOURCE="${8:-manual}"

    TOKEN=$(get_token)
    if [ -z "$TOKEN" ]; then
      echo "ERROR: Failed to get access token"
      exit 1
    fi

    # Append row to sheet
    BODY="{\"values\":[[\"$DATE\",\"$CATEGORY\",$AMOUNT,\"$CURRENCY\",\"\",\"$DESCRIPTION\",\"$LOCATION\",\"$RECORDER\",\"$TIMESTAMP\",\"$SOURCE\"]]}"
    
    RESULT=$(curl -s -X POST \
      "https://sheets.googleapis.com/v4/spreadsheets/${EXPENSE_SHEET_ID}/values/Expenses!A:J:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$BODY")

    if echo "$RESULT" | grep -q "updatedRows"; then
      echo "✅ 已記錄: $CATEGORY $AMOUNT $CURRENCY - $DESCRIPTION"
    else
      echo "❌ 記錄失敗: $RESULT"
      exit 1
    fi
    ;;

  total)
    TOKEN=$(get_token)
    RESULT=$(curl -s \
      "https://sheets.googleapis.com/v4/spreadsheets/${EXPENSE_SHEET_ID}/values/Expenses!A2:J1000" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$RESULT" | python3 -c "
import json,sys
d=json.load(sys.stdin)
rows=d.get('values',[])
if not rows:
    print('📊 目前沒有任何消費記錄。')
else:
    total=sum(float(r[2]) for r in rows if len(r)>2 and r[2])
    print(f'📊 旅程總消費: {len(rows)} 筆')
    cats={}
    for r in rows:
        if len(r)>2:
            cats[r[1]]=cats.get(r[1],0)+float(r[2])
    for c,a in sorted(cats.items(),key=lambda x:-x[1]):
        print(f'   {c}: {a:.1f}')
" 2>/dev/null || echo "$RESULT" | grep -o '"values"' | wc -l | xargs -I{} echo "📊 {} 筆記錄"
    ;;

  summary)
    TOKEN=$(get_token)
    FILTER_DATE="$1"
    RESULT=$(curl -s \
      "https://sheets.googleapis.com/v4/spreadsheets/${EXPENSE_SHEET_ID}/values/Expenses!A2:J1000" \
      -H "Authorization: Bearer $TOKEN")
    echo "$RESULT"
    ;;

  *)
    echo "Usage: expense_tracker.sh {add|total|summary}"
    echo "  add DATE CATEGORY AMOUNT CURRENCY DESCRIPTION LOCATION RECORDER [SOURCE]"
    echo "  total"
    echo "  summary [DATE]"
    ;;
esac

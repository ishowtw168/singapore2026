#!/usr/bin/env python3
"""
Singapore 2026 Trip Expense Tracker
Records expenses to a shared Google Sheet via OAuth2 credentials.

Usage (by Kiro CLI agent):
  python3 ops/expense_tracker.py add --date "2026-07-04" --category "食" \
    --amount 15.50 --currency SGD --description "松發肉骨茶" \
    --location "Clarke Quay" --recorder "Allen"
  python3 ops/expense_tracker.py summary [--date 2026-07-04]
  python3 ops/expense_tracker.py total

Environment:
  GOOGLE_CLIENT_ID      - OAuth2 client ID
  GOOGLE_CLIENT_SECRET  - OAuth2 client secret
  GOOGLE_REFRESH_TOKEN  - OAuth2 refresh token
  EXPENSE_SHEET_ID      - Google Sheet ID (from URL)
"""

import argparse
import json
import os
import sys
from datetime import datetime


def get_sheet_client():
    """Initialize gspread with OAuth2 user credentials."""
    try:
        import gspread
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
    except ImportError:
        print("ERROR: gspread and google-auth not installed.")
        print("Install: pip install gspread google-auth")
        sys.exit(1)

    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    refresh_token = os.environ.get("GOOGLE_REFRESH_TOKEN")
    sheet_id = os.environ.get("EXPENSE_SHEET_ID")

    if not all([client_id, client_secret, refresh_token]):
        print("ERROR: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN must be set.")
        sys.exit(1)
    if not sheet_id:
        print("ERROR: EXPENSE_SHEET_ID environment variable not set.")
        sys.exit(1)

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"],
    )
    creds.refresh(Request())

    client = gspread.authorize(creds)
    sheet = client.open_by_key(sheet_id).sheet1
    return sheet


def cmd_add(args):
    """Add an expense row."""
    sheet = get_sheet_client()
    row = [
        args.date or datetime.now().strftime("%Y-%m-%d"),
        args.category,
        float(args.amount),
        args.currency or "SGD",
        args.description,
        args.location or "",
        args.recorder or "Bot",
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    ]
    sheet.append_row(row, value_input_option="USER_ENTERED")
    print(f"✅ 已記錄: {args.category} {args.amount} {args.currency or 'SGD'} - {args.description}")


def cmd_summary(args):
    """Get expense summary for a date or all."""
    sheet = get_sheet_client()
    records = sheet.get_all_records()
    if not records:
        print("📊 目前沒有任何消費記錄。")
        return

    if args.date:
        records = [r for r in records if r.get("Date") == args.date]
        if not records:
            print(f"📊 {args.date} 沒有消費記錄。")
            return

    total = sum(float(r.get("Amount", 0)) for r in records)
    print(f"📊 消費摘要{' (' + args.date + ')' if args.date else ''}:")
    print(f"   筆數: {len(records)}")
    print(f"   總額: {total:.2f} SGD")
    print()

    # Group by category
    cats = {}
    for r in records:
        cat = r.get("Category", "其他")
        cats[cat] = cats.get(cat, 0) + float(r.get("Amount", 0))
    for cat, amt in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"   {cat}: {amt:.2f} SGD")


def cmd_total(args):
    """Get total expenses."""
    sheet = get_sheet_client()
    records = sheet.get_all_records()
    if not records:
        print("📊 目前沒有任何消費記錄。總額: $0.00 SGD")
        return
    total = sum(float(r.get("Amount", 0)) for r in records)
    print(f"📊 旅程總消費: {total:.2f} SGD ({len(records)} 筆)")


def main():
    parser = argparse.ArgumentParser(description="Singapore 2026 Expense Tracker")
    sub = parser.add_subparsers(dest="command")

    p_add = sub.add_parser("add", help="Add expense")
    p_add.add_argument("--date", help="Date (YYYY-MM-DD), default today")
    p_add.add_argument("--category", required=True, help="Category (食/交通/門票/購物/住宿/其他)")
    p_add.add_argument("--amount", required=True, type=float, help="Amount")
    p_add.add_argument("--currency", default="SGD", help="Currency (default SGD)")
    p_add.add_argument("--description", required=True, help="Description")
    p_add.add_argument("--location", help="Location")
    p_add.add_argument("--recorder", help="Who recorded (default Bot)")

    p_sum = sub.add_parser("summary", help="Expense summary")
    p_sum.add_argument("--date", help="Filter by date")

    sub.add_parser("total", help="Total expenses")

    args = parser.parse_args()
    if args.command == "add":
        cmd_add(args)
    elif args.command == "summary":
        cmd_summary(args)
    elif args.command == "total":
        cmd_total(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

# Singapore 2026 — Agent Instructions

You are a bot collaborating on Allen's family trip info site for Singapore.
Read this file whenever you enter this workspace via `[[ws:@singapore2026]]`.

## Project Context

- **Trip dates**: 2026-07-04 ~ 2026-07-09 (5 nights)
- **Travelers**: Allen's family (adults + children)
- **Site URL**: https://ishowtw168.github.io/singapore2026/
- **Repo**: https://github.com/ishowtw168/singapore2026
- **Owner**: ishowtw168 (Show / Pudding)
- **Collaborators**: fisherivco (Allen), ichitaiwan-rgb (Chi)

## Your Role

You are one of several bots that collect, organize, and update travel
information for this trip. Your job is to help the user research, write,
and push data to this repo.

## Repo Structure

```
singapore2026/
├── AGENTS.md          ← you are here
├── README.md          ← project overview + data schema docs
├── index.html         ← static site (single page, fetches JSON)
├── .nojekyll          ← tells GitHub Pages to serve files as-is
├── assets/
│   ├── style.css      ← mobile-first responsive CSS
│   └── app.js         ← fetches data/*.json and renders cards
├── data/
│   ├── meta.json      ← last_updated, trip dates, categories
│   ├── transport.json ← 交通
│   ├── events.json    ← 在地活動慶典
│   ├── food.json      ← 必吃美食
│   ├── attractions.json  ← 必玩景點
│   ├── souvenirs.json    ← 必買伴禮
│   └── experiences.json  ← 其他旅遊體驗
├── docs/              ← additional documents (booked tickets, etc.)
└── ops/               ← operational scripts/templates
```

## Data Update Rules

1. **Only edit `data/<category>.json` files** unless explicitly asked otherwise
2. **Validate JSON before commit**: `python3 -m json.tool data/<file>.json > /dev/null`
3. **Update timestamps**: set `"updated"` in the category file + `"last_updated"` in `data/meta.json`
4. **Commit message format**: `data(<category>): 新增/更新 N 筆項目`
5. **Push to `main`**: site auto-deploys via GitHub Pages in ~1-2 min
6. **No-delete principle**: don't remove existing items; replace or mark outdated instead
7. **Language rules**:
   - `en_name` + `address` = English (for navigation / taxi drivers)
   - `zh_name` + `zh_desc` + `price_zh` + `tags` = 繁體中文 (for the family)

## Item Schema (per entry in items[])

Required: `id`, `en_name`, `zh_name`, `zh_desc`
Recommended: `address`, `area`, `price_zh`, `map_link`, `tags`, `source_url`
Optional fields are omitted gracefully by the frontend.

## Git Identity

When committing, use your bot's identity:
- show-kiro-aws: `kiro-bot@users.noreply.github.com` / `Kiro Bot`
- show-codex-aws: `codex-bot@users.noreply.github.com` / `Codex Bot`
- show-hermes-aws: `hermes-bot@users.noreply.github.com` / `Hermes Bot`
- OAB-Codex-AWS: `fisherivco@users.noreply.github.com` / `OAB-Codex-AWS`
- chi-kiro-aws: `ichitaiwan-rgb@users.noreply.github.com` / `Chi Kiro Bot`
- chi-codex-aws: `ichitaiwan-rgb@users.noreply.github.com` / `Chi Codex Bot`
- chi-hermes-aws: `ichitaiwan-rgb@users.noreply.github.com` / `Chi Hermes Bot`

## Security & Privacy

- **No personal info**: do not commit phone numbers, passport details, flight
  booking references, or hotel confirmation numbers
- **No secrets**: never commit tokens, passwords, or API keys
- **Public repo**: everything pushed is publicly visible
- **Operational docs** (`docs/booked-tickets.md`): may contain non-sensitive
  trip logistics only (flight times, hotel names, SIM card plans)

## How to Start Working

```bash
cd ~/singapore2026
git pull origin main          # always pull latest first
# ... make your edits to data/<category>.json ...
python3 -m json.tool data/<category>.json > /dev/null  # validate
git add data/<category>.json data/meta.json
git commit -m "data(<category>): 新增 N 筆項目"
git push origin main
```

## Coordination

- Multiple bots may work on different categories simultaneously
- Each bot owns its assigned category file — no cross-editing without permission
- If merge conflicts occur, `git pull --rebase` then retry
- Use GitHub Issues for task tracking (6 open issues, one per category)
- Check issues before starting work to see what's already been assigned/done

## Questions?

If you're unsure about anything, ask the user. Don't guess on data accuracy —
it's better to say "I couldn't verify this" than to push incorrect info that
the family might rely on during the trip.
<!-- private-repo-verify 1782900529 -->

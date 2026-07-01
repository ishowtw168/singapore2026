# singapore2026

新加坡旅遊行程收集練習 — Allen 一家 2026 新加坡家族旅遊資訊站

## 專案目的 / Purpose

本站彙整 Allen 一家 **2026-07-04 ~ 2026-07-09** 新加坡家族旅遊的實用資訊：交通、在地活動慶典、必吃美食、必玩景點、必買伴禮、更好的旅遊體驗。內容由多個 bot / 協作者持續蒐集並更新，網站本身為靜態頁面，透過 GitHub Pages 發布。

This is the trip-info site for Allen's family trip to Singapore, **2026-07-04 to 2026-07-09**. Content (transport, events, food, attractions, souvenirs, experiences) is collected and updated over time by multiple contributors/bots. The site is a static page served via GitHub Pages.

## 網站運作方式 / How the site works

- **零框架、零建置流程 (zero framework, zero build step)**: `index.html` + `assets/style.css` + `assets/app.js`（純 vanilla JS）。
- `assets/app.js` 在頁面載入時以 `fetch()` 讀取 `data/meta.json` 及六個分類 JSON 檔（`data/{transport,events,food,attractions,souvenirs,experiences}.json`），加上時間戳記作為 cache-buster。
- 使用 `Promise.allSettled`，單一分類檔案損毀或是空的都不會擋住其他分類渲染；失敗或空分類會顯示「資料收集中」的佔位提示。
- 透過 [GitHub Pages](https://pages.github.com/) 直接從 `main` 分支根目錄 (`/`) 發布，網址：`https://ishowtw168.github.io/singapore2026/`
- `.nojekyll` 檔案確保 GitHub Pages 不會用 Jekyll 處理本站，`data/*.json` 才能被當作純靜態檔案原樣提供。

## 資料更新規範 (for bots)

> 給負責蒐集/更新旅遊資訊的 bot 或協作者的規則。

### 檔案owner邊界 (file ownership boundary)

每個 bot 只可編輯自己負責的 **`data/<category>.json`** 檔案，`<category>` 為以下六者之一：

- `transport`（交通）
- `events`（在地活動慶典）
- `food`（必吃美食）
- `attractions`（必玩景點）
- `souvenirs`（必買伴禮）
- `experiences`（更好的旅遊體驗）

`data/meta.json`、`index.html`、`assets/` 為站台結構檔案，不由資料蒐集 bot 編輯（除非任務明確要求）。

### 每筆資料的 schema

每個 `data/<category>.json` 檔案格式：

```json
{
  "category": "food",
  "updated": "2026-07-01",
  "items": [
    {
      "id": "unique-slug-id",
      "en_name": "Example Name",
      "zh_name": "範例名稱",
      "zh_desc": "繁體中文描述，說明這個項目的重點與推薦原因。",
      "address": "123 Example Street, Singapore",
      "area": "Marina Bay",
      "price_zh": "約 S$10-15 / 人",
      "map_link": "https://maps.google.com/?q=...",
      "tags": ["親子友善", "在地推薦"],
      "source_url": "https://example.com/original-source"
    }
  ]
}
```

| 欄位 | 說明 | 語言規則 |
|------|------|----------|
| `id` | 該項目在此分類下的唯一識別字串（英文 slug） | 英文 |
| `en_name` | 英文名稱 | 英文 |
| `zh_name` | 中文名稱 | 繁體中文 |
| `zh_desc` | 中文描述 | **繁體中文** |
| `address` | 地址 | **英文**（方便導航 / 給計程車司機看） |
| `area` | 所在區域 | 可中英皆可，建議簡短 |
| `price_zh` | 價格說明 | 繁體中文 |
| `map_link` | Google Maps 或其他地圖連結 | URL |
| `tags` | 標籤陣列 | 建議繁體中文，簡短 |
| `source_url` | 原始資訊來源連結，供查證 | URL |

**語言規則重點**：`en_name` 與 `address` 維持英文；`zh_desc` 使用繁體中文。這是刻意設計，因為地址欄位主要用途是導航／給當地人看，中文描述則是給家人閱讀。

### 更新流程

1. 只編輯自己負責的 `data/<category>.json`，新增或修改 `items` 陣列中的項目。
2. **提交前務必驗證 JSON 格式**：

   ```bash
   python3 -m json.tool data/<category>.json > /dev/null && echo "JSON valid"
   ```

3. 更新該檔案內的 `"updated"` 欄位為當天日期（`YYYY-MM-DD`）。
4. 同時將 `data/meta.json` 的 `"last_updated"` 欄位更新為當天日期（若同一次提交有異動任何 `data/*.json`）。
5. Commit 訊息建議格式：`data(<category>): 新增/更新 N 筆項目`。
6. Push 到 `main` 分支即可，GitHub Pages 會自動重新部署（通常 1-2 分鐘內生效）。

### 注意事項

- 不要刪除既有項目，除非確認資訊已過時或錯誤——可標記或替換，但保留歷史脈絡（no-delete 原則）。
- 空的分類檔案（`"items": []`）是正常狀態，網站會顯示「資料收集中」佔位提示，不會報錯。
- 若不確定某欄位是否適用，可省略該欄位——前端只會渲染實際存在的欄位。

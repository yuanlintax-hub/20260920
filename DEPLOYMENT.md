# 豬事大吉！彰化豚肉節租稅彈珠挑戰賽 — 部署與設定手冊

本專案為完整可執行之全端繁體中文網頁遊戲，結合彰化豚肉節美食特色、租稅益智問答、物理彈珠台（具備豚寶磁力防卡機制）、宣導品兌換與工作人員後台統計管理系統。

---

## 專案核心架構與檔案清單

1. **前端遊戲畫面元件 (`src/components/`)**
   - `HomeScreen.tsx`：遊戲首頁（主標題、玩法說明、開始按鈕、音效切換、工作人員隱蔽入口）
   - `QuizScreen.tsx`：租稅問答介面（12秒計時提醒、非閃爍警示、立即回饋、黃金/普通彈珠獎勵）
   - `PinballCanvas.tsx`：HTML5 Canvas 物理彈珠台（碰撞、反彈、重力、肉圓/香腸/轉盤/彩虹門/幸運鈴/爌肉飯加倍區機關、3秒自動發射、8秒豚寶磁力防卡機制）
   - `PinballScreen.tsx`：彈珠台挑戰介面
   - `ResultScreen.tsx`：成果結算頁（答對題數、總分、4級稱號、4位數兌換碼輸入與防連點防護，無「再玩一次」按鈕）
   - `SuccessScreen.tsx`：全螢幕核銷成功頁（流水號、臺灣時區日期時間、大字體現場工作人員確認畫面）
   - `AdminModal.tsx`：工作人員密碼輸入彈窗（後端驗證，無密碼提示）
   - `AdminDashboard.tsx`：工作人員後台管理面板（累計人次、今日人次、最近時間、明細表、UTF-8 BOM CSV 匯出）
   - `PiggyMascot.tsx`：SVG 原生向量主廚豚寶吉祥物（多種姿態表情）

2. **題庫與邏輯 (`src/data/`, `src/utils/`, `src/types.ts`)**
   - `src/data/questions.ts`：完整 12 題租稅問答題庫（地價稅、房屋稅、身障用車免稅、電動車免牌照稅、雲端發票）及跨分類抽題演算法
   - `src/utils/audio.ts`：Web Audio API 原生音效合成器（按鈕、答對、答錯、拉桿、彈珠碰撞、幸運鈴、彩虹門、磁力、通關音效）
   - `src/types.ts`：全域 TypeScript 型別定義

3. **後端服務與安全性 (`server.ts`, `data/redemptions.json`)**
   - `server.ts`：Express 後端伺服器，集中驗證兌換碼（7777）與工作人員密碼（5566）、以 Asia/Taipei 臺灣時間紀錄兌換、提供 CSV 匯出及安全 Session Token 管理
   - 預設具備持續性檔案儲存 (`data/redemptions.json`)，即使無外部資料庫亦能跨裝置與重啟保留統計

4. **Firebase Firestore 雲端擴充設定（選填）**
   - `firebase-blueprint.json`：Firestore 資料綱要設計（redemptions 與 activity_metadata 集合）
   - `firestore.rules`：Firestore 雲端安全規則（禁止未授權讀寫，保障活動數據）

---

## 部署與環境變數設定

本系統開箱即用，已預先設定好正式活動規則。若您欲調整兌換碼或工作人員密碼，只需在 `.env` 或雲端服務環境變數（Environment Variables）中填入：

| 環境變數名稱 | 預設值 | 說明 |
| :--- | :--- | :--- |
| `REDEEM_CODE` | `7777` | 現場宣導品 4 位數兌換碼（由後端安全核銷） |
| `ADMIN_PASSWORD` | `5566` | 工作人員管理後台登入密碼（由後端安全驗證） |
| `PORT` | `3000` | 伺服器監聽連接埠（Cloud Run 容器標準埠） |
| `ADMIN_SESSION_SECRET` | `changhua_tax_pinball_2026` | 後台登入 Token 加密金鑰 |

---

## CSV 匯出格式說明

- **編碼**：UTF-8 with BOM (`\uFEFF`)，使用 Microsoft Excel、Numbers 或 Google 試算表開啟皆**保證不亂碼**。
- **檔名格式**：`彰化豚肉節_兌換統計_YYYYMMDD.csv`（例如：`彰化豚肉節_兌換統計_20260814.csv`）
- **欄位格式**：
  ```csv
  累計序號,兌換日期,兌換時間
  1,2026/08/14,10:25:36
  2,2026/08/14,10:27:08
  ```

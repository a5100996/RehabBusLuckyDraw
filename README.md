# 復康巴士抽獎系統

一個公平、透明的抽獎系統，支援 CSV 檔案上傳和隨機抽獎功能。

## 版本說明

### 完整版 (index.html)
- 需要 Node.js 後端伺服器
- 支援檔案上傳到伺服器
- 適合內部部署

### 純前端版 (standalone.html)
- 完全前端運作，無需後端
- 可直接部署到 GitHub Pages
- 支援瀏覽器本地檔案處理

## GitHub Pages 部署步驟

1. Fork 此專案到您的 GitHub 帳號
2. 進入專案設定 (Settings)
3. 找到 Pages 選項
4. 選擇 Source: Deploy from a branch
5. 選擇 Branch: main 或 master
6. 選擇 Folder: / (root)
7. 點擊 Save

部署完成後，訪問 `https://yourusername.github.io/yourrepository/public/standalone.html`

## 功能特色

- 🎲 Fisher-Yates 洗牌演算法確保公平性
- 📁 支援 CSV 檔案上傳
- 🎯 範例資料快速測試
- 📊 即時顯示參與者名單
- 📄 多種格式匯出 (CSV, TXT, 列印)
- 🔍 完整的演算法透明度說明
- 📱 響應式設計，支援行動裝置

## 使用方法

1. 開啟 `standalone.html`
2. 載入範例資料或上傳 CSV 檔案
3. 設定抽獎人數
4. 點擊開始抽獎
5. 匯出或列印結果

## CSV 檔案格式

檔案必須包含 `NAME` 或 `姓名` 欄位，其他欄位為選填：

```csv
NAME,ID,PHONE
張三,A123456789,0912345678
李四,B987654321,0987654321
```

## 技術說明

- 純 HTML/CSS/JavaScript
- 無需後端伺服器
- 本地檔案處理
- Fisher-Yates 演算法
- 密碼學安全隨機數

const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 3000;

// 設定檔案上傳
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    // 保持原始檔案名稱，並加上時間戳記避免衝突
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    cb(null, `${timestamp}_${originalName}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // 只接受CSV檔案
    if (
      file.mimetype === "text/csv" ||
      file.originalname.toLowerCase().endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new Error("只能上傳CSV檔案"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制檔案大小為10MB
  },
});

// 建立uploads資料夾
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// 設定靜態檔案目錄
app.use(express.static("public"));
app.use(express.json());

// 儲存所有人員資料
let allParticipants = [];
let currentFileName = "";

// 讀取CSV檔案
function loadParticipants(filePath) {
  return new Promise((resolve, reject) => {
    const participants = [];

    // 檢查檔案是否存在
    if (!fs.existsSync(filePath)) {
      reject(new Error("檔案不存在"));
      return;
    }

    fs.createReadStream(filePath, { encoding: "utf8" })
      .pipe(csv())
      .on("data", (row) => {
        // 直接使用CSV欄位名稱，處理可能的空白字元
        const nameKey = Object.keys(row).find(
          (key) => key.trim().toUpperCase() === "NAME"
        );
        const bindIdKey = Object.keys(row).find(
          (key) => key.trim().toUpperCase() === "BIND_ID"
        );
        const idKey = Object.keys(row).find(
          (key) => key.trim().toUpperCase() === "ID"
        );
        const idAllKey = Object.keys(row).find(
          (key) => key.trim().toUpperCase() === "IDALL"
        );
        const phoneKey = Object.keys(row).find(
          (key) => key.trim().toUpperCase() === "PHONE"
        );

        // 確保有姓名欄位且不為空
        if (nameKey && row[nameKey] && row[nameKey].trim() !== "") {
          participants.push({
            name: row[nameKey].trim(),
            bindId: bindIdKey ? (row[bindIdKey] || "").trim() : "",
            id: idKey ? (row[idKey] || "").trim() : "",
            idAll: idAllKey ? (row[idAllKey] || "").trim() : "",
            phone: phoneKey ? (row[phoneKey] || "無").trim() : "無",
            // 保留所有原始資料
            rawData: row,
          });
        }
      })
      .on("end", () => {
        console.log(`成功載入 ${participants.length} 位參與者`);
        resolve(participants);
      })
      .on("error", (error) => {
        console.error("讀取CSV檔案錯誤:", error);
        reject(error);
      });
  });
}

// 初始載入預設檔案（如果存在）
async function loadDefaultFile() {
  const defaultFile = path.join(__dirname, "同意名單.csv");
  if (fs.existsSync(defaultFile)) {
    try {
      allParticipants = await loadParticipants(defaultFile);
      currentFileName = "同意名單.csv";
    } catch (error) {
      console.log("預設檔案載入失敗，等待使用者上傳檔案");
      allParticipants = [];
    }
  }
}

// Fisher-Yates 洗牌演算法
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// API路由：取得所有參與者數量
app.get("/api/participants/count", (req, res) => {
  res.json({ count: allParticipants.length });
});

// API路由：取得所有參與者名單
app.get("/api/participants/list", (req, res) => {
  res.json({
    success: true,
    participants: allParticipants,
    count: allParticipants.length,
  });
});

// API路由：進行抽獎
app.post("/api/draw", (req, res) => {
  try {
    const { count = 50 } = req.body;

    if (count > allParticipants.length) {
      return res.status(400).json({
        error: `抽獎人數 (${count}) 不能超過總參與者人數 (${allParticipants.length})`,
      });
    }

    // 使用Fisher-Yates演算法隨機打亂陣列，然後取前N個
    const shuffled = shuffleArray(allParticipants);
    const winners = shuffled.slice(0, count);

    res.json({
      success: true,
      totalParticipants: allParticipants.length,
      drawCount: count,
      winners: winners,
      timestamp: new Date().toLocaleString("zh-TW"),
    });
  } catch (error) {
    console.error("抽獎錯誤:", error);
    res.status(500).json({ error: "抽獎過程發生錯誤" });
  }
});

// API路由：上傳CSV檔案
app.post("/api/upload", upload.single("csvFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "請選擇CSV檔案" });
    }

    const filePath = req.file.path;
    const originalName = Buffer.from(req.file.originalname, "latin1").toString(
      "utf8"
    );

    // 載入新的參與者資料
    allParticipants = await loadParticipants(filePath);
    currentFileName = originalName;

    res.json({
      success: true,
      message: `成功載入 ${allParticipants.length} 位參與者`,
      fileName: currentFileName,
      participantCount: allParticipants.length,
    });
  } catch (error) {
    console.error("檔案上傳錯誤:", error);
    res.status(500).json({
      error: "檔案載入失敗：" + error.message,
    });
  }
});

// API路由：取得目前檔案資訊和參與者數量
app.get("/api/participants/info", (req, res) => {
  res.json({
    count: allParticipants.length,
    fileName: currentFileName || "尚未載入檔案",
  });
});

// 首頁路由
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 啟動伺服器
async function startServer() {
  try {
    // 嘗試載入預設檔案
    await loadDefaultFile();

    app.listen(PORT, () => {
      console.log(`抽獎系統已啟動！`);
      console.log(`請開啟瀏覽器前往: http://localhost:${PORT}`);
      console.log(`目前參與者人數: ${allParticipants.length}`);
      if (currentFileName) {
        console.log(`載入的檔案: ${currentFileName}`);
      } else {
        console.log(`請上傳CSV檔案以開始抽獎`);
      }
    });
  } catch (error) {
    console.error("啟動伺服器失敗:", error);
    process.exit(1);
  }
}

startServer();

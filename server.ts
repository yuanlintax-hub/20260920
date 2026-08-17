import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

interface RedemptionRecord {
  serialNumber: number;
  date: string; // YYYY/MM/DD
  time: string; // HH:mm:ss
  timestamp: number; // UTC millis
}

interface ActivityStats {
  startTime: string;
  records: RedemptionRecord[];
}

const PORT = 3000;
const REDEEM_CODE = process.env.REDEEM_CODE || "7777";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "5566";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "changhua_tax_pinball_2026";

// File storage configuration
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "redemptions.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

// In-memory active admin tokens
const activeAdminTokens = new Set<string>();

// Ensure data and backup directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Helpers for Taipei Timezone (Asia/Taipei)
function getTaipeiDateTime(dateObj: Date = new Date()): { dateStr: string; timeStr: string; dateNumStr: string; monthStr: string } {
  // Format in Asia/Taipei
  const formatterDate = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const formatterTime = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const partsDate = formatterDate.formatToParts(dateObj);
  let year = "";
  let month = "";
  let day = "";
  for (const part of partsDate) {
    if (part.type === "year") year = part.value;
    if (part.type === "month") month = part.value;
    if (part.type === "day") day = part.value;
  }

  const partsTime = formatterTime.formatToParts(dateObj);
  let hour = "";
  let minute = "";
  let second = "";
  for (const part of partsTime) {
    if (part.type === "hour") hour = part.value;
    if (part.type === "minute") minute = part.value;
    if (part.type === "second") second = part.value;
  }

  const dateStr = `${year}/${month}/${day}`;
  const timeStr = `${hour}:${minute}:${second}`;
  const dateNumStr = `${year}${month}${day}`;
  const monthStr = `${year}_${month}`;

  return { dateStr, timeStr, dateNumStr, monthStr };
}

// Load or initialize activity stats with multi-file backup recovery
function loadStats(): ActivityStats {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.records)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[Storage] Error reading primary redemptions file, trying backups:", err);
  }

  // Attempt recovery from backup directory if primary file is missing/damaged
  try {
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json")).sort().reverse();
      if (files.length > 0) {
        const newestBackup = path.join(BACKUP_DIR, files[0]);
        console.log(`[Storage] Recovering data from newest backup: ${files[0]}`);
        const backupData = fs.readFileSync(newestBackup, "utf-8");
        const parsed = JSON.parse(backupData);
        if (parsed && Array.isArray(parsed.records)) {
          saveStats(parsed);
          return parsed;
        }
      }
    }
  } catch (backupErr) {
    console.error("[Storage] Error during backup recovery:", backupErr);
  }

  const initialTaipei = getTaipeiDateTime();
  const initialData: ActivityStats = {
    startTime: `${initialTaipei.dateStr} ${initialTaipei.timeStr}`,
    records: [],
  };
  saveStats(initialData);
  return initialData;
}

// Save activity stats to disk with atomic write and monthly/daily historical persistence (Retained 1 month+ guaranteed)
function saveStats(stats: ActivityStats): void {
  try {
    const jsonStr = JSON.stringify(stats, null, 2);
    
    // 1. Atomic write to main data file
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, jsonStr, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);

    // 2. Continuous Monthly Archive (Guarantees retention across months)
    const { monthStr, dateNumStr } = getTaipeiDateTime();
    const monthlyArchiveFile = path.join(DATA_DIR, `redemptions_${monthStr}.json`);
    fs.writeFileSync(monthlyArchiveFile, jsonStr, "utf-8");

    // 3. Daily Rolling Backup in /data/backups/
    const dailyBackupFile = path.join(BACKUP_DIR, `redemptions_backup_${dateNumStr}.json`);
    fs.writeFileSync(dailyBackupFile, jsonStr, "utf-8");
  } catch (err) {
    console.error("[Storage] Error saving redemptions data file:", err);
  }
}

// Helper to verify admin token
function verifyAdminToken(req: express.Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.substring(7);
  return activeAdminTokens.has(token);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Ensure persistent data is loaded
  const statsState = loadStats();

  // API 1: Verify redemption code and record redemption
  app.post("/api/redeem", (req, res) => {
    const { code } = req.body;

    if (!code || typeof code !== "string" || code.trim().length !== 4) {
      return res.status(400).json({
        success: false,
        error: "兌換碼不正確，請洽現場工作人員。",
      });
    }

    // Backend verification against authoritative code
    if (code.trim() !== REDEEM_CODE) {
      return res.status(400).json({
        success: false,
        error: "兌換碼不正確，請洽現場工作人員。",
      });
    }

    try {
      const now = new Date();
      const { dateStr, timeStr } = getTaipeiDateTime(now);
      
      const newSerialNumber = statsState.records.length + 1;
      const record: RedemptionRecord = {
        serialNumber: newSerialNumber,
        date: dateStr,
        time: timeStr,
        timestamp: now.getTime(),
      };

      statsState.records.push(record);
      saveStats(statsState);

      return res.json({
        success: true,
        serialNumber: record.serialNumber,
        date: record.date,
        time: record.time,
        timestamp: record.timestamp,
      });
    } catch (error) {
      console.error("Redemption write failure:", error);
      return res.status(500).json({
        success: false,
        error: "系統暫時無法完成兌換，請洽現場工作人員。",
      });
    }
  });

  // API 1.5: Quick Staff Count Endpoint (Protected by password 5566 or token)
  app.post("/api/redemptions/count", (req, res) => {
    const { password } = req.body || {};
    const authHeader = req.headers.authorization;
    let authorized = false;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (activeAdminTokens.has(token)) authorized = true;
    }
    if (password === ADMIN_PASSWORD) {
      authorized = true;
    }

    if (!authorized) {
      return res.status(401).json({
        success: false,
        error: "工作人員密碼錯誤，請重新輸入。",
      });
    }

    const { dateStr: todayTaipeiDate } = getTaipeiDateTime();
    const totalRedemptions = statsState.records.length;
    const todayRecords = statsState.records.filter((r) => r.date === todayTaipeiDate);
    const todayRedemptions = todayRecords.length;
    const lastRecord = statsState.records.length > 0 ? statsState.records[statsState.records.length - 1] : null;

    return res.json({
      success: true,
      totalRedemptions,
      todayRedemptions,
      lastRedemptionTime: lastRecord ? `${lastRecord.date} ${lastRecord.time}` : "尚無紀錄",
      statsStartTime: statsState.startTime,
    });
  });

  // API 1.6: Reset / Clear Redemption Records (Protected by password 5566 or token)
  app.post("/api/redemptions/reset", (req, res) => {
    const { password } = req.body || {};
    const authHeader = req.headers.authorization;
    let authorized = false;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (activeAdminTokens.has(token)) authorized = true;
    }
    if (password === ADMIN_PASSWORD) {
      authorized = true;
    }

    if (!authorized) {
      return res.status(401).json({
        success: false,
        error: "工作人員密碼錯誤，無法清除紀錄。",
      });
    }

    try {
      // Clear records and update start time
      const { dateStr, timeStr } = getTaipeiDateTime();
      statsState.records = [];
      statsState.startTime = `${dateStr} ${timeStr}`;
      saveStats(statsState);

      console.log(`[Storage] Redemption records cleared by staff at ${statsState.startTime}`);

      return res.json({
        success: true,
        message: "兌換紀錄已成功清除重置為 0 筆",
        totalRedemptions: 0,
        todayRedemptions: 0,
        lastRedemptionTime: "尚無紀錄",
        statsStartTime: statsState.startTime,
        records: [],
      });
    } catch (error) {
      console.error("[Storage] Failed to clear redemption records:", error);
      return res.status(500).json({
        success: false,
        error: "清除紀錄時發生伺服器異常",
      });
    }
  });

  app.get("/api/redemptions/count", (req, res) => {
    const password = req.query.password as string;
    const authHeader = req.headers.authorization;
    let authorized = false;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (activeAdminTokens.has(token)) authorized = true;
    }
    if (password === ADMIN_PASSWORD) {
      authorized = true;
    }

    if (!authorized) {
      return res.status(401).json({
        success: false,
        error: "工作人員密碼錯誤，請重新輸入。",
      });
    }

    const { dateStr: todayTaipeiDate } = getTaipeiDateTime();
    const totalRedemptions = statsState.records.length;
    const todayRecords = statsState.records.filter((r) => r.date === todayTaipeiDate);
    const todayRedemptions = todayRecords.length;
    const lastRecord = statsState.records.length > 0 ? statsState.records[statsState.records.length - 1] : null;

    return res.json({
      success: true,
      totalRedemptions,
      todayRedemptions,
      lastRedemptionTime: lastRecord ? `${lastRecord.date} ${lastRecord.time}` : "尚無紀錄",
      statsStartTime: statsState.startTime,
    });
  });

  // API 2: Admin Login
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;

    if (!password || typeof password !== "string" || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: "密碼錯誤，請重新輸入。",
      });
    }

    // Generate secure session token
    const token = crypto.randomBytes(24).toString("hex");
    activeAdminTokens.add(token);

    return res.json({
      success: true,
      token,
    });
  });

  // API 3: Admin Logout
  app.post("/api/admin/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      activeAdminTokens.delete(token);
    }
    return res.json({ success: true });
  });

  // API 4: Get Admin Stats
  app.get("/api/admin/stats", (req, res) => {
    if (!verifyAdminToken(req)) {
      return res.status(401).json({
        success: false,
        error: "未授權存取，請先登入後台。",
      });
    }

    const { dateStr: todayTaipeiDate } = getTaipeiDateTime();
    const totalRedemptions = statsState.records.length;
    
    // Calculate today's redemptions in Asia/Taipei
    const todayRecords = statsState.records.filter((r) => r.date === todayTaipeiDate);
    const todayRedemptions = todayRecords.length;

    const lastRecord = statsState.records.length > 0 ? statsState.records[statsState.records.length - 1] : null;
    const lastRedemptionTime = lastRecord ? `${lastRecord.date} ${lastRecord.time}` : "尚無兌換";

    return res.json({
      success: true,
      totalRedemptions,
      todayRedemptions,
      lastRedemptionTime,
      statsStartTime: statsState.startTime,
      records: statsState.records,
    });
  });

  // API 5: Export CSV (UTF-8 with BOM for Excel compatibility)
  app.get("/api/admin/export-csv", (req, res) => {
    if (!verifyAdminToken(req)) {
      return res.status(401).json({
        success: false,
        error: "未授權存取，請先登入後台。",
      });
    }

    if (statsState.records.length === 0) {
      return res.status(400).json({
        success: false,
        error: "目前尚無兌換紀錄",
      });
    }

    const { dateNumStr } = getTaipeiDateTime();
    const filename = `彰化豚肉節_兌換統計_${dateNumStr}.csv`;

    // UTF-8 BOM
    const BOM = "\uFEFF";
    let csvContent = BOM + "累計序號,兌換日期,兌換時間\r\n";

    // Sorted by chronological order (1 to N)
    for (const record of statsState.records) {
      csvContent += `${record.serialNumber},${record.date},${record.time}\r\n`;
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    return res.send(csvContent);
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Changhua Pork Tax Pinball Server" });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Changhua Pork Tax Pinball running on http://localhost:${PORT}`);
  });
}

startServer();

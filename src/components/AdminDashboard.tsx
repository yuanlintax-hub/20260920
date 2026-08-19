import React, { useState, useEffect, useCallback, useMemo } from "react";
import { soundManager } from "../utils/audio";
import { fetchCloudStats, clearAllCloudStats } from "../utils/firebase";
import {
  Users,
  CalendarDays,
  Clock,
  Download,
  LogOut,
  RefreshCw,
  Award,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Database,
  Search,
  Filter,
  Trash2,
  Gamepad2,
} from "lucide-react";
import { AdminStatsData } from "../types";

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
}

type TimeFilterOption = "ALL" | "30DAYS" | "7DAYS" | "TODAY";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  onLogout,
}) => {
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data);
          return;
        } else {
          if (res.status === 401) {
            onLogout();
            return;
          }
        }
      }
      throw new Error("API not available");
    } catch {
      // Cloud Firestore cross-device fallback
      try {
        const cloudData = await fetchCloudStats();
        setStats({
          success: true,
          totalPlays: cloudData.totalPlays,
          todayPlays: cloudData.todayPlays,
          totalRedemptions: cloudData.totalRedemptions,
          todayRedemptions: cloudData.todayRedemptions,
          lastRedemptionTime: cloudData.lastRedemptionTime,
          statsStartTime: "雲端資料庫即時同步",
          records: cloudData.records || [],
        });
      } catch {
        setStats({
          success: true,
          totalPlays: 0,
          todayPlays: 0,
          totalRedemptions: 0,
          todayRedemptions: 0,
          lastRedemptionTime: "尚無紀錄",
          statsStartTime: "雲端連線異常",
          records: [],
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Filter records based on selected time window and search keyword
  const filteredRecords = useMemo(() => {
    if (!stats || !stats.records) return [];

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * oneDayMs;
    const sevenDaysMs = 7 * oneDayMs;

    return stats.records.filter((r) => {
      // 1. Time range filter
      if (timeFilter === "30DAYS") {
        if (now - r.timestamp > thirtyDaysMs) return false;
      } else if (timeFilter === "7DAYS") {
        if (now - r.timestamp > sevenDaysMs) return false;
      } else if (timeFilter === "TODAY") {
        // match today date
        const todayDate = stats.records[stats.records.length - 1]?.date;
        if (todayDate && r.date !== todayDate) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesSerial = r.serialNumber.toString().includes(query);
        const matchesDate = r.date.toLowerCase().includes(query);
        const matchesTime = r.time.toLowerCase().includes(query);
        if (!matchesSerial && !matchesDate && !matchesTime) return false;
      }

      return true;
    });
  }, [stats, timeFilter, searchQuery]);

  const handleExportCSV = async () => {
    if (!stats || stats.records.length === 0 || isExporting) return;

    soundManager.playClick();
    setIsExporting(true);

    try {
      const res = await fetch("/api/admin/export-csv", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const blob = await res.blob();
        const disposition = res.headers.get("Content-Disposition");
        let filename = "彰化豚肉節_兌換統計.csv";
        if (disposition && disposition.includes("filename=")) {
          const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            filename = decodeURIComponent(match[1].replace(/['"]/g, ""));
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      }
      throw new Error("API export not available");
    } catch {
      // Fallback CSV export on client side
      try {
        const records = stats.records;
        const csvRows = [
          "序號,日期,時間,兌換時間戳記",
          ...records.map(
            (r) => `${r.serialNumber},${r.date},${r.time},${r.timestamp}`
          ),
        ];
        const csvContent = "\uFEFF" + csvRows.join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `彰化豚肉節_兌換明細_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch {
        alert("匯出過程發生錯誤，請稍後再試。");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearRecords = async () => {
    const confirmed = window.confirm(
      "【清除紀錄警告】\n確定要清空雲端所有紀錄嗎？\n清除後跨裝置累計遊玩人次、兌換總數與今日數值將全部歸零重新計算。"
    );
    if (!confirmed) return;

    soundManager.playClick();
    setIsLoading(true);
    try {
      await clearAllCloudStats();
      soundManager.playCorrect();
      alert("已成功清除所有跨裝置紀錄！");
      fetchStats();
    } catch {
      alert("清除失敗，請檢查網路連線。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    soundManager.playClick();
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {}
    onLogout();
  };

  return (
    <div className="flex flex-col min-h-screen w-full max-w-4xl mx-auto px-4 py-6 select-none bg-[#FEF3C7] pig-bg">
      {/* Container Box with Editorial Border */}
      <div className="w-full bg-white rounded-3xl border-4 border-[#78350F] shadow-2xl p-6 space-y-6">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b-2 border-amber-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#DC2626] text-white">
                <Award className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#78350F]">
                活動工作人員管理後台
              </h1>
            </div>
            <p className="text-xs text-[#B45309] font-bold mt-1">
              豬事大吉！彰化豚肉節租稅彈珠挑戰賽 ‧ 即時兌換核銷統計
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              id="refresh-stats-btn"
              onClick={() => {
                soundManager.playClick();
                fetchStats();
              }}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-white border-2 border-[#78350F] hover:bg-amber-50 text-[#78350F] text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>重新整理</span>
            </button>

            <button
              id="clear-stats-btn"
              onClick={handleClearRecords}
              disabled={isLoading || !stats || stats.records.length === 0}
              className="px-3.5 py-2 rounded-xl bg-rose-50 border-2 border-rose-300 hover:bg-rose-100 disabled:opacity-50 text-rose-700 text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="清除所有兌換紀錄（歸零）"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>清除兌換紀錄</span>
            </button>

            <button
              id="admin-logout-btn"
              onClick={handleLogoutClick}
              className="px-3.5 py-2 rounded-xl bg-slate-100 border-2 border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>登出後台</span>
            </button>
          </div>
        </header>

        {/* 1-Month Retention Guarantee Banner */}
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-emerald-900">
                  資料保存機制：保留 1 個月以上（永久安全儲存）
                </span>
                <span className="bg-emerald-200 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                  安全備份運作中
                </span>
              </div>
              <p className="text-xs text-emerald-800/90 font-medium mt-0.5">
                宣導品兌換明細表具備磁碟持久化存檔、每日自動滾動備份與跨月封存檔，確保至少保留 1 個月以上的完整稽核明細。
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="space-y-6">
          {/* Error notice */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Stats Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Game Plays */}
            <div className="bg-sky-50 p-4 rounded-2xl border-2 border-sky-300 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-sky-900 mb-1.5">
                <span className="text-xs font-black">累計遊玩人次</span>
                <Gamepad2 className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-3xl font-black text-sky-900 font-mono">
                {stats ? (stats.totalPlays ?? 0) : "..."}
                <span className="text-xs text-sky-700 font-sans font-bold ml-1">人次</span>
              </div>
              <span className="text-[10px] text-sky-600 font-bold mt-1">跨手機/電腦即時同步</span>
            </div>

            {/* Today Game Plays */}
            <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-300 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-900 mb-1.5">
                <span className="text-xs font-black">今日遊玩人次</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-blue-900 font-mono">
                {stats ? (stats.todayPlays ?? 0) : "..."}
                <span className="text-xs text-blue-700 font-sans font-bold ml-1">人次</span>
              </div>
              <span className="text-[10px] text-blue-600 font-bold mt-1">今日挑戰關卡次數</span>
            </div>

            {/* Total Redemptions */}
            <div className="bg-[#FEF3C7] p-4 rounded-2xl border-2 border-[#78350F] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#78350F] mb-1.5">
                <span className="text-xs font-black">累計兌換人次</span>
                <Award className="w-4 h-4 text-[#DC2626]" />
              </div>
              <div className="text-3xl font-black text-[#DC2626] font-mono">
                {stats ? stats.totalRedemptions : "..."}
                <span className="text-xs text-[#78350F] font-sans font-bold ml-1">人次</span>
              </div>
              <span className="text-[10px] text-[#B45309] font-bold mt-1">現場已核銷總數</span>
            </div>

            {/* Today Redemptions */}
            <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-300 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-900 mb-1.5">
                <span className="text-xs font-black">今日兌換人次</span>
                <CalendarDays className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-800 font-mono">
                {stats ? stats.todayRedemptions : "..."}
                <span className="text-xs text-emerald-600 font-sans font-bold ml-1">人次</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold mt-1">
                最新: {stats?.lastRedemptionTime || "尚無紀錄"}
              </span>
            </div>
          </div>

          {/* Detailed Records Section with Filters & Export Button */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#FEF3C7]/40">
              <div>
                <h2 className="text-base font-black text-[#78350F] flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>宣導品兌換紀錄明細表</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  顯示 {filteredRecords.length} / 共 {stats?.records.length || 0} 筆有效兌換紀錄（依兌換時間排序）
                </p>
              </div>

              {/* CSV Export Button */}
              <button
                id="export-csv-btn"
                onClick={handleExportCSV}
                disabled={!stats || stats.records.length === 0 || isExporting}
                className="px-4 py-2.5 rounded-xl btn-editorial-emerald disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer focus:outline-none shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? "匯出中..." : "📥 匯出活動統計CSV (含完整明細)"}</span>
              </button>
            </div>

            {/* Filter Controls Toolbar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Range Tabs */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
                  <Filter className="w-3.5 h-3.5 text-[#B45309]" />
                  區間：
                </span>
                <button
                  type="button"
                  onClick={() => setTimeFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeFilter === "ALL"
                      ? "bg-[#78350F] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  全部紀錄
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter("30DAYS")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeFilter === "30DAYS"
                      ? "bg-[#78350F] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  近 30 天 (1個月)
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter("7DAYS")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeFilter === "7DAYS"
                      ? "bg-[#78350F] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  近 7 天
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter("TODAY")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeFilter === "TODAY"
                      ? "bg-[#78350F] text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  今日
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋序號或日期..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#78350F]"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-amber-50 text-[#78350F] font-black border-b border-slate-200 sticky top-0 z-10 shadow-xs">
                  <tr>
                    <th className="px-5 py-3">累計序號</th>
                    <th className="px-5 py-3">兌換日期 (YYYY/MM/DD)</th>
                    <th className="px-5 py-3">兌換時間 (HH:mm:ss 臺灣時間)</th>
                    <th className="px-5 py-3 text-right">資料狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((r) => (
                      <tr key={r.serialNumber} className="hover:bg-amber-50/50 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-[#78350F]">
                          #{r.serialNumber}
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-700">
                          {r.date}
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-700">
                          {r.time}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            已核銷存檔
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-400 font-medium">
                        {stats && stats.records.length > 0
                          ? "沒有符合篩選條件的兌換紀錄"
                          : "目前尚無兌換紀錄"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>彰化縣地方稅務局 ‧ 活動後台管理系統</span>
          <span className="text-[11px] text-slate-400 font-mono">
            資料保存庫：/data/redemptions.json + /data/backups
          </span>
        </footer>
      </div>
    </div>
  );
};



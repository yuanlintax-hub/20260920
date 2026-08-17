import React, { useState } from "react";
import { soundManager } from "../utils/audio";
import { Shield, Lock, X, AlertCircle, Loader2 } from "lucide-react";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isLoading) return;

    soundManager.playClick();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        setPassword("");
        onLoginSuccess(data.token);
      } else {
        soundManager.playIncorrect();
        setErrorMessage(data.error || "密碼錯誤，請重新輸入。");
      }
    } catch (err) {
      soundManager.playIncorrect();
      setErrorMessage("網路連線異常，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border-4 border-[#78350F] p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="關閉"
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#78350F] text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 id="admin-login-title" className="text-lg font-black text-[#78350F]">
              工作人員後台登入
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              請輸入管理密碼進入活動統計後台
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-password-input"
              className="block text-xs font-bold text-[#78350F] mb-1.5"
            >
              工作人員密碼
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password-input"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                disabled={isLoading}
                placeholder="請輸入管理密碼"
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#DC2626] focus:bg-white transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              id="admin-login-error"
              role="alert"
              className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="admin-login-submit-btn"
            type="submit"
            disabled={!password || isLoading}
            className="w-full py-3 btn-editorial-red rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>登入驗證中...</span>
              </>
            ) : (
              <span>登入管理後台</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};


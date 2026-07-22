import React, { useState } from "react";
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  User, 
  Loader2, 
  UserCheck 
} from "lucide-react";

interface UserType {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER";
}

interface LoginScreenProps {
  users: UserType[];
  onLoginSuccess: (user: UserType) => void;
  onRegisterSuccess: (user: UserType) => void;
  showToast: (msg: string, isError?: boolean) => void;
}

export default function LoginScreen({ users, onLoginSuccess, onRegisterSuccess, showToast }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Login fields (Defaults set to requested Keio user for easy testing)
  const [loginEmail, setLoginEmail] = useState("webpro2026@keio.jp");
  const [loginPassword, setLoginPassword] = useState("webpro");
  
  // Register fields
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<"STUDENT" | "TEACHER">("STUDENT");

  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast("メールアドレスとパスワードを入力してください。", true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      
      if (res.ok && data.user) {
        showToast(`${data.user.name} としてログインしました。`);
        onLoginSuccess(data.user);
      } else {
        showToast(data.error || "ログインに失敗しました。", true);
      }
    } catch (err) {
      console.error(err);
      showToast("サーバーとの通信に失敗しました。", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) {
      showToast("すべての項目を入力してください。", true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          role: registerRole,
          password: registerPassword
        })
      });
      const data = await res.json();

      if (res.ok && data.user) {
        showToast(`登録が完了しました。${data.user.name} としてログインします。`);
        onRegisterSuccess(data.user);
      } else {
        showToast(data.error || "登録に失敗しました。", true);
      }
    } catch (err) {
      console.error(err);
      showToast("サーバーとの通信に失敗しました。", true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md">
        {/* Brand/Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="bg-indigo-600 p-3.5 rounded-2xl text-white shadow-xl shadow-indigo-600/20 mb-4 animate-bounce-slow">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Keio WebPro LMS</h1>
          <p className="text-xs text-slate-400 mt-1.5">慶應義塾大学 授業支援・課題管理システム</p>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-800/80 p-1 rounded-xl flex mb-6 border border-slate-700/60 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === "login"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === "register"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            新規登録
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl shadow-2xl backdrop-blur-md p-6 sm:p-8">
          {activeTab === "login" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">ユーザーID (メールアドレス)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="webpro2026@keio.jp"
                    className="w-full bg-slate-900/60 border border-slate-700/80 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">パスワード</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="webpro"
                    className="w-full bg-slate-900/60 border border-slate-700/80 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/30 active:scale-[0.99] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                <span>ログイン</span>
              </button>


            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">氏名</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="福澤 諭吉"
                    className="w-full bg-slate-900/60 border border-slate-700/80 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">メールアドレス</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="example@keio.jp"
                    className="w-full bg-slate-900/60 border border-slate-700/80 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">パスワード</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="任意のパスワード"
                    className="w-full bg-slate-900/60 border border-slate-700/80 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">区分（ロール）</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegisterRole("STUDENT")}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                      registerRole === "STUDENT"
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                        : "bg-slate-900/30 border-slate-800 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    学生 (STUDENT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterRole("TEACHER")}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                      registerRole === "TEACHER"
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                        : "bg-slate-900/30 border-slate-800 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    教員 (TEACHER)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/30 active:scale-[0.99] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer mt-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                <span>アカウント作成</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

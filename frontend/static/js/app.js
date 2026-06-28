import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Shield, Bug, AlertTriangle, Play, CheckCircle, 
  Terminal, History as HistoryIcon, LayoutDashboard, Settings as SettingsIcon, 
  LogOut, Plus, Moon, Sun, Download, FileText, 
  Github, GitPullRequest, Code, ArrowRight, User, Key, Info, HelpCircle, Loader2
} from 'lucide-react';

const API_BASE = "/api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [currentView, setCurrentView] = useState(token ? "dashboard" : "login");
  const [darkMode, setDarkMode] = useState(true);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [message, setMessage] = useState(null);

  // Sync token and user to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, [token, user]);

  // Sync dark mode class
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [darkMode]);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    setCurrentView("login");
    showMessage("Logged out successfully.");
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-darkbg-200 text-slate-800 dark:text-slate-200">
      {/* Toast Alert */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-xl border shadow-lg animate-fade-in ${
          message.type === "error" 
            ? "bg-red-500/10 border-red-500/30 text-red-500" 
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        }`}>
          <Info className="w-5 h-5 mr-2" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Sidebar (Only when authenticated) */}
      {token && (
        <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg glow-btn">
              CRB
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight text-white">Review Bot</h1>
              <span className="text-xs text-slate-400">AI Code Reviewer</span>
            </div>
          </div>

          <nav className="flex-grow p-4 space-y-1">
            <button 
              onClick={() => setCurrentView("dashboard")} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                currentView === "dashboard" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button 
              onClick={() => setCurrentView("new-review")} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                currentView === "new-review" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Code className="w-4 h-4" /> New Review
            </button>
            <button 
              onClick={() => setCurrentView("history")} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                currentView === "history" || currentView === "review-details" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <HistoryIcon className="w-4 h-4" /> Review History
            </button>
            <button 
              onClick={() => setCurrentView("github-integrator")} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                currentView === "github-integrator" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Github className="w-4 h-4" /> GitHub Integration
            </button>
            <button 
              onClick={() => setCurrentView("settings")} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                currentView === "settings" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <SettingsIcon className="w-4 h-4" /> Settings
            </button>
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <div className="truncate w-28">
                <p className="text-xs font-semibold truncate text-white">{user?.username}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col p-6 overflow-y-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {currentView === "dashboard" && "Dashboard"}
              {currentView === "new-review" && "AI Code Review Panel"}
              {currentView === "history" && "Code Review Archives"}
              {currentView === "review-details" && "Code Review Report Details"}
              {currentView === "github-integrator" && "GitHub Integration & PR Automation"}
              {currentView === "settings" && "System Configuration"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentView === "dashboard" && "Overview of repository security and code health"}
              {currentView === "new-review" && "Paste code or upload files for multi-dimensional AI review"}
              {currentView === "history" && "Browse past reviews, scores, and downloadable PDF reports"}
              {currentView === "review-details" && "Detailed breakdown of bugs, security threats, and suggestions"}
              {currentView === "github-integrator" && "Connect repositories and set up webhooks for PR code reviews"}
              {currentView === "settings" && "Configure models, database secrets, and toggle theme modes"}
            </p>
          </div>

          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-yellow-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        {/* View Component Renderers */}
        <div className="flex-grow flex flex-col">
          {currentView === "login" && <AuthView setToken={setToken} setUser={setUser} setCurrentView={setCurrentView} showMessage={showMessage} />}
          {currentView === "dashboard" && <DashboardView token={token} setCurrentView={setCurrentView} setSelectedReviewId={setSelectedReviewId} />}
          {currentView === "new-review" && <NewReviewView token={token} setCurrentView={setCurrentView} setSelectedReviewId={setSelectedReviewId} showMessage={showMessage} />}
          {currentView === "history" && <HistoryView token={token} setCurrentView={setCurrentView} setSelectedReviewId={setSelectedReviewId} showMessage={showMessage} />}
          {currentView === "review-details" && <ReviewDetailsView token={token} reviewId={selectedReviewId} setCurrentView={setCurrentView} showMessage={showMessage} />}
          {currentView === "github-integrator" && <GithubIntegratorView token={token} showMessage={showMessage} />}
          {currentView === "settings" && <SettingsView darkMode={darkMode} setDarkMode={setDarkMode} user={user} />}
        </div>
      </main>
    </div>
  );
}


// --- COMPONENTS & SUB-VIEWS ---

// 1. Authentication View (Login/Register)
function AuthView({ setToken, setUser, setCurrentView, showMessage }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { username, password } : { username, email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        showMessage(data.message || "Welcome!");
        setCurrentView("dashboard");
      } else {
        showMessage(data.message || "Authentication failed.", "error");
      }
    } catch (err) {
      showMessage("Server connection failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12">
      <div className="w-full max-w-md glass-card p-8 rounded-2xl shadow-xl animate-fade-in border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-white text-2xl shadow-lg glow-btn mb-4">
            CRB
          </div>
          <h2 className="text-2xl font-bold dark:text-white">LLM Code Review Bot</h2>
          <p className="text-xs text-slate-400">Automated Code Quality & Security Architect</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
          <button 
            type="button" 
            onClick={() => setIsLogin(true)} 
            className={`w-1/2 py-2 rounded-lg text-sm font-medium transition-all ${isLogin ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm" : "text-slate-500"}`}
          >
            Login
          </button>
          <button 
            type="button" 
            onClick={() => setIsLogin(false)} 
            className={`w-1/2 py-2 rounded-lg text-sm font-medium transition-all ${!isLogin ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm" : "text-slate-500"}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-400">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-sm" 
                placeholder="developer_johndoe" 
                required 
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">Email Address</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-sm" 
                  placeholder="johndoe@example.com" 
                  required 
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-400">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-sm" 
                placeholder="••••••••••••" 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
          </button>
        </form>
      </div>
    </div>
  );
}


// 2. Dashboard View
function DashboardView({ token, setCurrentView, setSelectedReviewId }) {
  const [stats, setStats] = useState({ totalReviews: 0, avgScore: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0 });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatsAndReviews = async () => {
      try {
        const res = await fetch(`${API_BASE}/reviews`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReviews(data.slice(0, 5)); // Show latest 5 reviews
          
          if (data.length > 0) {
            const sumScore = data.reduce((acc, curr) => acc + curr.score, 0);
            
            // Fetch issue counts for each review to calculate summary metrics
            let totalHigh = 0;
            let totalMed = 0;
            let totalLow = 0;
            
            // Loop through latest reviews to aggregate statistics
            for (let r of data) {
              const detailsRes = await fetch(`${API_BASE}/reviews/${r.id}`, {
                headers: { "Authorization": `Bearer ${token}` }
              });
              if (detailsRes.ok) {
                const details = await detailsRes.json();
                const issues = details.issues || [];
                totalHigh += issues.filter(i => i.severity === "High").length;
                totalMed += issues.filter(i => i.severity === "Medium").length;
                totalLow += issues.filter(i => i.severity === "Low").length;
              }
            }

            setStats({
              totalReviews: data.length,
              avgScore: Math.round(sumScore / data.length),
              highIssues: totalHigh,
              mediumIssues: totalMed,
              lowIssues: totalLow
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatsAndReviews();
  }, [token]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl shadow-sm border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Total Reviews</p>
            <h3 className="text-2xl font-bold dark:text-white">{stats.totalReviews}</h3>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl shadow-sm border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Avg Quality Score</p>
            <h3 className="text-2xl font-bold dark:text-white">{stats.avgScore} <span className="text-xs font-normal text-slate-400">/ 100</span></h3>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl shadow-sm border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">High Security Risks</p>
            <h3 className="text-2xl font-bold dark:text-white">{stats.highIssues}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Reviews */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl shadow-sm border flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold dark:text-white">Recent Reviews</h3>
            <button 
              onClick={() => setCurrentView("history")} 
              className="text-xs text-blue-500 hover:text-blue-400 font-medium flex items-center gap-1"
            >
              See All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-grow space-y-3">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Code className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p className="text-xs">No code reviews submitted yet.</p>
                <button 
                  onClick={() => setCurrentView("new-review")} 
                  className="mt-3 text-xs px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                >
                  Start First Review
                </button>
              </div>
            ) : (
              reviews.map((r) => {
                const isGood = r.score >= 85;
                const isWarning = r.score >= 60 && r.score < 85;
                return (
                  <div 
                    key={r.id} 
                    onClick={() => { setSelectedReviewId(r.id); setCurrentView("review-details"); }}
                    className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-500/50 dark:hover:border-blue-500/30 hover:bg-slate-100/30 transition-all hover-lift"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        {r.repo_name ? <Github className="w-3.5 h-3.5 text-slate-400" /> : <FileText className="w-3.5 h-3.5 text-slate-400" />}
                        {r.repo_name ? `${r.repo_name} (PR #${r.pr_number})` : `Snippet #${r.id}`}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Submitted at: {new Date(r.created_at).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isGood 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : (isWarning ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400")
                      }`}>
                        Score: {r.score}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Code Quality Breakdown */}
        <div className="glass-card p-6 rounded-2xl shadow-sm border">
          <h3 className="text-sm font-semibold mb-4 dark:text-white">Issues Severity Density</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-rose-500 font-medium">Critical (High)</span>
                <span className="text-slate-400">{stats.highIssues}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.totalReviews ? Math.min(100, (stats.highIssues / (stats.highIssues + stats.mediumIssues + stats.lowIssues || 1)) * 100) : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-500 font-medium">Warning (Medium)</span>
                <span className="text-slate-400">{stats.mediumIssues}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.totalReviews ? Math.min(100, (stats.mediumIssues / (stats.highIssues + stats.mediumIssues + stats.lowIssues || 1)) * 100) : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-500 font-medium">Best Practice (Low)</span>
                <span className="text-slate-400">{stats.lowIssues}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.totalReviews ? Math.min(100, (stats.lowIssues / (stats.highIssues + stats.mediumIssues + stats.lowIssues || 1)) * 100) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-blue-400">Security Checkups</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Integrate GitHub PR reviews to automatically run security scans on every patch commit.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// 3. New Review View
function NewReviewView({ token, setCurrentView, setSelectedReviewId, showMessage }) {
  const [activeTab, setActiveTab] = useState("paste"); // "paste" or "upload"
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Python");
  const [filename, setFilename] = useState("code_snippet.py");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmitPaste = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      showMessage("Please paste some source code to review.", "error");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/reviews/paste`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ code, language, filename })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("Review completed!");
        setSelectedReviewId(data.review_id);
        setCurrentView("review-details");
      } else {
        showMessage(data.message || "Failed to submit code.", "error");
      }
    } catch (err) {
      showMessage("Server error.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFile = async (e) => {
    e.preventDefault();
    if (!file) {
      showMessage("Please select a file to upload.", "error");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);

    try {
      const res = await fetch(`${API_BASE}/reviews/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("File review completed!");
        setSelectedReviewId(data.review_id);
        setCurrentView("review-details");
      } else {
        showMessage(data.message || "Failed to review file.", "error");
      }
    } catch (err) {
      showMessage("Server error.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl shadow-sm border max-w-4xl mx-auto w-full animate-fade-in flex flex-col flex-grow">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 self-start">
        <button 
          onClick={() => setActiveTab("paste")} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === "paste" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm" : "text-slate-500"}`}
        >
          Paste Code Snippet
        </button>
        <button 
          onClick={() => setActiveTab("upload")} 
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === "upload" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm" : "text-slate-500"}`}
        >
          Upload Source File
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-400">Programming Language</label>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)} 
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="Python">Python</option>
            <option value="JavaScript">JavaScript</option>
            <option value="TypeScript">TypeScript</option>
            <option value="HTML">HTML</option>
            <option value="CSS">CSS</option>
            <option value="C++">C++</option>
            <option value="Java">Java</option>
            <option value="Go">Go</option>
          </select>
        </div>

        {activeTab === "paste" && (
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-400">File Name (Optional)</label>
            <input 
              type="text" 
              value={filename} 
              onChange={(e) => setFilename(e.target.value)} 
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-blue-500"
              placeholder="index.py"
            />
          </div>
        )}
      </div>

      {activeTab === "paste" ? (
        <form onSubmit={handleSubmitPaste} className="flex-grow flex flex-col space-y-4">
          <div className="flex-grow flex flex-col">
            <label className="block text-xs font-semibold mb-1 text-slate-400">Source Code</label>
            <textarea 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              className="flex-grow min-h-[300px] w-full p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs focus:outline-none border border-slate-800 focus:border-blue-500/50 resize-y"
              placeholder="# Paste your code here...&#10;def buggy_function(user_input):&#10;    query = 'SELECT * FROM users WHERE name = ' + user_input&#10;    return db.execute(query)"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto self-end px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Submit for AI Review
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmitFile} className="space-y-6">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center hover:border-blue-500 transition-all flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/20">
            <FileText className="w-12 h-12 text-slate-400 mb-3" />
            <span className="text-sm font-semibold mb-1 block">
              {file ? file.name : "Select your source code file"}
            </span>
            <span className="text-xs text-slate-400 block mb-4">Supported: .py, .js, .ts, .html, .css, .cpp, .java, .go</span>
            
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files[0])} 
              className="hidden" 
              id="file-upload-input" 
            />
            <label 
              htmlFor="file-upload-input" 
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold cursor-pointer border dark:border-slate-700 transition-colors"
            >
              Choose File
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto self-end px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Analyze File
          </button>
        </form>
      )}
    </div>
  );
}


// 4. Review History View
function HistoryView({ token, setCurrentView, setSelectedReviewId, showMessage }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_BASE}/reviews`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (err) {
        showMessage("Failed to load history.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [token]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl shadow-sm border animate-fade-in flex-grow">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400">
              <th className="py-3 px-4 font-semibold text-xs uppercase">Review ID</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase">Source</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase">Score</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase">Created At</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-12 text-slate-400 text-xs">
                  No code reviews found.
                </td>
              </tr>
            ) : (
              reviews.map((r) => {
                const scoreColor = r.score >= 85 ? "text-emerald-400" : (r.score >= 60 ? "text-amber-400" : "text-rose-500");
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-4 font-medium">#{r.id}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {r.repo_name ? <Github className="w-4 h-4 text-slate-400" /> : <FileText className="w-4 h-4 text-slate-400" />}
                        <span>{r.repo_name ? `${r.repo_name} (PR #${r.pr_number})` : "Pasted Code"}</span>
                      </div>
                    </td>
                    <td className={`py-4 px-4 font-bold ${scoreColor}`}>{r.score} / 100</td>
                    <td className="py-4 px-4 text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => { setSelectedReviewId(r.id); setCurrentView("review-details"); }}
                        className="text-xs px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 font-semibold rounded-lg transition-colors mr-2"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// 5. Review Details View
function ReviewDetailsView({ token, reviewId, setCurrentView, showMessage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIssueIndex, setActiveIssueIndex] = useState(0);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const detailData = await res.json();
          setData(detailData);
        } else {
          showMessage("Failed to retrieve review details.", "error");
          setCurrentView("history");
        }
      } catch (err) {
        showMessage("Server connection issue.", "error");
      } finally {
        setLoading(false);
      }
    };
    if (reviewId) fetchDetails();
  }, [reviewId, token]);

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}/pdf`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `review_report_${reviewId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        showMessage("PDF download failed.", "error");
      }
    } catch (err) {
      showMessage("Error fetching PDF.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const { review, issues } = data;
  const scoreColor = review.score >= 85 ? "text-emerald-400 border-emerald-500/30" : (review.score >= 60 ? "text-amber-400 border-amber-500/30" : "text-rose-500 border-rose-500/30");
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <button 
          onClick={() => setCurrentView("history")} 
          className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-semibold transition-colors border dark:border-slate-700"
        >
          &larr; Back to History
        </button>

        <button 
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
        >
          <Download className="w-4 h-4" /> Download PDF Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Score & High Level Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-2xl shadow-sm border text-center flex flex-col items-center justify-center">
            <h3 className="text-xs uppercase font-semibold text-slate-400 mb-4">Quality Score</h3>
            <div className={`w-32 h-32 rounded-full border-[8px] flex items-center justify-center mb-4 ${scoreColor} shadow-inner`}>
              <div className="text-3xl font-extrabold">{review.score}</div>
            </div>
            <p className="text-xs text-slate-400">Overall code quality rating</p>
          </div>

          <div className="glass-card p-6 rounded-2xl shadow-sm border">
            <h3 className="text-xs uppercase font-semibold text-slate-400 mb-2">Architect's Summary</h3>
            <div className="text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
              {review.summary}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Issue List and Fix Explanations */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl shadow-sm border flex flex-col">
          <h3 className="text-sm font-semibold mb-4 dark:text-white">Flagged Issues ({issues.length})</h3>

          {issues.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-xs font-medium">Perfect! No issues flagged by GPT-4o.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
              {/* Left Column of Inner Grid: Issue List */}
              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                {issues.map((issue, idx) => {
                  const isActive = idx === activeIssueIndex;
                  const sevColor = issue.severity === "High" 
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-500" 
                    : (issue.severity === "Medium" ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-blue-500/10 border-blue-500/30 text-blue-400");
                  
                  return (
                    <div 
                      key={issue.id}
                      onClick={() => setActiveIssueIndex(idx)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all flex items-start gap-2.5 hover-lift ${
                        isActive 
                          ? "bg-blue-600/10 border-blue-500/50 shadow-sm" 
                          : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/50"
                      }`}
                    >
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase mt-0.5 ${sevColor}`}>
                        {issue.severity}
                      </span>
                      <div className="truncate">
                        <h4 className="text-xs font-semibold truncate dark:text-white">{issue.file_path}</h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">Line {issue.line_number || "Global"} | {issue.category}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column of Inner Grid: Active Issue Details */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border dark:border-slate-700/60 rounded-2xl max-h-[450px] overflow-y-auto space-y-4">
                {issues[activeIssueIndex] && (
                  <>
                    <div>
                      <h4 className="text-xs uppercase font-bold text-slate-400 mb-1">Issue Category</h4>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {issues[activeIssueIndex].category} (Line {issues[activeIssueIndex].line_number || "Global"})
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs uppercase font-bold text-slate-400 mb-1">Detailed Explanation</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {issues[activeIssueIndex].explanation}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs uppercase font-bold text-slate-400 mb-1">Suggested Fix</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border dark:border-slate-800">
                        {issues[activeIssueIndex].suggested_fix}
                      </p>
                    </div>

                    {issues[activeIssueIndex].improved_code && (
                      <div>
                        <h4 className="text-xs uppercase font-bold text-slate-400 mb-1">Refactored Code</h4>
                        <pre className="text-[10px] bg-slate-950 text-slate-200 p-3 rounded-lg overflow-x-auto border border-slate-800 leading-relaxed font-mono max-h-48">
                          <code>{issues[activeIssueIndex].improved_code}</code>
                        </pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// 6. GitHub Integrator View
function GithubIntegratorView({ token, showMessage }) {
  const [repoName, setRepoName] = useState("");
  const [githubRepoId, setGithubRepoId] = useState("");
  const [repos, setRepos] = useState([]);
  const [webhookInfo, setWebhookInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRepos = async () => {
    try {
      const res = await fetch(`${API_BASE}/github/repos`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRepos(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, [token]);

  const handleIntegrate = async (e) => {
    e.preventDefault();
    if (!repoName.trim()) {
      showMessage("Please enter a repository name.", "error");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/github/repos/integrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          repo_name: repoName,
          github_repo_id: githubRepoId ? parseInt(githubRepoId) : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("Repository integrated successfully!");
        setWebhookInfo({
          webhookUrl: `${window.location.origin}/api/github/webhook`,
          secret: data.webhook_secret
        });
        setRepoName("");
        setGithubRepoId("");
        fetchRepos();
      } else {
        showMessage(data.message || "Integration failed.", "error");
      }
    } catch (err) {
      showMessage("Server error.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Left Columns: Integration Form and Instructions */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card p-6 rounded-2xl shadow-sm border">
          <h3 className="text-sm font-semibold mb-4 dark:text-white flex items-center gap-2">
            <Github className="w-5 h-5" /> Integrate New Repository
          </h3>

          <form onSubmit={handleIntegrate} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">Repository Name (Owner/Repo)</label>
              <input 
                type="text" 
                value={repoName} 
                onChange={(e) => setRepoName(e.target.value)} 
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-blue-500"
                placeholder="octocat/hello-world"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">GitHub Repository ID (Optional)</label>
              <input 
                type="number" 
                value={githubRepoId} 
                onChange={(e) => setGithubRepoId(e.target.value)} 
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-blue-500"
                placeholder="1296269"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="md:col-span-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Generate Webhook Settings
            </button>
          </form>
        </div>

        {webhookInfo && (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 space-y-4 animate-fade-in">
            <h4 className="text-xs font-bold uppercase text-blue-400">Configure Webhook in GitHub</h4>
            <p className="text-xs">Go to your GitHub repository settings &rarr; **Webhooks** &rarr; **Add Webhook** and copy these inputs:</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Payload URL</label>
                <div className="p-2.5 bg-slate-950 rounded-lg text-xs font-mono select-all truncate border border-slate-800">
                  {webhookInfo.webhookUrl}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Content Type</label>
                <div className="p-2.5 bg-slate-950 rounded-lg text-xs font-mono border border-slate-800">
                  application/json
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Secret</label>
                <div className="p-2.5 bg-slate-950 rounded-lg text-xs font-mono select-all border border-slate-800 text-emerald-400">
                  {webhookInfo.secret}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Which events trigger this webhook?</label>
                <div className="text-xs mt-1">Select **"Let me select individual events"** and check **Pull Requests**.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Integrated Repos */}
      <div className="glass-card p-6 rounded-2xl shadow-sm border">
        <h3 className="text-sm font-semibold mb-4 dark:text-white">Active Integrations</h3>
        
        <div className="space-y-3">
          {repos.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No integrated repositories.
            </div>
          ) : (
            repos.map((r) => (
              <div 
                key={r.id}
                className="p-3 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2 truncate">
                  <GitPullRequest className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-xs font-semibold truncate dark:text-white">{r.repo_name}</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Listening for PR webhooks"></span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


// 7. Settings View
function SettingsView({ darkMode, setDarkMode, user }) {
  return (
    <div className="glass-card p-6 rounded-2xl shadow-sm border max-w-2xl mx-auto w-full animate-fade-in space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2 dark:text-white">Profile Information</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-700">
            <span className="text-slate-400 block mb-0.5">Username</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.username}</span>
          </div>
          <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-700">
            <span className="text-slate-400 block mb-0.5">Email</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.email}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2 dark:text-white">Theme & UI Options</h3>
        <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs">
            {darkMode ? <Moon className="w-4 h-4 text-yellow-400" /> : <Sun className="w-4 h-4 text-slate-400" />}
            <div>
              <span className="font-semibold block">Dark Mode Theme</span>
              <span className="text-slate-400 text-[10px]">Toggles dark background colors</span>
            </div>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Toggle Theme
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2 dark:text-white">System Configuration</h3>
        <div className="p-4 bg-blue-600/5 border border-blue-500/10 rounded-xl text-xs space-y-2 text-slate-500">
          <p className="font-semibold text-blue-400">RAG Standard Engine: Active</p>
          <p>The vector indexing table matches PEP8 and OWASP guidelines dynamically for incoming code files. All reviews run through GPT-4o by default.</p>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);

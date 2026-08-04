"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Loader2,
  FileText,
  Users,
  HardDrive,
  Trash2,
  Search,
  ArrowLeft,
  CheckCircle,
  LayoutDashboard,
  Server,
  Settings,
  AlertCircle,
  XCircle,
  Clock,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/db/supabase";
import { toast } from "sonner";
import { getFileIcon } from "@/lib/helpers/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  GEMINI_MODEL_LITE,
  GEMINI_MODEL_TTS,
  GEMINI_MODEL_LIVE,
} from "@/lib/config/constants";

type AdminTab = "overview" | "documents" | "users" | "system";

export default function AdminDashboard() {
  const { isLoaded, userId, getToken } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [search, setSearch] = useState("");
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const [envStatus, setEnvStatus] = useState({
    clerkPublishable: false,
    clerkSecret: false,
    supabaseUrl: false,
    supabaseAnonKey: false,
    geminiApiKey: false,
  });

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const adminIdsStr = process.env.NEXT_PUBLIC_ADMIN_USER_IDS || "";
    const adminIds = adminIdsStr.split(",").map((id) => id.trim());

    if (adminIds.includes(userId)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
      setIsLoading(false);
    }

    setEnvStatus({
      clerkPublishable: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
      clerkSecret: true,
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      geminiApiKey: Boolean(process.env.NEXT_PUBLIC_ADMIN_USER_IDS),
    });
  }, [isLoaded, userId]);

  useEffect(() => {
    if (isAdmin !== true) return;

    const fetchAllData = async () => {
      setIsLoading(true);
      const startTime = performance.now();
      try {
        let token = null;
        try {
          token = await getToken({ template: "Supabase" });
        } catch (authErr) {
          console.warn("Clerk Supabase token fetch failed:", authErr);
        }

        const supabaseClient = getSupabaseClient(token || "");
        
        const { data, error } = await supabaseClient
          .from("documents")
          .select("*")
          .order("created_at", { ascending: false });

        const endTime = performance.now();
        setLatency(Math.round(endTime - startTime));

        if (error) {
          console.error("Failed to fetch documents:", error);
          setDbConnected(false);
          toast.error("Database connection failed.");
        } else {
          setDocs(data || []);
          setDbConnected(true);
        }
      } catch (err) {
        console.error(err);
        setDbConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [isAdmin]);

  const handleDeleteDoc = async (docId: string, docName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${docName}" from the system?`)) {
      return;
    }

    try {
      let token = null;
      try {
        token = await getToken({ template: "Supabase" });
      } catch (authErr) {
        console.warn(authErr);
      }

      const supabaseClient = getSupabaseClient(token || "");
      const { error } = await supabaseClient
        .from("documents")
        .delete()
        .eq("id", docId);

      if (error) throw error;

      toast.success(`Successfully deleted "${docName}"`);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete document.");
    }
  };

  const handleWipeUserData = async (targetUserId: string) => {
    if (!window.confirm(`WARNING: This will permanently delete ALL documents owned by User "${targetUserId}". Proceed?`)) {
      return;
    }

    try {
      let token = null;
      try {
        token = await getToken({ template: "Supabase" });
      } catch (authErr) {
        console.warn(authErr);
      }

      const supabaseClient = getSupabaseClient(token || "");
      const { error } = await supabaseClient
        .from("documents")
        .delete()
        .eq("user_id", targetUserId);

      if (error) throw error;

      toast.success(`Successfully wiped all data for user ${targetUserId}`);
      setDocs((prev) => prev.filter((d) => d.user_id !== targetUserId));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to wipe user data.");
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "N/A";
    return new Date(isoStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalDocs = docs.length;
  const uniqueUsers = new Set(docs.map((d) => d.user_id)).size;
  const totalStorage = docs.reduce((acc, d) => acc + (d.raw_size || 0), 0);

  const userStatsMap = docs.reduce((acc: Record<string, { count: number; size: number }>, d) => {
    if (!acc[d.user_id]) {
      acc[d.user_id] = { count: 0, size: 0 };
    }
    acc[d.user_id].count += 1;
    acc[d.user_id].size += d.raw_size || 0;
    return acc;
  }, {});

  const userStatsList = Object.entries(userStatsMap).map(([uid, stats]) => ({
    userId: uid,
    count: stats.count,
    size: stats.size,
  })).sort((a, b) => b.size - a.size);

  const filteredDocs = docs.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.user_id.toLowerCase().includes(search.toLowerCase()),
  );

  if (!isLoaded || (isAdmin === null && isLoading)) {
    return (
      <div className="min-h-screen bg-[#f9f7f4] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm font-bold text-foreground/60">Verifying authorization...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[#f9f7f4] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white border border-[#eae6df] rounded-3xl p-8 space-y-6 shadow-xl"
        >
          <div className="h-16 w-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading font-black text-2xl text-foreground">Access Denied</h1>
            <p className="text-sm text-foreground/60 font-semibold leading-relaxed">
              This area is restricted to administrators. Your account does not have authorization to view this resource.
            </p>
          </div>
          <Button
            onClick={() => router.push("/")}
            className="w-full rounded-2xl font-bold py-3 cursor-pointer shadow-md shadow-primary/20 hover:scale-[1.01] transition-transform"
          >
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f7f4] flex relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-125 h-125 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-150 h-150 rounded-full bg-violet-400/4 blur-[130px] pointer-events-none" />

      <main className="flex-1 flex flex-col overflow-auto min-w-0 relative z-10 p-4 md:p-8 max-w-6xl w-full mx-auto space-y-8 md:space-y-10 mt-14 md:mt-0">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-[#eae6df]/60 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-heading font-black text-foreground leading-tight tracking-tight flex items-center gap-2">
              <span className="shiny-text animate-shine text-primary font-black">Admin Console</span>
            </h1>
            <p className="text-sm text-foreground/60 font-medium">
              Professional system monitoring, configuration checks, and database management.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="rounded-2xl font-bold cursor-pointer text-xs flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#eae6df] shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Button>
        </div>

        <div className="flex border-b border-[#eae6df] gap-6 text-sm font-bold text-foreground/50 overflow-x-auto select-none">
          {(
            [
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "documents", label: "Documents Explorer", icon: FileText },
              { id: "users", label: "User Quotas", icon: Users },
              { id: "system", label: "System Health & Keys", icon: Server },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap px-1 ${
                  isActive
                    ? "border-primary text-primary font-black scale-102"
                    : "border-transparent hover:text-foreground/80"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="min-h-100">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white border border-[#eae6df] rounded-3xl p-6 flex items-center gap-4 shadow-xs">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Indexed Files</span>
                      <span className="font-heading font-black text-2xl text-foreground mt-0.5 block">{totalDocs}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#eae6df] rounded-3xl p-6 flex items-center gap-4 shadow-xs">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Registered Users</span>
                      <span className="font-heading font-black text-2xl text-foreground mt-0.5 block">{uniqueUsers}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#eae6df] rounded-3xl p-6 flex items-center gap-4 shadow-xs">
                    <div className="h-12 w-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                      <HardDrive className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Storage Capacity</span>
                      <span className="font-heading font-black text-lg text-foreground mt-0.5 block truncate max-w-37.5">
                        {formatSize(totalStorage)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#eae6df] rounded-3xl p-6 flex items-center gap-4 shadow-xs">
                    <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider block">Query Latency</span>
                      <span className="font-heading font-black text-2xl text-foreground mt-0.5 block">
                        {latency !== null ? `${latency}ms` : "checking..."}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  <div className="bg-white border border-[#eae6df] rounded-3xl p-6 space-y-6 shadow-xs">
                    <h3 className="font-heading font-black text-md text-foreground flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-violet-600" />
                      <span>Storage Quota Share by User</span>
                    </h3>

                    {userStatsList.length === 0 ? (
                      <p className="text-xs text-foreground/45 font-semibold text-center py-10">No active storage consumers.</p>
                    ) : (
                      <div className="space-y-4">
                        {userStatsList.slice(0, 5).map((user) => {
                          const percentage = totalStorage > 0 ? (user.size / totalStorage) * 100 : 0;
                          return (
                            <div key={user.userId} className="space-y-1.5">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-foreground/60 font-mono truncate max-w-50">{user.userId}</span>
                                <span className="text-foreground">{formatSize(user.size)} ({percentage.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-violet-500 h-full rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-[#eae6df] rounded-3xl p-6 space-y-6 shadow-xs">
                    <h3 className="font-heading font-black text-md text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>Document Distribution by User</span>
                    </h3>

                    {userStatsList.length === 0 ? (
                      <p className="text-xs text-foreground/45 font-semibold text-center py-10">No indexed documents found.</p>
                    ) : (
                      <div className="space-y-4">
                        {userStatsList.slice(0, 5).map((user) => {
                          const percentage = totalDocs > 0 ? (user.count / totalDocs) * 100 : 0;
                          return (
                            <div key={user.userId} className="space-y-1.5">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-foreground/60 font-mono truncate max-w-50">{user.userId}</span>
                                <span className="text-foreground">{user.count} Files ({percentage.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-primary h-full rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {activeTab === "documents" && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="font-heading font-black text-lg text-foreground">Global Document Explorer</h3>
                  
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" />
                    <input
                      type="text"
                      placeholder="Search file name or user ID..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full text-xs bg-white border border-[#eae6df] rounded-xl pl-9 pr-3 py-2 font-semibold text-foreground focus:outline-none focus:border-primary transition-all shadow-xs"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-20 bg-white border border-[#eae6df] rounded-3xl">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-[#eae6df] rounded-3xl p-6">
                    <FileText className="h-10 w-10 text-foreground/20 mx-auto mb-2" />
                    <h4 className="font-heading font-black text-sm text-foreground">No matching documents</h4>
                    <p className="text-xs text-foreground/40 font-semibold mt-1">Try adapting your search query.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-[#eae6df] rounded-3xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#eae6df] bg-[#f9f7f4]/60 font-black text-foreground/60">
                            <th className="p-4 pl-6">Document Name</th>
                            <th className="p-4">Owner User ID</th>
                            <th className="p-4">Size</th>
                            <th className="p-4">Uploaded</th>
                            <th className="p-4 pr-6 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eae6df]/60 font-semibold text-foreground/80">
                           {filteredDocs.map((doc) => {
                             const FileIcon = getFileIcon(doc.name);
                             return (
                               <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                                 <td className="p-4 pl-6 font-bold truncate max-w-45 flex items-center gap-2" title={doc.name}>
                                   <FileIcon className="h-4 w-4 text-foreground/40 shrink-0" />
                                   <span className="truncate">{doc.name}</span>
                                 </td>
                              <td className="p-4 font-mono text-[10px] text-foreground/60 truncate max-w-30" title={doc.user_id}>
                                {doc.user_id}
                              </td>
                              <td className="p-4 text-foreground/75">
                                {formatSize(doc.raw_size)}
                              </td>
                              <td className="p-4 text-foreground/50">
                                {formatDate(doc.created_at)}
                              </td>
                              <td className="p-4 pr-6 text-center">
                                <button
                                  onClick={() => handleDeleteDoc(doc.id, doc.name)}
                                  className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all cursor-pointer"
                                  title="Delete globally"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                           )})}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-black text-lg text-foreground">User Document Quotas & Storage</h3>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-20 bg-white border border-[#eae6df] rounded-3xl">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : userStatsList.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-[#eae6df] rounded-3xl p-6 text-foreground/30 font-bold text-xs">
                    No active user data found.
                  </div>
                ) : (
                  <div className="bg-white border border-[#eae6df] rounded-3xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#eae6df] bg-[#f9f7f4]/60 font-black text-foreground/60">
                            <th className="p-4 pl-6">Clerk User ID</th>
                            <th className="p-4">Indexed Documents</th>
                            <th className="p-4">Cumulative Storage</th>
                            <th className="p-4 pr-6 text-center">Wipe Data</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eae6df]/60 font-semibold text-foreground/80">
                          {userStatsList.map(({ userId, count, size }) => (
                            <tr key={userId} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 pl-6 font-mono text-[10px] text-foreground/60 truncate max-w-40" title={userId}>
                                {userId}
                              </td>
                              <td className="p-4 font-bold text-primary">
                                {count} Documents
                              </td>
                              <td className="p-4 text-foreground/80 font-bold">
                                {formatSize(size)}
                              </td>
                              <td className="p-4 pr-6 text-center">
                                <button
                                  onClick={() => handleWipeUserData(userId)}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all cursor-pointer font-bold text-[10px] inline-flex items-center gap-1"
                                  title="Wipe user directory"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Wipe All
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "system" && (
              <motion.div
                key="system"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="bg-white border border-[#eae6df] rounded-3xl p-6 space-y-6 shadow-xs">
                  <h3 className="font-heading font-black text-md text-foreground flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    <span>API Configuration Status</span>
                  </h3>

                  <div className="space-y-4">
                    {[
                      { name: "Clerk Publishable Key", status: envStatus.clerkPublishable },
                      { name: "Clerk Secret Key", status: envStatus.clerkSecret },
                      { name: "Supabase Public URL", status: envStatus.supabaseUrl },
                      { name: "Supabase Anon Key", status: envStatus.supabaseAnonKey },
                      { name: "Gemini API Key Configuration", status: envStatus.geminiApiKey },
                    ].map((keyItem) => (
                      <div key={keyItem.name} className="flex items-center justify-between border-b border-[#eae6df]/40 pb-3">
                        <span className="text-xs font-bold text-foreground/70">{keyItem.name}</span>
                        <span className="text-xs font-bold">
                          {keyItem.status ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" /> Configured
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1">
                              <XCircle className="h-4 w-4" /> Missing
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#eae6df] rounded-3xl p-6 space-y-6 shadow-xs">
                  <h3 className="font-heading font-black text-md text-foreground flex items-center gap-2">
                    <Settings className="h-4 w-4 text-indigo-600" />
                    <span>DocMind System Settings</span>
                  </h3>

                  <div className="space-y-4 text-xs font-bold text-foreground/75 leading-relaxed">
                    <div className="space-y-1">
                      <span className="text-[10px] text-foreground/45 uppercase tracking-wider block">Default RAG Model</span>
                      <span className="font-black text-foreground">{GEMINI_MODEL_LITE}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-foreground/45 uppercase tracking-wider block">Audio Synthesis Model</span>
                      <span className="font-black text-foreground">{GEMINI_MODEL_TTS}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-foreground/45 uppercase tracking-wider block">Gemini Live Client Engine</span>
                      <span className="font-black text-foreground text-[10px] font-mono">
                        {GEMINI_MODEL_LIVE}
                      </span>
                    </div>

                    <div className="space-y-1 border-t border-[#eae6df]/40 pt-4">
                      <span className="text-[10px] text-foreground/45 uppercase tracking-wider block">API Latency Status</span>
                      <span className="text-foreground/60">
                        Supabase RTT was measured at{" "}
                        <strong className="text-primary font-black">{latency !== null ? `${latency}ms` : "calculating..."}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>
    </div>
  );
}

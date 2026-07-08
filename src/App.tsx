import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  MessageSquare,
  HelpCircle,
  Plus,
  Search,
  User,
  ShieldAlert,
  Send,
  CornerDownRight,
  ExternalLink,
  MapPin,
  Mail,
  AlertTriangle,
  FileText,
  Bookmark,
  ChevronRight,
  Trash2,
  Download
} from "lucide-react";

// Types
interface UserType {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER";
}

interface LectureMaterialType {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileName?: string | null;
  week: number;
  teacherName?: string | null;
  createdAt: string;
}

interface CourseType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  syllabusUrl: string | null;
  classroom: string | null;
  teacherContact: string | null;
  teacherId: string | null;
  isEnrolled: boolean;
  enrollmentCount: number;
}

interface AssignmentType {
  id: number;
  title: string;
  description: string | null;
  courseId: number;
  isManual: boolean;
  userId: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  deadline: string;
  isCompleted: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
  course: {
    name: string;
    code: string;
  };
}

interface ChatMessageType {
  id: number;
  courseId: number;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

interface ContactType {
  id: number;
  courseId: number;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  reply: string | null;
  createdAt: string;
}

export default function App() {
  // State variables
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [assignments, setAssignments] = useState<AssignmentType[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([]);
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [materials, setMaterials] = useState<LectureMaterialType[]>([]);
  
  // UI Interaction States
  const [activeTab, setActiveTab] = useState<"dashboard" | "courses" | "course-detail">("dashboard");
  const [courseDetailTab, setCourseDetailTab] = useState<"info" | "materials" | "chat" | "contact">("info");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoding, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form States
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: "",
    name: "",
    description: "",
    syllabusUrl: "",
    classroom: "",
    teacherContact: "",
  });

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    courseId: "",
    isManual: true,
    priority: "MEDIUM" as "HIGH" | "MEDIUM" | "LOW",
    deadline: "",
    fileUrl: "",
    fileName: "",
  });

  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    fileUrl: "",
    fileName: "",
    week: 1,
    teacherName: "",
  });

  const [uploading, setUploading] = useState(false);

  const [newMessage, setNewMessage] = useState("");
  const [newInquiry, setNewInquiry] = useState({ subject: "", message: "" });
  const [replyText, setReplyText] = useState<Record<number, string>>({});

  // Fetch initial users list and set a default
  useEffect(() => {
    fetchUsers();
  }, []);

  // Whenever current user changes, reload dashboard and courses
  useEffect(() => {
    if (currentUser) {
      fetchDashboard();
      fetchCourses();
      if (selectedCourse) {
        // Refresh detail course info to update enrollment status
        const updated = courses.find((c) => c.id === selectedCourse.id);
        if (updated) {
          setSelectedCourse(updated);
        } else {
          setSelectedCourse(null);
          setActiveTab("dashboard");
        }
      }
    }
  }, [currentUser]);

  // Handle selected course sub-data loading
  useEffect(() => {
    if (selectedCourse && currentUser) {
      if (courseDetailTab === "chat" && currentUser.role === "STUDENT") {
        fetchChats(selectedCourse.id);
      } else if (courseDetailTab === "contact") {
        fetchContacts(selectedCourse.id);
      } else if (courseDetailTab === "materials" || courseDetailTab === "info") {
        fetchMaterials(selectedCourse.id);
      }
    }
  }, [selectedCourse, courseDetailTab, currentUser]);

  // Helper for requests with header auth
  const getHeaders = () => {
    return {
      "Content-Type": "application/json",
      "x-user-id": currentUser?.id || "",
    };
  };

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // API calls
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
      if (data.length > 0) {
        // Default to student Alice
        const defaultUser = data.find((u: UserType) => u.id === "student-1") || data[0];
        setCurrentUser(defaultUser);
      }
    } catch (err) {
      console.error(err);
      showToast("ユーザーリストの取得に失敗しました", true);
    }
  };

  const fetchDashboard = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard", { headers: getHeaders() });
      if (!res.ok) throw new Error("Dashboard fetch failed");
      const data = await res.json();
      setAssignments(data.assignments);
    } catch (err) {
      console.error(err);
      showToast("ダッシュボードデータの取得に失敗しました", true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses", { headers: getHeaders() });
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error(err);
      showToast("講義一覧の取得に失敗しました", true);
    }
  };

  const handleEnroll = async (courseId: number) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error();
      showToast("履修登録が完了しました！");
      await fetchCourses();
      await fetchDashboard();
    } catch (err) {
      showToast("履修登録に失敗しました", true);
    }
  };

  const handleUnenroll = async (courseId: number) => {
    if (!confirm("本当にこの授業の履修登録を解除しますか？（追加した手動課題やチャットは維持されます）")) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error();
      showToast("履修登録を解除しました");
      await fetchCourses();
      await fetchDashboard();
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
        setActiveTab("dashboard");
      }
    } catch (err) {
      showToast("履修登録解除に失敗しました", true);
    }
  };

  const handleToggleAssignment = async (id: number) => {
    try {
      const res = await fetch(`/api/assignments/${id}/toggle`, {
        method: "POST",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      // Update locally
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isCompleted: data.isCompleted } : a))
      );
      showToast(data.isCompleted ? "課題を完了にしました！ 🎉" : "課題を未完了に戻しました");
    } catch (err) {
      showToast("課題のステータス更新に失敗しました", true);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newCourse),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "授業の作成に失敗しました", true);
        return;
      }
      showToast("新規授業が共有データベースに登録されました！");
      setShowAddCourseModal(false);
      setNewCourse({
        code: "",
        name: "",
        description: "",
        syllabusUrl: "",
        classroom: "",
        teacherContact: "",
      });
      await fetchCourses();
    } catch (err) {
      showToast("通信エラーが発生しました", true);
    }
  };

  const handleFileUpload = async (file: File, onUploadSuccess: (url: string, name: string) => void) => {
    if (!currentUser) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-user-id": currentUser.id,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "アップロードに失敗しました", true);
        return;
      }

      showToast(`ファイル「${data.fileName}」をアップロードしました！`);
      onUploadSuccess(data.fileUrl, data.fileName);
    } catch (err) {
      showToast("ファイルのアップロード中にエラーが発生しました", true);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ...newTask,
          isManual: currentUser?.role === "STUDENT" ? true : false, // Students create manual, Teachers create official
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "課題の追加に失敗しました", true);
        return;
      }
      showToast(currentUser?.role === "STUDENT" ? "手動課題を追加しました！" : "公式課題を配信しました！");
      setShowAddTaskModal(false);
      setNewTask({
        title: "",
        description: "",
        courseId: "",
        isManual: true,
        priority: "MEDIUM",
        deadline: "",
        fileUrl: "",
        fileName: "",
      });
      await fetchDashboard();
    } catch (err) {
      showToast("通信エラーが発生しました", true);
    }
  };

  const fetchChats = async (courseId: number) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/chats`, { headers: getHeaders() });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error);
      }
      const data = await res.json();
      setChatMessages(data);
    } catch (err: any) {
      setChatMessages([]);
      showToast(err.message || "チャットメッセージの取得に失敗しました", true);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newMessage.trim()) return;

    try {
      const res = await fetch(`/api/courses/${selectedCourse.id}/chats`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ message: newMessage }),
      });
      if (!res.ok) throw new Error();
      setNewMessage("");
      fetchChats(selectedCourse.id);
    } catch (err) {
      showToast("メッセージの送信に失敗しました", true);
    }
  };

  const fetchContacts = async (courseId: number) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/contacts`, { headers: getHeaders() });
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      showToast("問い合わせの取得に失敗しました", true);
    }
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newInquiry.subject.trim() || !newInquiry.message.trim()) return;

    try {
      const res = await fetch(`/api/courses/${selectedCourse.id}/contacts`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newInquiry),
      });
      if (!res.ok) throw new Error();
      setNewInquiry({ subject: "", message: "" });
      showToast("教員への公式問い合わせを送信しました。");
      fetchContacts(selectedCourse.id);
    } catch (err) {
      showToast("問い合わせの送信に失敗しました", true);
    }
  };

  const handleSendReply = async (contactId: number) => {
    const text = replyText[contactId];
    if (!text || !text.trim() || !selectedCourse) return;

    try {
      const res = await fetch(`/api/contacts/${contactId}/reply`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ reply: text }),
      });
      if (!res.ok) throw new Error();
      setReplyText((prev) => ({ ...prev, [contactId]: "" }));
      showToast("問い合わせへの回答を送信しました。");
      fetchContacts(selectedCourse.id);
    } catch (err) {
      showToast("回答の送信に失敗しました", true);
    }
  };

  const fetchMaterials = async (courseId: number) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/materials`, { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "授業資料の取得に失敗しました");
      setMaterials(data);
    } catch (err: any) {
      setMaterials([]);
      showToast(err.message || "授業資料の取得に失敗しました", true);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!newMaterial.title || !newMaterial.week) {
      showToast("タイトルと講義回は必須項目です。", true);
      return;
    }

    try {
      const res = await fetch(`/api/courses/${selectedCourse.id}/materials`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newMaterial),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "授業資料の追加に失敗しました", true);
        return;
      }
      showToast("授業資料を登録しました！ 🎉");
      setShowAddMaterialModal(false);
      setNewMaterial({ title: "", description: "", fileUrl: "", fileName: "", week: 1, teacherName: "" });
      fetchMaterials(selectedCourse.id);
    } catch (err) {
      showToast("通信エラーが発生しました", true);
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!selectedCourse) return;
    if (!confirm("この授業資料を本当に削除しますか？")) return;

    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "授業資料の削除に失敗しました", true);
        return;
      }
      showToast("授業資料を削除しました");
      fetchMaterials(selectedCourse.id);
    } catch (err) {
      showToast("通信エラーが発生しました", true);
    }
  };

  // Filter courses based on search
  const filteredCourses = courses.filter((c) => {
    const term = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term))
    );
  });

  // Calculate stats
  const enrolledCoursesList = courses.filter((c) => c.isEnrolled);
  const incompleteAssignments = assignments.filter((a) => !a.isCompleted);
  const highPriorityIncomplete = incompleteAssignments.filter((a) => a.priority === "HIGH");

  // Find most imminent deadline
  const nearestAssignment = incompleteAssignments.length > 0 
    ? [...incompleteAssignments].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]
    : null;

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Top Banner / Header */}
      <header id="app-header" className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-inner">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">LMS Prototype</h1>
              <p className="text-xs text-slate-400">次世代学習管理・課題共有システム</p>
            </div>
          </div>

          {/* Role / User Switcher */}
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <User className="h-4 w-4 text-indigo-400" />
            <span className="text-xs text-slate-300 font-medium mr-1">現在のログイン:</span>
            <select
              id="user-selector"
              value={currentUser?.id || ""}
              onChange={(e) => {
                const selected = users.find((u) => u.id === e.target.value);
                if (selected) {
                  setCurrentUser(selected);
                  showToast(`${selected.name} に切り替えました。`);
                }
              }}
              className="bg-slate-900 text-xs font-semibold text-white rounded px-2 py-1 outline-none border border-slate-700 cursor-pointer hover:border-indigo-500 transition-colors"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === "STUDENT" ? "学生" : "教員"})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Global Toast Messages */}
      <div className="max-w-7xl mx-auto px-4 mt-2">
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="alert-error"
              className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2 text-sm shadow-sm"
            >
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="alert-success"
              className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2 text-sm shadow-sm"
            >
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div id="nav-tabs" className="flex border-b border-slate-200 mb-6 overflow-x-auto gap-2">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`py-2.5 px-4 font-semibold text-sm transition-all duration-150 border-b-2 shrink-0 ${
              activeTab === "dashboard"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            マイダッシュボード
          </button>
          <button
            id="tab-courses"
            onClick={() => setActiveTab("courses")}
            className={`py-2.5 px-4 font-semibold text-sm transition-all duration-150 border-b-2 shrink-0 ${
              activeTab === "courses"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            授業共有・検索 ({courses.length})
          </button>
          {selectedCourse && (
            <button
              id="tab-detail"
              onClick={() => setActiveTab("course-detail")}
              className={`py-2.5 px-4 font-semibold text-sm transition-all duration-150 border-b-2 shrink-0 flex items-center gap-1.5 ${
                activeTab === "course-detail"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>{selectedCourse.code}: {selectedCourse.name}</span>
            </button>
          )}
        </div>

        {/* Tab 1: Dashboard */}
        {activeTab === "dashboard" && (
          <div id="dashboard-view" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Quick Stats & Enrolled Courses */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Summary Card */}
              <div id="stats-card" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">履修状況のサマリー</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <span className="text-xs text-indigo-700 font-semibold block mb-1">履修中の授業</span>
                    <span className="text-3xl font-extrabold text-indigo-900">{enrolledCoursesList.length}</span>
                    <span className="text-[10px] text-indigo-600 block mt-1">共有DBから検索可能</span>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-xs text-amber-700 font-semibold block mb-1">未完了の課題</span>
                      <span className="text-3xl font-extrabold text-amber-900">{incompleteAssignments.length}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {highPriorityIncomplete.length > 0 && (
                        <span className="text-[10px] text-red-600 font-bold block">うち優先度高: {highPriorityIncomplete.length}</span>
                      )}
                      {nearestAssignment && (
                        <span className="text-[9px] text-amber-800 font-semibold bg-amber-200/50 px-1.5 py-1 rounded block truncate" title={`直近期限: ${nearestAssignment.title}`}>
                          直近: {new Date(nearestAssignment.deadline).toLocaleDateString("ja-JP", {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* My Courses List */}
              <div id="enrolled-courses-card" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-indigo-600" />
                    履修中の授業
                  </h3>
                  <button
                    onClick={() => setActiveTab("courses")}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    授業を追加する
                  </button>
                </div>

                {enrolledCoursesList.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">現在履修登録している授業はありません。</p>
                    <button
                      onClick={() => setActiveTab("courses")}
                      className="mt-3 inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded font-semibold transition-colors shadow-sm"
                    >
                      授業共有DBをみる
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrolledCoursesList.map((course) => (
                      <div
                        key={course.id}
                        id={`my-course-${course.id}`}
                        onClick={() => {
                          setSelectedCourse(course);
                          setActiveTab("course-detail");
                          setCourseDetailTab("info");
                        }}
                        className="group p-3 border border-slate-100 rounded-lg hover:border-indigo-200 hover:bg-slate-50 transition-all cursor-pointer flex justify-between items-center"
                      >
                        <div className="space-y-1">
                          <span className="inline-block bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {course.code}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                            {course.name}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-1">{course.classroom || "オンライン"}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-0.5" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (span 2): Assignments List */}
            <div className="lg:col-span-2 space-y-6">
              <div id="assignments-container-card" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                      締め切り優先度順 課題リスト
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      履修中の授業の公式課題と、あなたが手動で登録した課題が表示されます。
                    </p>
                  </div>

                  {/* Add Custom / Manual Task button */}
                  {enrolledCoursesList.length > 0 && (
                    <button
                      id="btn-add-task-dashboard"
                      onClick={() => {
                        setNewTask((prev) => ({ ...prev, courseId: String(enrolledCoursesList[0].id) }));
                        setShowAddTaskModal(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      {currentUser?.role === "STUDENT" ? "手動課題を追加する" : "公式課題を配信する"}
                    </button>
                  )}
                </div>

                {assignments.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold text-sm">現在、登録されている課題はありません。</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {enrolledCoursesList.length === 0
                        ? "まずは授業共有システムから履修登録を行ってください。"
                        : "右上のボタンから、手動で自分だけの課題を追加することができます。"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => {
                      const deadlineDate = new Date(assignment.deadline);
                      const isOverdue = deadlineDate.getTime() < Date.now() && !assignment.isCompleted;

                      return (
                        <div
                          key={assignment.id}
                          id={`assignment-item-${assignment.id}`}
                          className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row gap-4 justify-between items-start md:items-center ${
                            assignment.isCompleted
                              ? "bg-slate-50/70 border-slate-200/50 opacity-60"
                              : isOverdue
                              ? "bg-red-50/50 border-red-100 hover:border-red-200"
                              : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex gap-3 items-start shrink-1">
                            {/* Completion Status Checkbox */}
                            <button
                              onClick={() => handleToggleAssignment(assignment.id)}
                              className="mt-1 focus:outline-none cursor-pointer group"
                              title={assignment.isCompleted ? "未完了にする" : "完了にする"}
                            >
                              {assignment.isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 fill-green-50" />
                              ) : (
                                <Circle className="h-5 w-5 text-slate-400 group-hover:text-indigo-500" />
                              )}
                            </button>

                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-2 items-center">
                                {/* Course Badge */}
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0">
                                    {assignment.course.code}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-medium truncate max-w-[150px] md:max-w-[200px]" title={assignment.course.name}>
                                    {assignment.course.name}
                                  </span>
                                </div>

                                {/* Type Badge: Manual/Student vs Official/Teacher */}
                                {assignment.isManual ? (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    手動追加 (学生)
                                  </span>
                                ) : (
                                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    公式 (教員)
                                  </span>
                                )}

                                {/* Priority Badge */}
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    assignment.priority === "HIGH"
                                      ? "bg-red-100 text-red-800"
                                      : assignment.priority === "MEDIUM"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  優先度: {assignment.priority === "HIGH" ? "高" : assignment.priority === "MEDIUM" ? "中" : "低"}
                                </span>
                              </div>

                              <h3
                                className={`text-base font-bold ${
                                  assignment.isCompleted ? "line-through text-slate-400" : "text-slate-900"
                                }`}
                              >
                                {assignment.title}
                              </h3>

                              {assignment.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 max-w-xl">
                                  {assignment.description}
                                </p>
                              )}

                              {assignment.fileUrl && (
                                <div className="pt-1.5">
                                  <a
                                    href={assignment.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 px-2 py-1 rounded-lg transition-all"
                                  >
                                    <FileText className="h-3 w-3 text-indigo-500" />
                                    <span>添付: {assignment.fileName || "ファイルを開く"}</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Deadline & Control Box */}
                          <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1.5 w-full md:w-auto justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                              <Clock className={`h-4 w-4 ${isOverdue ? "text-red-500" : "text-slate-400"}`} />
                              <span className={isOverdue ? "text-red-600 font-bold" : ""}>
                                期限: {deadlineDate.toLocaleDateString("ja-JP", {
                                  month: "numeric",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            {/* Overdue Warning */}
                            {isOverdue && (
                              <span className="bg-red-100 text-red-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                期限超過
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Course Share & Search */}
        {activeTab === "courses" && (
          <div id="course-sharing-view" className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                    授業共有システム
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    誰かが登録した授業を検索して履修登録できます。履修登録することで、課題確認や学生間チャット、教員連絡窓口が利用可能になります。
                  </p>
                </div>

                {/* Create Course Button */}
                <button
                  id="btn-create-course-db"
                  onClick={() => setShowAddCourseModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  授業を新しく登録・共有
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="search-course-input"
                  type="text"
                  placeholder="授業名、講義コード、教室などで共有授業を検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              {filteredCourses.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Search className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">お探しの授業は見つかりませんでした。</p>
                  <p className="text-xs text-slate-400 mt-1">
                    右上の「授業を新しく登録・共有」からデータベースに追加できます。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      id={`course-card-${course.id}`}
                      className="bg-white border border-slate-200 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                    >
                      {/* Course Header Info */}
                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100">
                            {course.code}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            履修者: {course.enrollmentCount}名
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base line-clamp-1">{course.name}</h3>
                        
                        {course.description && (
                          <p className="text-xs text-slate-500 line-clamp-3">{course.description}</p>
                        )}

                        <div className="space-y-1.5 pt-2 border-t border-slate-50 text-xs text-slate-500">
                          {course.classroom && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="line-clamp-1">{course.classroom}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700">
                              担当: {course.code === "CS101" || course.code === "MATH201" ? "佐藤 裕二 教授" : "山田 太郎 教授"}
                            </span>
                          </div>
                          {course.teacherContact && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="line-clamp-1">連絡先: {course.teacherContact}</span>
                            </div>
                          )}
                          {course.syllabusUrl && (
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <a
                                href={course.syllabusUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                              >
                                シラバスを開く
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                        {course.isEnrolled ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedCourse(course);
                                setActiveTab("course-detail");
                                setCourseDetailTab("info");
                              }}
                              className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer text-center"
                            >
                              詳細をひらく
                            </button>
                            <button
                              onClick={() => handleUnenroll(course.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 font-bold text-xs px-2.5 py-2 rounded-lg transition-colors cursor-pointer"
                              title="履修解除"
                            >
                              履修解除
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course.id)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm text-center"
                          >
                            この授業を履修登録する
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Selected Course Details */}
        {activeTab === "course-detail" && selectedCourse && (
          <div id="course-detail-view" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar with Course Basic Metadata */}
            <div className="lg:col-span-1 space-y-4">
              <div id="detail-course-sidebar" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <span className="inline-block bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100 mb-1.5">
                    {selectedCourse.code}
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-snug">{selectedCourse.name}</h2>
                </div>

                {selectedCourse.description && (
                  <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-50 pt-3">
                    {selectedCourse.description}
                  </p>
                )}

                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-50 pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">教室</span>
                    <span className="font-bold">{selectedCourse.classroom || "未登録"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">担当教員</span>
                    <span className="font-bold text-slate-800">
                      {selectedCourse.code === "CS101" || selectedCourse.code === "MATH201" ? "佐藤 裕二 教授" : "山田 太郎 教授"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">連絡先・研究室</span>
                    <span className="font-medium text-right text-slate-500 break-all">{selectedCourse.teacherContact || "未登録"}</span>
                  </div>
                  {selectedCourse.syllabusUrl && (
                    <div className="pt-2">
                      <a
                        href={selectedCourse.syllabusUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-center text-[11px] py-1.5 rounded inline-flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
                      >
                        シラバスを確認
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Enrollment status and actions in sidebar */}
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
                  <div className="bg-green-50 text-green-800 text-xs p-3 rounded-lg border border-green-100 text-center font-bold">
                    履修登録中
                  </div>
                  <button
                    onClick={() => handleUnenroll(selectedCourse.id)}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer text-center"
                  >
                    この授業の履修登録を解除
                  </button>
                </div>
              </div>
            </div>

            {/* Main Interactive Sub-tabs Content area */}
            <div className="lg:col-span-3 space-y-6">
              <div id="course-interactive-card" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Secondary navigation tab list inside course detail */}
                <div className="flex border-b border-slate-100 bg-slate-50/50 px-4">
                  <button
                    id="subtab-info"
                    onClick={() => setCourseDetailTab("info")}
                    className={`py-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 ${
                      courseDetailTab === "info"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    基本情報 / 授業課題
                  </button>
                  <button
                    id="subtab-materials"
                    onClick={() => setCourseDetailTab("materials")}
                    className={`py-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1 ${
                      courseDetailTab === "materials"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    授業資料・講義スライド
                  </button>
                  <button
                    id="subtab-chat"
                    onClick={() => setCourseDetailTab("chat")}
                    className={`py-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1 ${
                      courseDetailTab === "chat"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    学生専用プライベートチャット
                  </button>
                  <button
                    id="subtab-contact"
                    onClick={() => setCourseDetailTab("contact")}
                    className={`py-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1 ${
                      courseDetailTab === "contact"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    教員問い合わせ窓口
                  </button>
                </div>

                {/* Sub-tab 1: Course Info & Assignments */}
                {courseDetailTab === "info" && (
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-3">この講義に登録されている課題</h3>
                      
                      {assignments.filter(a => a.courseId === selectedCourse.id).length === 0 ? (
                        <div className="text-center py-10 text-slate-400 border border-dashed border-slate-100 rounded-lg">
                          <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs">この授業に登録された課題はありません。</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {assignments
                            .filter(a => a.courseId === selectedCourse.id)
                            .map((a) => (
                              <div
                                key={a.id}
                                className={`p-3 rounded-lg border flex justify-between items-center text-sm ${
                                  a.isCompleted ? "bg-slate-50 border-slate-150 opacity-60" : "bg-white border-slate-200"
                                }`}
                              >
                                <div className="flex gap-2.5 items-center">
                                  <button onClick={() => handleToggleAssignment(a.id)}>
                                    {a.isCompleted ? (
                                      <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />
                                    ) : (
                                      <Circle className="h-4.5 w-4.5 text-slate-300 hover:text-indigo-500" />
                                    )}
                                  </button>
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold ${
                                        a.isManual ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"
                                      }`}>
                                        {a.isManual ? "手動追加" : "公式"}
                                      </span>
                                      <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold ${
                                        a.priority === "HIGH" ? "bg-red-100 text-red-800" : a.priority === "MEDIUM" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                                      }`}>
                                        優先度:{a.priority === "HIGH" ? "高" : a.priority === "MEDIUM" ? "中" : "低"}
                                      </span>
                                      <h4 className={`font-bold ${a.isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>{a.title}</h4>
                                    </div>
                                    {a.description && <p className="text-xs text-slate-400 mt-0.5">{a.description}</p>}
                                    {a.fileUrl && (
                                      <div className="pt-1">
                                        <a
                                          href={a.fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 px-1.5 py-0.5 rounded transition-all"
                                        >
                                          <FileText className="h-3 w-3 text-indigo-500" />
                                          <span>添付: {a.fileName || "ファイルを開く"}</span>
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs font-medium text-slate-400">
                                  {new Date(a.deadline).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Button to add task to this course */}
                    <div className="flex justify-end pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setNewTask((prev) => ({ ...prev, courseId: String(selectedCourse.id) }));
                          setShowAddTaskModal(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <Plus className="h-4 w-4" />
                        {currentUser?.role === "STUDENT" ? "手動課題を追加する" : "公式課題を追加する"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-tab: Materials (授業資料・講義スライド) */}
                {courseDetailTab === "materials" && (
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">授業資料・スライド一覧</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          各回の講義スライド、配布資料、参考リンクが掲載されます。
                        </p>
                      </div>
                      {currentUser?.role === "TEACHER" && (
                        <button
                          onClick={() => {
                            setNewMaterial({
                              title: "",
                              description: "",
                              fileUrl: "",
                              week: materials.length > 0 ? Math.max(...materials.map(m => m.week)) + 1 : 1,
                              teacherName: "",
                            });
                            setShowAddMaterialModal(true);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                          新規資料を登録
                        </button>
                      )}
                    </div>

                    {materials.length === 0 ? (
                      <div className="text-center py-16 text-slate-400 border border-dashed border-slate-100 rounded-xl bg-slate-50/20">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm font-medium">登録されている授業資料はありません。</p>
                        {currentUser?.role === "TEACHER" && (
                          <p className="text-xs text-slate-400 mt-1">
                            右上の「新規資料を登録」ボタンからスライドURLやタイトルを登録できます。
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {materials.map((m) => (
                          <div
                            key={m.id}
                            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-100 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-100 shrink-0">
                                  第{m.week}回
                                </span>
                                {m.teacherName && (
                                  <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 shrink-0 flex items-center gap-1">
                                    <User className="h-3 w-3 text-slate-400" />
                                    講師: {m.teacherName}
                                  </span>
                                )}
                                <h4 className="font-bold text-slate-800 text-sm md:text-base">{m.title}</h4>
                              </div>
                              {m.description && (
                                <p className="text-xs md:text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
                                  {m.description}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400">
                                登録日時: {new Date(m.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 self-stretch md:self-center justify-end">
                              {m.fileUrl ? (
                                <a
                                  href={m.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 hover:border-emerald-200 font-bold text-xs px-3.5 py-2 rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm w-full md:w-auto justify-center"
                                  title={m.fileName || "資料を開く"}
                                >
                                  {m.fileUrl.startsWith("/uploads/") ? (
                                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Download className="h-3.5 w-3.5" />
                                  )}
                                  <span className="truncate max-w-[200px]">
                                    {m.fileName || "資料を開く"}
                                  </span>
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400 px-3.5 py-2 select-none">
                                  スライド/資料リンクなし
                                </span>
                              )}

                              {currentUser?.role === "TEACHER" && (
                                <button
                                  onClick={() => handleDeleteMaterial(m.id)}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-100 p-2 rounded-lg transition-colors cursor-pointer"
                                  title="資料を削除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 2: Private Student Chat (Teachers Forbidden) */}
                {courseDetailTab === "chat" && (
                  <div className="p-6">
                    {currentUser?.role === "TEACHER" ? (
                      <div className="text-center py-12 bg-red-50 border border-red-100 rounded-lg p-6 space-y-3">
                        <ShieldAlert className="h-10 w-10 text-red-600 mx-auto" />
                        <h4 className="text-base font-bold text-red-800">アクセス制限エラー (教師ブロック)</h4>
                        <p className="text-xs text-red-600 max-w-md mx-auto leading-relaxed">
                          セキュリティポリシーに基づき、教員（佐藤教授等）は学生間のプライベートチャットを閲覧・アクセスすることはできません。学生間の自由なコミュニケーション環境を維持するための安全設計です。
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          ※上部のユーザー切り替えで学生アカウント（アリス、ボブ）を選択すると、チャットに参加することができます。
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3.5 rounded-lg flex items-start gap-2 leading-relaxed">
                          <ShieldAlert className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">学生専用スペース: </span>
                            このチャットは学生（アリス・ボブ等）間のみのプライベートチャットです。教員のアカウントからは閲覧・参加が不可能なようにバックエンドAPIレベルでアクセス制限ルールが敷かれています。
                          </div>
                        </div>

                        {/* Chat Messages Log */}
                        <div className="border border-slate-150 rounded-lg p-4 h-[300px] overflow-y-auto space-y-4 bg-slate-50/50">
                          {chatMessages.length === 0 ? (
                            <div className="text-center text-xs text-slate-400 py-16">
                              まだメッセージはありません。最初のメッセージを送信しましょう。
                            </div>
                          ) : (
                            chatMessages.map((chat) => (
                              <div
                                key={chat.id}
                                className={`flex flex-col max-w-[80%] ${
                                  chat.userId === currentUser?.id ? "ml-auto items-end" : "mr-auto items-start"
                                }`}
                              >
                                <span className="text-[10px] text-slate-400 font-bold mb-0.5">{chat.userName}</span>
                                <div
                                  className={`p-3 rounded-xl text-sm leading-relaxed ${
                                    chat.userId === currentUser?.id
                                      ? "bg-indigo-600 text-white rounded-tr-none"
                                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                                  }`}
                                >
                                  {chat.message}
                                </div>
                                <span className="text-[9px] text-slate-400 mt-0.5">
                                  {new Date(chat.createdAt).toLocaleTimeString("ja-JP", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Send Message Form */}
                        <form onSubmit={handleSendChatMessage} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="学生同士でチャットを入力..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="h-3 w-3" />
                            送信
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 3: Official Inquiry to Teacher */}
                {courseDetailTab === "contact" && (
                  <div className="p-6 space-y-6">
                    <div className="bg-indigo-50 border border-indigo-150 text-indigo-900 text-xs p-3.5 rounded-lg">
                      <span className="font-bold">教員公式窓口: </span>
                      チャットと異なり、教員（佐藤教授）と個別での公式なやり取りを行います。学生からは自分の問い合わせのみが見え、教員側からは届いたすべての問い合わせを確認して返信（回答）を行うことができます。
                    </div>

                    {/* Inquiry List */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-800">問い合わせ履歴 / 受信トレイ</h4>
                      
                      {contacts.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-slate-100 rounded-lg text-xs text-slate-400">
                          現在、問い合わせ履歴はありません。
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {contacts.map((contact) => (
                            <div key={contact.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white hover:border-indigo-100 hover:shadow-sm transition-all">
                              <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-slate-50">
                                <div>
                                  <span className="bg-slate-100 text-slate-600 font-bold text-[10px] px-1.5 py-0.5 rounded-full mr-2">
                                    差出人: {contact.userName}
                                  </span>
                                  <span className="text-xs font-bold text-slate-700">{contact.subject}</span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(contact.createdAt).toLocaleDateString("ja-JP", {
                                    month: "numeric",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-50">
                                {contact.message}
                              </p>

                              {/* Display Reply */}
                              {contact.reply ? (
                                <div className="pl-4 border-l-2 border-green-500 space-y-1 bg-green-50/30 p-3 rounded-r-lg">
                                  <div className="flex items-center gap-1.5 text-xs text-green-700 font-bold">
                                    <CornerDownRight className="h-4 w-4 shrink-0" />
                                    <span>教員からの回答:</span>
                                  </div>
                                  <p className="text-sm text-green-800 font-medium leading-relaxed">
                                    {contact.reply}
                                  </p>
                                </div>
                              ) : (
                                <div className="pl-4 border-l-2 border-slate-300">
                                  <span className="text-xs text-slate-400 font-medium">教員からの回答待ちです。</span>
                                </div>
                              )}

                              {/* Reply Form for Teachers */}
                              {currentUser?.role === "TEACHER" && !contact.reply && (
                                <div className="pt-2 flex flex-col gap-2">
                                  <textarea
                                    rows={2}
                                    placeholder="この問い合わせに返信する..."
                                    value={replyText[contact.id] || ""}
                                    onChange={(e) => setReplyText((prev) => ({ ...prev, [contact.id]: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                                  />
                                  <div className="flex justify-end">
                                    <button
                                      onClick={() => handleSendReply(contact.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                                    >
                                      回答を送信
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit New Inquiry (Student Only) */}
                    {currentUser?.role === "STUDENT" && (
                      <form onSubmit={handleSendInquiry} className="border-t border-slate-100 pt-6 space-y-4">
                        <h4 className="text-sm font-bold text-slate-800">教員への新規問い合わせ</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">件名 (Subject)</label>
                            <input
                              type="text"
                              required
                              placeholder="例: レポート提出遅延に関する質問、講義資料の再掲依頼など..."
                              value={newInquiry.subject}
                              onChange={(e) => setNewInquiry((prev) => ({ ...prev, subject: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">本文 (Inquiry Content)</label>
                            <textarea
                              rows={4}
                              required
                              placeholder="教員（佐藤教授）宛ての問い合わせ本文を入力してください..."
                              value={newInquiry.message}
                              onChange={(e) => setNewInquiry((prev) => ({ ...prev, message: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4.5 py-2 rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
                            >
                              問い合わせを送信する
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer id="app-footer" className="max-w-7xl mx-auto px-4 py-8 border-t border-slate-200 text-center text-xs text-slate-400">
        <p>© 2026 Custom Learning Management System Dashboard. All rights reserved.</p>
        <p className="mt-1">Built with React 19, Node.js, Express, Prisma & SQLite.</p>
      </footer>

      {/* --- MODALS --- */}

      {/* 1. Add Course Modal */}
      {showAddCourseModal && (
        <div id="modal-add-course" className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden"
          >
            <div className="bg-slate-900 text-white p-5">
              <h3 className="text-base font-bold">新規授業の共有登録</h3>
              <p className="text-xs text-slate-400 mt-0.5">他の学生も履修登録できるよう、授業データを共有データベースに登録します。</p>
            </div>
            <form onSubmit={handleCreateCourse} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">講義コード *</label>
                  <input
                    type="text"
                    required
                    placeholder="例: CS101"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse((prev) => ({ ...prev, code: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">授業名 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例: アルゴリズム論基礎"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">授業概要 / シラバス説明</label>
                <textarea
                  rows={2}
                  placeholder="授業内容の簡単な要約を入力..."
                  value={newCourse.description}
                  onChange={(e) => setNewCourse((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">教室 / 会場</label>
                  <input
                    type="text"
                    placeholder="例: 3号館 301講義室"
                    value={newCourse.classroom}
                    onChange={(e) => setNewCourse((prev) => ({ ...prev, classroom: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">教員の公式連絡先</label>
                  <input
                    type="text"
                    placeholder="例: prof_sato@univ.ac.jp"
                    value={newCourse.teacherContact}
                    onChange={(e) => setNewCourse((prev) => ({ ...prev, teacherContact: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">シラバスURL (PDF/Web)</label>
                <input
                  type="url"
                  placeholder="https://syllabus.univ.ac.jp/..."
                  value={newCourse.syllabusUrl}
                  onChange={(e) => setNewCourse((prev) => ({ ...prev, syllabusUrl: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  授業を登録する
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. Add Assignment / Manual Task Modal */}
      {showAddTaskModal && (
        <div id="modal-add-task" className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-slate-900 text-white p-5">
              <h3 className="text-base font-bold">
                {currentUser?.role === "STUDENT" ? "手動課題の追加 (自分専用)" : "公式課題の配信 (全員)"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser?.role === "STUDENT"
                  ? "講義スライド等から手動で課題を作成できます。自分のみのダッシュボードに反映されます。"
                  : "この講義を履修登録している全学生のダッシュボードへ課題が配信されます。"}
              </p>
            </div>
            <form onSubmit={handleCreateAssignment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">対象の授業 *</label>
                <select
                  required
                  value={newTask.courseId}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, courseId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {enrolledCoursesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">課題タイトル *</label>
                <input
                  type="text"
                  required
                  placeholder="例: 第4回課題レポート提出"
                  value={newTask.title}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">課題の詳細説明</label>
                <textarea
                  rows={2}
                  placeholder="例: 配布資料のp15からp20までの練習問題を解いて提出する..."
                  value={newTask.description}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">優先度 *</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value as "HIGH" | "MEDIUM" | "LOW" }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="HIGH">高 (HIGH)</option>
                    <option value="MEDIUM">中 (MEDIUM)</option>
                    <option value="LOW">低 (LOW)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">期限日時 *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newTask.deadline}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">課題ファイルのアップロード (パソコンから直接)</label>
                <div
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 rounded-lg p-4 text-center cursor-pointer transition-all relative"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      handleFileUpload(files[0], (url, name) => {
                        setNewTask((prev) => ({ ...prev, fileUrl: url, fileName: name }));
                      });
                    }
                  }}
                  onClick={() => {
                    const fileInput = document.getElementById("task-file-input");
                    if (fileInput) fileInput.click();
                  }}
                >
                  <input
                    id="task-file-input"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleFileUpload(files[0], (url, name) => {
                          setNewTask((prev) => ({ ...prev, fileUrl: url, fileName: name }));
                        });
                      }
                    }}
                  />
                  {uploading ? (
                    <div className="text-slate-500 text-xs py-2 flex flex-col items-center gap-1">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                      <span>アップロード中...</span>
                    </div>
                  ) : newTask.fileUrl && newTask.fileUrl.startsWith("/uploads/") ? (
                    <div className="text-emerald-600 text-xs font-semibold flex flex-col items-center gap-1">
                      <FileText className="h-5 w-5 text-emerald-500" />
                      <span className="truncate max-w-full">添付済み: {newTask.fileName}</span>
                      <span className="text-[10px] text-slate-400">クリックまたはドラッグで変更</span>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs flex flex-col items-center gap-1 py-1">
                      <Download className="h-5 w-5 text-slate-400" />
                      <span>ファイルをドラッグ＆ドロップ</span>
                      <span className="text-[10px] text-slate-400">または クリックしてファイルを選択</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">または 共有URLでファイルを添付</label>
                <input
                  type="url"
                  placeholder="https://example.com/docs/homework-instructions.pdf"
                  value={newTask.fileUrl}
                  onChange={(e) => setNewTask((prev) => {
                    const url = e.target.value;
                    const name = url ? url.split("/").pop() || "共有リンク" : "";
                    return { ...prev, fileUrl: url, fileName: name };
                  })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  ※Googleドライブ、GitHub、外部ドキュメントリンク等を使用する場合はここにURLを入力してください。
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  課題を登録する
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 3. Add Lecture Material Modal */}
      {showAddMaterialModal && selectedCourse && (
        <div id="modal-add-material" className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-slate-900 text-white p-5">
              <h3 className="text-base font-bold">新規授業資料・スライドの登録</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                [{selectedCourse.code}] {selectedCourse.name} の履修学生に公開する資料を登録します。
              </p>
            </div>
            <form onSubmit={handleCreateMaterial} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">講義回 *</label>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs">
                    <span>第</span>
                    <input
                      type="number"
                      required
                      min={1}
                      max={15}
                      value={newMaterial.week}
                      onChange={(e) => setNewMaterial((prev) => ({ ...prev, week: parseInt(e.target.value) || 1 }))}
                      className="w-full bg-transparent focus:outline-none font-bold text-center text-indigo-700"
                    />
                    <span>回</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">資料タイトル *</label>
                  <input
                    type="text"
                    required
                    placeholder="例: 第3回講義スライド (配列・ループ)"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">資料の説明やアナウンス</label>
                <textarea
                  rows={3}
                  placeholder="例: 今回使用した講義資料のスライドと追加の補足資料です。復習用として確認してください。"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">この回の担当教員・講師名 (オムニバス・ゲスト講義用)</label>
                <input
                  type="text"
                  placeholder="例: 佐藤 裕二 教授 (空欄の場合はデフォルト教員)"
                  value={newMaterial.teacherName}
                  onChange={(e) => setNewMaterial((prev) => ({ ...prev, teacherName: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  ※授業回によって担当が異なる場合や、特別ゲストスピーカーを招く際に入力してください。
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">パソコンから直接アップロード</label>
                <div
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 rounded-lg p-4 text-center cursor-pointer transition-all relative"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      handleFileUpload(files[0], (url, name) => {
                        setNewMaterial((prev) => ({ ...prev, fileUrl: url, fileName: name }));
                      });
                    }
                  }}
                  onClick={() => {
                    const fileInput = document.getElementById("material-file-input");
                    if (fileInput) fileInput.click();
                  }}
                >
                  <input
                    id="material-file-input"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleFileUpload(files[0], (url, name) => {
                          setNewMaterial((prev) => ({ ...prev, fileUrl: url, fileName: name }));
                        });
                      }
                    }}
                  />
                  {uploading ? (
                    <div className="text-slate-500 text-xs py-2 flex flex-col items-center gap-1">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                      <span>アップロード中...</span>
                    </div>
                  ) : newMaterial.fileUrl && newMaterial.fileUrl.startsWith("/uploads/") ? (
                    <div className="text-emerald-600 text-xs font-semibold flex flex-col items-center gap-1">
                      <FileText className="h-5 w-5 text-emerald-500" />
                      <span className="truncate max-w-full">添付済み: {newMaterial.fileName}</span>
                      <span className="text-[10px] text-slate-400">クリックまたはドラッグで変更</span>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs flex flex-col items-center gap-1 py-1">
                      <Download className="h-5 w-5 text-slate-400" />
                      <span>ファイルをドラッグ＆ドロップ</span>
                      <span className="text-[10px] text-slate-400">または クリックしてファイルを選択</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">または 共有URLで資料を添付</label>
                <input
                  type="url"
                  placeholder="https://example.com/slides/week3.pdf"
                  value={newMaterial.fileUrl}
                  onChange={(e) => setNewMaterial((prev) => {
                    const url = e.target.value;
                    const name = url ? url.split("/").pop() || "共有資料リンク" : "";
                    return { ...prev, fileUrl: url, fileName: name };
                  })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  ※Googleドライブ、Box、PDFファイル、または外部の共有用URLを入力してください。
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  資料を登録・公開
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

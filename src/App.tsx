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
  Filter,
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
  Download,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  Upload,
  Edit3,
  ClipboardList
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
  dayOfWeek?: string | null;
  period?: number | null;
  color?: string | null;
  teacherName?: string | null;
  isOfficial?: boolean;
  creatorId?: string | null;
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
  week?: number;
  course?: {
    name: string;
    code: string;
    color?: string | null;
    isOfficial?: boolean;
  };
  submissionComment?: string | null;
  submissionFileUrl?: string | null;
  submissionFileName?: string | null;
  teacherComment?: string | null;
  submittedAt?: string | null;
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "timetable" | "courses" | "tools" | "course-detail">("dashboard");
  const [courseDetailTab, setCourseDetailTab] = useState<"info" | "materials" | "chat" | "contact">("materials");
  
  // Assignment View & Submission States
  const [viewingAssignment, setViewingAssignment] = useState<AssignmentType | null>(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<any[]>([]);
  const [submissionComment, setSubmissionComment] = useState("");
  const [submissionFileUrl, setSubmissionFileUrl] = useState("");
  const [submissionFileName, setSubmissionFileName] = useState("");
  const [teacherFeedbackTexts, setTeacherFeedbackTexts] = useState<Record<string, string>>({});
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);
  const [editAssignmentForm, setEditAssignmentForm] = useState({
    title: "",
    description: "",
    fileUrl: "",
    fileName: "",
    week: 1,
    priority: "MEDIUM" as "HIGH" | "MEDIUM" | "LOW",
    deadline: "",
  });
  const [activeMenuCourseId, setActiveMenuCourseId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDayOfWeek, setFilterDayOfWeek] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<number | null>(null);
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
    dayOfWeek: "",
    period: "",
    color: "#4f46e5",
    teacherName: "",
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

  // Close timetable course dropdown menus on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuCourseId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
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
      if (Array.isArray(data)) {
        setUsers(data);
        if (data.length > 0) {
          // Default to student Alice
          const defaultUser = data.find((u: UserType) => u.id === "student-1") || data[0];
          setCurrentUser(defaultUser);
        }
      } else {
        console.error("Failed to load users as array:", data);
        setUsers([]);
        showToast("ユーザーリストの形式が正しくありません", true);
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
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
      setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
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
      if (Array.isArray(data)) {
        setCourses(data);
      } else {
        console.error("Failed to load courses as array:", data);
        setCourses([]);
      }
    } catch (err) {
      console.error(err);
      setCourses([]);
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
      if (!newCourse.dayOfWeek || !newCourse.period) {
        showToast("曜日と時限を必ず選択してください。", true);
        return;
      }
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
        dayOfWeek: "",
        period: "",
        color: "#4f46e5",
        teacherName: "",
      });
      await fetchCourses();
      await fetchDashboard();
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

  const fetchSubmissions = async (assignmentId: number) => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submissions`, { headers: getHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssignmentSubmissions(data);
      
      // If student, prefill submission states
      if (currentUser?.role === "STUDENT" && data.length > 0) {
        setSubmissionComment(data[0].submissionComment || "");
        setSubmissionFileUrl(data[0].submissionFileUrl || "");
        setSubmissionFileName(data[0].submissionFileName || "");
      } else if (currentUser?.role === "TEACHER") {
        // Initialize feedback text fields for teachers
        const textMap: Record<string, string> = {};
        data.forEach((sub: any) => {
          textMap[sub.userId] = sub.teacherComment || "";
        });
        setTeacherFeedbackTexts(textMap);
      }
    } catch (err) {
      console.error(err);
      showToast("提出状況の取得に失敗しました", true);
    }
  };

  const handleSubmitAssignment = async (assignmentId: number) => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          submissionComment,
          submissionFileUrl,
          submissionFileName,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("課題を提出しました！ 🎉");
      await fetchSubmissions(assignmentId);
      await fetchDashboard();
    } catch (err) {
      showToast("課題の提出に失敗しました", true);
    }
  };

  const handleSaveFeedback = async (assignmentId: number, studentId: string) => {
    const feedbackText = teacherFeedbackTexts[studentId];
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/feedback`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          studentId,
          teacherComment: feedbackText,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("フィードバックを保存しました！");
      await fetchSubmissions(assignmentId);
      await fetchDashboard();
    } catch (err) {
      showToast("フィードバックの保存に失敗しました", true);
    }
  };

  const handleUpdateAssignmentDetails = async (assignmentId: number) => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(editAssignmentForm),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      showToast("課題内容を更新しました！");
      setViewingAssignment((prev) => prev ? { ...prev, ...data } : null);
      setIsEditingAssignment(false);
      await fetchDashboard();
    } catch (err) {
      showToast("課題内容の更新に失敗しました", true);
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

  // Filter courses based on search and selected day/period from timetable click
  const filteredCourses = courses.filter((c) => {
    if (filterDayOfWeek && c.dayOfWeek !== filterDayOfWeek) return false;
    if (filterPeriod && c.period !== filterPeriod) return false;

    const term = searchQuery.toLowerCase();
    const courseTeacher = c.teacherName || (c.code.startsWith("COGNITIVE") || c.code.startsWith("ECONOMICS") ? "佐藤 裕二 教授" : "山田 太郎 教授");
    return (
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term)) ||
      (courseTeacher && courseTeacher.toLowerCase().includes(term))
    );
  });

  // Calculate stats
  const enrolledCoursesList = courses.filter((c) => c.isEnrolled);
  
  // 自分が閲覧可能な課題（公式課題 + 自分が作成した手動課題）に制限し、他生徒の手動課題を完全に排除
  const visibleAssignments = assignments.filter((a) => {
    if (!a.isManual) return true; // 教員公式課題
    return a.userId === currentUser?.id; // 自分が作成した手動課題のみ
  });

  const incompleteAssignments = visibleAssignments.filter((a) => !a.isCompleted);
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
        <div id="nav-tabs" className="flex border-b border-slate-200 mb-6 overflow-x-auto gap-1">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`py-2.5 px-4 font-semibold text-sm transition-all duration-150 border-b-2 shrink-0 flex items-center gap-2 ${
              activeTab === "dashboard"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <GraduationCap className="h-4.5 w-4.5" />
            <span>マイダッシュボード</span>
          </button>
          <button
            id="tab-timetable"
            onClick={() => setActiveTab("timetable")}
            className={`py-2.5 px-4 font-semibold text-sm transition-all duration-150 border-b-2 shrink-0 flex items-center gap-2 ${
              activeTab === "timetable"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Calendar className="h-4.5 w-4.5" />
            <span>時間割</span>
          </button>
          <button
            id="tab-courses"
            onClick={() => setActiveTab("courses")}
            className={`py-2.5 px-4 font-semibold text-sm transition-all duration-150 border-b-2 shrink-0 flex items-center gap-2 ${
              activeTab === "courses"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <BookOpen className="h-4.5 w-4.5" />
            <span>{currentUser?.role === "TEACHER" ? "授業登録" : "履修登録"} ({courses.length})</span>
          </button>
          <button
            id="tab-tools"
            onClick={() => setActiveTab("tools")}
            className={`py-2.5 px-4 font-semibold text-sm transition-all duration-150 border-b-2 shrink-0 flex items-center gap-2 ${
              activeTab === "tools"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Bookmark className="h-4.5 w-4.5" />
            <span>便利ツール</span>
          </button>
          {selectedCourse && (
            <button
              id="tab-detail"
              onClick={() => setActiveTab("course-detail")}
              className="py-2.5 px-4 font-semibold text-sm transition-all duration-150 border-b-2 shrink-0 flex items-center gap-2"
              style={{
                borderColor: activeTab === "course-detail" ? (selectedCourse.color || "#4f46e5") : "transparent",
                color: activeTab === "course-detail" ? (selectedCourse.color || "#4f46e5") : "rgb(100 116 139)"
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 animate-pulse" style={{ backgroundColor: selectedCourse.color || "#4f46e5" }}></span>
              <span className={activeTab === "course-detail" ? "font-extrabold" : ""}>{selectedCourse.code}: {selectedCourse.name}</span>
            </button>
          )}
        </div>
         {/* Tab 1: Dashboard */}
        {activeTab === "dashboard" && (
          <div id="dashboard-view" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column (span 2): Enrolled Courses - MAIN FOCUS */}
            <div className="lg:col-span-2 space-y-6">
              {/* My Courses List */}
              <div id="enrolled-courses-card" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2.5">
                    <Bookmark className="h-5.5 w-5.5 text-indigo-600" />
                    {currentUser?.role === "TEACHER" ? "登録・担当中の授業" : "履修中の授業一覧"}
                  </h3>
                  <button
                    onClick={() => setActiveTab("courses")}
                    className="text-xs text-indigo-600 hover:underline font-bold bg-indigo-50 px-3.5 py-1.5 rounded-lg border border-indigo-100 transition-colors cursor-pointer shadow-3xs"
                  >
                    授業を追加する
                  </button>
                </div>

                {enrolledCoursesList.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-semibold">
                      {currentUser?.role === "TEACHER" 
                        ? "現在登録している授業はありません。" 
                        : "現在履修登録している授業はありません。"}
                    </p>
                    <button
                      onClick={() => setActiveTab("courses")}
                      className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors shadow-sm cursor-pointer"
                    >
                      授業共有DBをみる
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {enrolledCoursesList.map((course) => {
                      const themeColor = course.color || "#4f46e5";
                      return (
                        <div
                          key={course.id}
                          id={`enrolled-course-${course.id}`}
                          onClick={() => {
                            setSelectedCourse(course);
                            setActiveTab("course-detail");
                            setCourseDetailTab("materials");
                          }}
                          className="group relative p-6 border border-l-8 transition-all cursor-pointer flex flex-col justify-between shadow-xs rounded-2xl hover:-translate-y-1 hover:shadow-md overflow-hidden bg-white min-h-[160px] border-slate-200/60"
                          style={{ 
                            borderLeftColor: themeColor,
                            backgroundColor: `${themeColor}04`
                          }}
                        >
                          {/* Ambient backdrop flare */}
                          <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"
                            style={{ backgroundColor: `${themeColor}05` }}
                          />

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-block text-white font-mono text-[11px] font-extrabold px-2.5 py-0.5 rounded shadow-sm" style={{ backgroundColor: themeColor }}>
                                {course.code}
                              </span>
                              <span className="inline-block bg-white text-slate-700 border border-slate-200/80 font-bold text-[10px] px-2 py-0.5 rounded shadow-2xs">
                                {course.dayOfWeek}曜{course.period}限
                              </span>
                              {course.isOfficial ? (
                                <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-100 shadow-2xs">
                                  教員公式
                                </span>
                              ) : (
                                <span className="bg-slate-50 text-slate-500 text-[10px] font-extrabold px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                                  生徒作成
                                </span>
                              )}
                            </div>

                            <h4 className="font-extrabold text-lg md:text-xl transition-colors group-hover:underline leading-tight" style={{ color: themeColor }}>
                              {course.name}
                            </h4>

                            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                              <span className="bg-white text-slate-600 border border-slate-150 px-2.5 py-0.5 rounded-md shadow-3xs">{course.classroom || "オンライン"}</span>
                              {course.teacherName && <span className="text-slate-400">/ 担当: {course.teacherName}</span>}
                            </p>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-100/70 flex justify-between items-center text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
                            <span className="text-[11px] text-slate-400">講義ポータル & 各種機能を開く</span>
                            <div className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                              <span className="text-[11px] underline">詳細ページへ</span>
                              <ChevronRight className="h-4 w-4 text-indigo-500" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Quick Stats & Assignments List */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Summary Card */}
              <div id="stats-card" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                  課題ステータス
                </h3>
                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-amber-800 font-extrabold block mb-1">
                      未完了の課題
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-amber-900">{incompleteAssignments.length}</span>
                      <span className="text-xs font-semibold text-amber-700">件</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    {highPriorityIncomplete.length > 0 && (
                      <span className="text-[10px] text-white bg-red-600 font-extrabold px-2 py-0.5 rounded-full inline-block">優先高: {highPriorityIncomplete.length}件</span>
                    )}
                    {nearestAssignment && (
                      <span className="text-[10px] text-amber-900 font-semibold bg-white border border-amber-200/50 px-2 py-1 rounded-md block truncate max-w-[130px]" title={`直近期限: ${nearestAssignment.title}`}>
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

              {/* Official Assignments List Card */}
              <div id="official-assignments-card" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col gap-3 mb-5 pb-4 border-b border-slate-100">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-indigo-600" />
                        教員公式 課題リスト
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        大学の教員より配信された公式課題
                      </p>
                    </div>
                  </div>
                </div>

                {visibleAssignments.filter((a) => !a.isManual).length === 0 ? (
                  <div className="text-center py-10 text-slate-400 border border-dashed border-slate-150 rounded-xl">
                    <FileText className="h-9 w-9 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-[11px]">配信されている公式課題はありません。</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {visibleAssignments
                      .filter((a) => !a.isManual)
                      .map((assignment) => {
                        const deadlineDate = new Date(assignment.deadline);
                        const isOverdue = deadlineDate.getTime() < Date.now() && !assignment.isCompleted;
                        // Dynamic robust color fallback directly from active course list to guarantee match
                        const courseColor = assignment.course.color || courses.find((c) => c.id === assignment.courseId || c.code === assignment.course.code)?.color || "#4f46e5";

                        return (
                          <div
                            key={assignment.id}
                            id={`official-assignment-item-${assignment.id}`}
                            className={`p-3.5 rounded-xl border border-l-[6px] transition-all flex flex-col gap-2 hover:scale-[1.01] ${
                              assignment.isCompleted
                                ? "opacity-65 hover:opacity-80 bg-slate-50/40"
                                : "hover:shadow-xs"
                            }`}
                            style={{ 
                              borderLeftColor: courseColor,
                              borderColor: assignment.isCompleted 
                                ? `${courseColor}20` 
                                : isOverdue 
                                ? "#fecaca" 
                                : `${courseColor}25`,
                              backgroundColor: assignment.isCompleted 
                                ? `${courseColor}02` 
                                : isOverdue 
                                ? "#fef2f2" 
                                : `${courseColor}06`
                            }}
                          >
                            <div className="flex gap-2.5 items-start">
                              <button
                                onClick={() => handleToggleAssignment(assignment.id)}
                                className="mt-0.5 focus:outline-none cursor-pointer group shrink-0"
                                title={assignment.isCompleted ? "未完了にする" : "完了にする"}
                              >
                                {assignment.isCompleted ? (
                                  <CheckCircle2 className="h-4.5 w-4.5 text-green-500 fill-green-50" />
                                ) : (
                                  <Circle className="h-4.5 w-4.5 text-slate-400 group-hover:text-indigo-500" style={{ color: courseColor }} />
                                )}
                              </button>

                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {/* Strict Theme Colored Solid Tag */}
                                  <span 
                                    className="px-2 py-0.5 rounded-md text-white text-[9px] font-extrabold shadow-3xs truncate max-w-full" 
                                    style={{ backgroundColor: courseColor }}
                                    title={assignment.course.name}
                                  >
                                    {assignment.course.name}
                                  </span>
                                  <span
                                    className={`text-[8px] font-extrabold px-1 rounded ${
                                      assignment.priority === "HIGH"
                                        ? "bg-red-100 text-red-800"
                                        : assignment.priority === "MEDIUM"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {assignment.priority === "HIGH" ? "高" : assignment.priority === "MEDIUM" ? "中" : "低"}
                                  </span>
                                </div>

                                <h3
                                  className={`text-xs font-bold ${
                                    assignment.isCompleted ? "line-through text-slate-400 font-medium" : "text-slate-800 font-extrabold"
                                  }`}
                                >
                                  {assignment.title}
                                </h3>

                                {assignment.fileUrl && (
                                  <div className="pt-0.5">
                                    <a
                                      href={assignment.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[9px] text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 px-1.5 py-0.5 rounded transition-all"
                                    >
                                      <FileText className="h-2.5 w-2.5 text-indigo-500" />
                                      <span>添付あり</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100/50 pt-2 mt-1">
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                <Clock className={`h-3 w-3 ${isOverdue ? "text-red-500" : "text-slate-400"}`} />
                                <span className={isOverdue ? "text-red-600 font-bold" : ""}>
                                  期限: {deadlineDate.toLocaleDateString("ja-JP", {
                                    month: "numeric",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              {isOverdue && (
                                <span className="bg-red-100 text-red-800 text-[8px] font-extrabold px-1 py-0.2 rounded">
                                  超過
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Personal Student TODO List Card */}
              <div id="todo-assignments-card" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col gap-3 mb-5 pb-4 border-b border-slate-100">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        マイTODOリスト
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        自分が手動で追加した自主課題・予定
                      </p>
                    </div>
                    {/* Add Custom / Manual Task button in My TODO only */}
                    {enrolledCoursesList.length > 0 && (
                      <button
                        id="btn-add-todo-dashboard"
                        onClick={() => {
                          setNewTask((prev) => ({ ...prev, courseId: String(enrolledCoursesList[0].id) }));
                          setShowAddTaskModal(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors shadow-sm cursor-pointer shrink-0"
                      >
                        <Plus className="h-3 w-3" />
                        <span>TODO追加</span>
                      </button>
                    )}
                  </div>
                </div>

                {visibleAssignments.filter((a) => a.isManual).length === 0 ? (
                  <div className="text-center py-10 text-slate-400 border border-dashed border-slate-150 rounded-xl">
                    <CheckCircle2 className="h-9 w-9 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-[11px]">登録されているTODOはありません。</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {visibleAssignments
                      .filter((a) => a.isManual)
                      .map((assignment) => {
                        const deadlineDate = new Date(assignment.deadline);
                        const isOverdue = deadlineDate.getTime() < Date.now() && !assignment.isCompleted;
                        // Dynamic robust color fallback directly from active course list to guarantee match
                        const courseColor = assignment.course.color || courses.find((c) => c.id === assignment.courseId || c.code === assignment.course.code)?.color || "#4f46e5";

                        return (
                          <div
                            key={assignment.id}
                            id={`todo-assignment-item-${assignment.id}`}
                            className={`p-3.5 rounded-xl border border-l-[6px] transition-all flex flex-col gap-2 hover:scale-[1.01] ${
                              assignment.isCompleted
                                ? "opacity-65 hover:opacity-80 bg-slate-50/40"
                                : "hover:shadow-xs"
                            }`}
                            style={{ 
                              borderLeftColor: courseColor,
                              borderColor: assignment.isCompleted 
                                ? `${courseColor}20` 
                                : isOverdue 
                                ? "#fecaca" 
                                : `${courseColor}25`,
                              backgroundColor: assignment.isCompleted 
                                ? `${courseColor}02` 
                                : isOverdue 
                                ? "#fef2f2" 
                                : `${courseColor}06`
                            }}
                          >
                            <div className="flex gap-2.5 items-start">
                              <button
                                onClick={() => handleToggleAssignment(assignment.id)}
                                className="mt-0.5 focus:outline-none cursor-pointer group shrink-0"
                                title={assignment.isCompleted ? "未完了にする" : "完了にする"}
                              >
                                {assignment.isCompleted ? (
                                  <CheckCircle2 className="h-4.5 w-4.5 text-green-500 fill-green-50" />
                                ) : (
                                  <Circle className="h-4.5 w-4.5 text-slate-400 group-hover:text-emerald-500" style={{ color: courseColor }} />
                                )}
                              </button>

                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {/* Theme Colored Course Badge */}
                                  <span 
                                    className="px-2 py-0.5 rounded-md text-white text-[9px] font-extrabold shadow-3xs truncate max-w-full" 
                                    style={{ backgroundColor: courseColor }}
                                    title={assignment.course.name}
                                  >
                                    {assignment.course.name}
                                  </span>
                                  <span
                                    className={`text-[8px] font-extrabold px-1 rounded ${
                                      assignment.priority === "HIGH"
                                        ? "bg-red-100 text-red-800"
                                        : assignment.priority === "MEDIUM"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {assignment.priority === "HIGH" ? "高" : assignment.priority === "MEDIUM" ? "中" : "低"}
                                  </span>
                                </div>

                                <h3
                                  className={`text-xs font-bold ${
                                    assignment.isCompleted ? "line-through text-slate-400 font-medium" : "text-slate-800 font-extrabold"
                                  }`}
                                >
                                  {assignment.title}
                                </h3>

                                {assignment.fileUrl && (
                                  <div className="pt-0.5">
                                    <a
                                      href={assignment.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[9px] text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 px-1.5 py-0.5 rounded transition-all"
                                    >
                                      <FileText className="h-2.5 w-2.5 text-indigo-500" />
                                      <span>添付あり</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100/50 pt-2 mt-1">
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                <Clock className={`h-3 w-3 ${isOverdue ? "text-red-500" : "text-slate-400"}`} />
                                <span className={isOverdue ? "text-red-600 font-bold" : ""}>
                                  期限: {deadlineDate.toLocaleDateString("ja-JP", {
                                    month: "numeric",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              {isOverdue && (
                                <span className="bg-red-100 text-red-800 text-[8px] font-extrabold px-1 py-0.2 rounded">
                                  超過
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

        {/* Tab: Timetable (時間割) */}
        {activeTab === "timetable" && (
          <div id="timetable-view" className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    学期履修時間割
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    あなたが履修登録している授業（曜日・時限）が自動的に時間割に配置されます。授業をクリックすると詳細ページへジャンプします。
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("courses")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  授業を追加して時間割を埋める
                </button>
              </div>

              {/* Responsive Timetable Grid */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[800px] border-collapse bg-white text-center">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                      <th className="py-3 px-4 text-xs font-bold w-[100px] border-r border-slate-100">時限</th>
                      {["月", "火", "水", "木", "金", "土"].map((day) => (
                        <th key={day} className="py-3 px-4 text-xs font-bold border-r border-slate-100 last:border-r-0">
                          {day}曜日
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {["1", "2", "3", "4", "5", "6", "7"].map((period) => (
                      <tr key={period} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/30 transition-colors">
                        <td className="py-5 px-4 font-bold text-sm text-slate-500 bg-slate-50/50 border-r border-slate-200">
                          <div className="text-sm font-extrabold text-slate-800">{period}限</div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            {period === "1" ? "09:00~10:30" : 
                             period === "2" ? "10:45~12:15" : 
                             period === "3" ? "13:00~14:30" : 
                             period === "4" ? "14:45~16:15" : 
                             period === "5" ? "16:30~18:00" : 
                             period === "6" ? "18:10~19:40" : "19:50~21:20"}
                          </div>
                        </td>
                        {["月", "火", "水", "木", "金", "土"].map((day) => {
                          const course = enrolledCoursesList.find(
                            (c) => (c.dayOfWeek === day && String(c.period) === period)
                          );
                          const themeColor = course?.color || "#4f46e5";

                          return (
                            <td key={day} className="p-2 border-r border-slate-100 last:border-r-0 align-stretch min-h-[100px]">
                              {course ? (
                                <div
                                  onClick={() => {
                                    setSelectedCourse(course);
                                    setActiveTab("course-detail");
                                    setCourseDetailTab("materials");
                                  }}
                                  className="group p-3 rounded-lg border-l-4 text-left cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-between h-full min-h-[85px] border relative pr-7"
                                  style={{ 
                                    borderLeftColor: themeColor, 
                                    borderColor: `${themeColor}20`,
                                    backgroundColor: `${themeColor}08` 
                                  }}
                                >
                                  {/* Absolute dropdown button for Course Menu (Deregister, Syllabus) */}
                                  <div className="absolute top-2 right-1 z-10">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuCourseId(activeMenuCourseId === course.id ? null : course.id);
                                      }}
                                      className="p-1 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                                      title="メニューを開く"
                                    >
                                      <MoreVertical className="h-3.5 w-3.5" />
                                    </button>
                                    {activeMenuCourseId === course.id && (
                                      <div 
                                        className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 text-xs text-slate-700"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {course.syllabusUrl ? (
                                          <a
                                            href={course.syllabusUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-50 transition-colors font-medium text-slate-700"
                                            onClick={() => setActiveMenuCourseId(null)}
                                          >
                                            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                                            <span>シラバスを見る</span>
                                          </a>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              showToast("この授業にはシラバスのリンクが登録されていません。", true);
                                              setActiveMenuCourseId(null);
                                            }}
                                            className="w-full text-left flex items-center gap-1.5 px-3 py-2 hover:bg-slate-50 transition-colors font-medium text-slate-400 cursor-not-allowed"
                                          >
                                            <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
                                            <span>シラバス未登録</span>
                                          </button>
                                        )}
                                        <button
                                          onClick={() => {
                                            setActiveMenuCourseId(null);
                                            handleUnenroll(course.id);
                                          }}
                                          className="w-full text-left flex items-center gap-1.5 px-3 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors font-bold border-t border-slate-100 cursor-pointer"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                          <span>履修登録を解除</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-1 flex-wrap">
                                      <span className="text-[9px] font-bold font-mono px-1 py-0.2 rounded text-white shrink-0" style={{ backgroundColor: themeColor }}>
                                        {course.code}
                                      </span>
                                      {course.isOfficial ? (
                                        <span className="bg-blue-50 text-blue-700 text-[8px] font-extrabold px-1 rounded border border-blue-100 scale-90">
                                          公式
                                        </span>
                                      ) : (
                                        <span className="bg-slate-100 text-slate-500 text-[8px] font-bold px-1 rounded border border-slate-200 scale-90">
                                          生徒
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="font-extrabold text-slate-800 text-xs md:text-sm line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                                      {course.name}
                                    </h4>
                                  </div>
                                  <div className="mt-2 pt-1 border-t border-slate-100/50 flex justify-between items-center text-[10px] text-slate-400">
                                    <span className="truncate max-w-[80px]" title={course.classroom || "オンライン"}>
                                      {course.classroom || "教室未定"}
                                    </span>
                                    <span className="truncate max-w-[80px]" title={course.teacherName || ""}>
                                      {course.teacherName || "教員未定"}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => {
                                    setFilterDayOfWeek(day);
                                    setFilterPeriod(Number(period));
                                    setSearchQuery(""); // Clear text query
                                    setActiveTab("courses");
                                    showToast(`${day}曜${period}限の授業を共有データベースから検索しました！`);
                                  }}
                                  className="h-full min-h-[85px] border border-dashed border-slate-150 rounded-lg flex items-center justify-center p-2 text-slate-300 hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-400 cursor-pointer transition-all group"
                                  title="授業を登録する"
                                >
                                  <div className="text-center">
                                    <Plus className="h-4 w-4 mx-auto mb-1 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                    <span className="text-[10px] block opacity-0 group-hover:opacity-100 transition-opacity">授業登録</span>
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Keio University Useful Tools (慶應義塾大学 便利ツール) */}
        {activeTab === "tools" && (
          <div id="tools-view" className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 transform translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl space-y-2">
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-widest">
                  Academic Portals
                </span>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                  慶應義塾大学 学術支援・便利ツールポータル
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  大学での学習や履修申告、成績確認などで頻繁に利用する主要公式Webサイトへのダイレクトアクセスページです。シームレスな学習環境のハブとしてご活用ください。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: University Homepage */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">慶應義塾大学 公式ホームページ</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      大学全体の公式ニュース、学事日程、各学部・研究科のアナウンス、キャンパスイベント情報などを網羅した公式の玄関口です。
                    </p>
                  </div>
                </div>
                <a
                  href="https://www.keio.ac.jp/ja/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs py-2.5 rounded-lg text-center transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>ホームページを開く</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Card 2: Syllabus */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">シラバス検索システム (GSLBS)</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      全授業の講義内容、評価基準（期末試験、レポート比率など）、教科書・参考書情報、担当教員の講義計画などを詳細に調査できます。
                    </p>
                  </div>
                </div>
                <a
                  href="https://gslbs.keio.jp/syllabus/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-bold text-xs py-2.5 rounded-lg text-center transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>シラバスを開く</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Card 3: Student MyPage */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">塾生マイページ (Students portal)</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      学籍情報の確認、各種証明書の発行申請、大学からの個別・緊急お知らせ受信、学事日程や変更手続きの申請を行う重要な塾生専用窓口です。
                    </p>
                  </div>
                </div>
                <a
                  href="https://keiouniversity.my.site.com/students/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 font-bold text-xs py-2.5 rounded-lg text-center transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>塾生マイページを開く</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Card 4: Exam Timetable */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">期末試験時間割検索システム</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      学期末に行われる対面試験やオンライン試験の正確な実施日程、試験教室、特別持込物許可などの詳細情報を確認するための特設ポータルです。
                    </p>
                  </div>
                </div>
                <a
                  href="https://gexam.keio.jp/exam-tt/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 font-bold text-xs py-2.5 rounded-lg text-center transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>試験時間割を開く</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Card 5: Academic Grades Report */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 border border-red-100 shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">学業成績表確認システム</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      各期末の取得単位数、GPAの推移、成績評価(S・A・B・C等)、進級判定、卒業要件の充足状況をオンラインで照会するための高セキュリティシステムです。
                    </p>
                  </div>
                </div>
                <a
                  href="https://gacad.keio.jp/rcs/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 font-bold text-xs py-2.5 rounded-lg text-center transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>成績評価を確認する</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
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
                    {currentUser?.role === "TEACHER"
                      ? "登録されている授業を検索して登録・管理できます。登録することで、課題の管理や資料の追加、チャットなどが利用可能になります。"
                      : "誰かが登録した授業を検索して履修登録できます。履修登録することで、課題確認や学生間チャット、教員連絡窓口が利用可能になります。"}
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

              {/* Filter Row */}
              <div className="flex flex-wrap gap-3 items-center mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 shadow-xs">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                  <Filter className="h-3.5 w-3.5 text-indigo-500" />
                  時間割フィルター:
                </span>
                
                {/* Day of Week Filter Selector */}
                <select
                  value={filterDayOfWeek || ""}
                  onChange={(e) => setFilterDayOfWeek(e.target.value ? e.target.value : null)}
                  className="bg-white text-xs font-bold text-slate-700 rounded-lg px-3 py-1.5 border border-slate-200 outline-none cursor-pointer focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-2xs"
                >
                  <option value="">すべての曜日</option>
                  {["月", "火", "水", "木", "金", "土"].map((day) => (
                    <option key={day} value={day}>{day}曜日</option>
                  ))}
                </select>

                {/* Period Filter Selector */}
                <select
                  value={filterPeriod || ""}
                  onChange={(e) => setFilterPeriod(e.target.value ? Number(e.target.value) : null)}
                  className="bg-white text-xs font-bold text-slate-700 rounded-lg px-3 py-1.5 border border-slate-200 outline-none cursor-pointer focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-2xs"
                >
                  <option value="">すべての時限</option>
                  {["1", "2", "3", "4", "5", "6", "7"].map((p) => (
                    <option key={p} value={p}>{p}限</option>
                  ))}
                </select>

                {/* Active Filter Indicators */}
                {(filterDayOfWeek || filterPeriod) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-indigo-200">
                      現在: {filterDayOfWeek ? `${filterDayOfWeek}曜` : ""}{filterPeriod ? `${filterPeriod}限` : ""}
                    </span>
                    <button
                      onClick={() => {
                        setFilterDayOfWeek(null);
                        setFilterPeriod(null);
                        showToast("時間帯フィルターを解除しました。");
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200/50 rounded-lg px-2.5 py-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <span>フィルターをクリア</span>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
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
                  {filteredCourses.map((course) => {
                    const themeColor = course.color || "#4f46e5";
                    const displayTeacher = course.teacherName || (course.code === "CS101" || course.code === "MATH201" ? "佐藤 裕二 教授" : course.code === "LIT301" ? "山田 太郎 教授" : "未設定 教授");
                    return (
                      <div
                        key={course.id}
                        id={`course-card-${course.id}`}
                        className="border border-l-4 rounded-xl hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                        style={{ 
                          borderLeftColor: themeColor,
                          borderColor: `${themeColor}20`,
                          backgroundColor: `${themeColor}04`
                        }}
                      >
                        {/* Course Header Info */}
                        <div className="p-5 space-y-3">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: themeColor }}>
                                {course.code}
                              </span>
                              {course.dayOfWeek && course.period && (
                                <span className="bg-slate-100 text-slate-600 font-bold text-[9px] px-1.5 py-0.5 rounded">
                                  {course.dayOfWeek}曜{course.period}限
                                </span>
                              )}
                              {course.isOfficial ? (
                                <span className="bg-blue-50 text-blue-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-blue-100">
                                  教員公式
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-slate-200">
                                  生徒作成
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] bg-slate-50 text-slate-500 font-bold px-2 py-0.5 rounded border border-slate-150 shrink-0">
                              履修者: {course.enrollmentCount}名
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-base line-clamp-1">{course.name}</h3>
                          
                          {course.description && (
                            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{course.description}</p>
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
                                担当: {displayTeacher}
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
                                setCourseDetailTab("materials");
                              }}
                              className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer text-center"
                            >
                              詳細をひらく
                            </button>
                            <button
                              onClick={() => handleUnenroll(course.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 font-bold text-xs px-2.5 py-2 rounded-lg transition-colors cursor-pointer"
                              title={currentUser?.role === "TEACHER" ? "登録解除" : "履修解除"}
                            >
                              {currentUser?.role === "TEACHER" ? "登録解除" : "履修解除"}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course.id)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm text-center"
                          >
                            {currentUser?.role === "TEACHER" ? "この授業を登録する" : "この授業を履修登録する"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Selected Course Details */}
        {activeTab === "course-detail" && selectedCourse && (
          viewingAssignment ? (
            /* DEDICATED ASSIGNMENT VIEW */
            <div id="assignment-detail-view" className="space-y-6">
              {/* Back Button & Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setViewingAssignment(null);
                      setIsEditingAssignment(false);
                    }}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-bold py-1.5 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-250 transition-all shrink-0 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>講義詳細に戻る</span>
                  </button>
                  <div className="min-w-0">
                    <span className="inline-block bg-indigo-50 text-indigo-700 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border border-indigo-100 mb-0.5">
                      第 {viewingAssignment.week || 1} 回 講義課題
                    </span>
                    <h2 className="text-base font-black text-slate-900 truncate" title={viewingAssignment.title}>
                      {viewingAssignment.title}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded font-extrabold ${
                    viewingAssignment.priority === "HIGH" ? "bg-red-100 text-red-800" : viewingAssignment.priority === "MEDIUM" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    優先度: {viewingAssignment.priority === "HIGH" ? "高" : viewingAssignment.priority === "MEDIUM" ? "中" : "低"}
                  </span>
                  <span className="text-slate-400 font-bold">
                    期限: {new Date(viewingAssignment.deadline).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Assignment Content */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="h-4 w-4 text-slate-400" />
                        課題内容と添付資料
                      </h3>
                      {!viewingAssignment.isManual && currentUser?.role === "TEACHER" && (
                        <button
                          onClick={() => {
                            setEditAssignmentForm({
                              title: viewingAssignment.title,
                              description: viewingAssignment.description || "",
                              fileUrl: viewingAssignment.fileUrl || "",
                              fileName: viewingAssignment.fileName || "",
                              week: viewingAssignment.week || 1,
                              priority: viewingAssignment.priority,
                              deadline: viewingAssignment.deadline ? new Date(viewingAssignment.deadline).toISOString().substring(0, 16) : "",
                            });
                            setIsEditingAssignment(!isEditingAssignment);
                          }}
                          className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 border border-indigo-150 rounded-md px-2.5 py-1 transition-all cursor-pointer"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>{isEditingAssignment ? "編集をキャンセル" : "課題を編集"}</span>
                        </button>
                      )}
                    </div>

                    {isEditingAssignment ? (
                      /* TEACHER EDIT FORM */
                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">課題タイトル</label>
                            <input
                              type="text"
                              value={editAssignmentForm.title}
                              onChange={(e) => setEditAssignmentForm({ ...editAssignmentForm, title: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">講義回 (Week)</label>
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={editAssignmentForm.week}
                              onChange={(e) => setEditAssignmentForm({ ...editAssignmentForm, week: parseInt(e.target.value) || 1 })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">課題の説明・要件</label>
                          <textarea
                            rows={6}
                            value={editAssignmentForm.description}
                            onChange={(e) => setEditAssignmentForm({ ...editAssignmentForm, description: e.target.value })}
                            placeholder="提出フォーマットや要件を記述してください..."
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">優先度</label>
                            <select
                              value={editAssignmentForm.priority}
                              onChange={(e) => setEditAssignmentForm({ ...editAssignmentForm, priority: e.target.value as any })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
                            >
                              <option value="HIGH">高 (HIGH)</option>
                              <option value="MEDIUM">中 (MEDIUM)</option>
                              <option value="LOW">低 (LOW)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">提出期限</label>
                            <input
                              type="datetime-local"
                              value={editAssignmentForm.deadline}
                              onChange={(e) => setEditAssignmentForm({ ...editAssignmentForm, deadline: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-slate-100 pt-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">課題添付ファイルのアップロード (パソコンから直接)</label>
                            <div
                              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 rounded-lg p-4 text-center cursor-pointer transition-all relative"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const files = e.dataTransfer.files;
                                if (files && files.length > 0) {
                                  handleFileUpload(files[0], (url, name) => {
                                    setEditAssignmentForm((prev) => ({ ...prev, fileUrl: url, fileName: name }));
                                  });
                                }
                              }}
                              onClick={() => {
                                const fileInput = document.getElementById("edit-task-file-input");
                                if (fileInput) fileInput.click();
                              }}
                            >
                              <input
                                id="edit-task-file-input"
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files && files.length > 0) {
                                    handleFileUpload(files[0], (url, name) => {
                                      setEditAssignmentForm((prev) => ({ ...prev, fileUrl: url, fileName: name }));
                                    });
                                  }
                                }}
                              />
                              {uploading ? (
                                <div className="text-slate-500 text-xs py-2 flex flex-col items-center gap-1">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                                  <span>アップロード中...</span>
                                </div>
                              ) : editAssignmentForm.fileUrl && editAssignmentForm.fileUrl.startsWith("/uploads/") ? (
                                <div className="text-emerald-600 text-xs font-semibold flex flex-col items-center gap-1">
                                  <FileText className="h-5 w-5 text-emerald-500" />
                                  <span className="truncate max-w-full">添付済み: {editAssignmentForm.fileName}</span>
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

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">添付ファイル名</label>
                              <input
                                type="text"
                                value={editAssignmentForm.fileName}
                                onChange={(e) => setEditAssignmentForm({ ...editAssignmentForm, fileName: e.target.value })}
                                placeholder="例: レポート用紙.docx"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">添付ファイルURL / リンク</label>
                              <input
                                type="text"
                                value={editAssignmentForm.fileUrl}
                                onChange={(e) => setEditAssignmentForm({ ...editAssignmentForm, fileUrl: e.target.value })}
                                placeholder="例: https://drive.google.com/..."
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleUpdateAssignmentDetails(viewingAssignment.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            課題内容を保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* DESCRIPTION DISPLAY */
                      <div className="space-y-4">
                        <div className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                          {viewingAssignment.description || "この課題には詳細な説明はありません。"}
                        </div>

                        {viewingAssignment.fileUrl && (
                          <div className="bg-indigo-50/30 p-3.5 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
                              <span className="font-extrabold text-indigo-900 truncate">
                                {viewingAssignment.fileName || "添付配布資料"}
                              </span>
                            </div>
                            <a
                              href={viewingAssignment.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Download className="h-3 w-3" />
                              <span>ダウンロード</span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Submission Form (Students) or Student List (Teachers) */}
                <div className="space-y-6">
                  {currentUser?.role === "STUDENT" ? (
                    /* STUDENT SUBMISSION WORKSPACE */
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 pb-3">
                        <Upload className="h-4 w-4 text-slate-400" />
                        あなたの提出ステータス
                      </h3>

                      <div className="text-xs space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-bold">提出状況:</span>
                          {viewingAssignment.isCompleted ? (
                            <span className="bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              提出済み
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded-md">
                              未提出
                            </span>
                          )}
                        </div>

                        {/* Submission inputs */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">提出物コメント / レポート要約</label>
                            <textarea
                              rows={4}
                              placeholder="教員への連絡事項や、提出コメントを入力してください..."
                              value={submissionComment}
                              onChange={(e) => setSubmissionComment(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">提出ファイルのアップロード (パソコンから直接)</label>
                              <div
                                className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50 rounded-lg p-4 text-center cursor-pointer transition-all relative"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const files = e.dataTransfer.files;
                                  if (files && files.length > 0) {
                                    handleFileUpload(files[0], (url, name) => {
                                      setSubmissionFileUrl(url);
                                      setSubmissionFileName(name);
                                    });
                                  }
                                }}
                                onClick={() => {
                                  const fileInput = document.getElementById("submission-file-input");
                                  if (fileInput) fileInput.click();
                                }}
                              >
                                <input
                                  id="submission-file-input"
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    const files = e.target.files;
                                    if (files && files.length > 0) {
                                      handleFileUpload(files[0], (url, name) => {
                                        setSubmissionFileUrl(url);
                                        setSubmissionFileName(name);
                                      });
                                    }
                                  }}
                                />
                                {uploading ? (
                                  <div className="text-slate-500 text-xs py-2 flex flex-col items-center gap-1">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                                    <span>アップロード中...</span>
                                  </div>
                                ) : submissionFileUrl && submissionFileUrl.startsWith("/uploads/") ? (
                                  <div className="text-emerald-600 text-xs font-semibold flex flex-col items-center gap-1">
                                    <FileText className="h-5 w-5 text-emerald-500" />
                                    <span className="truncate max-w-full">添付済み: {submissionFileName}</span>
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

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">添付ファイル名</label>
                                <input
                                  type="text"
                                  placeholder="例: レポート.pdf"
                                  value={submissionFileName}
                                  onChange={(e) => setSubmissionFileName(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">ファイルリンクURL</label>
                                <input
                                  type="text"
                                  placeholder="例: https://..."
                                  value={submissionFileUrl}
                                  onChange={(e) => setSubmissionFileUrl(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSubmitAssignment(viewingAssignment.id)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-2 rounded-lg text-xs transition-colors cursor-pointer text-center"
                          >
                            {viewingAssignment.isCompleted ? "提出物を更新する" : "課題を提出する"}
                          </button>
                        </div>

                        {/* Teacher's Reply Feedback */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2 mt-4">
                          <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <CornerDownRight className="h-3.5 w-3.5 text-slate-400" />
                            教員からのフィードバック
                          </h4>
                          {viewingAssignment.teacherComment ? (
                            <p className="text-slate-800 font-medium leading-relaxed italic whitespace-pre-wrap">
                              {viewingAssignment.teacherComment}
                            </p>
                          ) : (
                            <p className="text-slate-400 text-center py-2">
                              教員からのフィードバックコメントはまだありません（任意）。
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* TEACHER GRADING / FEEDBACK WORKSPACE */
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 pb-3">
                        <ClipboardList className="h-4 w-4 text-slate-400" />
                        受講生の提出一覧・フィードバック
                      </h3>

                      <div className="text-xs space-y-4 max-h-[500px] overflow-y-auto pr-1">
                        {assignmentSubmissions.length === 0 ? (
                          <p className="text-slate-400 text-center py-8">
                            この授業の履修学生はいません。
                          </p>
                        ) : (
                          assignmentSubmissions.map((sub) => (
                            <div key={sub.userId} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2.5">
                              <div className="flex justify-between items-center flex-wrap gap-1">
                                <div>
                                  <h4 className="font-extrabold text-slate-800 text-[13px]">{sub.userName}</h4>
                                  <p className="text-[10px] text-slate-400">{sub.userEmail}</p>
                                </div>
                                {sub.isCompleted ? (
                                  <span className="bg-green-100 text-green-800 font-extrabold text-[9px] px-2 py-0.5 rounded-md">
                                    提出済み
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-500 font-extrabold text-[9px] px-2 py-0.5 rounded-md">
                                    未提出
                                  </span>
                                )}
                              </div>

                              {sub.isCompleted && (
                                <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-150 text-[11px]">
                                  {sub.submittedAt && (
                                    <p className="text-[10px] text-slate-400">
                                      提出日時: {new Date(sub.submittedAt).toLocaleString("ja-JP")}
                                    </p>
                                  )}
                                  <div className="text-slate-700 leading-normal">
                                    <span className="font-bold text-slate-400 block mb-0.5">学生コメント:</span>
                                    {sub.submissionComment || "(コメントなし)"}
                                  </div>
                                  {sub.submissionFileUrl && (
                                    <div className="pt-1.5">
                                      <a
                                        href={sub.submissionFileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-2 py-1 rounded transition-colors"
                                      >
                                        <FileText className="h-3 w-3" />
                                        <span>添付: {sub.submissionFileName || "添付ファイル"}</span>
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Feedback text area */}
                              <div className="space-y-1 pt-1">
                                <label className="block text-[10px] font-bold text-slate-400">教員の返答・指導コメント（任意）</label>
                                <textarea
                                  rows={2}
                                  placeholder="フィードバックコメントを入力..."
                                  value={teacherFeedbackTexts[sub.userId] || ""}
                                  onChange={(e) => setTeacherFeedbackTexts({
                                    ...teacherFeedbackTexts,
                                    [sub.userId]: e.target.value
                                  })}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] focus:outline-none"
                                />
                                <div className="flex justify-end pt-1">
                                  <button
                                    onClick={() => handleSaveFeedback(viewingAssignment.id, sub.userId)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1 rounded-md text-[10px] transition-colors cursor-pointer"
                                  >
                                    返信を保存
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* STANDARD COURSE DETAIL VIEW WITH SUB-TABS */
            <div id="course-detail-view" className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
              
              {/* Super Compact Course Header Bar (Spans all 4 columns) */}
              <div className="lg:col-span-4 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="bg-indigo-50 text-indigo-700 font-mono text-xs font-black px-2 py-0.5 rounded border border-indigo-150 shrink-0">
                    {selectedCourse.code}
                  </span>
                  <h2 className="text-sm font-black text-slate-900 truncate" title={selectedCourse.name}>
                    {selectedCourse.name}
                  </h2>
                  <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 border-l border-slate-200 pl-3">
                    <span className="font-semibold text-slate-400">教室:</span>
                    <span className="font-bold text-slate-700">{selectedCourse.classroom || "未登録"}</span>
                    <span className="mx-1 text-slate-300">•</span>
                    <span className="font-semibold text-slate-400">担当教員:</span>
                    <span className="font-bold text-slate-700">
                      {selectedCourse.teacherName || (selectedCourse.code === "CS101" || selectedCourse.code === "MATH201" ? "佐藤 裕二 教授" : "山田 太郎 教授")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-[11px] sm:justify-end">
                  <div className="flex md:hidden items-center gap-2 text-slate-500 mr-2">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {selectedCourse.classroom || "教室未定"}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {selectedCourse.teacherName || "佐藤 裕二 教授"}
                    </span>
                  </div>
                  {selectedCourse.syllabusUrl && (
                    <a
                      href={selectedCourse.syllabusUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-[10px] px-2.5 py-1 rounded inline-flex items-center gap-1 border border-slate-200 transition-colors shrink-0"
                    >
                      <span>シラバス</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCourse(null);
                      setViewingAssignment(null);
                      setActiveTab("dashboard");
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] px-2.5 py-1 rounded border border-slate-200 transition-colors shrink-0 cursor-pointer"
                  >
                    閉じる
                  </button>
                </div>
              </div>

              {/* Left main area: Main Interactive Tab Card */}
              <div className="lg:col-span-3 space-y-6 order-1 lg:order-1">
              <div id="course-interactive-card" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Secondary navigation tab list inside course detail */}
                <div className="flex border-b border-slate-100 bg-slate-50/50 px-4">
                  <button
                    id="subtab-materials"
                    onClick={() => setCourseDetailTab("materials")}
                    className="py-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5"
                    style={{
                      borderColor: courseDetailTab === "materials" ? (selectedCourse.color || "#4f46e5") : "transparent",
                      color: courseDetailTab === "materials" ? (selectedCourse.color || "#4f46e5") : "rgb(100 116 139)"
                    }}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    授業資料・課題（講義回ごと）
                  </button>
                  <button
                    id="subtab-chat"
                    onClick={() => setCourseDetailTab("chat")}
                    className="py-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1"
                    style={{
                      borderColor: courseDetailTab === "chat" ? (selectedCourse.color || "#4f46e5") : "transparent",
                      color: courseDetailTab === "chat" ? (selectedCourse.color || "#4f46e5") : "rgb(100 116 139)"
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    学生専用プライベートチャット
                  </button>
                  <button
                    id="subtab-contact"
                    onClick={() => setCourseDetailTab("contact")}
                    className="py-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1"
                    style={{
                      borderColor: courseDetailTab === "contact" ? (selectedCourse.color || "#4f46e5") : "transparent",
                      color: courseDetailTab === "contact" ? (selectedCourse.color || "#4f46e5") : "rgb(100 116 139)"
                    }}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    教員問い合わせ窓口
                  </button>
                </div>

                {/* Sub-tab: Grouped Materials and Assignments by Week */}
                {courseDetailTab === "materials" && (
                  <div className="p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-2 border-b border-slate-100 gap-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">授業資料・課題（講義回ごと）</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          講義回ごとに整理された講義資料、配布スライド、および提出課題を確認できます。
                        </p>
                      </div>
                      {currentUser?.role === "TEACHER" && (
                        <div className="flex items-center gap-2 flex-wrap">
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
                            className="text-white font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-opacity shadow-sm cursor-pointer hover:opacity-90 bg-emerald-600"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            新規資料を登録
                          </button>
                          <button
                            onClick={() => {
                              setNewTask({
                                title: "",
                                description: "",
                                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
                                priority: "MEDIUM",
                                courseId: String(selectedCourse.id),
                                fileUrl: "",
                                fileName: "",
                                week: materials.length > 0 ? Math.max(...materials.map(m => m.week)) : 1,
                              });
                              setShowAddTaskModal(true);
                            }}
                            className="text-white font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-opacity shadow-sm cursor-pointer hover:opacity-90"
                            style={{ backgroundColor: selectedCourse.color || "#4f46e5" }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            公式課題を配信
                          </button>
                        </div>
                      )}
                    </div>

                    {materials.length === 0 && visibleAssignments.filter(a => a.courseId === selectedCourse.id).length === 0 ? (
                      <div className="text-center py-16 text-slate-400 border border-dashed border-slate-100 rounded-xl bg-slate-50/20">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm font-medium">登録されている資料・課題はありません。</p>
                        {currentUser?.role === "TEACHER" && (
                          <p className="text-xs text-slate-400 mt-1">
                            上のボタンから講義資料や配信課題を登録できます。
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Array.from(new Set([
                          ...materials.map(m => m.week),
                          ...visibleAssignments.filter(a => a.courseId === selectedCourse.id).map(a => a.week || 1)
                        ])).sort((a, b) => a - b).map((w) => {
                          const weekMaterials = materials.filter(m => m.week === w);
                          const weekAssignments = visibleAssignments.filter(a => a.courseId === selectedCourse.id && (a.week || 1) === w);

                          // Skip rendering empty weeks if there are no items in it AND it's not week 1
                          if (weekMaterials.length === 0 && weekAssignments.length === 0 && w !== 1) return null;

                          return (
                            <div key={w} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-indigo-100 transition-all">
                              {/* Week Header */}
                              <div 
                                className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100"
                                style={{ backgroundColor: `${selectedCourse.color || "#4f46e5"}08` }}
                              >
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0"
                                    style={{
                                      color: selectedCourse.color || "#4f46e5",
                                      backgroundColor: `${selectedCourse.color || "#4f46e5"}12`,
                                      borderColor: `${selectedCourse.color || "#4f46e5"}25`
                                    }}
                                  >
                                    第{w}回 講義
                                  </span>
                                  <span className="text-xs font-semibold text-slate-500">
                                    資料と課題
                                  </span>
                                </div>
                              </div>

                              <div className="p-4 space-y-4">
                                {/* Section 1: Materials */}
                                <div>
                                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                                    講義資料
                                  </h4>
                                  {weekMaterials.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic pl-1">この回の授業資料はまだ登録されていません。</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {weekMaterials.map((m) => (
                                        <div key={m.id} className="p-3 rounded-lg border border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                                          <div className="min-w-0 flex-1 space-y-0.5">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="bg-slate-100 text-slate-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">資料</span>
                                              <h5 className="font-bold text-slate-800 truncate" title={m.title}>{m.title}</h5>
                                            </div>
                                            {m.description && <p className="text-[11px] text-slate-500 line-clamp-2">{m.description}</p>}
                                          </div>

                                          <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                                            {m.fileUrl ? (
                                              <a
                                                href={m.fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 hover:border-emerald-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
                                                title={m.fileName || "資料を開く"}
                                              >
                                                {m.fileUrl.startsWith("/uploads/") ? (
                                                  <FileText className="h-3 w-3 text-emerald-600" />
                                                ) : (
                                                  <Download className="h-3 w-3" />
                                                )}
                                                <span className="max-w-[100px] truncate">{m.fileName || "資料を開く"}</span>
                                              </a>
                                            ) : (
                                              <span className="text-[10px] text-slate-400 font-medium">リンクなし</span>
                                            )}
                                            {currentUser?.role === "TEACHER" && (
                                              <button
                                                onClick={() => handleDeleteMaterial(m.id)}
                                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 p-1.5 rounded-lg transition-colors cursor-pointer"
                                                title="資料を削除"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Section 2: Assignments */}
                                <div className="border-t border-slate-100 pt-3">
                                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
                                    講義課題
                                  </h4>
                                  {weekAssignments.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic pl-1">この回の課題は設定されていません。</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {weekAssignments.map((a) => (
                                        <div 
                                          key={a.id} 
                                          onClick={() => {
                                            setViewingAssignment(a);
                                            fetchSubmissions(a.id);
                                          }}
                                          className={`p-3 rounded-lg border flex justify-between items-center text-xs transition-all cursor-pointer hover:shadow-xs ${
                                            a.isCompleted 
                                              ? "bg-green-50/20 border-green-150 text-slate-600" 
                                              : "bg-indigo-50/10 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/5 text-slate-800"
                                          }`}
                                        >
                                          <div className="min-w-0 flex-1 flex items-center gap-2.5">
                                            {currentUser?.role === "STUDENT" && (
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation(); // Avoid opening assignment detail if only checking box
                                                  handleToggleAssignment(a.id);
                                                }} 
                                                className="cursor-pointer shrink-0"
                                              >
                                                {a.isCompleted ? (
                                                  <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />
                                                ) : (
                                                  <Circle className="h-4.5 w-4.5 text-slate-300 hover:text-indigo-500" />
                                                )}
                                              </button>
                                            )}
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`text-[8px] px-1 py-0.2 rounded font-extrabold shrink-0 ${
                                                  a.priority === "HIGH" ? "bg-red-100 text-red-800" : a.priority === "MEDIUM" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                                                }`}>
                                                  {a.priority === "HIGH" ? "高" : a.priority === "MEDIUM" ? "中" : "低"}
                                                </span>
                                                <span className="font-bold hover:underline truncate">{a.title}</span>
                                              </div>
                                              {a.description && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{a.description}</p>}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 shrink-0 text-[10px] pl-2 font-medium text-slate-400">
                                            <span>期限: {new Date(a.deadline).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                            <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                                      ? "text-white rounded-tr-none"
                                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                                  }`}
                                  style={{
                                    backgroundColor: chat.userId === currentUser?.id ? (selectedCourse.color || "#4f46e5") : undefined
                                  }}
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
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1"
                            style={{
                              borderColor: newMessage ? (selectedCourse.color || "#4f46e5") : "rgb(226 232 240)"
                            }}
                          />
                          <button
                            type="submit"
                            className="text-white font-bold px-4 py-2 rounded-lg text-xs transition-opacity flex items-center gap-1 cursor-pointer hover:opacity-90"
                            style={{
                              backgroundColor: selectedCourse.color || "#4f46e5"
                            }}
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
                    <div 
                      className="text-xs p-3.5 rounded-lg border"
                      style={{
                        backgroundColor: `${selectedCourse.color || "#4f46e5"}08`,
                        borderColor: `${selectedCourse.color || "#4f46e5"}25`,
                        color: selectedCourse.color || "#4f46e5"
                      }}
                    >
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
                              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-1"
                              style={{
                                borderColor: newInquiry.subject ? (selectedCourse.color || "#4f46e5") : "rgb(226 232 240)"
                              }}
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
                              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1"
                              style={{
                                borderColor: newInquiry.message ? (selectedCourse.color || "#4f46e5") : "rgb(226 232 240)"
                              }}
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className="text-white font-bold px-4.5 py-2 rounded-lg text-xs transition-opacity cursor-pointer shadow-sm hover:opacity-90"
                              style={{
                                backgroundColor: selectedCourse.color || "#4f46e5"
                              }}
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

            {/* Right Sidebar: Incomplete assignments widget (students) or Basic info summary (teachers) */}
            <div className="lg:col-span-1 space-y-4 order-2 lg:order-2">
              {currentUser?.role === "STUDENT" ? (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3.5 animate-fade-in">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <ClipboardList className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                    <h3 className="text-xs font-extrabold text-slate-750 uppercase tracking-wider">
                      未完了の講義課題
                    </h3>
                    {/* Count Badge */}
                    {visibleAssignments.filter(a => a.courseId === selectedCourse.id && !a.isCompleted).length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                        {visibleAssignments.filter(a => a.courseId === selectedCourse.id && !a.isCompleted).length}
                      </span>
                    )}
                  </div>

                  {visibleAssignments.filter(a => a.courseId === selectedCourse.id && !a.isCompleted).length === 0 ? (
                    <div className="text-center py-6 text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-150">
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-1.5" />
                      <p className="text-[11px] font-bold text-green-700">すべての課題を完了しました！</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {visibleAssignments
                        .filter(a => a.courseId === selectedCourse.id && !a.isCompleted)
                        .map((a) => (
                          <div 
                            key={a.id}
                            onClick={() => {
                              setViewingAssignment(a);
                              fetchSubmissions(a.id);
                            }}
                            className="p-2.5 rounded-lg border border-slate-150 bg-amber-50/10 hover:bg-amber-50/30 hover:border-amber-200 transition-all cursor-pointer text-[11px] space-y-1"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-extrabold text-slate-800 line-clamp-2 hover:underline">
                                {a.title}
                              </span>
                              <span className={`text-[8px] px-1 py-0.2 rounded font-extrabold shrink-0 ${
                                a.priority === "HIGH" ? "bg-red-100 text-red-800" : a.priority === "MEDIUM" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                              }`}>
                                {a.priority === "HIGH" ? "高" : a.priority === "MEDIUM" ? "中" : "低"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>第{a.week || 1}回</span>
                              <span className="text-red-600 font-medium">
                                期限: {new Date(a.deadline).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                /* TEACHER BASIC INFO SUMMARY */
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <User className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                    <h3 className="text-xs font-extrabold text-slate-750 uppercase tracking-wider">
                      授業情報
                    </h3>
                  </div>

                  <div className="space-y-2 text-[11px] text-slate-600">
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-50">
                      <span className="font-semibold text-slate-400">教室</span>
                      <span className="font-bold text-slate-800">{selectedCourse.classroom || "未登録"}</span>
                    </div>
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-50">
                      <span className="font-semibold text-slate-400">担当教員</span>
                      <span className="font-bold text-slate-800">
                        {selectedCourse.teacherName || "佐藤 裕二 教授"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-400">連絡先</span>
                      <span className="font-medium text-slate-650 truncate max-w-[130px]" title={selectedCourse.teacherContact || "未登録"}>
                        {selectedCourse.teacherContact || "未登録"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">曜日 *</label>
                  <select
                    required
                    value={newCourse.dayOfWeek}
                    onChange={(e) => setNewCourse((prev) => ({ ...prev, dayOfWeek: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">曜日を選択...</option>
                    {["月", "火", "水", "木", "金", "土"].map((day) => (
                      <option key={day} value={day}>{day}曜日</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">時限 *</label>
                  <select
                    required
                    value={newCourse.period}
                    onChange={(e) => setNewCourse((prev) => ({ ...prev, period: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">時限を選択...</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                      <option key={p} value={p.toString()}>{p}限</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">担当教員名 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例: 佐藤 教授"
                    value={newCourse.teacherName}
                    onChange={(e) => setNewCourse((prev) => ({ ...prev, teacherName: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">授業のテーマ色 (マイダッシュボード等に反映)</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    "#4f46e5", // Indigo
                    "#059669", // Emerald
                    "#db2777", // Pink
                    "#d97706", // Amber
                    "#2563eb", // Blue
                    "#7c3aed", // Violet
                    "#0891b2", // Cyan
                    "#0d9488", // Teal
                    "#dc2626", // Red
                    "#4b5563"  // Gray
                  ].map((colorCode) => (
                    <button
                      key={colorCode}
                      type="button"
                      onClick={() => setNewCourse((prev) => ({ ...prev, color: colorCode }))}
                      className={`h-6 w-6 rounded-full border transition-all cursor-pointer ${
                        newCourse.color === colorCode
                          ? "ring-2 ring-indigo-500 scale-110 border-white"
                          : "border-slate-300 hover:scale-105"
                      }`}
                      style={{ backgroundColor: colorCode }}
                    />
                  ))}
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

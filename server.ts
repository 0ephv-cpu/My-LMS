import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import fs from "fs";

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(uploadsDir));


// Seeding function
async function seedDatabase() {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log("Seeding database with default mock data...");

    // Create Users
    const alice = await prisma.user.create({
      data: {
        id: "student-1",
        name: "アリス (学生)",
        email: "alice@example.com",
        role: "STUDENT",
      },
    });

    const bob = await prisma.user.create({
      data: {
        id: "student-2",
        name: "ボブ (学生)",
        email: "bob@example.com",
        role: "STUDENT",
      },
    });

    const teacher = await prisma.user.create({
      data: {
        id: "teacher-1",
        name: "佐藤教授 (教員)",
        email: "sato@example.com",
        role: "TEACHER",
      },
    });

    // Create Courses
    const cs101 = await prisma.course.create({
      data: {
        code: "CS101",
        name: "コンピュータサイエンス入門",
        description: "プログラミングの基礎とアルゴリズムについて学びます。",
        syllabusUrl: "https://syllabus.univ.ac.jp/cs101",
        classroom: "4号館 401教室",
        teacherContact: "sato@example.com (佐藤研究室)",
        teacherId: teacher.id,
      },
    });

    const math201 = await prisma.course.create({
      data: {
        code: "MATH201",
        name: "解析学 II",
        description: "微分積分の応用と多変数関数の微分積分を扱います。",
        syllabusUrl: "https://syllabus.univ.ac.jp/math201",
        classroom: "1号館 102教室",
        teacherContact: "sato@example.com (佐藤研究室)",
        teacherId: teacher.id,
      },
    });

    const literature301 = await prisma.course.create({
      data: {
        code: "LIT301",
        name: "現代日本文学論",
        description: "夏目漱石から村上春樹にいたる現代文学の潮流を探求します。",
        syllabusUrl: "https://syllabus.univ.ac.jp/lit301",
        classroom: "2号館 204教室",
        teacherContact: "yamada@example.com (山田研究室)",
        teacherId: "teacher-2",
      },
    });

    // Enrollments
    await prisma.enrollment.createMany({
      data: [
        { userId: alice.id, courseId: cs101.id },
        { userId: alice.id, courseId: math201.id },
        { userId: bob.id, courseId: cs101.id },
        { userId: bob.id, courseId: literature301.id },
      ],
    });

    // Assignments
    const now = new Date();

    await prisma.assignment.createMany({
      data: [
        {
          title: "中間プログラミング課題",
          description: "配列とループを用いたデータ集計プログラムの作成。",
          courseId: cs101.id,
          isManual: false,
          priority: "HIGH",
          deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        },
        {
          title: "確認小テスト 2",
          description: "第4回の講義スライドを復習して解答してください。",
          courseId: cs101.id,
          isManual: false,
          priority: "MEDIUM",
          deadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        },
        {
          title: "微分積分課題 3",
          description: "第5章の練習問題 1〜5を解いてPDFで提出。",
          courseId: math201.id,
          isManual: false,
          priority: "LOW",
          deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        },
        // Alice manual assignment
        {
          title: "アリスの自主学習用タスク",
          description: "参考書「よくわかるアルゴリズム」第2章を読む。",
          courseId: cs101.id,
          isManual: true,
          userId: alice.id,
          priority: "HIGH",
          deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        },
      ],
    });

    // Student chat message
    await prisma.chatMessage.createMany({
      data: [
        {
          courseId: cs101.id,
          userId: alice.id,
          userName: "アリス (学生)",
          message: "プログラミング課題の問2、どうやって解いた？",
        },
        {
          courseId: cs101.id,
          userId: bob.id,
          userName: "ボブ (学生)",
          message: "ループを使って配列の要素を合計したよ！",
        },
      ],
    });

    // Contact teacher
    await prisma.contact.create({
      data: {
        courseId: cs101.id,
        userId: alice.id,
        userName: "アリス (学生)",
        subject: "体調不良による講義欠席の相談",
        message: "明日の講義を風邪のため欠席させていただきます。スライド資料はLMSから閲覧可能でしょうか。",
        reply: "お大事に。講義資料はすべてLMSのシラバスリンクからダウンロードできますので確認してください。",
      },
    });

    // Seeding lecture materials
    await prisma.lectureMaterial.createMany({
      data: [
        {
          courseId: cs101.id,
          title: "第1回 イントロダクション＆環境構築",
          description: "講義の進め方と、Node.js / VS Code のセットアップ手順についてのスライドです。",
          fileUrl: "https://example.com/slides/cs101-week1.pdf",
          week: 1,
          teacherName: "佐藤 裕二 教授",
        },
        {
          courseId: cs101.id,
          title: "第2回 基本的なデータ型と変数",
          description: "JavaScript/TypeScript における変数宣言、数値、文字列、真偽値の基礎講義資料。",
          fileUrl: "https://example.com/slides/cs101-week2.pdf",
          week: 2,
          teacherName: "佐藤 裕二 教授",
        },
        {
          courseId: cs101.id,
          title: "第3回 [特別講義] Webフロントエンド最前線",
          description: "ゲスト講師を招き、現代のSPA開発手法とフレームワーク（React, Vite）の変遷を学びます。",
          fileUrl: "https://example.com/slides/cs101-week3-guest.pdf",
          week: 3,
          teacherName: "鈴木 健一 特任教授 (ゲスト講師)",
        },
        {
          courseId: math201.id,
          title: "第1回 多変数関数の極限",
          description: "2変数関数の極限と連続性の定義、例題の解説資料です。",
          fileUrl: "https://example.com/slides/math201-week1.pdf",
          week: 1,
          teacherName: "高橋 直樹 准教授",
        }
      ]
    });

    console.log("Database seeded successfully!");
  }
}

async function seedMaterialsForExisting() {
  try {
    const materialCount = await prisma.lectureMaterial.count();
    if (materialCount === 0) {
      console.log("Seeding existing database with lecture materials...");
      const cs101 = await prisma.course.findUnique({ where: { code: "CS101" } });
      const math201 = await prisma.course.findUnique({ where: { code: "MATH201" } });
      
      if (cs101) {
        await prisma.lectureMaterial.createMany({
          data: [
            {
              courseId: cs101.id,
              title: "第1回 イントロダクション＆環境構築",
              description: "講義の進め方と、Node.js / VS Code のセットアップ手順についてのスライドです。",
              fileUrl: "https://example.com/slides/cs101-week1.pdf",
              week: 1,
              teacherName: "佐藤 裕二 教授",
            },
            {
              courseId: cs101.id,
              title: "第2回 基本的なデータ型と変数",
              description: "JavaScript/TypeScript における変数宣言、数値、文字列、真偽値の基礎講義資料。",
              fileUrl: "https://example.com/slides/cs101-week2.pdf",
              week: 2,
              teacherName: "佐藤 裕二 教授",
            },
            {
              courseId: cs101.id,
              title: "第3回 [特別講義] Webフロントエンド最前線",
              description: "ゲスト講師を招き、現代のSPA開発手法とフレームワーク（React, Vite）の変遷を学びます。",
              fileUrl: "https://example.com/slides/cs101-week3-guest.pdf",
              week: 3,
              teacherName: "鈴木 健一 特任教授 (ゲスト講師)",
            }
          ]
        });
      }
      if (math201) {
        await prisma.lectureMaterial.createMany({
          data: [
            {
              courseId: math201.id,
              title: "第1回 多変数関数の極限",
              description: "2変数関数の極限と連続性の定義、例題の解説資料です。",
              fileUrl: "https://example.com/slides/math201-week1.pdf",
              week: 1,
              teacherName: "高橋 直樹 准教授",
            }
          ]
        });
      }
      console.log("Lecture materials seeded successfully for existing database!");
    }
  } catch (err) {
    console.error("Failed to seed materials for existing database:", err);
  }
}

// Ensure database is seeded
seedDatabase()
  .then(() => seedMaterialsForExisting())
  .catch((e) => {
    console.error("Failed to seed database:", e);
  });

// Helper to get current user based on x-user-id header
async function getCurrentUser(req: express.Request) {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

// Multer storage configurations for local file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    // Sanitize slightly, supporting Japanese characters
    const safeBasename = basename.replace(/[^a-zA-Z0-9\u3000-\u30fe\u4e00-\u9fa5]/g, "_");
    cb(null, `${safeBasename}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB size limit
});

// POST /api/upload - Handle physical file upload from computer
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!req.file) {
      return res.status(400).json({ error: "ファイルが添付されていません。" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      fileUrl,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error("Upload endpoint error:", error);
    res.status(500).json({ error: "ファイルのアップロードに失敗しました。" });
  }
});

// --- API ENDPOINTS ---

// GET /api/users - List users for prototype switching
app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/courses - List all available courses
app.get("/api/courses", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const courses = await prisma.course.findMany({
      include: {
        enrollments: true,
      },
    });

    // Map courses to indicate if current user is enrolled
    const parsedCourses = courses.map((course) => {
      const isEnrolled = user
        ? course.enrollments.some((e) => e.userId === user.id)
        : false;
      return {
        ...course,
        isEnrolled,
        enrollmentCount: course.enrollments.length,
      };
    });

    res.json(parsedCourses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// POST /api/courses - Create a new course (user becomes owner if teacher)
app.post("/api/courses", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const { code, name, description, syllabusUrl, classroom, teacherContact } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: "Code and Name are required" });
    }

    const course = await prisma.course.create({
      data: {
        code,
        name,
        description,
        syllabusUrl,
        classroom,
        teacherContact: teacherContact || (user && user.role === "TEACHER" ? `${user.email} (${user.name})` : undefined),
        teacherId: user && user.role === "TEACHER" ? user.id : "teacher-1",
      },
    });

    // Auto enroll the creator as a teacher or mock participant if needed
    if (user) {
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
        },
      }).catch(() => {}); // ignore duplicates
    }

    res.json(course);
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(400).json({ error: "その授業コード (Course Code) は既に登録されています" });
    } else {
      res.status(500).json({ error: "Failed to create course" });
    }
  }
});

// POST /api/courses/:id/enroll - Enroll in a course
app.post("/api/courses/:id/enroll", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const courseId = parseInt(req.params.id);

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId,
      },
    });

    res.json({ success: true, enrollment });
  } catch (error) {
    res.status(500).json({ error: "Failed to enroll in course" });
  }
});

// DELETE /api/courses/:id/enroll - Cancel enrollment (unenroll)
app.delete("/api/courses/:id/enroll", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const courseId = parseInt(req.params.id);

    await prisma.enrollment.delete({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel enrollment" });
  }
});

// GET /api/dashboard - Get enrolled courses and assignments sorted
app.get("/api/dashboard", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // 1. Get enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: {
            assignments: true,
          },
        },
      },
    });

    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    // 2. Fetch assignments for these courses
    // Official assignments: courseId is in enrolledCourseIds AND isManual: false
    // Custom/Manual assignments: courseId is in enrolledCourseIds AND isManual: true AND userId: user.id
    const assignments = await prisma.assignment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        OR: [
          { isManual: false },
          { isManual: true, userId: user.id },
        ],
      },
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    // Fetch completion status for these assignments for this user
    const statuses = await prisma.assignmentStatus.findMany({
      where: {
        userId: user.id,
        assignmentId: { in: assignments.map((a) => a.id) },
      },
    });

    const statusMap = new Map(statuses.map((s) => [s.assignmentId, s.isCompleted]));

    // Append completion status to assignments
    const assignmentsWithStatus = assignments.map((a) => ({
      ...a,
      isCompleted: statusMap.get(a.id) || false,
    }));

    // Sort: 1. incomplete first, 2. deadline (closest first), 3. priority (HIGH -> MEDIUM -> LOW)
    const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 } as Record<string, number>;

    assignmentsWithStatus.sort((a, b) => {
      // 1. Incomplete first
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      // 2. Deadline (closest first)
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      // 3. Priority weight (highest first)
      const weightA = priorityWeight[a.priority] || 0;
      const weightB = priorityWeight[b.priority] || 0;
      return weightB - weightA;
    });

    res.json({
      courses: enrollments.map((e) => e.course),
      assignments: assignmentsWithStatus,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// POST /api/assignments - Create a new assignment (either manual or official)
app.post("/api/assignments", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { title, description, courseId, isManual, priority, deadline, fileUrl, fileName } = req.body;

    if (!title || !courseId || !priority || !deadline) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if enrolled or authorized
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: parseInt(courseId),
        },
      },
    });

    if (!enrollment && user.role !== "TEACHER") {
      return res.status(403).json({ error: "You are not enrolled in this course" });
    }

    // Set user-specific custom task or teacher-created general task
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        courseId: parseInt(courseId),
        isManual: !!isManual,
        userId: isManual ? user.id : null,
        priority,
        deadline: new Date(deadline),
        fileUrl: fileUrl || null,
        fileName: fileName || null,
      },
    });

    res.json(assignment);
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// POST /api/assignments/:id/toggle - Toggle completion status
app.post("/api/assignments/:id/toggle", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const assignmentId = parseInt(req.params.id);

    // Get current completion status or create new one
    const status = await prisma.assignmentStatus.findUnique({
      where: {
        assignmentId_userId: {
          assignmentId,
          userId: user.id,
        },
      },
    });

    const isCompleted = status ? !status.isCompleted : true;

    const newStatus = await prisma.assignmentStatus.upsert({
      where: {
        assignmentId_userId: {
          assignmentId,
          userId: user.id,
        },
      },
      update: {
        isCompleted,
      },
      create: {
        assignmentId,
        userId: user.id,
        isCompleted,
      },
    });

    res.json({ success: true, isCompleted: newStatus.isCompleted });
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle assignment status" });
  }
});

// GET /api/courses/:id/chats - Student private chat (Teachers are strictly forbidden!)
app.get("/api/courses/:id/chats", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Access control: Teachers are NOT allowed to view or participate in student-only chat!
    if (user.role === "TEACHER") {
      return res.status(403).json({ error: "教師は学生専用プライベートチャットを閲覧できません。" });
    }

    const courseId = parseInt(req.params.id);

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({ error: "この授業のチャットを閲覧するには、まず履修登録をする必要があります。" });
    }

    const chats = await prisma.chatMessage.findMany({
      where: { courseId },
      orderBy: { createdAt: "asc" },
    });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// POST /api/courses/:id/chats - Send a message in Student private chat (Teachers strictly forbidden!)
app.post("/api/courses/:id/chats", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role === "TEACHER") {
      return res.status(403).json({ error: "教師は学生専用プライベートチャットに投稿できません。" });
    }

    const courseId = parseInt(req.params.id);
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({ error: "履修登録を行っていない授業にはメッセージを送信できません。" });
    }

    const chat = await prisma.chatMessage.create({
      data: {
        courseId,
        userId: user.id,
        userName: user.name,
        message,
      },
    });

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// GET /api/courses/:id/contacts - Official inquiries
app.get("/api/courses/:id/contacts", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const courseId = parseInt(req.params.id);

    let contacts;
    if (user.role === "TEACHER") {
      // Teachers see all inquiries for this course
      contacts = await prisma.contact.findMany({
        where: { courseId },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Students only see their own inquiries for this course
      contacts = await prisma.contact.findMany({
        where: {
          courseId,
          userId: user.id,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// POST /api/courses/:id/contacts - Create an inquiry (Student only)
app.post("/api/courses/:id/contacts", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role === "TEACHER") {
      return res.status(403).json({ error: "教員が問い合わせを新規作成することはできません。" });
    }

    const courseId = parseInt(req.params.id);
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: "Subject and Message are required" });
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({ error: "履修登録を行っていない授業への問い合わせはできません。" });
    }

    const contact = await prisma.contact.create({
      data: {
        courseId,
        userId: user.id,
        userName: user.name,
        subject,
        message,
      },
    });

    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: "Failed to send inquiry" });
  }
});

// POST /api/contacts/:id/reply - Reply to an inquiry (Teacher only)
app.post("/api/contacts/:id/reply", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role !== "TEACHER") {
      return res.status(403).json({ error: "教員のみが問い合わせに回答できます。" });
    }

    const contactId = parseInt(req.params.id);
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ error: "Reply is required" });
    }

    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: { reply },
    });
    res.json(updatedContact);
  } catch (error) {
    res.status(500).json({ error: "Failed to reply to inquiry" });
  }
});

// GET /api/courses/:id/materials - Get all lecture materials for a course
app.get("/api/courses/:id/materials", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const courseId = parseInt(req.params.id);
    const materials = await prisma.lectureMaterial.findMany({
      where: { courseId },
      orderBy: { week: "asc" },
    });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});

// POST /api/courses/:id/materials - Create a new lecture material (Teacher only)
app.post("/api/courses/:id/materials", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role !== "TEACHER") {
      return res.status(403).json({ error: "授業資料を登録できるのは教員のみです。" });
    }

    const courseId = parseInt(req.params.id);
    const { title, description, fileUrl, fileName, week, teacherName } = req.body;

    if (!title || week === undefined || week === null) {
      return res.status(400).json({ error: "タイトルと講義回(第◯回)は必須入力です。" });
    }

    const material = await prisma.lectureMaterial.create({
      data: {
        courseId,
        title,
        description,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        week: parseInt(week),
        teacherName: teacherName || null,
      },
    });

    res.json(material);
  } catch (error) {
    res.status(500).json({ error: "Failed to add material" });
  }
});

// DELETE /api/materials/:id - Delete a lecture material (Teacher only)
app.delete("/api/materials/:id", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role !== "TEACHER") {
      return res.status(403).json({ error: "授業資料を削除できるのは教員のみです。" });
    }

    const materialId = parseInt(req.params.id);
    await prisma.lectureMaterial.delete({
      where: { id: materialId },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete material" });
  }
});


// Serve Vite or static files
async function startServer() {
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

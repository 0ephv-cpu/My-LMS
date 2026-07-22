import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import fs from "fs";
import crypto from "crypto";

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
  console.log("Resetting database and seeding with fresh default mock data...");

  // Delete existing records to ensure fresh state
  try {
    await prisma.lectureMaterial.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.assignmentStatus.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (err) {
    console.error("Error clearing database tables:", err);
  }

  // Create Users
  const alice = await prisma.user.create({
    data: {
      id: "student-1",
      name: "アリス (学生)",
      email: "alice@example.com",
      role: "STUDENT",
      password: "alice",
    },
  });

  const bob = await prisma.user.create({
    data: {
      id: "student-2",
      name: "ボブ (学生)",
      email: "bob@example.com",
      role: "STUDENT",
      password: "bob",
    },
  });

  const webproUser = await prisma.user.create({
    data: {
      id: "webpro-student",
      name: "慶應 太郎 (学生)",
      email: "webpro2026@keio.jp",
      role: "STUDENT",
      password: "webpro",
    },
  });

  const teacher = await prisma.user.create({
    data: {
      id: "teacher-1",
      name: "佐藤教授 (教員)",
      email: "sato@example.com",
      role: "TEACHER",
      password: "sato",
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      id: "teacher-2",
      name: "山田教授 (教員)",
      email: "yamada@example.com",
      role: "TEACHER",
      password: "yamada",
    },
  });

  // Create Courses
  const cognitive = await prisma.course.create({
    data: {
      code: "COGNITIVE101",
      name: "認知科学基礎論",
      description: "人間の知の仕組みを、心理学、脳科学、人工知能の多角的なアプローチから探求します。認知バイアス、記憶、言語獲得、意思決定などの認知機能をモデル化して理解します。",
      syllabusUrl: "https://syllabus.univ.ac.jp/cognitive101",
      classroom: "三田キャンパス 511教室",
      teacherContact: "sato@example.com (佐藤研究室)",
      teacherId: teacher.id,
      isOfficial: true,
      dayOfWeek: "月",
      period: 1,
      color: "#9333ea", // Purple
      teacherName: "佐藤教授",
    },
  });

  const econ = await prisma.course.create({
    data: {
      code: "ECONOMICS202",
      name: "ミクロ経済学中級",
      description: "市場における価格形成のメカニズムや企業・消費者の最適化行動、ゲーム理論の基礎を数理的に分析します。市場の失敗や外部性、情報の非対称性への理解を深めます。",
      syllabusUrl: "https://syllabus.univ.ac.jp/econ202",
      classroom: "日吉キャンパス J411教室",
      teacherContact: "sato@example.com (佐藤研究室)",
      teacherId: teacher.id,
      isOfficial: true,
      dayOfWeek: "水",
      period: 3,
      color: "#3b82f6", // Blue
      teacherName: "佐藤教授",
    },
  });

  const media = await prisma.course.create({
    data: {
      code: "MEDIA301",
      name: "メディア・コミュニケーション論",
      description: "マスメディアからソーシャルメディアに至るメディア環境の変遷と、それが個人の心理、社会構造、世論形成、文化価値観に与える影響を多角的なメディア理論から紐解きます。",
      syllabusUrl: "https://syllabus.univ.ac.jp/media301",
      classroom: "SFC アルファ館 201教室",
      teacherContact: "yamada@example.com (山田研究室)",
      teacherId: teacher2.id,
      isOfficial: true,
      dayOfWeek: "金",
      period: 2,
      color: "#ef4444", // Red
      teacherName: "山田教授",
    },
  });

  const aiSocial = await prisma.course.create({
    data: {
      code: "AI401",
      name: "人工知能と社会構造",
      description: "生成AIやディープラーニングなどの技術革新が、著作権、労働、法制度、倫理観に与える構造的な変化を考察します。技術的な限界をふまえた、望ましいAIガバナンスを議論します。",
      syllabusUrl: "https://syllabus.univ.ac.jp/ai401",
      classroom: "三田キャンパス 421教室",
      teacherContact: "yamada@example.com (山田研究室)",
      teacherId: teacher2.id,
      isOfficial: true,
      dayOfWeek: "火",
      period: 2,
      color: "#10b981", // Green
      teacherName: "山田教授",
    },
  });

  const english = await prisma.course.create({
    data: {
      code: "ENGL401",
      name: "学術英語ライティング",
      description: "国際的な研究論文の執筆に必要なロジカルな文章構成力、適切なアカデミック語彙の選択、パラグラフの展開手法、および正確な引用形式のルールについて実践的に指導します。",
      syllabusUrl: "https://syllabus.univ.ac.jp/engl401",
      classroom: "日吉キャンパス D201教室",
      teacherContact: "yamada@example.com (山田研究室)",
      teacherId: teacher2.id,
      isOfficial: true,
      dayOfWeek: "木",
      period: 4,
      color: "#f59e0b", // Amber
      teacherName: "山田教授",
    },
  });

  const math = await prisma.course.create({
    data: {
      code: "MATH101",
      name: "線形代数学基礎",
      description: "ベクトル空間、線形写像、行列式、固有値・固有ベクトルなど、現代科学技術の基盤となる線形代数の基本概念とその応用について体系的に学びます。",
      syllabusUrl: "https://syllabus.univ.ac.jp/math101",
      classroom: "矢上キャンパス 12棟101教室",
      teacherContact: "sato@example.com (佐藤研究室)",
      teacherId: teacher.id,
      isOfficial: true,
      dayOfWeek: "火",
      period: 3,
      color: "#06b6d4", // Cyan
      teacherName: "佐藤教授",
    },
  });

  const cs = await prisma.course.create({
    data: {
      code: "CS201",
      name: "データ構造とアルゴリズム",
      description: "計算機科学において極めて重要な配列、リスト、スタック、キュー、木構造、グラフなどのデータ構造と、ソート、探索、動的計画法などの主要なアルゴリズムの設計・解析手法を習得します。",
      syllabusUrl: "https://syllabus.univ.ac.jp/cs201",
      classroom: "矢上キャンパス 14棟201教室",
      teacherContact: "yamada@example.com (山田研究室)",
      teacherId: teacher2.id,
      isOfficial: true,
      dayOfWeek: "木",
      period: 2,
      color: "#f43f5e", // Rose
      teacherName: "山田教授",
    },
  });

  // Enrollments
  await prisma.enrollment.createMany({
    data: [
      { userId: alice.id, courseId: cognitive.id },
      { userId: alice.id, courseId: econ.id },
      { userId: alice.id, courseId: aiSocial.id },
      { userId: alice.id, courseId: math.id },
      { userId: bob.id, courseId: cognitive.id },
      { userId: bob.id, courseId: media.id },
      { userId: bob.id, courseId: english.id },
      { userId: bob.id, courseId: cs.id },
    ],
  });

  // Assignments
  const now = new Date();

  await prisma.assignment.createMany({
    data: [
      {
        title: "認知バイアスに関するミニレポート",
        description: "日常で見られる認知バイアス（確証バイアス、フレーミング効果など）の事例を1つ挙げ、その心理学的背景をA4用紙1枚程度で要約・考察しなさい。",
        courseId: cognitive.id,
        isManual: false,
        priority: "MEDIUM",
        deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
      {
        title: "第3回講義の確認クイズ",
        description: "コグニティブAIに関する第3回特別講義スライドを復習し、期限までにLMS上の確認クイズ（全5問）をすべて完了させてください。",
        courseId: cognitive.id,
        isManual: false,
        priority: "LOW",
        deadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      },
      {
        title: "市場の失敗と外部性に関する計算問題",
        description: "教科書第5章の練習問題 1〜5を解き、途中計算とグラフ、および厚生評価のプロセスを詳細に記述したPDFファイルを提出してください。",
        courseId: econ.id,
        isManual: false,
        priority: "HIGH",
        deadline: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      },
      {
        title: "ソーシャルメディアが世論に与える影響の分析",
        description: "特定のエコーチェンバー現象またはフェイクニュースの拡散事例を調べ、その伝播モデルと社会へのインパクト、および対策案を構造的にレポートにまとめてください。",
        courseId: media.id,
        isManual: false,
        priority: "HIGH",
        deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },
      {
        title: "生成AIが著作権とクリエイティブ業界に与える影響",
        description: "米国または日本国内の具体的な係争例やガイドラインを参照しつつ、AIガバナンスと表現の自由の衝突に関する立場をグループでまとめてスライドを用意すること。",
        courseId: aiSocial.id,
        isManual: false,
        priority: "MEDIUM",
        deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        title: "行列の対角化と固有値問題の演習",
        description: "固有値・固有ベクトルの定義に基づき、3次正方行列の対角化可能性の判定と実際の対角化計算を行い、その幾何学的意味を説明しなさい。配布された演習プリントを解いてPDFでアップロードしてください。",
        courseId: math.id,
        isManual: false,
        priority: "MEDIUM",
        deadline: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      },
      {
        title: "ハッシュテーブルの実装と性能比較",
        description: "チェイン法とオープンアドレス法を用いたハッシュテーブルをプログラム言語（Python、C、Java、TypeScriptなど任意）で実装し、衝突（衝突数と探索効率）に関する実測データを比較分析したレポートを提出しなさい。",
        courseId: cs.id,
        isManual: false,
        priority: "HIGH",
        deadline: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
      },
      // Alice manual assignment
      {
        title: "アリスのフレーミング効果文献調査",
        description: "カーネマンとトベルスキーの古典論文「The Framing of Decisions」を精読し、主要な論点を読書記録ノートにメモする。",
        courseId: cognitive.id,
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
        courseId: cognitive.id,
        userId: alice.id,
        userName: "アリス (学生)",
        message: "認知バイアスのレポート、みんなテーマ何にする？",
      },
      {
        courseId: cognitive.id,
        userId: bob.id,
        userName: "ボブ (学生)",
        message: "僕は日常の意思決定で起きる「確証バイアス」について書く予定だよ！ニュースの見方とかに関連づけて。",
      },
      {
        courseId: cognitive.id,
        userId: alice.id,
        userName: "アリス (学生)",
        message: "面白そう！私は「フレーミング効果」で、質問の表現によってアンケート結果がどう変わるか調べようかな。",
      },
    ],
  });

  // Contact teacher
  await prisma.contact.create({
    data: {
      courseId: cognitive.id,
      userId: alice.id,
      userName: "アリス (学生)",
      subject: "体調不良による講義欠席の相談",
      message: "明日の講義を風邪のため欠席させていただきます。講義スライドはLMSから閲覧可能でしょうか。",
      reply: "お大事にしてください。講義スライドはすべて「授業資料・講義スライド」タブにアップロードしていますので、第1回〜第3回を確認して自習に役立ててください。確認クイズも忘れずに行ってくださいね。",
    },
  });

  // Seeding lecture materials
  await prisma.lectureMaterial.createMany({
    data: [
      {
        courseId: cognitive.id,
        title: "第1回 認知科学の歴史とアプローチ",
        description: "講義全体の進め方と、行動主義から認知心理学への移行期における情報処理パラダイムの台頭について学ぶスライドです。",
        fileUrl: "https://example.com/slides/cognitive-week1.pdf",
        week: 1,
        teacherName: "佐藤 裕二 教授",
      },
      {
        courseId: cognitive.id,
        title: "第2回 感覚・知覚と認知のメカニズム",
        description: "視覚・聴覚情報の感覚器から脳への伝達と、人間の認知システムが持つ「ボトムアップ処理」と「トップダウン処理」の相互作用についての講義レジュメ。",
        fileUrl: "https://example.com/slides/cognitive-week2.pdf",
        week: 2,
        teacherName: "佐藤 裕二 教授",
      },
      {
        courseId: cognitive.id,
        title: "第3回 [特別講義] コグニティブAI最前線",
        description: "ゲスト講師を招き、LLM（大規模言語モデル）の推論プロセスと人間の認知科学モデルとの類似性、および今後の展開について議論します。",
        fileUrl: "https://example.com/slides/cognitive-week3-guest.pdf",
        week: 3,
        teacherName: "鈴木 健一 特任教授 (ゲスト講師)",
      },
      {
        courseId: econ.id,
        title: "第1回 消費者行動と効用最大化",
        description: "無差別曲線と予算線を用いて、消費者の合理的な選択と限界代替率（MRS）の概念を視覚的かつ数理的に分析します。",
        fileUrl: "https://example.com/slides/econ-week1.pdf",
        week: 1,
        teacherName: "佐藤 裕二 教授",
      },
      {
        courseId: math.id,
        title: "第1回 行列と行列式の基本性質",
        description: "連立一次方程式の掃き出し法による解法と、行列式の性質（多線形性・交代性）について理解を深める講義資料です。",
        fileUrl: "https://example.com/slides/math-week1.pdf",
        week: 1,
        teacherName: "佐藤 裕二 教授",
      },
      {
        courseId: cs.id,
        title: "第1回 アルゴリズムの計算量とO記法",
        description: "最悪時間計算量、平均時間計算量の概念と、アルゴリズムの効率性を測るためのランダウの記号（Big-O）の数理的定義と使用方法について解説します。",
        fileUrl: "https://example.com/slides/cs-week1.pdf",
        week: 1,
        teacherName: "山田 教授",
      }
    ]
  });

  console.log("Database seeded successfully with rich academic examples!");
}

async function seedMaterialsForExisting() {
  try {
    const materialCount = await prisma.lectureMaterial.count();
    if (materialCount === 0) {
      console.log("Seeding existing database with lecture materials...");
      const cognitive = await prisma.course.findUnique({ where: { code: "COGNITIVE101" } });
      const econ = await prisma.course.findUnique({ where: { code: "ECONOMICS202" } });
      const math = await prisma.course.findUnique({ where: { code: "MATH101" } });
      const cs = await prisma.course.findUnique({ where: { code: "CS201" } });
      
      if (cognitive) {
        await prisma.lectureMaterial.createMany({
          data: [
            {
              courseId: cognitive.id,
              title: "第1回 認知科学の歴史とアプローチ",
              description: "講義全体の進め方と、行動主義から認知心理学への移行期における情報処理パラダイムの台頭について学ぶスライドです。",
              fileUrl: "https://example.com/slides/cognitive-week1.pdf",
              week: 1,
              teacherName: "佐藤 裕二 教授",
            },
            {
              courseId: cognitive.id,
              title: "第2回 感覚・知覚と認知のメカニズム",
              description: "視覚・聴覚情報の感覚器から脳への伝達と、人間の認知システムが持つ「ボトムアップ処理」と「トップダウン処理」の相互作用についての講義レジュメ。",
              fileUrl: "https://example.com/slides/cognitive-week2.pdf",
              week: 2,
              teacherName: "佐藤 裕二 教授",
            },
            {
              courseId: cognitive.id,
              title: "第3回 [特別講義] コグニティブAI最前線",
              description: "ゲスト講師を招き、LLM（大規模言語モデル）の推論プロセスと人間の認知科学モデルとの類似性、および今後の展開について議論します。",
              fileUrl: "https://example.com/slides/cognitive-week3-guest.pdf",
              week: 3,
              teacherName: "鈴木 健一 特任教授 (ゲスト講師)",
            }
          ]
        });
      }
      if (econ) {
        await prisma.lectureMaterial.createMany({
          data: [
            {
              courseId: econ.id,
              title: "第1回 消費者行動と効用最大化",
              description: "無差別曲線と予算線を用いて、消費者の合理的な選択と限界代替率（MRS）の概念を視覚的かつ数理的に分析します。",
              fileUrl: "https://example.com/slides/econ-week1.pdf",
              week: 1,
              teacherName: "佐藤 裕二 教授",
            }
          ]
        });
      }
      if (math) {
        await prisma.lectureMaterial.createMany({
          data: [
            {
              courseId: math.id,
              title: "第1回 行列と行列式の基本性質",
              description: "連立一次方程式の掃き出し法による解法と、行列式の性質（多線形性・交代性）について理解を深める講義資料です。",
              fileUrl: "https://example.com/slides/math-week1.pdf",
              week: 1,
              teacherName: "佐藤 裕二 教授",
            }
          ]
        });
      }
      if (cs) {
        await prisma.lectureMaterial.createMany({
          data: [
            {
              courseId: cs.id,
              title: "第1回 アルゴリズムの計算量とO記法",
              description: "最悪時間計算量、平均時間計算量の概念と、アルゴリズムの効率性を測るためのランダウの記号（Big-O）の数理的定義と使用方法について解説します。",
              fileUrl: "https://example.com/slides/cs-week1.pdf",
              week: 1,
              teacherName: "山田 教授",
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

// --- AUTHENTICATION & DEVICE AUTH (PASSKEY) ENDPOINTS ---

// POST /api/auth/register - Register a new user
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: "すべての項目を入力してください。" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "このメールアドレスは既に登録されています。" });
    }

    // Generate a unique ID for the user
    const id = "user-" + Math.random().toString(36).substr(2, 9);

    const user = await prisma.user.create({
      data: {
        id,
        name,
        email,
        role,
        password,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "ユーザー登録に失敗しました。" });
  }
});

// POST /api/auth/login - Standard password login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "メールアドレスとパスワードを入力してください。" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません。" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "ログインに失敗しました。" });
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
    const { 
      code, 
      name, 
      description, 
      syllabusUrl, 
      classroom, 
      teacherContact,
      dayOfWeek,
      period,
      color,
      teacherName
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: "授業コードと授業名は必須です。" });
    }

    if (!dayOfWeek || !period) {
      return res.status(400).json({ error: "曜日と時限は必須です。" });
    }

    const defaultColors = [
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
    ];
    const finalColor = color || defaultColors[Math.floor(Math.random() * defaultColors.length)];
    const isOfficial = user ? user.role === "TEACHER" : true;

    const course = await prisma.course.create({
      data: {
        code,
        name,
        description,
        syllabusUrl,
        classroom,
        teacherContact: teacherContact || (user && user.role === "TEACHER" ? `${user.email} (${user.name})` : undefined),
        teacherId: user && user.role === "TEACHER" ? user.id : null,
        creatorId: user ? user.id : null,
        isOfficial,
        dayOfWeek: dayOfWeek || null,
        period: period ? parseInt(period) : null,
        color: finalColor,
        teacherName: teacherName || (user && user.role === "TEACHER" ? user.name.replace(" (教員)", "") : null),
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
      console.error("Create course error:", error);
      res.status(500).json({ error: "授業の作成に失敗しました。" });
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
            color: true,
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

    const statusMap = new Map(statuses.map((s) => [s.assignmentId, s]));

    // Append completion status and submission fields to assignments
    const assignmentsWithStatus = assignments.map((a) => {
      const statusObj = statusMap.get(a.id);
      return {
        ...a,
        isCompleted: statusObj ? statusObj.isCompleted : false,
        submissionComment: statusObj ? statusObj.submissionComment : null,
        submissionFileUrl: statusObj ? statusObj.submissionFileUrl : null,
        submissionFileName: statusObj ? statusObj.submissionFileName : null,
        teacherComment: statusObj ? statusObj.teacherComment : null,
        submittedAt: statusObj ? statusObj.submittedAt : null,
      };
    });

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

    const { title, description, courseId, isManual, priority, deadline, fileUrl, fileName, week } = req.body;

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
        week: week ? parseInt(week) : 1,
      },
    });

    res.json(assignment);
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// PUT /api/assignments/:id - Update assignment details (description, week, attachments) (Teacher or Creator only)
app.put("/api/assignments/:id", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const assignmentId = parseInt(req.params.id);
    const { title, description, fileUrl, fileName, priority, deadline, week } = req.body;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Access control
    if (assignment.isManual) {
      if (assignment.userId !== user.id) {
        return res.status(403).json({ error: "You cannot edit this manual assignment" });
      }
    } else {
      if (user.role !== "TEACHER") {
        return res.status(403).json({ error: "Only teachers can edit official assignments" });
      }
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title: title !== undefined ? title : assignment.title,
        description: description !== undefined ? description : assignment.description,
        fileUrl: fileUrl !== undefined ? fileUrl : assignment.fileUrl,
        fileName: fileName !== undefined ? fileName : assignment.fileName,
        priority: priority !== undefined ? priority : assignment.priority,
        deadline: deadline !== undefined ? new Date(deadline) : assignment.deadline,
        week: week !== undefined ? parseInt(week) : assignment.week,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update assignment error:", error);
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

// POST /api/assignments/:id/submit - Submit assignment (Student comment and/or attachment)
app.post("/api/assignments/:id/submit", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const assignmentId = parseInt(req.params.id);
    const { submissionComment, submissionFileUrl, submissionFileName } = req.body;

    const statusObj = await prisma.assignmentStatus.upsert({
      where: {
        assignmentId_userId: {
          assignmentId,
          userId: user.id,
        },
      },
      update: {
        submissionComment: submissionComment || null,
        submissionFileUrl: submissionFileUrl || null,
        submissionFileName: submissionFileName || null,
        isCompleted: true,
        submittedAt: new Date(),
      },
      create: {
        assignmentId,
        userId: user.id,
        submissionComment: submissionComment || null,
        submissionFileUrl: submissionFileUrl || null,
        submissionFileName: submissionFileName || null,
        isCompleted: true,
        submittedAt: new Date(),
      },
    });

    res.json({ success: true, status: statusObj });
  } catch (error) {
    console.error("Submit assignment error:", error);
    res.status(500).json({ error: "Failed to submit assignment" });
  }
});

// POST /api/assignments/:id/feedback - Add/update teacher feedback comment (Teacher only)
app.post("/api/assignments/:id/feedback", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role !== "TEACHER") {
      return res.status(403).json({ error: "教員のみがフィードバックを登録できます。" });
    }

    const assignmentId = parseInt(req.params.id);
    const { studentId, teacherComment } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: "学生IDが必要です。" });
    }

    const statusObj = await prisma.assignmentStatus.upsert({
      where: {
        assignmentId_userId: {
          assignmentId,
          userId: studentId,
        },
      },
      update: {
        teacherComment: teacherComment || null,
      },
      create: {
        assignmentId,
        userId: studentId,
        teacherComment: teacherComment || null,
        isCompleted: false,
      },
    });

    res.json({ success: true, status: statusObj });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

// GET /api/assignments/:id/submissions - Get submission list for an assignment (Teacher or Student)
app.get("/api/assignments/:id/submissions", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const assignmentId = parseInt(req.params.id);

    if (user.role === "TEACHER") {
      const assignmentObj = await prisma.assignment.findUnique({
        where: { id: assignmentId },
      });
      if (!assignmentObj) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: assignmentObj.courseId },
        include: { user: true },
      });

      const students = enrollments
        .map((e) => e.user)
        .filter((u) => u.role === "STUDENT");

      const statuses = await prisma.assignmentStatus.findMany({
        where: { assignmentId },
      });

      const statusMap = new Map(statuses.map((s) => [s.userId, s]));

      const results = students.map((s) => {
        const sObj = statusMap.get(s.id);
        return {
          userId: s.id,
          userName: s.name,
          userEmail: s.email,
          isCompleted: sObj ? sObj.isCompleted : false,
          submissionComment: sObj ? sObj.submissionComment : null,
          submissionFileUrl: sObj ? sObj.submissionFileUrl : null,
          submissionFileName: sObj ? sObj.submissionFileName : null,
          teacherComment: sObj ? sObj.teacherComment : null,
          submittedAt: sObj ? sObj.submittedAt : null,
          updatedAt: sObj ? sObj.updatedAt : null,
        };
      });

      res.json(results);
    } else {
      const statusObj = await prisma.assignmentStatus.findUnique({
        where: {
          assignmentId_userId: {
            assignmentId,
            userId: user.id,
          },
        },
      });

      res.json(statusObj ? [{
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        isCompleted: statusObj.isCompleted,
        submissionComment: statusObj.submissionComment,
        submissionFileUrl: statusObj.submissionFileUrl,
        submissionFileName: statusObj.submissionFileName,
        teacherComment: statusObj.teacherComment,
        submittedAt: statusObj.submittedAt,
        updatedAt: statusObj.updatedAt,
      }] : [{
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        isCompleted: false,
        submissionComment: null,
        submissionFileUrl: null,
        submissionFileName: null,
        teacherComment: null,
        submittedAt: null,
        updatedAt: null,
      }]);
    }
  } catch (error) {
    console.error("Fetch submissions error:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
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
  // Check if users exist. If not, seed database automatically.
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("Database is empty. Seeding database...");
      await seedDatabase();
      await seedMaterialsForExisting();
    }
  } catch (err) {
    console.error("Failed to check/seed database on startup:", err);
  }

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

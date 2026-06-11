import React, { useState, useEffect } from "react";
import {
  Brain,
  Music,
  BookOpen,
  MessageSquare,
  Trophy,
  Users,
  Settings,
  LogOut,
  Calendar,
  ListTodo,
  Gamepad2,
  Layers,
  Lightbulb,
  Zap,
  Layout,
  Database,
  ClipboardCheck,
  UploadCloud,
  Mic,
  X,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Medal,
  Flame,
  Coins,
  Sparkles,
  Bot,
  Headphones,
  Stethoscope,
} from "lucide-react";
import {
  User,
  JournalEntry,
  Post,
  ViewType,
  Notification,
  Badge,
  Theme,
  TeamMember,
} from "./types";
import { Logo } from "./components/Logo";
import {
  auth,
  db,
  loginWithGoogle,
  logout,
  registerWithEmail,
  loginWithEmail,
} from "./services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import {
  DashboardView,
  FlashcardView,
  TransformerUploadView,
  StudyPlannerView,
  JournalView,
  CommunityView,
  CognitiveTestView,
  TeamView,
  AdminView,
  ApiDocView,
  TopMusicBar,
  UnifiedAIView,
  GamificationView,
  FocusSoundView,
  LiveVoiceView,
  SummaryView,
  StudyGuideView,
  ExercisesView,
  TimelineView,
  AIChatView,
  PartnerClinicsView,
  MindMapView,
} from "./components/Views";

const NotificationToast = ({
  notifications,
  remove,
}: {
  notifications: Notification[];
  remove: (id: string) => void;
}) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
    {notifications.map((n) => (
      <div
        key={n.id}
        className={`pointer-events-auto flex items-center gap-3 p-4 rounded-lg shadow-lg min-w-[300px] animate-slideIn border-l-4 bg-white ${n.type === "success" ? "border-green-500" : n.type === "error" ? "border-red-500" : n.type === "warning" ? "border-yellow-500" : "border-blue-500"}`}
      >
        <Info size={20} className="text-blue-500" />
        <p className="text-sm font-medium text-slate-700 flex-1">{n.message}</p>
        <button
          onClick={() => remove(n.id)}
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      </div>
    ))}
  </div>
);

const INITIAL_POSTS: Post[] = [
  {
    id: "1",
    user: "Sofia M.",
    role: "student",
    content: "Consegui estudar 2 horas com a técnica Pomodoro! 🍅",
    likes: 12,
    comments: 2,
    pinned: false,
  },
  {
    id: "2",
    user: "Admin",
    role: "admin",
    content:
      "Dica: A desidratação afeta a atenção no lobo frontal. Bebam água!",
    likes: 45,
    comments: 0,
    pinned: true,
  },
];

const INITIAL_TEAM = [
  {
    id: "1",
    name: "Gelison de Aguiar Gonçalves",
    role: "Fundador & Pesquisador",
    desc: "Autor do projeto. Experiência pessoal com TDAH e paixão por tecnologia assistiva.",
  },
  {
    id: "2",
    name: "Equipa UNIFESO",
    role: "Apoio Institucional",
    desc: "Centro Universitário Serra dos Órgãos - Apoio pedagógico e científico.",
  },
  {
    id: "3",
    name: "Gemini 2.5",
    role: "Inteligência Artificial",
    desc: "O cérebro digital por trás da adaptação de conteúdo em tempo real.",
  },
];

const INITIAL_USERS = [
  { id: "1", name: "Sofia M.", role: "student", status: "active" },
  { id: "2", name: "Carlos E.", role: "student", status: "blocked" },
  { id: "3", name: "Ana B.", role: "student", status: "active" },
];

const AVAILABLE_BADGES: Badge[] = [
  {
    id: "first_step",
    name: "Primeiro Passo",
    description: "Completou o teste cognitivo",
    icon: "🎯",
    requiredXp: 100,
  },
  {
    id: "bookworm",
    name: "Devorador de Livros",
    description: "Alcançou 300 XP",
    icon: "📚",
    requiredXp: 300,
  },
  {
    id: "explorer",
    name: "Explorador",
    description: "Alcançou 600 XP",
    icon: "🧭",
    requiredXp: 600,
  },
  {
    id: "master",
    name: "Mestre da Mente",
    description: "Alcançou 1000 XP",
    icon: "🧠",
    requiredXp: 1000,
  },
  {
    id: "social",
    name: "Voz da Comunidade",
    description: "Postou na comunidade",
    icon: "🗣️",
    requiredXp: 0,
    unlocked: false,
  },
];

// --- DEFAULT CONSTANTS ---
const DEFAULT_PROMPTS = {
  tutor:
    "Você é o especialista do Estúdio. Responda perguntas com base nos documentos enviados. Use uma formatação visual incrível com Markdown (negrito em palavras cruciais, blocos de citação `>` para conceitos chave e quebras de linha generosas para ótima legibilidade).",
  summary:
    "Crie um Resumo Visual altamente estruturado do contexto anexado. Use tabelas em Markdown para comparar itens se houver, blockquotes para a ideia central, bullet points bem espaçados com emojis elegantes e negrito para os termos-chave. Estrutura recomendada:\n\n> 🎯 **Ideia Central** (Resuma aqui em 1 frase impecável)\n\n### 💡 Principais Descobertas\n- Ponto 1...\n\n### 🚀 Conclusão\n(Síntese final)",
  study_guide:
    "Gere um Guia de Estudos interativo e elegante. Para cada pergunta, use títulos (### Pergunta 1) para hierarquia, e apresente a resposta escondida num bloco de código ou aspas (Blockquote). O material deve parecer uma apostila digital minimalista e profissional. Crie no máximo 5 perguntas.",
  exercises:
    "Gere Exercícios Práticos super engajadores. Comece formatando uma linda seção de '📝 Questões' numeradas. Pule várias linhas e crie uma seção separada '✅ Gabarito Comentado' usando tabelas ou blockquotes para as explicações das respostas. Use emojis e negrito sabiamente.",
  timeline:
    "Crie uma Linha do Tempo visual em formato Markdown. Exiba os acontecimentos como uma lista estruturada fluida: \n\n**[Data ou Etapa]** \n> Acontecimento principal...\n\nIsso dará um efeito de cartões visuais para a linha do tempo.",
  mindmap:
    "Você é um especialista em síntese visual. Seu objetivo é criar mapas mentais EXTREMAMENTE CONCISOS. O tema central deve ter no máximo 3 subclasses, e cada subclasse no máximo 2 tópicos. Use palavras-chave curtas (máximo 3 palavras por nó), sem frases longas. Use emojis para ancoragem visual.",
};

const DEFAULT_KNOWLEDGE = {
  tutor: "Sempre quebre grandes blocos de texto em parágrafos separados. Use tabelas se for comparar duas coisas.",
  summary: "A estética visual da sua resposta é MAIS importante que o tamanho. Use espaçamentos, negrito e estrutura impecável.",
  study_guide: "Formatação clara: separe bem as perguntas das respostas para evitar leitura acidental do gabarito.",
  exercises: "A apresentação deve ser como uma folha de prova elegante. Gabarito BEM SEPARADO das perguntas.",
  timeline: "Aposte em espaçamentos (`\n\n`) e uso pesado de citações (`>`) para realçar os anos/etapas.",
  mindmap: "Corte toda a 'gordura'. Um nó de mapa mental nunca deve ser uma frase completa, apenas palavras-chave ou ideias curtas.",
};

const DEFAULT_PLAYLIST = "37i9dQZF1DWZeKCadgRdKQ";

// --- LOCAL ADMIN (login sem Firebase) ---
const LOCAL_ADMIN_EMAIL = "admin@admin.com";
const LOCAL_ADMIN_PASSWORD = "admin";
const LOCAL_ADMIN_FLAG = "adaptmind_local_admin";

const LOCAL_ADMIN_USER: User = {
  uid: "local-admin",
  name: "Administrador",
  email: LOCAL_ADMIN_EMAIL,
  role: "admin",
  status: "active",
  joinedAt: new Date().toISOString(),
  xp: 0,
  level: 1,
  coins: 50,
  streak: 3,
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem("adaptmind_user_profile");
    return cached ? JSON.parse(cached) : null;
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"student" | "admin">(
    "student",
  );
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [team, setTeam] = useState<any[]>(INITIAL_TEAM);
  const [users, setUsers] = useState<any[]>(INITIAL_USERS); // Lifted State
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(50);
  const [badges, setBadges] = useState<Badge[]>(AVAILABLE_BADGES);
  const [streak, setStreak] = useState(3);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pdfContext, setPdfContext] = useState<
    { name: string; data: string }[]
  >([]);

  useEffect(() => {
    // If we have a cached user, we can consider auth "ready" for the initial render
    if (localStorage.getItem("adaptmind_user_profile")) {
      setIsAuthReady(true);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
            localStorage.setItem(
              "adaptmind_user_profile",
              JSON.stringify(userData),
            );
          } else {
            // Create new user profile
            const isAdminEmail = firebaseUser.email === "geltattoorj@gmail.com";
            const newUser: User = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || "Usuário",
              email: firebaseUser.email || "",
              role: isAdminEmail ? "admin" : "student",
              status: "active",
              joinedAt: new Date().toISOString(),
              xp: 0,
              level: 1,
              coins: 50,
              streak: 3,
            };
            await setDoc(userDocRef, newUser);
            setUser(newUser);
            localStorage.setItem(
              "adaptmind_user_profile",
              JSON.stringify(newUser),
            );
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else if (localStorage.getItem(LOCAL_ADMIN_FLAG) !== "true") {
        setUser(null);
        localStorage.removeItem("adaptmind_user_profile");
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAllUsers = async () => {
      if (user?.role === "admin") {
        try {
          const usersSnap = await getDocs(collection(db, "users"));
          const fetchedUsers: any[] = [];
          usersSnap.forEach((doc) => {
            fetchedUsers.push({ id: doc.id, ...doc.data() });
          });
          setUsers(fetchedUsers);
        } catch (error) {
          console.error("Error fetching all users:", error);
        }
      }
    };
    fetchAllUsers();
  }, [user?.role]);


  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    // Login local de admin (não passa pelo Firebase)
    if (
      authMode === "login" &&
      authEmail.trim().toLowerCase() === LOCAL_ADMIN_EMAIL &&
      authPassword === LOCAL_ADMIN_PASSWORD
    ) {
      localStorage.setItem(LOCAL_ADMIN_FLAG, "true");
      localStorage.setItem(
        "adaptmind_user_profile",
        JSON.stringify(LOCAL_ADMIN_USER),
      );
      setUser(LOCAL_ADMIN_USER);
      setActiveView("dashboard");
      return;
    }

    setIsAuthLoading(true);
    try {
      if (authMode === "register") {
        await registerWithEmail(authEmail, authPassword, authName);
      } else {
        await loginWithEmail(authEmail, authPassword);
      }
      setActiveView("dashboard");
    } catch (error: any) {
      console.error("Auth error", error);
      if (error.code === "auth/email-already-in-use")
        setAuthError("Este email já está em uso.");
      else if (error.code === "auth/invalid-credential")
        setAuthError("Email ou senha incorretos.");
      else if (error.code === "auth/weak-password")
        setAuthError("A senha deve ter pelo menos 6 caracteres.");
      else setAuthError("Ocorreu um erro na autenticação.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      setActiveView("dashboard");
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === "auth/popup-closed-by-user") {
        // Ignorar se o usuário apenas fechou a janela
        return;
      }
      if (error.code === "auth/unauthorized-domain") {
        alert(
          `Este domínio (${window.location.hostname}) não está autorizado no Firebase. Adicione-o em Authentication > Settings > Authorized domains no console do Firebase.`,
        );
        return;
      }
      alert(
        `Erro ao fazer login com o Google (${error.code || "desconhecido"}). Verifique se os pop-ups estão bloqueados.`,
      );
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem(LOCAL_ADMIN_FLAG);
    localStorage.removeItem("adaptmind_user_profile");
    await logout();
    setUser(null);
  };

  // --- PERSISTENT STATE INITIALIZATION ---

  // Custom Logo Persistence
  const [customLogo, setCustomLogo] = useState(() => {
    return localStorage.getItem("adaptmind_logo") || "";
  });

  // Theme Persistence
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("adaptmind_theme") as Theme) || "light";
  });

  // Playlist Persistence
  const [spotifyPlaylistId, setSpotifyPlaylistId] = useState(() => {
    const saved = localStorage.getItem("adaptmind_playlist");
    return saved || DEFAULT_PLAYLIST;
  });

  // Prompts Persistence
  const [agentPrompts, setAgentPrompts] = useState<Record<string, string>>(
    () => {
      // Force update for v9 prompts
      const isUpToDate = localStorage.getItem("adaptmind_prompts_v9");
      if (!isUpToDate) {
        localStorage.setItem("adaptmind_prompts_v9", "true");
        return DEFAULT_PROMPTS;
      }
      const saved = localStorage.getItem("adaptmind_prompts");
      return saved ? JSON.parse(saved) : DEFAULT_PROMPTS;
    },
  );

  // Knowledge Persistence
  const [agentKnowledge, setAgentKnowledge] = useState<Record<string, string>>(
    () => {
      const isUpToDate = localStorage.getItem("adaptmind_knowledge_v9");
      if (!isUpToDate) {
        localStorage.setItem("adaptmind_knowledge_v9", "true");
        return DEFAULT_KNOWLEDGE;
      }
      const saved = localStorage.getItem("adaptmind_knowledge");
      return saved ? JSON.parse(saved) : DEFAULT_KNOWLEDGE;
    },
  );

  // --- SAVE EFFECTS ---
  useEffect(() => {
    localStorage.setItem("adaptmind_theme", theme);

    // Inject Theme Styles
    const root = document.documentElement;
    const styleId = "theme-styles";
    let styleTag = document.getElementById(styleId);

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    let css = "";

    if (theme === "dark") {
      css = `
        body, .bg-slate-50 { background-color: #0f172a !important; color: #f1f5f9; }
        .bg-white { background-color: #1e293b !important; color: #f1f5f9 !important; border-color: #334155 !important; }
        .text-slate-900, .text-slate-800, .text-slate-700 { color: #f1f5f9 !important; }
        .text-slate-500, .text-slate-600 { color: #94a3b8 !important; }
        .border-slate-200, .border-slate-100 { border-color: #334155 !important; }
        .bg-slate-100, .bg-slate-50 { background-color: #334155 !important; color: #f1f5f9 !important; }
        .shadow-sm, .shadow-lg, .shadow-2xl { box-shadow: none !important; }
        input, textarea, select { background-color: #0f172a !important; color: white !important; border-color: #475569 !important; }
        /* Keep sidebar dark but slightly different */
        aside { background-color: #020617 !important; border-color: #1e293b !important; }
        /* Fix prose elements for dark mode */
        h1, h2, h3, h4, h5, h6, strong, b, em { color: #f8fafc !important; }
        th, td { border-color: #475569 !important; color: #f1f5f9 !important; }
        code { color: #38bdf8 !important; }
        a { color: #60a5fa !important; }
      `;
    } else if (theme === "high-contrast") {
      css = `
        body, .bg-slate-50 { background-color: #000000 !important; color: #ffff00; }
        .bg-white, aside, .bg-slate-900 { background-color: #000000 !important; color: #ffff00 !important; border: 2px solid #ffffff !important; }
        .text-slate-900, .text-slate-800, .text-slate-700, .text-slate-500, .text-slate-600, .text-teal-600, .text-blue-600 { color: #ffff00 !important; }
        .text-white { color: #ffff00 !important; }
        .bg-teal-600, .bg-indigo-600, .bg-purple-600, .bg-blue-600, .bg-slate-800 { background-color: #000000 !important; border: 2px solid #ffff00 !important; color: #ffff00 !important; }
        .border-slate-200, .border-slate-100 { border-color: #ffffff !important; border-width: 2px !important; }
        .bg-slate-100, .bg-slate-50, .bg-blue-50, .bg-green-50, .bg-purple-50 { background-color: #000000 !important; border: 1px solid #ffffff !important; color: #ffff00 !important; }
        button { border: 2px solid #ffff00 !important; }
        input, textarea { background-color: #000000 !important; color: #ffff00 !important; border: 2px solid #ffffff !important; }
      `;
    }

    styleTag.textContent = css;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("adaptmind_playlist", spotifyPlaylistId);
  }, [spotifyPlaylistId]);

  useEffect(() => {
    localStorage.setItem("adaptmind_prompts", JSON.stringify(agentPrompts));
  }, [agentPrompts]);

  useEffect(() => {
    localStorage.setItem("adaptmind_knowledge", JSON.stringify(agentKnowledge));
  }, [agentKnowledge]);

  // --- UPDATE HANDLERS ---

  const updateAgentPrompt = (agent: string, prompt: string) => {
    setAgentPrompts((prev) => ({ ...prev, [agent]: prompt }));
  };

  const updateAgentKnowledge = (agent: string, knowledge: string) => {
    setAgentKnowledge((prev) => ({ ...prev, [agent]: knowledge }));
  };

  const level = Math.floor(xp / 100) + 1;

  const addXp = (amount: number) => {
    setXp((prev) => {
      const newXp = prev + amount;
      const newLevel = Math.floor(newXp / 100) + 1;
      if (newLevel > Math.floor(prev / 100) + 1) {
        notify(
          `Nível Up! Agora você é nível ${Math.floor(newXp / 100) + 1}`,
          "success",
        );
      }
      return newXp;
    });
  };

  const notify = (
    message: string,
    type: "success" | "info" | "error" | "warning" = "info",
  ) => {
    const id = crypto.randomUUID();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      4000,
    );
  };

  const removeNotification = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <Brain size={48} className="text-blue-600 mb-4" />
          <p className="text-slate-500">Carregando AdaptMind...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full animate-fadeIn">
          {/* Logo Ajustado: w-28 h-28 para harmonia visual */}
          <div className="flex justify-center mb-6">
            <Logo url={customLogo} className="w-28 h-28" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">AdaptMind</h1>
          <p className="text-slate-500 mb-6">Estudo Adaptativo</p>

          {authError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold">
              {authError}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6 text-left">
            {authMode === "register" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  placeholder="Seu Nome"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition disabled:opacity-50 mt-2"
            >
              {isAuthLoading
                ? "Aguarde..."
                : authMode === "login"
                  ? "Entrar"
                  : "Criar Conta"}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-slate-400 text-sm font-bold">OU</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 mb-6"
          >
            <Users size={20} />
            Entrar com Google
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setAuthError("");
            }}
            className="text-blue-600 text-sm font-bold hover:underline"
          >
            {authMode === "login"
              ? "Não tem uma conta? Cadastre-se"
              : "Já tem uma conta? Faça login"}
          </button>
        </div>
      </div>
    );
  }

  const SidebarItem = ({
    id,
    icon: Icon,
    label,
  }: {
    id: ViewType;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => {
        setActiveView(id);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition mb-1 text-left ${activeView === id ? "bg-teal-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div
      className={`${theme} flex h-screen bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden text-slate-900 dark:text-slate-100`}
    >
      <NotificationToast
        notifications={notifications}
        remove={removeNotification}
      />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden animate-fadeIn"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar with Mobile Support */}
      <aside
        className={`w-64 bg-slate-900 text-white flex flex-col shadow-2xl fixed md:relative z-40 h-full transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="p-6 border-b border-slate-800 flex flex-col items-center justify-center text-center gap-4">
          <div className="flex items-center justify-between w-full md:hidden">
            <span></span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          {/* Logo proporcional para a barra lateral (w-16/64px) */}
          <Logo url={customLogo} className="w-16 h-16" />
          <h1 className="font-bold text-lg">
            AdaptMind{" "}
            <span className="text-xs text-teal-400 font-normal">v10.0</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-bold text-slate-500 uppercase mb-2 px-4">
            Principal
          </div>
          <SidebarItem id="dashboard" icon={Trophy} label="Painel Inicial" />
          <SidebarItem id="gamification" icon={Medal} label="Conquistas" />

          <div className="text-xs font-bold text-slate-500 uppercase mb-2 px-4 mt-4">
            Estudo & IA
          </div>
          <SidebarItem id="nexus" icon={Bot} label="Nexus IA (Agentes)" />
          <SidebarItem id="live" icon={Mic} label="Conversa de Voz" />
          <SidebarItem id="focus" icon={Headphones} label="Foco Sonoro" />
          <SidebarItem id="flashcards" icon={Layers} label="Flashcards IA" />
          <SidebarItem id="planner" icon={Calendar} label="Planejador" />
          <SidebarItem
            id="transformer"
            icon={UploadCloud}
            label="AdaptCast Studio"
          />

          <div className="text-xs font-bold text-slate-500 uppercase mb-2 px-4 mt-4">
            Social & Rede
          </div>
          <SidebarItem id="journal" icon={BookOpen} label="Diário" />
          <SidebarItem id="community" icon={Users} label="Comunidade" />
          <SidebarItem
            id="clinics"
            icon={Stethoscope}
            label="Clínicas Parceiras"
          />

          <div className="text-xs font-bold text-slate-500 uppercase mb-2 px-4 mt-4">
            Sistema
          </div>
          <SidebarItem id="team" icon={Layout} label="Equipe" />
          <SidebarItem
            id="test"
            icon={ClipboardCheck}
            label="Recalibrar Perfil"
          />
          {user?.role === "admin" && (
            <SidebarItem id="admin" icon={Settings} label="Admin" />
          )}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between px-2 mb-4 text-xs font-bold text-yellow-400">
            <span className="flex items-center gap-1">
              <Coins size={14} /> {coins}
            </span>
            <span className="flex items-center gap-1">
              <Flame size={14} /> {streak}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 text-red-300 py-2 rounded-lg hover:bg-slate-700 transition"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col relative w-full">
        <TopMusicBar
          playlistId={spotifyPlaylistId}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div
          className={
            activeView === "focus" ? "h-full overflow-hidden" : "hidden"
          }
        >
          <FocusSoundView addXp={addXp} notify={notify} />
        </div>

        <div
          className={`flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar ${activeView === "focus" ? "hidden" : ""}`}
        >
          {activeView === "dashboard" && (
            <DashboardView
              user={user}
              xp={xp}
              level={level}
              setActiveView={setActiveView}
              journalEntries={journalEntries}
              posts={posts}
              notify={notify}
            />
          )}

          {activeView === "nexus" && (
            <UnifiedAIView
              addXp={addXp}
              notify={notify}
              agentPrompts={agentPrompts}
              agentKnowledge={agentKnowledge}
              setActiveView={setActiveView}
              pdfContext={pdfContext}
              setPdfContext={setPdfContext}
            />
          )}

          {activeView === "gamification" && (
            <GamificationView
              xp={xp}
              level={level}
              coins={coins}
              streak={streak}
              badges={badges}
            />
          )}
          {activeView === "flashcards" && (
            <FlashcardView addXp={addXp} notify={notify} />
          )}
          {activeView === "planner" && (
            <StudyPlannerView user={user} addXp={addXp} notify={notify} />
          )}
          {activeView === "transformer" && (
            <TransformerUploadView user={user} addXp={addXp} notify={notify} />
          )}
          {activeView === "journal" && (
            <JournalView
              addXp={addXp}
              journalEntries={journalEntries}
              setJournalEntries={setJournalEntries}
              notify={notify}
              basePrompt={agentPrompts.journal}
              agentKnowledge={agentKnowledge.journal}
            />
          )}
          {activeView === "community" && (
            <CommunityView
              posts={posts}
              setPosts={setPosts}
              user={user}
              addXp={addXp}
              notify={notify}
            />
          )}
          {activeView === "test" && (
            <CognitiveTestView
              user={user}
              setUser={setUser}
              setActiveView={setActiveView}
              addXp={addXp}
              notify={notify}
            />
          )}

          {activeView === "admin" && (
            <AdminView
              user={user}
              notify={notify}
              playlistId={spotifyPlaylistId}
              setPlaylistId={setSpotifyPlaylistId}
              agentPrompts={agentPrompts}
              updateAgentPrompt={updateAgentPrompt}
              agentKnowledge={agentKnowledge}
              updateAgentKnowledge={updateAgentKnowledge}
              theme={theme}
              setTheme={setTheme}
              team={team}
              setTeam={setTeam}
              users={users}
              setUsers={setUsers}
              customLogo={customLogo} // Pass logo for preview
              setCustomLogo={setCustomLogo}
            />
          )}

          {activeView === "api" && <ApiDocView />}
          {activeView === "team" && <TeamView team={team} />}
          {activeView === "clinics" && <PartnerClinicsView />}

          {activeView === "ai" && (
            <AIChatView
              addXp={addXp}
              notify={notify}
              basePrompt={agentPrompts.tutor}
              agentKnowledge={agentKnowledge.tutor}
              setActiveView={setActiveView}
              pdfContext={pdfContext}
              setPdfContext={setPdfContext}
            />
          )}
          {activeView === "summary" && (
            <SummaryView
              addXp={addXp}
              notify={notify}
              basePrompt={agentPrompts.summary}
              agentKnowledge={agentKnowledge.summary}
              setActiveView={setActiveView}
              pdfContext={pdfContext}
              setPdfContext={setPdfContext}
            />
          )}
          {activeView === "study_guide" && (
            <StudyGuideView
              addXp={addXp}
              notify={notify}
              basePrompt={agentPrompts.study_guide}
              agentKnowledge={agentKnowledge.study_guide}
              setActiveView={setActiveView}
              pdfContext={pdfContext}
              setPdfContext={setPdfContext}
            />
          )}
          {activeView === "exercises" && (
            <ExercisesView
              addXp={addXp}
              notify={notify}
              basePrompt={agentPrompts.exercises}
              agentKnowledge={agentKnowledge.exercises}
              setActiveView={setActiveView}
              pdfContext={pdfContext}
              setPdfContext={setPdfContext}
            />
          )}
          {activeView === "timeline" && (
            <TimelineView
              addXp={addXp}
              notify={notify}
              basePrompt={agentPrompts.timeline}
              agentKnowledge={agentKnowledge.timeline}
              setActiveView={setActiveView}
              pdfContext={pdfContext}
              setPdfContext={setPdfContext}
            />
          )}
          {activeView === "mindmap" && (
            <MindMapView
              addXp={addXp}
              notify={notify}
              basePrompt={agentPrompts.mindmap}
              agentKnowledge={agentKnowledge.mindmap}
              setActiveView={setActiveView}
              pdfContext={pdfContext}
              setPdfContext={setPdfContext}
            />
          )}
        </div>
      </main>
    </div>
  );
}


export interface User {
  uid?: string;
  name: string;
  email?: string;
  role: 'student' | 'admin';
  cognitiveProfile?: string;
  archetype?: string; // Novo campo para o Arquétipo (ex: "Visionário Ágil")
  status?: 'active' | 'blocked';
  joinedAt?: string;
  xp?: number;
  level?: number;
  coins?: number;
  streak?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  desc: string;
}

export interface ReportedPost {
  id: string;
  author: string;
  content: string;
  reason: string;
  date: string;
}

export interface JournalEntry {
  id: string;
  text: string;
  feedback: string;
  date: string;
  time: string;
}

export interface Post {
  id: string;
  user: string;
  role: string;
  content: string;
  likes: number;
  comments: number;
  pinned?: boolean;
}

export interface MindMapNodeData {
  label: string;
  children?: MindMapNodeData[];
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface StorySegment {
  text: string;
  choices: string[];
  selected?: string;
}

export interface StudyPlanDay {
  day: string;
  tasks: string[];
}

export interface StudyPlan {
  tips: string[];
  schedule: StudyPlanDay[];
}

export interface PodcastLine {
  speaker: string;
  text: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  type?: 'text' | 'mindmap'; // New field for rich content
  data?: MindMapNodeData;    // Payload for mind maps
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredXp: number;
  unlocked?: boolean;
}

export type Theme = 'light' | 'dark' | 'high-contrast';

export type ViewType = 
  | 'dashboard' 
  | 'story' 
  | 'flashcards' 
  | 'analogy' 
  | 'mindmap' 
  | 'planner' 
  | 'transformer' 
  | 'ai' 
  | 'test' 
  | 'simplifier' 
  | 'music' 
  | 'journal' 
  | 'community' 
  | 'team' 
  | 'admin' 
  | 'api'
  | 'live'
  | 'nexus'
  | 'gamification'
  | 'focus'
  | 'summary'
  | 'study_guide'
  | 'exercises'
  | 'timeline'
  | 'clinics';
export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm' | 'clarity' | 'custom';

export interface InteractionMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export interface JournalInteraction {
  id: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  initialPrompt: string;
  latestResponse: string;
  messages: InteractionMessage[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  modelUsed: string;
  moodRating?: number;
  isFavorite?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface ModeConfig {
  id: ReflectionMode;
  label: string;
  description: string;
  badgeColor: string;
  iconName: string;
  promptPlaceholder: string;
}

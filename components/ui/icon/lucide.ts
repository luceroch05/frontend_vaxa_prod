import {
  Bell,
  Trash2,
  Edit,
  Plus,
  Search,
  User,
  Settings,
  LogOut,
  Mail,
  Lock,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  type LucideIcon as LucideIconType,
} from 'lucide-react';

export const lucideIcons = {
  bell: Bell,
  trash: Trash2,
  edit: Edit,
  plus: Plus,
  search: Search,
  user: User,
  settings: Settings,
  logout: LogOut,
  mail: Mail,
  lock: Lock,
  building: Building2,
  eye: Eye,
  eyeOff: EyeOff,
  alertCircle: AlertCircle,
  loader: Loader2,
} as const;

export type LucideIconName = keyof typeof lucideIcons;

// Re-exportar iconos por nombre para import directo: import { Mail } from '@/components/ui/icon'
export {
  Bell,
  Trash2,
  Edit,
  Plus,
  Search,
  User,
  Settings,
  LogOut,
  Mail,
  Lock,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
};
export type { LucideIconType };

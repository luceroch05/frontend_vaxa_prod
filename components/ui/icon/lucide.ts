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

  FileText,
  Calendar,
  Download,

  Edit2,
  Save,
  X,
  RefreshCw,
  Package,
  Users,
 
  Star,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  
  CheckCircle,
  XCircle,
  Award,

  Shield,
  Clock,

  Verified,
  Sparkles,
 
  FolderOpen,
 
  TrendingUp,
 
  Activity,
  
  ArrowRight,
  
  Upload,
  FileSpreadsheet,
  Type,
  PenTool,
 
  CheckCircle2,
  ChevronRight,
  
  Image as ImageIcon,
 
    CreditCard,

 
  Zap,
   FileImage,

  Unlock,
  Check,

 
  FileSignature,

  BarChart3,
 
  LayoutDashboard,
 
 Phone, MapPin, Globe,
 DollarSign,
 LogIn,
   Info,
  type LucideIcon,
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
   FileText,
  Calendar,
  Download,
  Edit2,
  Save,
  X,
  RefreshCw,
  Package,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
   CheckCircle,
  XCircle,
  Award,

  Shield,
  Clock,

  Verified,
  Sparkles,
  FolderOpen,
    TrendingUp,
 
  Activity,

  ArrowRight,
  
 
 
  

  
  
   
  Upload,
  FileSpreadsheet,
  Type,
  PenTool,

  CheckCircle2,
  ChevronRight,

  ImageIcon,
   CreditCard,
  Check,
  Zap,
  FileImage,
  Unlock,
  FileSignature,
  BarChart3,
  LayoutDashboard,
   Phone, MapPin, Globe,
   DollarSign,
     Info,
     LogIn,
};
  export type { LucideIcon };

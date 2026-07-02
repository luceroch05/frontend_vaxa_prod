import {
  Bell,
  Trash2,
  Edit,
  Plus,
  Minus,
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
  MessageCircle,

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
  ArrowUpRight,

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

  // Iconos para el módulo de certificados
  GraduationCap,
  BookOpen,
  ClipboardList,
  UserCheck,
  UserPlus,
  FileBadge,
  QrCode,
  Layers,
  Menu,
  Home,
  ChevronLeft,
  MoreVertical,
  AlertTriangle,
  BadgeCheck,
  Pencil,
  Ban,
  PrinterIcon,
  Copy,
  Link2,

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
  graduationCap: GraduationCap,
  bookOpen: BookOpen,
  clipboardList: ClipboardList,
  userCheck: UserCheck,
  userPlus: UserPlus,
  fileBadge: FileBadge,
  qrCode: QrCode,
  layers: Layers,
  menu: Menu,
  home: Home,
  chevronLeft: ChevronLeft,
  moreVertical: MoreVertical,
  alertTriangle: AlertTriangle,
  badgeCheck: BadgeCheck,
  pencil: Pencil,
  ban: Ban,
  printer: PrinterIcon,
} as const;

export type LucideIconName = keyof typeof lucideIcons;

export {
  Bell, Trash2, Edit, Plus, Minus, Search, User, Settings, LogOut, Mail, Lock,
  Building2, Eye, EyeOff, AlertCircle, Loader2, FileText, Calendar, Download,
  Edit2, Save, X, RefreshCw, Package, Users, Star, ChevronDown, ChevronUp,
  ArrowLeft, CheckCircle, XCircle, Award, Shield, Clock, Verified, Sparkles,
  FolderOpen, TrendingUp, Activity, CheckCircle2, ArrowRight, ArrowUpRight, Upload, ImageIcon,
  FileSpreadsheet, Type, PenTool, ChevronRight, CreditCard, Check, Zap, FileImage,
  Unlock, FileSignature, BarChart3, LayoutDashboard, Phone, MapPin, Globe,
  DollarSign, Info, LogIn,
  // Certificados
  GraduationCap, BookOpen, ClipboardList, UserCheck, UserPlus, FileBadge,
  QrCode, Layers, Menu, Home, ChevronLeft, MoreVertical, AlertTriangle,
  BadgeCheck, Pencil, Ban, PrinterIcon, Copy, Link2, MessageCircle,
};
export type { LucideIcon };

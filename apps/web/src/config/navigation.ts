import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  BookOpenCheck,
  FileSpreadsheet,
  CreditCard,
  Library,
  Bus,
  Bell,
  Settings,
  BookMarked,
  ShieldCheck,
  Link,
  Building2,
  PieChart,
  GitPullRequest,
  Rocket,
  Clock,
  FileText,
  History,
  Layers,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  ClipboardList,
  UserCheck,
  Briefcase,
  FolderOpen,
  MapPin,
  Truck,
  BookCopy,
  Receipt,
  Wallet,
  Scale,
  Database,
  LifeBuoy,
  Megaphone,
  Monitor,
  ShoppingCart,
  Package,
  Stethoscope,
  Activity,
  Heart,
  Thermometer,
  Smartphone,
  Mail,
  UserCircle,
  BarChart3,
  File,
  Gavel,
  HardHat,
  PiggyBank,
  Book,
  GraduationCap as GradCap,
} from 'lucide-react';

export interface NavigationItem {
  label: string;
  icon: any;
  href: string;
  permission?: string;
  entitlement?: string;
  roles?: string[];
  badge?: string | number;
  children?: NavigationItem[];
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

/* ============================================================
   PLATFORM SUPER ADMIN PORTAL
   Manages ALL schools across the platform
   ============================================================ */
export const SUPER_ADMIN_NAV: NavigationSection[] = [
  {
    title: 'Platform Overview',
    items: [
      { label: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
      { label: 'System Health', href: '/super-admin/monitoring', icon: BarChart3 },
      { label: 'Recent Platform Activity', href: '/super-admin/audit', icon: History },
    ]
  },
  {
    title: 'School Management',
    items: [
      { label: 'Registered Schools', href: '/super-admin/schools', icon: Building2 },
      { label: 'Registration Requests', href: '/super-admin/schools?status=PENDING', icon: ClipboardList },
      { label: 'School Administrators', href: '/super-admin/users', icon: Users },
      { label: 'School Status & Onboarding', href: '/super-admin/schools', icon: Rocket },
    ]
  },
  {
    title: 'Commercial Management',
    items: [
      { label: 'SMS Packages', href: '/super-admin/sms-packages', icon: Smartphone },
      { label: 'SMS Credit Ledger', href: '/super-admin/sms-credits', icon: Wallet },
      { label: 'SMS Usage', href: '/super-admin/sms-credits', icon: Activity },
      { label: 'Payment Transactions', href: '/super-admin/payments', icon: CreditCard },
      { label: 'Subscription Plans', href: '/super-admin/plans', icon: PiggyBank },
      { label: 'Premium Features & Entitlements', href: '/super-admin/settings', icon: Settings },
    ]
  },
  {
    title: 'Platform Services',
    items: [
      { label: 'SMS Gateway', href: '/super-admin/settings', icon: Smartphone },
      { label: 'Email Services', href: '/super-admin/settings', icon: Mail },
      { label: 'Payment Integrations', href: '/super-admin/payments', icon: CreditCard },
      { label: 'API Configuration', href: '/super-admin/settings', icon: Link },
      { label: 'Service Monitoring', href: '/super-admin/monitoring', icon: Monitor },
    ]
  },
  {
    title: 'System Administration',
    items: [
      { label: 'Maintenance', href: '/super-admin/maintenance', icon: Gavel },
      { label: 'Application Configuration', href: '/super-admin/settings', icon: Settings },
      { label: 'Developer Mode', href: '/super-admin/dev-mode', icon: Activity },
      { label: 'Error Monitoring', href: '/super-admin/monitoring', icon: AlertCircle },
      { label: 'Background Jobs', href: '/super-admin/monitoring', icon: Activity },
      { label: 'Backup & Recovery', href: '/super-admin/backups', icon: Database },
    ]
  },
  {
    title: 'Security and Audit',
    items: [
      { label: 'Platform Users', href: '/super-admin/users', icon: Users },
      { label: 'Privileged Access', href: '/super-admin/support-access', icon: ShieldCheck },
      { label: 'Security Events', href: '/super-admin/security', icon: AlertCircle },
      { label: 'Audit Logs', href: '/super-admin/audit', icon: FileText },
    ]
  },
  {
    title: 'Communication',
    items: [
      { label: 'Announcements', href: '/super-admin/announcements', icon: Megaphone },
    ]
  }
];

/* ============================================================
   SCHOOL ADMIN PORTAL
   Each school manages ONLY their own data
   ============================================================ */
export const SCHOOL_NAV: NavigationSection[] = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'School Management',
    items: [
      { label: 'School Profile', href: '/dashboard/settings', icon: Building2, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'] },
      { label: 'Academic Years & Terms', href: '/dashboard/academics/years', icon: Clock, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'] },
      { label: 'Classes & Streams', href: '/dashboard/academics/classes', icon: Layers, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'] },
      { label: 'Subjects', href: '/dashboard/academics/subjects', icon: Book, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'] },
    ]
  },
  {
    title: 'People',
    items: [
      { label: 'Students', href: '/dashboard/students', icon: GraduationCap, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'TEACHER', 'ACCOUNTANT', 'HR'] },
      { label: 'Parents & Guardians', href: '/dashboard/guardians', icon: UserCircle, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'RECEPTIONIST'] },
      { label: 'Teachers & Staff', href: '/dashboard/hr/staff', icon: Briefcase, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'HR'] },
      { label: 'Register Teacher', href: '/dashboard/teachers/new', icon: GraduationCap, roles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER', 'RECEPTIONIST'] },
      { label: 'User Accounts', href: '/dashboard/users', icon: ShieldCheck, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
    ]
  },
  {
    title: 'Academics',
    items: [
      { label: 'Academic Overview', href: '/dashboard/academics', icon: BookMarked },
      { label: 'Enrollments', href: '/dashboard/academics/enrollments', icon: UserCheck },
      { label: 'Timetable', href: '/dashboard/academics/timetable', icon: Clock },
      { label: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck },
      { label: 'Assessments & Examinations', href: '/dashboard/assessments', icon: ClipboardList },
      { label: 'Results & Report Cards', href: '/dashboard/results', icon: FileSpreadsheet },
    ]
  },
  {
    title: 'Finance',
    items: [
      { label: 'Finance Overview', href: '/dashboard/finance', icon: Wallet, roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
      { label: 'Fee Structures', href: '/accountant/fees', icon: PiggyBank, roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
      { label: 'Invoices', href: '/dashboard/finance/invoices', icon: FileText, roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
      { label: 'Payments', href: '/dashboard/finance/payments', icon: CreditCard, roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
      { label: 'Outstanding Balances', href: '/accountant/outstanding', icon: AlertCircle, roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
      { label: 'Financial Reports', href: '/accountant/reports', icon: BarChart3, roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    ]
  },
  {
    title: 'Communication',
    items: [
      { label: 'SMS & Email', href: '/communications', icon: Megaphone, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
      { label: 'SMS Credit Balance', href: '/dashboard/sms/balance', icon: Smartphone, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
      { label: 'Purchase SMS Credits', href: '/dashboard/sms/purchase', icon: CreditCard, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
      { label: 'Message History', href: '/communications/delivery', icon: FileText, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
      { label: 'Announcements', href: '/dashboard/announcements', icon: Bell },
    ]
  },
  {
    title: 'Operations',
    items: [
      { label: 'Admissions', href: '/dashboard/admissions', icon: UserCheck, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'RECEPTIONIST'] },
      { label: 'Library', href: '/dashboard/library', icon: Library },
      { label: 'Transport', href: '/dashboard/transport', icon: Bus },
      { label: 'HR', href: '/dashboard/hr', icon: Briefcase, roles: ['SCHOOL_ADMIN', 'ADMIN', 'HR'] },
      { label: 'Inventory', href: '/inventory', icon: Package, roles: ['SCHOOL_ADMIN', 'ADMIN', 'INVENTORY_OFFICER', 'STOREKEEPER'] },
      { label: 'Assets', href: '/assets', icon: Monitor, roles: ['SCHOOL_ADMIN', 'ADMIN', 'INVENTORY_OFFICER'] },
      { label: 'Procurement', href: '/procurement', icon: ShoppingCart, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER'] },
      { label: 'Health & Clinic', href: '/health', icon: Stethoscope, roles: ['SCHOOL_ADMIN', 'ADMIN', 'NURSE', 'MEDICAL_OFFICER'] },
      { label: 'Task Management', href: '/dashboard/tasks', icon: ClipboardList, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'HR_OFFICER'] },
    ]
  },
  {
    title: 'Reports',
    items: [
      { label: 'Student Reports', href: '/dashboard/report-cards/generate', icon: File, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'] },
      { label: 'Academic Reports', href: '/dashboard/results', icon: BarChart3, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'TEACHER'] },
      { label: 'Attendance Reports', href: '/dashboard/attendance/history', icon: CalendarCheck, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'] },
      { label: 'Financial Reports', href: '/accountant/reports', icon: BarChart3, roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    ]
  },
  {
    title: 'Administration & Settings',
    items: [
      { label: 'School Settings Center', href: '/dashboard/settings', icon: Settings, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
      { label: 'Roles & Permissions', href: '/dashboard/users', icon: Gavel, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
      { label: 'Notification Settings', href: '/dashboard/settings/features', icon: Bell, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
      { label: 'School Activity History', href: '/dashboard/activity', icon: FileText, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
    ]
  },
  {
    title: 'Staff Supervision',
    items: [
      { label: 'Task Management', href: '/dashboard/tasks', icon: ClipboardList, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'HR_OFFICER'] },
    ]
  }
];

export const TEACHER_NAV: NavigationSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
      { label: 'My Tasks', href: '/teacher/tasks', icon: ClipboardList },
      { label: 'My Classes', href: '/teacher/classes', icon: BookMarked },
      { label: 'My Students', href: '/teacher/students', icon: GraduationCap },
      { label: 'Timetable', href: '/teacher/timetable', icon: Clock },
    ]
  },
  {
    title: 'Academic',
    items: [
      { label: 'Attendance', href: '/teacher/attendance', icon: CalendarCheck },
      { label: 'Assessments', href: '/teacher/assessments', icon: BookOpenCheck },
      { label: 'Assignments', href: '/teacher/assignments', icon: FileText },
      { label: 'Reports', href: '/teacher/reports', icon: FileSpreadsheet },
      { label: 'Resources', href: '/teacher/resources', icon: FolderOpen },
    ]
  },
  {
    title: 'Communication',
    items: [
      { label: 'Messages', href: '/teacher/messages', icon: MessageSquare },
      { label: 'Announcements', href: '/teacher/announcements', icon: Bell },
      { label: 'Notifications', href: '/teacher/notifications', icon: Bell },
    ]
  },
  {
    title: 'Personal',
    items: [
      { label: 'Profile', href: '/teacher/profile', icon: Users },
      { label: 'Settings', href: '/teacher/settings', icon: Settings },
    ]
  }
];

export const STUDENT_NAV: NavigationSection[] = [
  {
    title: 'Learning',
    items: [
      { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
      { label: 'My Classes', href: '/student/classes', icon: BookMarked },
      { label: 'Subjects', href: '/student/subjects', icon: BookOpenCheck },
      { label: 'Timetable', href: '/student/timetable', icon: Clock },
    ]
  },
  {
    title: 'Academic',
    items: [
      { label: 'Attendance', href: '/student/attendance', icon: CalendarCheck },
      { label: 'Assessments', href: '/student/assessments', icon: ClipboardList },
      { label: 'Assignments', href: '/student/assignments', icon: FileText },
      { label: 'Examinations', href: '/student/examinations', icon: ClipboardList },
      { label: 'Results', href: '/student/results', icon: FileSpreadsheet },
    ]
  },
  {
    title: 'Finance & Tools',
    items: [
      { label: 'Fees', href: '/student/fees', icon: Wallet },
      { label: 'Library', href: '/student/library', icon: Library },
      { label: 'Transport', href: '/student/transport', icon: Bus },
    ]
  },
  {
    title: 'Communication',
    items: [
      { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
      { label: 'Announcements', href: '/student/announcements', icon: Bell },
    ]
  }
];

export const PARENT_NAV: NavigationSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
      { label: 'Children', href: '/parent/children', icon: GraduationCap },
    ]
  },
  {
    title: 'Academic',
    items: [
      { label: 'Attendance', href: '/parent/attendance', icon: CalendarCheck },
      { label: 'Results', href: '/parent/results', icon: FileSpreadsheet },
      { label: 'Timetable', href: '/parent/timetable', icon: Clock },
    ]
  },
  {
    title: 'Finance & Operations',
    items: [
      { label: 'Fees', href: '/parent/fees', icon: Wallet },
      { label: 'Library', href: '/parent/library', icon: Library },
      { label: 'Transport', href: '/parent/transport', icon: Bus },
    ]
  },
  {
    title: 'Communication',
    items: [
      { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
      { label: 'Announcements', href: '/dashboard/announcements', icon: Bell },
    ]
  }
];

export const ACCOUNTANT_NAV: NavigationSection[] = [
  {
    title: 'Finance',
    items: [
      { label: 'Dashboard', href: '/accountant/dashboard', icon: LayoutDashboard },
      { label: 'Fee Structures', href: '/accountant/fees', icon: PiggyBank },
      { label: 'Invoices', href: '/accountant/invoices', icon: FileText },
      { label: 'Payments', href: '/accountant/payments', icon: CreditCard },
      { label: 'Receipts', href: '/accountant/receipts', icon: Receipt },
      { label: 'Ledger', href: '/accountant/ledger', icon: Scale },
      { label: 'Outstanding Balances', href: '/accountant/outstanding', icon: AlertCircle },
      { label: 'Billing', href: '/accountant/billing', icon: Receipt },
      { label: 'Record Refund', href: '/accountant/refunds/new', icon: History },
      { label: 'Reports', href: '/accountant/reports', icon: BarChart3 },
    ]
  },
  {
    title: 'Communication',
    items: [
      { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    ]
  }
];

export const LIBRARIAN_NAV: NavigationSection[] = [
  {
    title: 'Library',
    items: [
      { label: 'Dashboard', href: '/librarian/dashboard', icon: LayoutDashboard },
      { label: 'Books', href: '/librarian/books', icon: Library },
      { label: 'Issue Loan', href: '/librarian/loans/issue', icon: BookCopy },
      { label: 'Return Loan', href: '/librarian/loans/return', icon: GitPullRequest },
      { label: 'Reports', href: '/librarian/reports', icon: BarChart3 },
    ]
  }
];

export const HR_NAV: NavigationSection[] = [
  {
    title: 'Human Resources',
    items: [
      { label: 'Dashboard', href: '/dashboard/hr', icon: LayoutDashboard },
      { label: 'Staff', href: '/dashboard/hr/staff', icon: Users },
      { label: 'Leave', href: '/dashboard/hr/leave', icon: Clock },
    ]
  }
];

export const RECEPTIONIST_NAV: NavigationSection[] = [
  {
    title: 'Front Office',
    items: [
      { label: 'Dashboard', href: '/receptionist/dashboard', icon: LayoutDashboard },
      { label: 'Visitors Desk', href: '/receptionist/visitors', icon: Users },
      { label: 'Appointments', href: '/receptionist/appointments', icon: CalendarCheck },
      { label: 'Enquiries Log', href: '/receptionist/enquiries', icon: ClipboardList },
      { label: 'Student Checkout', href: '/receptionist/student-checkout', icon: GraduationCap },
      { label: 'Late Arrivals', href: '/receptionist/late-arrivals', icon: Clock },
      { label: 'Deliveries Log', href: '/receptionist/deliveries', icon: Truck },
      { label: 'Lost & Found', href: '/receptionist/lost-found', icon: AlertCircle },
    ]
  }
];

export const TRANSPORT_NAV: NavigationSection[] = [
  {
    title: 'Transport',
    items: [
      { label: 'Transport Overview', href: '/dashboard/transport', icon: LayoutDashboard },
    ]
  }
];

export const HEALTH_NAV: NavigationSection[] = [
  {
    title: 'Clinic Ops',
    items: [
      { label: 'Dashboard', href: '/health', icon: LayoutDashboard },
      { label: 'Clinic Queue', href: '/health/clinic/queue', icon: Clock },
      { label: 'New Visit', href: '/health/visits/new', icon: Stethoscope },
    ]
  },
  {
    title: 'Records',
    items: [
      { label: 'Incidents', href: '/health/incidents', icon: AlertCircle },
    ]
  }
];
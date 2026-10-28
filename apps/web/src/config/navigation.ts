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
  Thermometer
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

export const SUPER_ADMIN_NAV: NavigationSection[] = [
  {
    title: 'Platform',
    items: [
      { label: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
      { label: 'Schools', href: '/super-admin/schools', icon: Building2 },
      { label: 'Users', href: '/super-admin/users', icon: Users },
      { label: 'Support Access', href: '/super-admin/support-access', icon: LifeBuoy },
      { label: 'Announcements', href: '/super-admin/announcements', icon: Megaphone },
      { label: 'Platform Settings', href: '/super-admin/settings', icon: Settings },
      { label: 'Launch Readiness', href: '/super-admin/launch-readiness', icon: Rocket },
    ]
  },
  {
    title: 'Financials',
    items: [
      { label: 'Plans', href: '/super-admin/plans', icon: Layers },
      { label: 'Revenue', href: '/super-admin/payments', icon: CreditCard },
    ]
  },
  {
    title: 'Operations',
    items: [
      { label: 'Maintenance', href: '/super-admin/maintenance', icon: Settings },
      { label: 'Backups', href: '/super-admin/backups', icon: Database },
      { label: 'Security', href: '/super-admin/security', icon: ShieldCheck },
      { label: 'Audit', href: '/super-admin/audit', icon: History },
      { label: 'Monitoring', href: '/super-admin/monitoring', icon: PieChart },
    ]
  }
];

export const SCHOOL_NAV: NavigationSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'People',
    items: [
      { label: 'Students', href: '/dashboard/students', icon: GraduationCap, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'TEACHER', 'ACCOUNTANT', 'HR'] },
      { label: 'Staff', href: '/dashboard/hr/staff', icon: Briefcase, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'HR'] },
      { label: 'Users & Roles', href: '/dashboard/users', icon: ShieldCheck, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
    ]
  },
  {
    title: 'Academics',
    items: [
      { label: 'Academic Overview', href: '/dashboard/academics', icon: BookMarked },
      { label: 'Academic Years', href: '/dashboard/academics/years', icon: Clock, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'] },
      { label: 'Enrollments', href: '/dashboard/academics/enrollments', icon: UserCheck },
      { label: 'Timetable', href: '/dashboard/academics/timetable', icon: Clock },
      { label: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck },
      { label: 'Examinations', href: '/dashboard/examinations', icon: ClipboardList },
      { label: 'Results', href: '/dashboard/results', icon: FileSpreadsheet },
    ]
  },
  {
    title: 'Finance',
    items: [
      { label: 'Finance Overview', href: '/dashboard/finance', icon: Wallet, roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
      { label: 'Invoices', href: '/dashboard/finance/invoices', icon: FileText, roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
      { label: 'Payments', href: '/dashboard/finance/payments', icon: CreditCard, roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    ]
  },
  {
    title: 'Operations',
    items: [
      { label: 'Admissions', href: '/dashboard/admissions', icon: UserCheck, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'RECEPTIONIST'] },
      { label: 'Library', href: '/dashboard/library', icon: Library },
      { label: 'Transport', href: '/dashboard/transport', icon: Bus },
      { label: 'HR', href: '/dashboard/hr', icon: Briefcase, roles: ['SCHOOL_ADMIN', 'ADMIN', 'HR'] },
    ]
  },
  {
    title: 'Communication',
    items: [
      { label: 'Operations Center', href: '/communications', icon: Megaphone, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
      { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badge: 'New' },
      { label: 'Announcements', href: '/dashboard/announcements', icon: Bell },
    ]
  },
  {
    title: 'Resources',
    items: [
      { label: 'Inventory', href: '/inventory', icon: Package, roles: ['SCHOOL_ADMIN', 'ADMIN', 'INVENTORY_OFFICER', 'STOREKEEPER'] },
      { label: 'Assets', href: '/assets', icon: Monitor, roles: ['SCHOOL_ADMIN', 'ADMIN', 'INVENTORY_OFFICER'] },
      { label: 'Procurement', href: '/procurement', icon: ShoppingCart, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER'] },
      { label: 'Health & Clinic', href: '/health', icon: Stethoscope, roles: ['SCHOOL_ADMIN', 'ADMIN', 'NURSE', 'MEDICAL_OFFICER'] },
    ]
  },
  {
    title: 'Administration',
    items: [
      { label: 'School Settings', href: '/dashboard/settings', icon: Settings, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
    ]
  }
];

export const TEACHER_NAV: NavigationSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
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
      { label: 'Invoices', href: '/accountant/invoices', icon: FileText },
      { label: 'Payments', href: '/accountant/payments', icon: CreditCard },
      { label: 'Receipts', href: '/accountant/receipts', icon: Receipt },
      { label: 'Ledger', href: '/accountant/ledger', icon: Scale },
      { label: 'Outstanding', href: '/accountant/outstanding', icon: AlertCircle },
      { label: 'Billing', href: '/accountant/billing', icon: Receipt },
      { label: 'Record Refund', href: '/accountant/refunds/new', icon: History },
      { label: 'Fee Structures', href: '/accountant/fees', icon: Wallet },
      { label: 'Reports', href: '/accountant/reports', icon: TrendingUp },
    ]
  },
  {
    title: 'Students',
    items: [
      { label: 'Students', href: '/dashboard/students', icon: GraduationCap },
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
      { label: 'Reports', href: '/librarian/reports', icon: TrendingUp },
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

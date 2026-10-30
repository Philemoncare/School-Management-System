import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchableEntityType, SearchIndex, SavedSearch, SearchHistory } from '@prisma/client';
import { GlobalSearchDto, AdvancedSearchDto, SaveSearchDto, SearchResult } from './dto/search.dto';
import { IndexingService } from './indexing.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(schoolId: string, userId: string, roles: string[], dto: GlobalSearchDto): Promise<SearchResult[]> {
    const { q, entities, module } = dto;

    // Save to history
    await this.saveHistory(schoolId, userId, q, module);

    const where: any = {
      schoolId,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { subtitle: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { entityId: q }, // Exact identifier match
      ],
    };

    if (entities && entities.length > 0) {
      where.entityType = { in: entities };
    }

    if (module) {
      where.module = module;
    }

    // In a real PostgreSQL FTS implementation, we would use:
    // SELECT *, ts_rank(to_tsvector(content), plainto_tsquery('query')) as rank ... ORDER BY rank DESC
    let results = await this.prisma.searchIndex.findMany({
      where,
      take: 100,
      orderBy: [
        { title: 'asc' },
        { updatedAt: 'desc' }
      ],
    });

    // Permission filtering
    results = await this.filterByPermissions(schoolId, userId, roles, results);

    // Manual Ranking Logic (Objective 18, 19)
    const rankedResults = results.map(item => {
      let score = 0;
      const lowerQ = q.toLowerCase();
      const lowerTitle = item.title.toLowerCase();
      const lowerSubtitle = item.subtitle?.toLowerCase() || '';

      if (item.entityId === q) score += 1000;
      if (lowerTitle === lowerQ) score += 500;
      if (lowerTitle.startsWith(lowerQ)) score += 200;
      if (lowerSubtitle.includes(lowerQ)) score += 50;
      if (item.content?.toLowerCase().includes(lowerQ)) score += 20;

      return { ...item, relevanceScore: score };
    }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    return rankedResults.map(item => this.mapToSearchResult(item, roles)).slice(0, 50);
  }

  async advancedSearch(schoolId: string, userId: string, roles: string[], dto: AdvancedSearchDto): Promise<SearchResult[]> {
    const { q, entity, filters, sortBy, sortOrder } = dto;

    const where: any = {
      schoolId,
      entityType: entity,
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { entityId: q },
      ];
    }

    // Server-side validation and application of filters (Objective 26)
    if (filters && typeof filters === 'object') {
      const metadataFilters: any[] = [];
      for (const [key, value] of Object.entries(filters)) {
        if (!key || value === undefined || value === null || value === '') continue;
        // In this implementation, we map filters to the metadata JSON field.
        metadataFilters.push({ metadata: { path: [key], equals: value } });
      }
      if (metadataFilters.length > 0) where.AND = metadataFilters;
    }

    const sortableFields = new Set(['title', 'entityType', 'updatedAt', 'createdAt']);
    const orderBy: any =
      sortBy && sortableFields.has(sortBy)
        ? { [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc' }
        : { updatedAt: 'desc' };

    let results = await this.prisma.searchIndex.findMany({
      where,
      orderBy,
      take: 100,
    });

    results = await this.filterByPermissions(schoolId, userId, roles, results);

    return results.map(item => this.mapToSearchResult(item, roles));
  }

  async platformSearch(roles: string[], dto: GlobalSearchDto): Promise<SearchResult[]> {
    if (!roles.includes('SUPER_ADMIN')) return [];

    const { q, entities } = dto;

    const where: any = {
      schoolId: 'PLATFORM',
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { entityId: q },
      ],
    };

    if (entities && entities.length > 0) {
      where.entityType = { in: entities };
    }

    const results = await this.prisma.searchIndex.findMany({
      where,
      take: 100,
      orderBy: { updatedAt: 'desc' },
    });

    return results.map(item => this.mapToSearchResult(item, roles));
  }

  async suggest(schoolId: string, q: string): Promise<string[]> {
    const results = await this.prisma.searchIndex.findMany({
      where: {
        schoolId,
        title: { startsWith: q, mode: 'insensitive' },
      },
      select: { title: true },
      distinct: ['title'],
      take: 10,
    });

    return results.map(r => r.title);
  }

  async saveSearch(schoolId: string, userId: string, dto: SaveSearchDto) {
    return this.prisma.savedSearch.create({
      data: {
        ...dto,
        schoolId,
        userId,
      },
    });
  }

  async getSavedSearches(schoolId: string, userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { schoolId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecentSearches(schoolId: string, userId: string) {
    return this.prisma.searchHistory.findMany({
      where: { schoolId, userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async getCommands(userId: string, roles: string[]) {
    // Comprehensive command list filtered by user roles (Objective 22, 24)
    const allCommands = [
      // Navigation
      { id: 'nav-dashboard', title: 'Dashboard', icon: 'Layout', route: '/dashboard', roles: [] },
      { id: 'nav-students', title: 'Students', icon: 'Users', route: '/dashboard/students', roles: ['SCHOOL_ADMIN', 'TEACHER', 'ADMISSIONS_OFFICER'] },
      { id: 'nav-teachers', title: 'Teachers', icon: 'BookOpen', route: '/dashboard/hr/staff', roles: ['SCHOOL_ADMIN', 'PRINCIPAL'] },
      { id: 'nav-admissions', title: 'Admissions', icon: 'UserPlus', route: '/dashboard/admissions', roles: ['SCHOOL_ADMIN', 'ADMISSIONS_OFFICER'] },
      { id: 'nav-finance', title: 'Finance', icon: 'DollarSign', route: '/dashboard/finance', roles: ['SCHOOL_ADMIN', 'ACCOUNTANT'] },
      { id: 'nav-academics', title: 'Academics', icon: 'Award', route: '/dashboard/academics', roles: ['SCHOOL_ADMIN', 'TEACHER'] },
      { id: 'nav-library', title: 'Library', icon: 'Book', route: '/dashboard/library', roles: ['SCHOOL_ADMIN', 'LIBRARIAN', 'STUDENT'] },
      { id: 'nav-transport', title: 'Transport', icon: 'Truck', route: '/dashboard/transport', roles: ['SCHOOL_ADMIN', 'TRANSPORT_MANAGER'] },
      { id: 'nav-hr', title: 'HR & Staff', icon: 'Briefcase', route: '/dashboard/hr', roles: ['SCHOOL_ADMIN'] },
      { id: 'nav-health', title: 'Health & Clinic', icon: 'Heart', route: '/health', roles: ['SCHOOL_ADMIN', 'NURSE', 'MEDICAL_OFFICER'] },
      { id: 'nav-settings', title: 'Settings', icon: 'Settings', route: '/dashboard/settings', roles: ['SCHOOL_ADMIN'] },

      // Platform Admin Navigation
      { id: 'nav-platform-schools', title: 'Schools Management', icon: 'Home', route: '/super-admin/schools', roles: ['SUPER_ADMIN'] },
      { id: 'nav-platform-subs', title: 'Subscriptions', icon: 'CreditCard', route: '/super-admin/plans', roles: ['SUPER_ADMIN'] },

      // Quick Actions
      { id: 'action-create-student', title: 'Register Student', icon: 'UserPlus', route: '/dashboard/students', roles: ['SCHOOL_ADMIN', 'ADMISSIONS_OFFICER'] },
      { id: 'action-record-payment', title: 'Record Payment', icon: 'DollarSign', route: '/dashboard/finance/payments', roles: ['SCHOOL_ADMIN', 'ACCOUNTANT'] },
      { id: 'action-mark-attendance', title: 'Mark Attendance', icon: 'CheckSquare', route: '/dashboard/attendance', roles: ['SCHOOL_ADMIN', 'TEACHER'] },
      { id: 'action-add-book', title: 'Add Library Book', icon: 'PlusCircle', route: '/dashboard/library', roles: ['SCHOOL_ADMIN', 'LIBRARIAN'] },
      { id: 'action-announcement', title: 'Create Announcement', icon: 'Bell', route: '/dashboard/announcements', roles: ['SCHOOL_ADMIN'] },
    ];

    return allCommands.filter(cmd => cmd.roles.length === 0 || cmd.roles.some(role => roles.includes(role)));
  }

  async getQuickActions(entityType: SearchableEntityType, entityId: string, roles: string[]) {
    // Context-aware quick actions (Objective 23)
    const actionsMap: Partial<Record<SearchableEntityType, any[]>> = {
      STUDENT: [
        { id: 'view-profile', title: 'View Profile', icon: 'User', route: `/dashboard/students/${entityId}`, roles: [] },
        { id: 'view-results', title: 'View Results', icon: 'Award', route: `/dashboard/students/${entityId}/results`, roles: ['TEACHER', 'SCHOOL_ADMIN', 'PRINCIPAL'] },
        { id: 'view-attendance', title: 'View Attendance', icon: 'Calendar', route: `/dashboard/students/${entityId}/attendance`, roles: ['TEACHER', 'SCHOOL_ADMIN'] },
        { id: 'view-fees', title: 'View Fees', icon: 'DollarSign', route: `/dashboard/students/${entityId}/fees`, roles: ['ACCOUNTANT', 'SCHOOL_ADMIN'] },
      ],
      TEACHER: [
        { id: 'view-profile', title: 'View Profile', icon: 'User', route: `/dashboard/teachers/${entityId}`, roles: ['SCHOOL_ADMIN', 'PRINCIPAL'] },
        { id: 'view-timetable', title: 'Timetable', icon: 'Clock', route: `/dashboard/teachers/${entityId}/timetable`, roles: [] },
        { id: 'assign-classes', title: 'Assign Classes', icon: 'PlusSquare', route: `/dashboard/teachers/${entityId}/assignments`, roles: ['SCHOOL_ADMIN'] },
      ],
      INVOICE: [
        { id: 'view-invoice', title: 'View Invoice', icon: 'FileText', route: `/dashboard/finance/invoices/${entityId}`, roles: [] },
        { id: 'record-payment', title: 'Record Payment', icon: 'DollarSign', route: `/dashboard/finance/payments/create?invoiceId=${entityId}`, roles: ['ACCOUNTANT', 'SCHOOL_ADMIN'] },
        { id: 'send-reminder', title: 'Send Reminder', icon: 'Mail', route: '#', roles: ['ACCOUNTANT', 'SCHOOL_ADMIN'] },
      ],
      LIBRARY_BOOK: [
        { id: 'view-book', title: 'Book Details', icon: 'Book', route: `/dashboard/library/books/${entityId}`, roles: [] },
        { id: 'issue-copy', title: 'Issue Copy', icon: 'ArrowUpRight', route: `/dashboard/library/loans/create?bookId=${entityId}`, roles: ['LIBRARIAN', 'SCHOOL_ADMIN'] },
      ],
      ADMISSION_APPLICATION: [
        { id: 'view-app', title: 'Review Application', icon: 'FileText', route: `/dashboard/admissions/applications/${entityId}`, roles: ['ADMISSIONS_OFFICER', 'SCHOOL_ADMIN'] },
        { id: 'schedule-interview', title: 'Schedule Interview', icon: 'Calendar', route: `/dashboard/admissions/applications/${entityId}/interview`, roles: ['ADMISSIONS_OFFICER', 'SCHOOL_ADMIN'] },
      ]
    };

    const actions = actionsMap[entityType] || [{ id: 'view', title: 'View Details', icon: 'Eye', route: this.getRoute(entityType, entityId), roles: [] }];
    return actions.filter(action => action.roles.length === 0 || action.roles.some(role => roles.includes(role)));
  }

  private async filterByPermissions(schoolId: string, userId: string, roles: string[], results: SearchIndex[]): Promise<SearchIndex[]> {
    // Objective 2, 29, 31-35: Security & Role-based Scoping
    if (roles.includes('SCHOOL_ADMIN') || roles.includes('PRINCIPAL')) return results;

    const allowedTypes: SearchableEntityType[] = ['ANNOUNCEMENT', 'SUBJECT', 'CLASS'];

    if (roles.includes('TEACHER')) {
        allowedTypes.push('STUDENT', 'ASSESSMENT', 'RESULT', 'SECTION', 'ACADEMIC_YEAR', 'TERM', 'CONVERSATION', 'DOCUMENT');
    }
    if (roles.includes('ACCOUNTANT')) {
        allowedTypes.push('INVOICE', 'PAYMENT', 'RECEIPT', 'STUDENT');
    }
    if (roles.includes('LIBRARIAN')) {
        allowedTypes.push('LIBRARY_BOOK', 'LIBRARY_COPY', 'LIBRARY_LOAN', 'STUDENT');
    }
    if (roles.includes('NURSE') || roles.includes('MEDICAL_OFFICER')) {
        allowedTypes.push('STUDENT', 'CLINIC_VISIT', 'HEALTH_INCIDENT', 'HEALTH_PROFILE', 'CARE_PLAN', 'HEALTH_SCREENING', 'DOCUMENT');
    }
    if (roles.includes('STUDENT')) {
        // Students can only see their own stuff and public school info
        allowedTypes.push('LIBRARY_BOOK', 'ANNOUNCEMENT', 'CONVERSATION');
        // We might need extra logic to filter to "OWN" records
    }
    if (roles.includes('SUPER_ADMIN')) {
        return results.filter(r => ['SCHOOL', 'SUBSCRIPTION', 'PLAN', 'USER'].includes(r.entityType));
    }

    return results.filter(item => allowedTypes.includes(item.entityType));
  }

  private getRoute(type: SearchableEntityType, id: string): string {
    const routeMap: Record<SearchableEntityType, string> = {
      STUDENT: `/dashboard/students/${id}`,
      TEACHER: `/dashboard/teachers/${id}`,
      STAFF: `/dashboard/staff/${id}`,
      GUARDIAN: `/dashboard/guardians/${id}`,
      ADMISSION_APPLICATION: `/dashboard/admissions/applications/${id}`,
      CLASS: `/dashboard/academics/classes/${id}`,
      SECTION: `/dashboard/academics/sections/${id}`,
      SUBJECT: `/dashboard/academics/subjects/${id}`,
      ACADEMIC_YEAR: `/dashboard/academics/years/${id}`,
      TERM: `/dashboard/academics/terms/${id}`,
      ASSESSMENT: `/dashboard/academics/assessments/${id}`,
      EXAMINATION: `/dashboard/academics/examinations/${id}`,
      RESULT: `/dashboard/academics/results/${id}`,
      INVOICE: `/dashboard/finance/invoices/${id}`,
      PAYMENT: `/dashboard/finance/payments/${id}`,
      RECEIPT: `/dashboard/finance/receipts/${id}`,
      LIBRARY_BOOK: `/dashboard/library/books/${id}`,
      LIBRARY_COPY: `/dashboard/library/copies/${id}`,
      LIBRARY_LOAN: `/dashboard/library/loans/${id}`,
      TRANSPORT_ROUTE: `/dashboard/transport/routes/${id}`,
      TRANSPORT_VEHICLE: `/dashboard/transport/vehicles/${id}`,
      DOCUMENT: `/dashboard/documents/${id}`,
      ANNOUNCEMENT: `/dashboard/communication/announcements/${id}`,
      CONVERSATION: `/dashboard/communication/messages/${id}`,
      WORKFLOW: `/dashboard/operations/workflows/${id}`,
      USER: `/dashboard/settings/users/${id}`,
      SCHOOL: `/admin/schools/${id}`,
      SUBSCRIPTION: `/admin/subscriptions/${id}`,
      PLAN: `/admin/plans/${id}`,
      CLINIC_VISIT: `/dashboard/health/visits/${id}`,
      HEALTH_INCIDENT: `/dashboard/health/incidents/${id}`,
      HEALTH_PROFILE: `/dashboard/health/students/${id}`,
      CARE_PLAN: `/dashboard/health/care-plans/${id}`,
      HEALTH_SCREENING: `/dashboard/health/screenings/${id}`,
    };
    return routeMap[type] || '#';
  }

  private mapToSearchResult(item: SearchIndex, roles: string[]): SearchResult {
    const allowedActions = ['VIEW'];
    if (roles.includes('SCHOOL_ADMIN') || roles.includes('ACCOUNTANT') || roles.includes('TEACHER')) {
      allowedActions.push('EDIT');
    }

    return {
      id: item.entityId,
      entityType: item.entityType,
      title: item.title,
      subtitle: item.subtitle || undefined,
      status: item.status || undefined,
      module: item.module,
      route: this.getRoute(item.entityType, item.entityId),
      allowedActions,
      metadata: item.metadata,
    };
  }

  private async saveHistory(schoolId: string, userId: string, query: string, scope?: string) {
    await this.prisma.searchHistory.create({
      data: { schoolId, userId, query, scope },
    }).catch(() => {});
  }

  async indexEntity(schoolId: string, entityId: string, entityType: SearchableEntityType, data: any) {
    return this.prisma.searchIndex.upsert({
      where: {
        schoolId_entityType_entityId: {
          schoolId,
          entityType,
          entityId,
        },
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        ...data,
        schoolId,
        entityId,
        entityType,
      },
    });
  }

  async removeEntity(schoolId: string, entityId: string, entityType: SearchableEntityType) {
    return this.prisma.searchIndex.deleteMany({
      where: { schoolId, entityId, entityType },
    });
  }

  async reindexSchool(schoolId: string) {
      return new IndexingService(this.prisma).reindexAll(schoolId);
  }
}

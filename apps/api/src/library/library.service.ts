import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateBookDto,
  CreateBookCopyDto,
  IssueBookDto,
  ReturnBookDto,
  CreateCategoryDto,
  CreateAuthorDto,
  CreatePublisherDto,
  CreateLocationDto,
  UpdateCategoryDto,
  UpdateAuthorDto,
  UpdatePublisherDto,
  UpdateLocationDto,
} from './dto/library.dto';
import { BookCopyStatus, LoanStatus, ReservationStatus, Prisma } from '@prisma/client';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class LibraryService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private settings: SettingsService,
  ) {}

  // Configuration
  async getOrCreateConfig(schoolId: string) {
    let config = await this.prisma.libraryConfiguration.findUnique({
      where: { schoolId },
    });
    if (!config) {
      config = await this.prisma.libraryConfiguration.create({
        data: { schoolId },
      });
    }
    return config;
  }

  // Catalog
  async createBook(schoolId: string, dto: CreateBookDto, actorId: string) {
    const { authorIds, ...data } = dto;

    if (data.categoryId) {
      const category = await this.prisma.bookCategory.findFirst({
        where: { id: data.categoryId, schoolId },
        select: { id: true },
      });
      if (!category) throw new BadRequestException('Select a book category from this school.');
    }
    if (data.publisherId) {
      const publisher = await this.prisma.publisher.findFirst({
        where: { id: data.publisherId, schoolId },
        select: { id: true },
      });
      if (!publisher) throw new BadRequestException('Select a publisher from this school.');
    }
    const uniqueAuthorIds = Array.from(new Set((authorIds ?? []).filter(Boolean)));
    if (uniqueAuthorIds.length > 0) {
      const authors = await this.prisma.author.findMany({
        where: { id: { in: uniqueAuthorIds }, schoolId },
        select: { id: true },
      });
      if (authors.length !== uniqueAuthorIds.length) {
        throw new BadRequestException('One or more selected authors do not belong to this school.');
      }
    }

    const book = await this.prisma.book.create({
      data: {
        ...data,
        schoolId,
        authors: uniqueAuthorIds.length
          ? { create: uniqueAuthorIds.map((id) => ({ authorId: id })) }
          : undefined,
      },
      include: { authors: { include: { author: true } } },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'BOOK_CREATED',
      module: 'LIBRARY',
      resourceId: book.id,
      metadata: { title: book.title },
    });

    return book;
  }

  async findAllBooks(schoolId: string, filters: any = {}) {
    const search = typeof filters?.search === 'string' ? filters.search.trim() : '';
    const categoryId = typeof filters?.categoryId === 'string' && filters.categoryId.trim()
      ? filters.categoryId.trim()
      : undefined;
    const publisherId = typeof filters?.publisherId === 'string' && filters.publisherId.trim()
      ? filters.publisherId.trim()
      : undefined;

    return this.prisma.book.findMany({
      where: {
        schoolId,
        ...(categoryId ? { categoryId } : {}),
        ...(publisherId ? { publisherId } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' as const } },
                { isbn: { contains: search, mode: 'insensitive' as const } },
                { authors: { some: { author: { name: { contains: search, mode: 'insensitive' as const } } } } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        authors: { include: { author: true } },
        _count: { select: { copies: true } },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOneBook(schoolId: string, id: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, schoolId },
      include: {
        category: true,
        publisher: true,
        authors: { include: { author: true } },
        copies: { include: { location: true } },
      },
    });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  // Book Copies
  async createCopy(schoolId: string, dto: CreateBookCopyDto, actorId: string) {
    const accessionNumber = dto.accessionNumber || await this.settings.generateNextNumber(schoolId, 'LIBRARY_ACCESSION');
    const copy = await this.prisma.bookCopy.create({
      data: { ...dto, accessionNumber, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'BOOK_COPY_CREATED',
      module: 'LIBRARY',
      resourceId: copy.id,
    });

    return copy;
  }

  // Borrowing
  async issueBook(schoolId: string, dto: IssueBookDto, actorId: string) {
    const config = await this.getOrCreateConfig(schoolId);

    const membership = await this.prisma.libraryMembership.findUnique({
      where: { id: dto.membershipId },
      include: { _count: { select: { loans: { where: { status: LoanStatus.ACTIVE } } } } }
    });
    if (!membership || membership.schoolId !== schoolId) throw new NotFoundException('Library membership not found');
    if (membership.status !== 'ACTIVE') throw new BadRequestException('Membership is not active');

    if (membership._count.loans >= config.maxActiveLoans) {
      throw new BadRequestException(`Borrowing limit reached (${config.maxActiveLoans} books)`);
    }

    const copy = await this.prisma.bookCopy.findUnique({
      where: { id: dto.bookCopyId },
    });
    if (!copy || copy.schoolId !== schoolId) throw new NotFoundException('Book copy not found');
    if (copy.status !== BookCopyStatus.AVAILABLE) throw new ConflictException(`Book copy is ${copy.status}`);

    const loanDate = new Date();
    const dueDate = dto.dueDate || new Date(loanDate.getTime() + config.loanDurationDays * 24 * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.libraryLoan.create({
        data: {
          schoolId,
          membershipId: dto.membershipId,
          bookCopyId: dto.bookCopyId,
          loanDate,
          dueDate,
          status: LoanStatus.ACTIVE,
          issuedBy: actorId,
        },
      });

      await tx.bookCopy.update({
        where: { id: dto.bookCopyId },
        data: { status: BookCopyStatus.BORROWED }
      });

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'BOOK_ISSUED',
        module: 'LIBRARY',
        resourceId: loan.id,
        tx,
      });

      return loan;
    });
  }

  async returnBook(schoolId: string, loanId: string, dto: ReturnBookDto, actorId: string) {
    const loan = await this.prisma.libraryLoan.findUnique({
      where: { id: loanId },
      include: { bookCopy: true }
    });
    if (!loan || loan.schoolId !== schoolId) throw new NotFoundException('Loan not found');
    if (loan.status !== LoanStatus.ACTIVE && loan.status !== LoanStatus.OVERDUE) {
       throw new BadRequestException('Loan is already returned or closed');
    }

    return this.prisma.$transaction(async (tx) => {
      const returnDate = new Date();

      const updatedLoan = await tx.libraryLoan.update({
        where: { id: loanId },
        data: {
          returnDate,
          status: LoanStatus.RETURNED,
          returnedBy: actorId,
        },
      });

      await tx.bookCopy.update({
        where: { id: loan.bookCopyId },
        data: {
          status: BookCopyStatus.AVAILABLE,
          condition: dto.condition || loan.bookCopy.condition,
        }
      });

      // Handle fines if overdue
      if (returnDate > loan.dueDate) {
        const config = await this.getOrCreateConfig(schoolId);
        const diffTime = Math.abs(returnDate.getTime() - loan.dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const fineAmount = new Prisma.Decimal(diffDays).mul(config.dailyFineAmount);

        if (fineAmount.gt(0)) {
          await tx.libraryFine.create({
            data: {
              schoolId,
              membershipId: loan.membershipId,
              loanId: loan.id,
              bookCopyId: loan.bookCopyId,
              amount: fineAmount,
              balance: fineAmount,
              reason: `Overdue return by ${diffDays} days`,
            }
          });
        }
      }

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'BOOK_RETURNED',
        module: 'LIBRARY',
        resourceId: loan.id,
        tx,
      });

      return updatedLoan;
    });
  }

  // Renewals
  async renewLoan(schoolId: string, loanId: string, actorId: string) {
    const loan = await this.prisma.libraryLoan.findUnique({
      where: { id: loanId },
      include: { school: true }
    });
    if (!loan || loan.schoolId !== schoolId) throw new NotFoundException('Loan not found');
    if (loan.status !== LoanStatus.ACTIVE) throw new BadRequestException('Only active loans can be renewed');

    const config = await this.getOrCreateConfig(schoolId);
    if (loan.renewalCount >= config.maxRenewals) {
      throw new BadRequestException(`Maximum renewals reached (${config.maxRenewals})`);
    }

    // Check for reservations on this book (optional policy: cannot renew if someone else reserved it)
    const bookCopy = await this.prisma.bookCopy.findUnique({ where: { id: loan.bookCopyId } });
    const hasReservations = await this.prisma.libraryReservation.count({
       where: { bookId: bookCopy?.bookId, status: 'PENDING' }
    });
    if (hasReservations > 0) {
       throw new BadRequestException('Cannot renew: Book has pending reservations');
    }

    const newDueDate = new Date(loan.dueDate.getTime() + config.loanDurationDays * 24 * 60 * 60 * 1000);

    return this.prisma.libraryLoan.update({
      where: { id: loanId },
      data: {
        dueDate: newDueDate,
        renewalCount: { increment: 1 },
      }
    });
  }

  // Reservations
  async createReservation(schoolId: string, userId: string, bookId: string) {
    const membership = await this.prisma.libraryMembership.findFirst({
      where: { schoolId, userId }
    });
    if (!membership) throw new BadRequestException('User is not a library member');

    // Check if book exists
    const book = await this.prisma.book.findFirst({ where: { id: bookId, schoolId } });
    if (!book) throw new NotFoundException('Book not found');

    return this.prisma.libraryReservation.create({
      data: {
        schoolId,
        membershipId: membership.id,
        bookId,
        status: 'PENDING'
      }
    });
  }

  async findAllReservations(schoolId: string, filters: any = {}, userId?: string) {
    let membershipId: string | undefined;
    if (userId) {
      const membership = await this.prisma.libraryMembership.findFirst({
        where: { schoolId, userId }
      });
      if (!membership) return [];
      membershipId = membership.id;
    }
    return this.prisma.libraryReservation.findMany({
      where: {
        schoolId,
        membershipId,
        status: filters.status,
      },
      include: {
        book: true,
        membership: { include: { user: true } },
      },
      orderBy: { requestDate: 'desc' },
    });
  }

  async cancelReservation(schoolId: string, id: string) {
    const reservation = await this.prisma.libraryReservation.findUnique({
      where: { id },
    });
    if (!reservation || reservation.schoolId !== schoolId) throw new NotFoundException('Reservation not found');
    return this.prisma.libraryReservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async findAllFines(schoolId: string, filters: any = {}, userId?: string) {
    let membershipId: string | undefined;
    if (userId) {
      const membership = await this.prisma.libraryMembership.findFirst({
        where: { schoolId, userId }
      });
      if (!membership) return [];
      membershipId = membership.id;
    }
    return this.prisma.libraryFine.findMany({
      where: {
        schoolId,
        membershipId,
        status: filters.status,
      },
      include: {
        membership: { include: { user: true } },
        loan: { include: { bookCopy: { include: { book: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Dashboard Metrics
  async getDashboardMetrics(schoolId: string) {
    const [
      totalBooks,
      totalCopies,
      availableCopies,
      borrowedCopies,
      overdueLoans,
      activeMembers,
    ] = await Promise.all([
      this.prisma.book.count({ where: { schoolId } }),
      this.prisma.bookCopy.count({ where: { schoolId } }),
      this.prisma.bookCopy.count({ where: { schoolId, status: BookCopyStatus.AVAILABLE } }),
      this.prisma.bookCopy.count({ where: { schoolId, status: BookCopyStatus.BORROWED } }),
      this.prisma.libraryLoan.count({ where: { schoolId, status: LoanStatus.ACTIVE, dueDate: { lt: new Date() } } }),
      this.prisma.libraryMembership.count({ where: { schoolId, status: 'ACTIVE' } }),
    ]);

    return {
      metrics: {
        totalBooks,
        totalCopies,
        availableCopies,
        borrowedCopies,
        overdueLoans,
        activeMembers,
      }
    };
  }

  async findAllLoans(schoolId: string, filters: any = {}, userId?: string) {
    const { search, status, ...rest } = filters;

    // If userId is provided, we filter for that specific user's loans
    let membershipId: string | undefined;
    if (userId) {
      const membership = await this.prisma.libraryMembership.findFirst({
        where: { schoolId, userId }
      });
      if (!membership) return []; // User is not a library member
      membershipId = membership.id;
    }

    return this.prisma.libraryLoan.findMany({
      where: {
        schoolId,
        status,
        membershipId,
        ...rest,
        OR: search ? [
          { bookCopy: { accessionNumber: { contains: search, mode: 'insensitive' } } },
          { bookCopy: { book: { title: { contains: search, mode: 'insensitive' } } } },
          { membership: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
          { membership: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        ] : undefined,
      },
      include: {
        bookCopy: { include: { book: true } },
        membership: { include: { user: true } },
      },
      orderBy: { loanDate: 'desc' },
    });
  }

  async findAllMembers(schoolId: string, filters: any = {}) {
    const { search, ...rest } = filters;
    return this.prisma.libraryMembership.findMany({
      where: {
        schoolId,
        ...rest,
        OR: search ? [
          { membershipNumber: { contains: search, mode: 'insensitive' } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
        ] : undefined,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async registerMember(schoolId: string, userId: string, actorId: string) {
    const existing = await this.prisma.libraryMembership.findFirst({
      where: { schoolId, userId }
    });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const membershipNumber = await this.settings.generateNextNumber(schoolId, 'LIBRARY_MEMBERSHIP');

    const membership = await this.prisma.libraryMembership.create({
      data: {
        schoolId,
        userId,
        membershipNumber,
        status: 'ACTIVE',
      }
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'LIBRARY_MEMBER_REGISTERED',
      module: 'LIBRARY',
      resourceId: membership.id,
    });

    return membership;
  }

  async findCategories(schoolId: string) {
    return this.prisma.bookCategory.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  }

  async findAuthors(schoolId: string) {
    return this.prisma.author.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  }

  async findPublishers(schoolId: string) {
    return this.prisma.publisher.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  }

  async findLocations(schoolId: string) {
    return this.prisma.libraryLocation.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  }

  async createCategory(schoolId: string, dto: CreateCategoryDto) {
    const name = dto.name?.trim();
    const code = dto.code?.trim();
    if (!name) throw new BadRequestException('Category name is required.');
    if (!code) throw new BadRequestException('Category code is required.');

    const duplicate = await this.prisma.bookCategory.findFirst({
      where: {
        schoolId,
        OR: [{ code: { equals: code, mode: 'insensitive' } }, { name: { equals: name, mode: 'insensitive' } }],
      },
      select: { id: true, code: true, name: true },
    });
    if (duplicate) {
      throw new ConflictException(
        duplicate.code.toLowerCase() === code.toLowerCase()
          ? `Category code "${code}" is already in use.`
          : `A category named "${name}" already exists.`,
      );
    }

    return this.prisma.bookCategory.create({
      data: {
        schoolId,
        name,
        code,
        ...(dto.description?.trim() ? { description: dto.description.trim() } : {}),
      },
    });
  }

  async updateCategory(schoolId: string, id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.bookCategory.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Category not found.');

    const name = dto.name?.trim();
    const code = dto.code?.trim();
    if (dto.name !== undefined && !name) throw new BadRequestException('Category name is required.');
    if (dto.code !== undefined && !code) throw new BadRequestException('Category code is required.');

    if (name || code) {
      const duplicate = await this.prisma.bookCategory.findFirst({
        where: {
          schoolId,
          id: { not: id },
          OR: [
            ...(code ? [{ code: { equals: code, mode: 'insensitive' as const } }] : []),
            ...(name ? [{ name: { equals: name, mode: 'insensitive' as const } }] : []),
          ],
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException('Another category already uses that name or code.');
      }
    }

    return this.prisma.bookCategory.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(code ? { code } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
      },
    });
  }

  async createAuthor(schoolId: string, dto: CreateAuthorDto) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Author name is required.');
    const duplicate = await this.prisma.author.findFirst({
      where: { schoolId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException(`An author named "${name}" already exists.`);

    return this.prisma.author.create({
      data: {
        schoolId,
        name,
        ...(dto.biography?.trim() ? { biography: dto.biography.trim() } : {}),
      },
    });
  }

  async updateAuthor(schoolId: string, id: string, dto: UpdateAuthorDto) {
    const existing = await this.prisma.author.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Author not found.');

    const name = dto.name?.trim();
    if (dto.name !== undefined && !name) throw new BadRequestException('Author name is required.');
    if (name) {
      const duplicate = await this.prisma.author.findFirst({
        where: { schoolId, id: { not: id }, name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException(`An author named "${name}" already exists.`);
    }

    return this.prisma.author.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(dto.biography !== undefined ? { biography: dto.biography?.trim() || null } : {}),
      },
    });
  }

  async createPublisher(schoolId: string, dto: CreatePublisherDto) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Publisher name is required.');
    const duplicate = await this.prisma.publisher.findFirst({
      where: { schoolId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException(`A publisher named "${name}" already exists.`);

    return this.prisma.publisher.create({
      data: {
        schoolId,
        name,
        ...(dto.website?.trim() ? { website: dto.website.trim() } : {}),
      },
    });
  }

  async updatePublisher(schoolId: string, id: string, dto: UpdatePublisherDto) {
    const existing = await this.prisma.publisher.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Publisher not found.');

    const name = dto.name?.trim();
    if (dto.name !== undefined && !name) throw new BadRequestException('Publisher name is required.');
    if (name) {
      const duplicate = await this.prisma.publisher.findFirst({
        where: { schoolId, id: { not: id }, name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException(`A publisher named "${name}" already exists.`);
    }

    return this.prisma.publisher.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(dto.website !== undefined ? { website: dto.website?.trim() || null } : {}),
      },
    });
  }

  async createLocation(schoolId: string, dto: CreateLocationDto) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Location name is required.');
    const duplicate = await this.prisma.libraryLocation.findFirst({
      where: { schoolId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException(`A location named "${name}" already exists.`);

    return this.prisma.libraryLocation.create({
      data: {
        schoolId,
        name,
        ...(dto.description?.trim() ? { description: dto.description.trim() } : {}),
      },
    });
  }

  async updateLocation(schoolId: string, id: string, dto: UpdateLocationDto) {
    const existing = await this.prisma.libraryLocation.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Location not found.');

    const name = dto.name?.trim();
    if (dto.name !== undefined && !name) throw new BadRequestException('Location name is required.');
    if (name) {
      const duplicate = await this.prisma.libraryLocation.findFirst({
        where: { schoolId, id: { not: id }, name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException(`A location named "${name}" already exists.`);
    }

    return this.prisma.libraryLocation.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
      },
    });
  }
}

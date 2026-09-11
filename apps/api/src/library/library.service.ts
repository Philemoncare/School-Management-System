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
  CreateLocationDto
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

    const book = await this.prisma.book.create({
      data: {
        ...data,
        schoolId,
        authors: authorIds ? {
          create: authorIds.map(id => ({ authorId: id }))
        } : undefined,
      },
      include: { authors: { include: { author: true } } }
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'BOOK_CREATED',
      module: 'LIBRARY',
      resourceId: book.id,
    });

    return book;
  }

  async findAllBooks(schoolId: string, filters: any = {}) {
    const { search, categoryId, ...rest } = filters;
    return this.prisma.book.findMany({
      where: {
        schoolId,
        categoryId,
        ...rest,
        OR: search ? [
          { title: { contains: search, mode: 'insensitive' } },
          { isbn: { contains: search, mode: 'insensitive' } },
          { authors: { some: { author: { name: { contains: search, mode: 'insensitive' } } } } },
        ] : undefined,
      },
      include: {
        category: true,
        authors: { include: { author: true } },
        _count: { select: { copies: true } },
      },
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
          notes: dto.notes,
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
    return this.prisma.bookCategory.create({ data: { ...dto, schoolId } });
  }

  async createAuthor(schoolId: string, dto: CreateAuthorDto) {
    return this.prisma.author.create({ data: { ...dto, schoolId } });
  }

  async createPublisher(schoolId: string, dto: CreatePublisherDto) {
    return this.prisma.publisher.create({ data: { ...dto, schoolId } });
  }

  async createLocation(schoolId: string, dto: CreateLocationDto) {
    return this.prisma.libraryLocation.create({ data: { ...dto, schoolId } });
  }
}

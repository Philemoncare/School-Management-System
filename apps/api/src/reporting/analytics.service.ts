import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportCategory, StudentStatus, AttendanceStatus, ResultStatus, ApplicationStatus, StaffStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSchoolOverview(schoolId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      activeStudents,
      pendingApplications,
      totalTeachers,
      totalStaff,
      outstandingFees,
      paymentsToday,
      activeLoans,
      onLeave,
      studentsAbsentToday,
    ] = await Promise.all([
      this.prisma.student.count({ where: { schoolId } }),
      this.prisma.student.count({ where: { schoolId, status: StudentStatus.ACTIVE } }),
      this.prisma.admissionApplication.count({ where: { schoolId, status: ApplicationStatus.SUBMITTED } }),
      this.prisma.teacher.count({ where: { schoolId, status: StaffStatus.ACTIVE } }),
      this.prisma.staff.count({ where: { schoolId, status: StaffStatus.ACTIVE } }),
      this.prisma.invoice.aggregate({
        where: { schoolId, status: { notIn: ['PAID', 'VOID', 'CANCELLED'] } },
        _sum: { balance: true }
      }),
      this.prisma.payment.aggregate({
        where: { schoolId, status: 'SUCCESS', paymentDate: { gte: today } },
        _sum: { amount: true }
      }),
      this.prisma.libraryLoan.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.leaveRequest.count({
        where: {
          schoolId,
          status: 'APPROVED',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      }),
      this.prisma.studentAttendance.count({
        where: { schoolId, status: AttendanceStatus.ABSENT, session: { date: today } }
      })
    ]);

    return {
      metrics: {
        totalStudents,
        activeStudents,
        pendingApplications,
        totalTeachers,
        totalStaff,
        outstandingFees: Number(outstandingFees._sum.balance || 0),
        paymentsToday: Number(paymentsToday._sum.amount || 0),
        activeLoans,
        onLeave,
        studentsAbsentToday
      }
    };
  }

  async getFinanceAnalytics(schoolId: string, academicYearId?: string) {
    const [collectionsByMonth, categoryPerformance, collectionRate, dailyCollections, overdueInvoices] = await Promise.all([
      this.prisma.payment.groupBy({
        by: ['paymentDate'],
        where: { schoolId, status: 'SUCCESS' },
        _sum: { amount: true },
        orderBy: { paymentDate: 'asc' }
      }),
      this.prisma.invoiceItem.groupBy({
        by: ['feeCategoryId'],
        where: { invoice: { schoolId, academicYearId } },
        _sum: { totalAmount: true }
      }),
      this.prisma.invoice.aggregate({
        where: { schoolId, academicYearId },
        _sum: { totalAmount: true, amountPaid: true }
      }),
      this.prisma.payment.groupBy({
        by: ['paymentDate'],
        where: {
          schoolId,
          status: 'SUCCESS',
          paymentDate: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
        },
        _sum: { amount: true }
      }),
      this.prisma.invoice.count({
        where: { schoolId, status: 'OVERDUE' }
      })
    ]);

    const totalInvoiced = Number(collectionRate._sum.totalAmount || 0);
    const totalCollected = Number(collectionRate._sum.amountPaid || 0);

    return {
      collectionsByMonth,
      categoryPerformance,
      collectionRate: totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0,
      totalInvoiced,
      totalCollected,
      dailyCollections,
      overdueInvoices,
      outstandingBalance: totalInvoiced - totalCollected
    };
  }

  async getAcademicAnalytics(schoolId: string, classId?: string, academicYearId?: string) {
    const [gradeDistribution, subjectAverages, performanceTrend, passFailRate] = await Promise.all([
      this.prisma.subjectResult.groupBy({
        by: ['grade'],
        where: { schoolId, classId, academicYearId, status: ResultStatus.PUBLISHED },
        _count: { _all: true }
      }),
      this.prisma.subjectResult.groupBy({
        by: ['subjectId'],
        where: { schoolId, classId, academicYearId, status: ResultStatus.PUBLISHED },
        _avg: { percentage: true }
      }),
      this.prisma.overallResult.groupBy({
        by: ['academicYearId', 'termId'],
        where: { schoolId, classId, academicYearId, status: ResultStatus.PUBLISHED },
        _avg: { averagePercentage: true }
      }),
      this.prisma.overallResult.aggregate({
        where: { schoolId, classId, academicYearId, status: ResultStatus.PUBLISHED },
        _count: { _all: true },
        // Simplified pass/fail logic: >= 50%
      })
    ]);

    const totalResults = passFailRate._count._all;
    const passed = await this.prisma.overallResult.count({
        where: { schoolId, classId, academicYearId, status: ResultStatus.PUBLISHED, averagePercentage: { gte: 50 } }
    });

    return {
      gradeDistribution,
      subjectAverages,
      performanceTrend,
      passRate: totalResults > 0 ? (passed / totalResults) * 100 : 0,
      totalAssessments: await this.prisma.assessment.count({ where: { schoolId, classId, academicYearId } })
    };
  }

  async getAttendanceAnalytics(schoolId: string, classId?: string, academicYearId?: string) {
    const [statusDistribution, classAttendance, dailyTrends] = await Promise.all([
      this.prisma.studentAttendance.groupBy({
        by: ['status'],
        where: { schoolId, session: { academicYearId, classId } },
        _count: { _all: true }
      }),
      this.prisma.attendanceSession.findMany({
        where: { schoolId, academicYearId, classId },
        include: {
          _count: {
            select: {
              records: { where: { status: AttendanceStatus.PRESENT } }
            }
          }
        },
        take: 20,
        orderBy: { date: 'desc' }
      }),
      this.prisma.attendanceSession.groupBy({
          by: ['date'],
          where: { schoolId, academicYearId },
          _count: { _all: true },
          orderBy: { date: 'desc' },
          take: 30
      })
    ]);

    const totalRecords = await this.prisma.studentAttendance.count({
        where: { schoolId, session: { academicYearId, classId } }
    });
    const presentRecords = await this.prisma.studentAttendance.count({
        where: { schoolId, session: { academicYearId, classId }, status: AttendanceStatus.PRESENT }
    });

    return {
        statusDistribution,
        classAttendance,
        dailyTrends,
        attendanceRate: totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0
    };
  }

  async getAdmissionsAnalytics(schoolId: string, campaignId?: string) {
    const [statusDistribution, applicationsByClass, conversionRate] = await Promise.all([
      this.prisma.admissionApplication.groupBy({
        by: ['status'],
        where: { schoolId, campaignId },
        _count: { _all: true }
      }),
      this.prisma.admissionApplication.groupBy({
        by: ['classId'],
        where: { schoolId, campaignId },
        _count: { _all: true }
      }),
      this.prisma.admissionApplication.aggregate({
        where: { schoolId, campaignId },
        _count: { _all: true },
        // Count admitted/enrolled
      })
    ]);

    const total = await this.prisma.admissionApplication.count({ where: { schoolId, campaignId } });
    const admitted = await this.prisma.admissionApplication.count({
      where: { schoolId, campaignId, status: { in: [ApplicationStatus.ADMITTED, ApplicationStatus.ENROLLED] } }
    });

    return {
      statusDistribution,
      applicationsByClass,
      conversionRate: total > 0 ? (admitted / total) * 100 : 0
    };
  }

  async getHRAnalytics(schoolId: string) {
    const [staffByStatus, staffByDepartment, leaveStats] = await Promise.all([
      this.prisma.staff.groupBy({
        by: ['status'],
        where: { schoolId },
        _count: { _all: true }
      }),
      this.prisma.staff.groupBy({
        by: ['departmentId'],
        where: { schoolId },
        _count: { _all: true }
      }),
      this.prisma.leaveRequest.groupBy({
        by: ['status'],
        where: { schoolId },
        _count: { _all: true }
      })
    ]);

    return { staffByStatus, staffByDepartment, leaveStats };
  }

  async getLibraryAnalytics(schoolId: string) {
    const [bookStatus, topBorrowed, overdueCount] = await Promise.all([
      this.prisma.bookCopy.groupBy({
        by: ['status'],
        where: { schoolId },
        _count: { _all: true }
      }),
      this.prisma.libraryLoan.groupBy({
        by: ['bookCopyId'],
        where: { schoolId },
        _count: { _all: true },
        orderBy: { _count: { bookCopyId: 'desc' } },
        take: 10
      }),
      this.prisma.libraryLoan.count({
        where: { schoolId, status: 'OVERDUE' }
      })
    ]);

    return { bookStatus, topBorrowed, overdueCount };
  }

  async getTransportAnalytics(schoolId: string) {
    const [vehicleStatus, studentAssignmentCount, tripSummary] = await Promise.all([
      this.prisma.vehicle.groupBy({
        by: ['status'],
        where: { schoolId },
        _count: { _all: true }
      }),
      this.prisma.transportAssignment.count({
        where: { schoolId, status: 'ACTIVE' }
      }),
      this.prisma.transportTrip.groupBy({
        by: ['status'],
        where: { schoolId },
        _count: { _all: true }
      })
    ]);

    return { vehicleStatus, studentAssignmentCount, tripSummary };
  }

  async getCommunicationAnalytics(schoolId: string) {
      const [notificationStatus, channelUsage] = await Promise.all([
          this.prisma.notification.groupBy({
              by: ['status'],
              where: { schoolId },
              _count: { _all: true }
          }),
          this.prisma.notificationDelivery.groupBy({
              by: ['channel'],
              where: { notification: { schoolId } },
              _count: { _all: true }
          })
      ]);
      return { notificationStatus, channelUsage };
  }

  async getDocumentAnalytics(schoolId: string) {
      const [verificationStatus, totalDocuments] = await Promise.all([
          this.prisma.staffDocument.groupBy({
              by: ['verificationStatus'],
              where: { staff: { schoolId } },
              _count: { _all: true }
          }),
          this.prisma.staffDocument.count({
              where: { staff: { schoolId } }
          })
      ]);
      return { verificationStatus, totalDocuments };
  }

  async getExaminationAnalytics(schoolId: string, examPeriodId?: string) {
      const [examStatus, sessionAttendance] = await Promise.all([
          this.prisma.examinationPeriod.groupBy({
              by: ['status'],
              where: { schoolId },
              _count: { _all: true }
          }),
          this.prisma.examinationAttendance.groupBy({
              by: ['status'],
              where: { session: { period: { schoolId, id: examPeriodId } } },
              _count: { _all: true }
          })
      ]);
      return { examStatus, sessionAttendance };
  }

  async getOperationsAnalytics(schoolId: string) {
      const [workflowStatus, auditActions] = await Promise.all([
          this.prisma.workflowInstance.groupBy({
              by: ['status'],
              where: { schoolId },
              _count: { _all: true }
          }),
          this.prisma.auditLog.groupBy({
              by: ['action'],
              where: { schoolId },
              _count: { _all: true },
              orderBy: { _count: { action: 'desc' } },
              take: 10
          })
      ]);
      return { workflowStatus, auditActions };
  }

  async getPlatformAnalytics() {
    // Super Admin only
    const [
        totalSchools,
        schoolsByStatus,
        activeSubscriptions,
        totalRevenue,
        mrr,
        subscriptionDistribution,
        topSchoolsByRevenue
    ] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.school.groupBy({
        by: ['status'],
        _count: { _all: true }
      }),
      this.prisma.schoolSubscription.count({
        where: { status: 'ACTIVE' }
      }),
      this.prisma.platformPayment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true }
      }),
      this.prisma.subscriptionPricing.aggregate({
          where: { subscriptions: { some: { status: 'ACTIVE' } }, interval: 'MONTHLY' },
          _sum: { amount: true }
      }),
      this.prisma.schoolSubscription.groupBy({
          by: ['planId'],
          _count: { _all: true }
      }),
      this.prisma.platformPayment.groupBy({
          by: ['schoolId'],
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
          take: 5
      })
    ]);

    return {
      totalSchools,
      schoolsByStatus,
      activeSubscriptions,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      mrr: Number(mrr._sum.amount || 0),
      subscriptionDistribution,
      topSchoolsByRevenue
    };
  }

  async getDataQualityMetrics(schoolId: string) {
      const [
          studentsWithoutEnrollment,
          studentsWithoutGuardian,
          incompleteStaffRecords,
          missingAssessmentScores,
          unbalancedInvoices,
          expiredDocuments
      ] = await Promise.all([
          this.prisma.student.count({
              where: { schoolId, status: StudentStatus.ACTIVE, enrollments: { none: {} } }
          }),
          this.prisma.student.count({
              where: { schoolId, status: StudentStatus.ACTIVE, guardians: { none: {} } }
          }),
          this.prisma.staff.count({
              where: { schoolId, status: StaffStatus.ACTIVE, OR: [{ employeeId: null }, { userId: null }] }
          }),
          this.prisma.studentAssessmentScore.count({
              where: { schoolId, status: 'NOT_ENTERED', assessment: { status: 'PUBLISHED' } }
          }),
          this.prisma.invoice.count({
              where: { schoolId, balance: { lt: 0 } } // Should not happen usually
          }),
          this.prisma.staffDocument.count({
              where: { staff: { schoolId }, expiryDate: { lt: new Date() } }
          })
      ]);

      return {
          studentsWithoutEnrollment,
          studentsWithoutGuardian,
          incompleteStaffRecords,
          missingAssessmentScores,
          unbalancedInvoices,
          expiredDocuments,
          lastChecked: new Date()
      };
  }

  async createSnapshot(schoolId: string, metricName: string, value: number, dimension1?: string, dimension2?: string) {
      return this.prisma.analyticsSnapshot.create({
          data: {
              schoolId,
              metricName,
              metricValue: value,
              dimension1,
              dimension2,
              periodStart: new Date(),
              periodEnd: new Date(),
              granularity: 'DAILY'
          }
      });
  }

  async runPeriodicSnapshots() {
      const schools = await this.prisma.school.findMany({ select: { id: true } });
      for (const school of schools) {
          const overview = await this.getSchoolOverview(school.id);
          const metrics = overview.metrics;

          for (const [name, value] of Object.entries(metrics)) {
              if (typeof value === 'number') {
                  await this.createSnapshot(school.id, name, value);
              }
          }
      }
  }
}


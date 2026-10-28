import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseRequestStatus, PurchaseOrderStatus } from '@prisma/client';

@Injectable()
export class ProcurementService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(schoolId: string) {
    const [pendingRequests, pendingOrders, suppliersCount, recentOrders] = await Promise.all([
      this.prisma.purchaseRequest.count({ where: { schoolId, status: PurchaseRequestStatus.UNDER_REVIEW } }),
      this.prisma.purchaseOrder.count({ where: { schoolId, status: PurchaseOrderStatus.APPROVED } }),
      this.prisma.supplier.count({ where: { schoolId } }),
      this.prisma.purchaseOrder.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { supplier: true },
      }),
    ]);

    return {
      pendingRequests,
      pendingOrders,
      suppliersCount,
      recentOrders,
    };
  }

  // --- SUPPLIERS ---
  async getSuppliers(schoolId: string) {
    return this.prisma.supplier.findMany({ where: { schoolId } });
  }

  async createSupplier(schoolId: string, data: any) {
    return this.prisma.supplier.create({
      data: {
        ...data,
        schoolId,
      },
    });
  }

  // --- PURCHASE REQUESTS ---
  async getPurchaseRequests(schoolId: string) {
    return this.prisma.purchaseRequest.findMany({
      where: { schoolId },
      include: { requester: { select: { firstName: true, lastName: true } }, items: true },
    });
  }

  async createPurchaseRequest(schoolId: string, userId: string, data: any) {
    return this.prisma.purchaseRequest.create({
      data: {
        schoolId,
        requesterId: userId,
        requestNumber: `PR-${Date.now()}`,
        reason: data.reason,
        priority: data.priority,
        items: {
          create: data.items,
        },
      },
    });
  }

  // --- PURCHASE ORDERS ---
  async getPurchaseOrders(schoolId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { schoolId },
      include: { supplier: true, items: true },
    });
  }

  async createPurchaseOrder(schoolId: string, data: any) {
    return this.prisma.purchaseOrder.create({
      data: {
        schoolId,
        poNumber: `PO-${Date.now()}`,
        supplierId: data.supplierId,
        requestId: data.requestId,
        subtotal: data.subtotal,
        totalAmount: data.totalAmount,
        items: {
          create: data.items,
        },
      },
    });
  }

  async receiveGoods(schoolId: string, userId: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.create({
        data: {
          schoolId,
          receiptNumber: `GR-${Date.now()}`,
          poId: data.poId,
          receivedById: userId,
          items: {
            create: data.items,
          },
        },
      });

      // Update stock for each item
      for (const item of data.items) {
        if (item.itemId && item.locationId) {
            // This would call the inventory logic to adjust stock
            // For now we'll do it manually in this transaction
            const balance = await tx.inventoryBalance.findUnique({
                where: { itemId_locationId: { itemId: item.itemId, locationId: item.locationId } }
            });

            if (balance) {
                await tx.inventoryBalance.update({
                    where: { id: balance.id },
                    data: {
                        onHand: { increment: item.quantityReceived },
                        available: { increment: item.quantityReceived }
                    }
                });
            } else {
                await tx.inventoryBalance.create({
                    data: {
                        schoolId,
                        itemId: item.itemId,
                        locationId: item.locationId,
                        onHand: item.quantityReceived,
                        available: item.quantityReceived
                    }
                });
            }

            await tx.stockMovement.create({
                data: {
                    schoolId,
                    itemId: item.itemId,
                    locationId: item.locationId,
                    quantity: item.quantityReceived,
                    type: 'RECEIPT',
                    reference: receipt.id,
                    userId,
                }
            });
        }
      }

      return receipt;
    });
  }
}

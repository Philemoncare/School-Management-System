import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockMovementType, InventoryItemStatus, InventoryLocationStatus } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(schoolId: string) {
    const [itemCount, lowStockItems, outOfStockItems, recentMovements, assetCount, assetsAssigned] = await Promise.all([
      this.prisma.inventoryItem.count({ where: { schoolId, status: InventoryItemStatus.ACTIVE } }),
      this.prisma.inventoryBalance.count({
        where: {
          schoolId,
          item: { status: InventoryItemStatus.ACTIVE },
          onHand: { gt: 0, lte: 10 }, // Simplified low stock logic
        },
      }),
      this.prisma.inventoryBalance.count({
        where: {
          schoolId,
          onHand: 0,
        },
      }),
      this.prisma.stockMovement.findMany({
        where: { schoolId },
        orderBy: { timestamp: 'desc' },
        take: 5,
        include: { item: true, location: true, user: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.asset.count({ where: { schoolId } }),
      this.prisma.asset.count({ where: { schoolId, status: 'ASSIGNED' } }),
    ]);

    return {
      itemCount,
      lowStockItems,
      outOfStockItems,
      recentMovements,
      assetCount,
      assetsAssigned,
    };
  }

  // --- ITEMS ---
  async getItems(schoolId: string, categoryId?: string) {
    return this.prisma.inventoryItem.findMany({
      where: { schoolId, categoryId },
      include: { category: true, balances: { include: { location: true } } },
    });
  }

  async createItem(schoolId: string, data: any) {
    return this.prisma.inventoryItem.create({
      data: {
        ...data,
        schoolId,
      },
    });
  }

  async getItem(id: string, schoolId: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: { category: true, balances: { include: { location: true } } },
    });
    if (!item || item.schoolId !== schoolId) throw new NotFoundException('Item not found');
    return item;
  }

  // --- LOCATIONS ---
  async getLocations(schoolId: string) {
    return this.prisma.inventoryLocation.findMany({
      where: { schoolId, status: InventoryLocationStatus.ACTIVE },
    });
  }

  async createLocation(schoolId: string, data: any) {
    return this.prisma.inventoryLocation.create({
      data: {
        ...data,
        schoolId,
      },
    });
  }

  // --- MOVEMENTS & BALANCES ---
  async adjustStock(schoolId: string, userId: string, data: { itemId: string; locationId: string; quantity: number; type: StockMovementType; reason?: string }) {
    const { itemId, locationId, quantity, type, reason } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create movement record
      const movement = await tx.stockMovement.create({
        data: {
          schoolId,
          itemId,
          locationId,
          quantity,
          type,
          reason,
          userId,
        },
      });

      // 2. Update or create balance
      const balance = await tx.inventoryBalance.findUnique({
        where: { itemId_locationId: { itemId, locationId } },
      });

      let delta = quantity;
      if (([StockMovementType.ISSUE, StockMovementType.TRANSFER_OUT, StockMovementType.ADJUSTMENT_OUT, StockMovementType.DAMAGE, StockMovementType.LOSS] as StockMovementType[]).includes(type)) {
        delta = -Math.abs(quantity);
      } else {
        delta = Math.abs(quantity);
      }

      if (balance) {
        if (balance.available + delta < 0) {
          throw new BadRequestException('Insufficient stock available');
        }
        await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: {
            onHand: { increment: delta },
            available: { increment: delta },
            lastMovementAt: new Date(),
          },
        });
      } else {
        if (delta < 0) throw new BadRequestException('Cannot issue stock from empty location');
        await tx.inventoryBalance.create({
          data: {
            schoolId,
            itemId,
            locationId,
            onHand: delta,
            available: delta,
          },
        });
      }

      return movement;
    });
  }

  async getMovements(schoolId: string, itemId?: string) {
    return this.prisma.stockMovement.findMany({
      where: { schoolId, itemId },
      include: { item: true, location: true, user: { select: { firstName: true, lastName: true } } },
      orderBy: { timestamp: 'desc' },
    });
  }

  // --- ASSETS ---
  async getAssets(schoolId: string) {
    return this.prisma.asset.findMany({
      where: { schoolId },
      include: { location: true, staff: true, department: true },
    });
  }

  async createAsset(schoolId: string, data: any) {
    return this.prisma.asset.create({
      data: {
        ...data,
        schoolId,
      },
    });
  }

  async assignAsset(assetId: string, schoolId: string, userId: string, data: any) {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.schoolId !== schoolId) throw new NotFoundException('Asset not found');
    if (asset.status === 'ASSIGNED') throw new BadRequestException('Asset is already assigned');

    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.create({
        data: {
          assetId,
          ...data,
          issuedById: userId,
        },
      });

      await tx.asset.update({
        where: { id: assetId },
        data: {
          status: 'ASSIGNED',
          assignedStaffId: data.assignedStaffId,
          assignedDeptId: data.assignedDeptId,
          locationId: data.locationId,
        },
      });

      return assignment;
    });
  }
}

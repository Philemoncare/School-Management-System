import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockMovementType, InventoryItemStatus, InventoryLocationStatus } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(schoolId: string) {
    const [
      items,
      recentMovements,
      assetCount,
      assetsAssigned,
      assetsInMaintenance,
      locationCount,
      categoryCount,
    ] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where: { schoolId, status: InventoryItemStatus.ACTIVE },
        select: {
          id: true,
          reorderLevel: true,
          balances: { select: { onHand: true } },
        },
      }),
      this.prisma.stockMovement.findMany({
        where: { schoolId },
        orderBy: { timestamp: 'desc' },
        take: 5,
        include: {
          item: true,
          location: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.asset.count({ where: { schoolId } }),
      this.prisma.asset.count({ where: { schoolId, status: 'ASSIGNED' } }),
      this.prisma.asset.count({ where: { schoolId, status: 'UNDER_MAINTENANCE' } }),
      this.prisma.inventoryLocation.count({
        where: { schoolId, status: InventoryLocationStatus.ACTIVE },
      }),
      this.prisma.inventoryCategory.count({ where: { schoolId } }),
    ]);

    // Low stock must follow each item's own reorder level; a single global
    // threshold produced wrong numbers for schools with different thresholds.
    let lowStockItems = 0;
    let outOfStockItems = 0;
    for (const item of items) {
      const onHand = item.balances.reduce((sum, balance) => sum + balance.onHand, 0);
      if (item.balances.length > 0 && onHand <= 0) {
        outOfStockItems += 1;
      } else if (onHand > 0 && onHand <= item.reorderLevel) {
        lowStockItems += 1;
      }
    }

    return {
      itemCount: items.length,
      lowStockItems,
      outOfStockItems,
      recentMovements,
      assetCount,
      assetsAssigned,
      assetsInMaintenance,
      locationCount,
      categoryCount,
    };
  }

  // --- ITEMS ---
  async getItems(schoolId: string, categoryId?: string) {
    return this.prisma.inventoryItem.findMany({
      where: { schoolId, ...(categoryId ? { categoryId } : {}) },
      include: { category: true, balances: { include: { location: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createItem(schoolId: string, data: any) {
    const name = String(data?.name ?? '').trim();
    const code = String(data?.code ?? '').trim().toUpperCase();
    const categoryId = String(data?.categoryId ?? '');
    const unitOfMeasure = String(data?.unitOfMeasure ?? '').trim();

    if (!name || !code || !categoryId || !unitOfMeasure) {
      throw new BadRequestException('Name, code, category and unit of measure are required.');
    }

    const category = await this.prisma.inventoryCategory.findFirst({
      where: { id: categoryId, schoolId },
      select: { id: true },
    });
    if (!category) throw new NotFoundException('Category not found in this school');

    const duplicate = await this.prisma.inventoryItem.findFirst({
      where: { schoolId, code },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('An item with this code already exists.');

    return this.prisma.inventoryItem.create({
      data: {
        schoolId,
        categoryId,
        name,
        code,
        description: data?.description?.trim() || null,
        unitOfMeasure,
        itemType: data?.itemType || 'CONSUMABLE',
        reorderLevel: Number(data?.reorderLevel ?? 0),
        reorderQuantity: Number(data?.reorderQuantity ?? 0),
        maxStock: data?.maxStock == null ? null : Number(data.maxStock),
        sku: data?.sku?.trim() || null,
        barcode: data?.barcode?.trim() || null,
        manufacturer: data?.manufacturer?.trim() || null,
        model: data?.model?.trim() || null,
      },
      include: { category: true },
    });
  }

  async updateItem(schoolId: string, id: string, data: any) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { id, schoolId } });
    if (!item) throw new NotFoundException('Item not found');

    const code = data?.code ? String(data.code).trim().toUpperCase() : undefined;
    if (code && code !== item.code) {
      const duplicate = await this.prisma.inventoryItem.findFirst({
        where: { schoolId, code, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException('An item with this code already exists.');
    }

    if (data?.categoryId) {
      const category = await this.prisma.inventoryCategory.findFirst({
        where: { id: data.categoryId, schoolId },
        select: { id: true },
      });
      if (!category) throw new NotFoundException('Category not found in this school');
    }

    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(data?.name ? { name: String(data.name).trim() } : {}),
        ...(code ? { code } : {}),
        ...(data?.categoryId ? { categoryId: data.categoryId } : {}),
        ...(data?.description !== undefined
          ? { description: data.description?.trim() || null }
          : {}),
        ...(data?.unitOfMeasure ? { unitOfMeasure: String(data.unitOfMeasure).trim() } : {}),
        ...(data?.itemType ? { itemType: data.itemType } : {}),
        ...(data?.reorderLevel !== undefined ? { reorderLevel: Number(data.reorderLevel) } : {}),
        ...(data?.status ? { status: data.status } : {}),
      },
      include: { category: true },
    });
  }

  // --- CATEGORIES ---
  async getCategories(schoolId: string) {    return this.prisma.inventoryCategory.findMany({
      where: { schoolId },
      include: { _count: { select: { items: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(schoolId: string, data: any) {
    const name = String(data?.name ?? '').trim();
    const code = String(data?.code ?? '').trim().toUpperCase();
    if (!name || !code) {
      throw new BadRequestException('Category name and code are required.');
    }

    const duplicate = await this.prisma.inventoryCategory.findFirst({
      where: { schoolId, code },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('A category with this code already exists.');

    if (data?.parentCategoryId) {
      const parent = await this.prisma.inventoryCategory.findFirst({
        where: { id: data.parentCategoryId, schoolId },
        select: { id: true },
      });
      if (!parent) throw new NotFoundException('Parent category not found in this school');
    }

    return this.prisma.inventoryCategory.create({
      data: {
        schoolId,
        name,
        code,
        description: data?.description?.trim() || null,
        parentCategoryId: data?.parentCategoryId || null,
      },
    });
  }

  async updateCategory(schoolId: string, id: string, data: any) {
    const category = await this.prisma.inventoryCategory.findFirst({
      where: { id, schoolId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const code = data?.code ? String(data.code).trim().toUpperCase() : undefined;
    if (code && code !== category.code) {
      const duplicate = await this.prisma.inventoryCategory.findFirst({
        where: { schoolId, code, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException('A category with this code already exists.');
    }

    return this.prisma.inventoryCategory.update({
      where: { id },
      data: {
        ...(data?.name ? { name: String(data.name).trim() } : {}),
        ...(code ? { code } : {}),
        ...(data?.description !== undefined
          ? { description: data.description?.trim() || null }
          : {}),
      },
    });
  }

  async getItem(id: string, schoolId: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, schoolId },
      include: { category: true, balances: { include: { location: true } } },
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  // --- LOCATIONS ---
  async getLocations(schoolId: string) {
    return this.prisma.inventoryLocation.findMany({
      where: { schoolId, status: InventoryLocationStatus.ACTIVE },
      include: {
        staff: { select: { firstName: true, lastName: true } },
        _count: { select: { balances: true, assets: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createLocation(schoolId: string, data: any) {
    const name = String(data?.name ?? '').trim();
    const code = String(data?.code ?? '').trim().toUpperCase();
    if (!name || !code) {
      throw new BadRequestException('Location name and code are required.');
    }

    const duplicate = await this.prisma.inventoryLocation.findFirst({
      where: { schoolId, code },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('A location with this code already exists.');

    return this.prisma.inventoryLocation.create({
      data: {
        schoolId,
        name,
        code,
        description: data?.description?.trim() || null,
        type: data?.type?.trim() || null,
        responsibleStaffId: data?.responsibleStaffId || null,
        status: data?.status || InventoryLocationStatus.ACTIVE,
      },
    });
  }

  async updateLocation(schoolId: string, id: string, data: any) {
    const location = await this.prisma.inventoryLocation.findFirst({
      where: { id, schoolId },
    });
    if (!location) throw new NotFoundException('Location not found');

    const code = data?.code ? String(data.code).trim().toUpperCase() : undefined;
    if (code && code !== location.code) {
      const duplicate = await this.prisma.inventoryLocation.findFirst({
        where: { schoolId, code, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException('A location with this code already exists.');
    }

    return this.prisma.inventoryLocation.update({
      where: { id },
      data: {
        ...(data?.name ? { name: String(data.name).trim() } : {}),
        ...(code ? { code } : {}),
        ...(data?.description !== undefined
          ? { description: data.description?.trim() || null }
          : {}),
        ...(data?.type !== undefined ? { type: data.type?.trim() || null } : {}),
        ...(data?.status ? { status: data.status } : {}),
      },
    });
  }

  // --- MOVEMENTS & BALANCES ---
  async adjustStock(schoolId: string, userId: string, data: { itemId: string; locationId: string; quantity: number; type: StockMovementType; reason?: string }) {
    const { itemId, locationId, type, reason } = data;
    const quantity = Number(data?.quantity);

    if (!itemId || !locationId) {
      throw new BadRequestException('Select an item and a location for this movement.');
    }
    if (!Number.isFinite(quantity) || quantity === 0) {
      throw new BadRequestException('Enter a quantity greater than zero.');
    }
    if (!Object.values(StockMovementType).includes(type)) {
      throw new BadRequestException('Unknown movement type.');
    }

    // Both references are tenant-scoped; without this check a caller could
    // post stock against another school's item or location id.
    const [item, location] = await Promise.all([
      this.prisma.inventoryItem.findFirst({
        where: { id: itemId, schoolId },
        select: { id: true, status: true },
      }),
      this.prisma.inventoryLocation.findFirst({
        where: { id: locationId, schoolId },
        select: { id: true, status: true },
      }),
    ]);
    if (!item) throw new NotFoundException('Item not found in this school');
    if (!location) throw new NotFoundException('Location not found in this school');
    if (item.status !== InventoryItemStatus.ACTIVE) {
      throw new BadRequestException('This item is archived or inactive.');
    }
    if (location.status !== InventoryLocationStatus.ACTIVE) {
      throw new BadRequestException('This location is archived or inactive.');
    }

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

  async getAsset(assetId: string, schoolId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, schoolId },
      include: {
        location: true,
        staff: true,
        department: true,
        item: true,
        supplier: true,
        warranty: true,
        disposal: true,
        assignments: {
          include: { staff: true, department: true, location: true, issuedBy: true },
          orderBy: { assignmentDate: 'desc' },
        },
        maintenance: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
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

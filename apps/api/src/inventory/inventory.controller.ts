import { Controller, Get, Post, Body, Param, UseGuards, Query, Patch } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('dashboard')
  @Roles('ADMIN', 'INVENTORY_OFFICER', 'STOREKEEPER')
  getDashboard(@ActiveSchool() schoolId: string) {
    return this.inventoryService.getDashboard(schoolId);
  }

  @Get('items')
  @Roles('ADMIN', 'INVENTORY_OFFICER', 'STOREKEEPER')
  getItems(@ActiveSchool() schoolId: string, @Query('categoryId') categoryId?: string) {
    return this.inventoryService.getItems(schoolId, categoryId);
  }

  @Post('items')
  @Roles('ADMIN', 'INVENTORY_OFFICER')
  createItem(@ActiveSchool() schoolId: string, @Body() dto: any) {
    return this.inventoryService.createItem(schoolId, dto);
  }

  @Get('items/:id')
  @Roles('ADMIN', 'INVENTORY_OFFICER', 'STOREKEEPER')
  getItem(@Param('id') id: string, @ActiveSchool() schoolId: string) {
    return this.inventoryService.getItem(id, schoolId);
  }

  @Get('locations')
  @Roles('ADMIN', 'INVENTORY_OFFICER', 'STOREKEEPER')
  getLocations(@ActiveSchool() schoolId: string) {
    return this.inventoryService.getLocations(schoolId);
  }

  @Post('adjust')
  @Roles('ADMIN', 'INVENTORY_OFFICER', 'STOREKEEPER')
  adjustStock(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    return this.inventoryService.adjustStock(schoolId, user.id, dto);
  }

  @Get('movements')
  @Roles('ADMIN', 'INVENTORY_OFFICER', 'STOREKEEPER')
  getMovements(@ActiveSchool() schoolId: string, @Query('itemId') itemId?: string) {
    return this.inventoryService.getMovements(schoolId, itemId);
  }

  @Get('assets')
  @Roles('ADMIN', 'INVENTORY_OFFICER')
  getAssets(@ActiveSchool() schoolId: string) {
    return this.inventoryService.getAssets(schoolId);
  }

  @Post('assets')
  @Roles('ADMIN', 'INVENTORY_OFFICER')
  createAsset(@ActiveSchool() schoolId: string, @Body() dto: any) {
    return this.inventoryService.createAsset(schoolId, dto);
  }

  @Post('assets/:id/assign')
  @Roles('ADMIN', 'INVENTORY_OFFICER')
  assignAsset(
    @Param('id') id: string,
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    return this.inventoryService.assignAsset(id, schoolId, user.id, dto);
  }
}

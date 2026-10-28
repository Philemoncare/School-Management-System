import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RedisService } from '../redis/redis.service';
import { UpdateSettingDto } from './dto/settings.dto';

const DEFAULT_FEATURES = [
  {
    name: 'LIBRARY_MANAGEMENT',
    description: 'Digital book catalog, circulation, reservations and fines.',
  },
  {
    name: 'TRANSPORT_MANAGEMENT',
    description: 'Routes, vehicles, drivers and transport attendance.',
  },
  {
    name: 'ONLINE_PAYMENTS',
    description: 'Parent and student online fee collection.',
  },
  {
    name: 'ADMISSIONS_PORTAL',
    description: 'Public admission campaigns and applications.',
  },
  {
    name: 'MESSAGING_SYSTEM',
    description: 'Internal messaging for staff, students and guardians.',
  },
  {
    name: 'HEALTH_MANAGEMENT',
    description: 'Student health profiles, clinic visits and incidents.',
  },
  {
    name: 'INVENTORY_MANAGEMENT',
    description: 'Stock, assets, procurement and supplier records.',
  },
];

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private redis: RedisService,
  ) {}

  // --- Platform Settings ---

  async getPlatformSetting(key: string) {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  }

  async getPlatformSettings() {
    return this.prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async updatePlatformSetting(key: string, dto: UpdateSettingDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const setting = await tx.platformSetting.upsert({
        where: { key },
        update: { value: dto.value },
        create: { key, value: dto.value },
      });

      await tx.platformSettingVersion.create({
        data: {
          platformSettingKey: key,
          value: dto.value,
          changeReason: dto.changeReason,
          createdById: userId,
        },
      });

      await this.audit.log(
        {
          userId,
          action: 'PLATFORM_SETTING_UPDATED',
          module: 'SETTINGS',
          resourceId: key,
          metadata: { value: dto.value, reason: dto.changeReason },
        },
        tx,
      );

      await this.clearPlatformCache(key);
      return setting;
    });
  }

  // --- School Settings ---

  async getSchoolSetting(schoolId: string, key: string) {
    const setting = await this.prisma.schoolSetting.findUnique({
      where: { schoolId_key: { schoolId, key } },
    });
    return setting?.value || null;
  }

  async updateSchoolSetting(schoolId: string, key: string, dto: UpdateSettingDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const setting = await tx.schoolSetting.upsert({
        where: { schoolId_key: { schoolId, key } },
        update: { value: dto.value },
        create: { schoolId, key, value: dto.value },
      });

      await tx.schoolSettingVersion.create({
        data: {
          schoolSettingId: setting.id,
          value: dto.value,
          changeReason: dto.changeReason,
          createdById: userId,
        },
      });

      await this.audit.log({
        userId,
        schoolId,
        action: 'SCHOOL_SETTING_UPDATED',
        module: 'SETTINGS',
        resourceId: key,
        metadata: { value: dto.value, reason: dto.changeReason },
      });

      await this.clearSchoolCache(schoolId, key);
      return setting;
    });
  }

  // --- Effective Configuration (Objective 2, 3, 24) ---

  async getEffectiveSetting(schoolId: string, key: string, userId?: string) {
    const cacheKey = `setting:${schoolId}:${userId || 'none'}:${key}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    let value = null;

    // 1. User Preference
    if (userId) {
      const pref = await this.prisma.userPreference.findUnique({
        where: { userId_key: { userId, key } },
      });
      if (pref) value = pref.value;
    }

    // 2. School Override
    if (value === null) {
      value = await this.getSchoolSetting(schoolId, key);
    }

    // 3. Platform Default
    if (value === null) {
      value = await this.getPlatformSetting(key);
    }

    await this.redis.set(cacheKey, JSON.stringify(value), 3600); // 1 hour cache
    return value;
  }

  async getManyEffectiveSettings(schoolId: string, keys: string[], userId?: string) {
    const result: Record<string, any> = {};
    for (const key of keys) {
      result[key] = await this.getEffectiveSetting(schoolId, key, userId);
    }
    return result;
  }

  // --- Feature Flags (Objective 19, 20) ---

  private async ensureDefaultFeatures() {
    await this.prisma.featureFlag.createMany({
      data: DEFAULT_FEATURES.map((feature) => ({
        ...feature,
        isEnabled: false,
        allSchools: false,
        schoolIds: [],
      })),
      skipDuplicates: true,
    });
  }

  async getFeatureFlags(schoolId: string) {
    await this.ensureDefaultFeatures();

    const flags = await this.prisma.featureFlag.findMany({
      include: { overrides: { where: { schoolId } } },
      orderBy: { name: 'asc' },
    });

    return flags.map((flag) => {
      const override = flag.overrides[0];
      return {
        name: flag.name,
        description: flag.description,
        isEnabled: override
          ? override.isEnabled
          : flag.isEnabled || flag.allSchools || flag.schoolIds.includes(schoolId),
        hasOverride: Boolean(override),
      };
    });
  }

  async getPlatformFeatureFlags() {
    await this.ensureDefaultFeatures();
    return this.prisma.featureFlag.findMany({
      include: {
        overrides: {
          include: { school: { select: { id: true, name: true, code: true } } },
          take: 20,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createFeatureFlag(
    dto: { name: string; description?: string; isEnabled?: boolean; allSchools?: boolean; schoolIds?: string[] },
    userId: string,
  ) {
    const name = dto.name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const existing = await this.prisma.featureFlag.findUnique({ where: { name } });
    if (existing) throw new BadRequestException('A feature flag with this name already exists');

    const flag = await this.prisma.featureFlag.create({
      data: {
        name,
        description: dto.description || null,
        isEnabled: dto.isEnabled ?? false,
        allSchools: dto.allSchools ?? false,
        schoolIds: dto.schoolIds || [],
      },
    });

    await this.audit.log({
      userId,
      action: 'FEATURE_FLAG_CREATED',
      module: 'SETTINGS',
      resourceId: flag.id,
      metadata: { name: flag.name, isEnabled: flag.isEnabled, allSchools: flag.allSchools },
    });

    return flag;
  }

  async updateFeatureFlag(
    id: string,
    dto: {
      name?: string;
      description?: string;
      isEnabled?: boolean;
      allSchools?: boolean;
      schoolIds?: string[];
    },
    userId: string,
  ) {
    const existing = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Feature flag not found');

    const flag = await this.prisma.featureFlag.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_') } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
        ...(dto.allSchools !== undefined ? { allSchools: dto.allSchools } : {}),
        ...(dto.schoolIds !== undefined ? { schoolIds: dto.schoolIds } : {}),
      },
    });

    await this.audit.log({
      userId,
      action: 'FEATURE_FLAG_UPDATED',
      module: 'SETTINGS',
      resourceId: flag.id,
      metadata: { name: flag.name, changedFields: Object.keys(dto) },
    });

    return flag;
  }

  async isFeatureEnabled(featureName: string, schoolId: string): Promise<boolean> {
    const feature = await this.prisma.featureFlag.findUnique({
      where: { name: featureName },
      include: {
        overrides: {
          where: { schoolId },
        },
      },
    });

    if (!feature) return false;

    // School specific override
    if (feature.overrides.length > 0) {
      return feature.overrides[0].isEnabled;
    }

    // Rollout logic (if schoolId is in schoolIds list)
    if (feature.schoolIds.includes(schoolId)) {
        return true;
    }

    // Global toggle
    return feature.isEnabled || feature.allSchools;
  }

  // --- Numbering System (Objective 39) ---

  async generateNextNumber(schoolId: string, entityType: string): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      let rule = await tx.numberingRule.findUnique({
        where: { schoolId_entityType: { schoolId, entityType } },
      });

      if (!rule) {
        // Create a default rule if not exists
        rule = await tx.numberingRule.create({
          data: {
            schoolId,
            entityType,
            prefix: entityType.substring(0, 3).toUpperCase(),
            padding: 6,
            currentValue: 0
          }
        });
      }

      const nextVal = rule.currentValue + 1;
      await tx.numberingRule.update({
        where: { id: rule.id },
        data: { currentValue: nextVal },
      });

      const year = new Date().getFullYear();
      const padded = nextVal.toString().padStart(rule.padding, '0');

      let result = '';
      if (rule.prefix) result += rule.prefix;
      if (rule.includeYear) result += `-${year}`;
      result += `-${padded}`;
      if (rule.suffix) result += rule.suffix;

      return result;
    });
  }

  async getNumberingRules(schoolId: string) {
    const rules = await this.prisma.numberingRule.findMany({
      where: { schoolId },
    });
    return rules.reduce((acc, r) => ({ ...acc, [r.entityType]: r }), {});
  }

  async setNumberingRule(schoolId: string, entityType: string, dto: any, userId: string) {
    const rule = await this.prisma.numberingRule.upsert({
      where: { schoolId_entityType: { schoolId, entityType } },
      update: dto,
      create: { ...dto, schoolId, entityType },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'NUMBERING_RULE_UPDATED',
      module: 'SETTINGS',
      resourceId: entityType,
      metadata: dto,
    });

    return rule;
  }

  async toggleFeatureOverride(schoolId: string, featureName: string, isEnabled: boolean, userId: string) {
    await this.ensureDefaultFeatures();
    const feature = await this.prisma.featureFlag.findUnique({ where: { name: featureName } });
    if (!feature) throw new NotFoundException('Feature not found');

    const override = await this.prisma.featureFlagOverride.upsert({
      where: { featureFlagId_schoolId: { featureFlagId: feature.id, schoolId } },
      update: { isEnabled },
      create: { featureFlagId: feature.id, schoolId, isEnabled },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: isEnabled ? 'FEATURE_ENABLED' : 'FEATURE_DISABLED',
      module: 'SETTINGS',
      resourceId: featureName,
    });

    return override;
  }

  private async clearPlatformCache(key: string) {
    // Platform defaults are cached under every school/user combination.
    await this.redis.delByPattern(`setting:*:*:${key}`);
  }

  private async clearSchoolCache(schoolId: string, key: string) {
    await this.redis.delByPattern(`setting:${schoolId}:*:${key}`);
  }
}

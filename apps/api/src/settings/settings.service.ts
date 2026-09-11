import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RedisService } from '../redis/redis.service';
import { UpdateSettingDto } from './dto/settings.dto';

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

      await this.audit.log({
        userId,
        action: 'PLATFORM_SETTING_UPDATED',
        module: 'SETTINGS',
        resourceId: key,
        metadata: { value: dto.value, reason: dto.changeReason },
      });

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
    // In production, use a pattern-based deletion or versioning
  }

  private async clearSchoolCache(schoolId: string, key: string) {
    // Clear school-level cache
  }
}

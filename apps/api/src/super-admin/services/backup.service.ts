import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PlatformBackupStatus, PlatformBackupVerificationStatus } from '@prisma/client';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_PG_BIN = 'C:\\Program Files\\PostgreSQL\\18\\bin';

function binaryPath(name: 'pg_dump' | 'pg_restore') {
  const configured = process.env.PG_BIN?.trim();
  if (configured) return join(configured, `${name}.exe`);

  const defaultPath = join(DEFAULT_PG_BIN, `${name}.exe`);
  return existsSync(defaultPath) ? defaultPath : name;
}

function processResult(command: string, args: string[], env: NodeJS.ProcessEnv) {
  return new Promise<{ code: number; stdout: string; stderr: string }>(
    (resolvePromise, reject) => {
      const child = spawn(command, args, {
        env,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      child.on('error', reject);
      child.on('close', (code) => {
        resolvePromise({ code: code ?? 1, stdout, stderr });
      });
    },
  );
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private backupDirectory() {
    return resolve(
      process.env.BACKUP_DIRECTORY?.trim() ||
        join(process.cwd(), 'backups'),
    );
  }

  private databaseConnection() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new BadRequestException('DATABASE_URL is not configured.');
    }

    let parsed: URL;
    try {
      parsed = new URL(connectionString);
    } catch {
      throw new BadRequestException('DATABASE_URL is not a valid PostgreSQL URL.');
    }

    if (!parsed.protocol.startsWith('postgres')) {
      throw new BadRequestException('Backups require a PostgreSQL DATABASE_URL.');
    }

    const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
    const username = decodeURIComponent(parsed.username);
    const password = decodeURIComponent(parsed.password);
    if (!database || !username) {
      throw new BadRequestException('DATABASE_URL is missing a database name or user.');
    }

    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port || '5432',
      database,
      username,
      password,
    };
  }

  private mapBackup(backup: any) {
    return {
      ...backup,
      sizeBytes: backup.sizeBytes == null ? null : Number(backup.sizeBytes),
    };
  }

  async list() {
    const items = await this.prisma.platformBackup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    return { items: items.map((item) => this.mapBackup(item)), total: items.length };
  }

  async start(actorId: string) {
    const connection = this.databaseConnection();
    const pgDump = binaryPath('pg_dump');
    if (pgDump !== 'pg_dump' && !existsSync(pgDump)) {
      throw new BadRequestException(
        'pg_dump was not found. Configure PG_BIN or install PostgreSQL client tools.',
      );
    }

    const running = await this.prisma.platformBackup.findFirst({
      where: { status: { in: [PlatformBackupStatus.PENDING, PlatformBackupStatus.RUNNING] } },
      select: { id: true, filename: true },
    });
    if (running) {
      throw new BadRequestException(
        `Backup ${running.filename} is already in progress. Wait for it to finish.`,
      );
    }

    const directory = this.backupDirectory();
    await mkdir(directory, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `schoolma-${timestamp}.dump`;

    const backup = await this.prisma.platformBackup.create({
      data: {
        filename,
        databaseName: connection.database,
        format: 'custom',
        status: PlatformBackupStatus.PENDING,
        createdById: actorId,
      },
    });

    await this.audit.log({
      userId: actorId,
      action: 'PLATFORM_BACKUP_STARTED',
      module: 'SYSTEM',
      resourceId: backup.id,
      metadata: { filename, format: 'custom', database: connection.database },
    });

    void this.executeBackup(backup.id, connection, pgDump);

    return this.mapBackup(backup);
  }

  private async executeBackup(
    backupId: string,
    connection: ReturnType<BackupService['databaseConnection']>,
    pgDump: string,
  ) {
    const backup = await this.prisma.platformBackup.findUnique({
      where: { id: backupId },
    });
    if (!backup) return;

    const filePath = join(this.backupDirectory(), backup.filename);
    const startedAt = new Date();

    await this.prisma.platformBackup.update({
      where: { id: backupId },
      data: { status: PlatformBackupStatus.RUNNING, startedAt },
    });

    try {
      const result = await processResult(
        pgDump,
        [
          '--format=custom',
          '--no-owner',
          '--no-acl',
          '--host',
          connection.host,
          '--port',
          connection.port,
          '--username',
          connection.username,
          '--dbname',
          connection.database,
          '--file',
          filePath,
        ],
        { ...process.env, PGPASSWORD: connection.password },
      );

      if (result.code !== 0) {
        throw new Error(result.stderr.trim() || `pg_dump exited with code ${result.code}`);
      }

      const fileStat = await stat(filePath);
      const checksum = await this.hashFile(filePath);

      await this.prisma.platformBackup.update({
        where: { id: backupId },
        data: {
          status: PlatformBackupStatus.COMPLETED,
          completedAt: new Date(),
          sizeBytes: BigInt(fileStat.size),
          checksumSha256: checksum,
          errorMessage: null,
        },
      });
    } catch (error: any) {
      this.logger.error(`Backup ${backup.filename} failed: ${error.message}`);
      await unlink(filePath).catch(() => undefined);
      await this.prisma.platformBackup.update({
        where: { id: backupId },
        data: {
          status: PlatformBackupStatus.FAILED,
          completedAt: new Date(),
          errorMessage: String(error.message || error).slice(0, 2000),
        },
      });
      await this.audit.log({
        userId: backup.createdById,
        action: 'PLATFORM_BACKUP_FAILED',
        module: 'SYSTEM',
        resourceId: backup.id,
        metadata: { filename: backup.filename, error: String(error.message || error).slice(0, 500) },
      });
    }
  }

  private hashFile(filePath: string) {
    return new Promise<string>((resolvePromise, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk as any));
      stream.on('error', reject);
      stream.on('end', () => resolvePromise(hash.digest('hex')));
    });
  }

  async verify(backupId: string, actorId: string) {
    const backup = await this.prisma.platformBackup.findUnique({
      where: { id: backupId },
    });
    if (!backup) throw new NotFoundException('Backup not found');
    if (backup.status !== PlatformBackupStatus.COMPLETED) {
      throw new BadRequestException('Only completed backups can be verified.');
    }

    const filePath = join(this.backupDirectory(), backup.filename);
    if (!existsSync(filePath)) {
      await this.prisma.platformBackup.update({
        where: { id: backupId },
        data: {
          verificationStatus: PlatformBackupVerificationStatus.FAILED,
          verifiedAt: new Date(),
          verificationMessage: 'Backup file is missing from the backup directory.',
        },
      });
      throw new BadRequestException('Backup file is missing from the backup directory.');
    }

    const pgRestore = binaryPath('pg_restore');
    const result = await processResult(
      pgRestore,
      ['--list', filePath],
      process.env,
    );
    const verified = result.code === 0;

    const updated = await this.prisma.platformBackup.update({
      where: { id: backupId },
      data: {
        verificationStatus: verified
          ? PlatformBackupVerificationStatus.VERIFIED
          : PlatformBackupVerificationStatus.FAILED,
        verifiedAt: new Date(),
        verificationMessage: (
          verified ? 'Archive listing verified successfully.' : result.stderr
        ).slice(0, 2000),
      },
    });

    await this.audit.log({
      userId: actorId,
      action: verified ? 'PLATFORM_BACKUP_VERIFIED' : 'PLATFORM_BACKUP_VERIFICATION_FAILED',
      module: 'SYSTEM',
      resourceId: backup.id,
      metadata: { filename: backup.filename, verified },
    });

    return this.mapBackup(updated);
  }
}

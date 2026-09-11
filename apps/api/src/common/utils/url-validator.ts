import { BadRequestException } from '@nestjs/common';
import * as url from 'url';
import * as net from 'net';

export class UrlValidator {
  private static readonly BLOCKED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '169.254.169.254', // AWS/GCP metadata
  ];

  private static readonly BLOCKED_IP_RANGES = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^0\./,
  ];

  static validate(inputUrl: string): string {
    try {
      const parsed = new url.URL(inputUrl);

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new BadRequestException('Invalid protocol');
      }

      const hostname = parsed.hostname.toLowerCase();

      if (this.BLOCKED_HOSTS.includes(hostname)) {
        throw new BadRequestException('Forbidden hostname');
      }

      // Check for IP-based hostnames
      if (net.isIP(hostname)) {
        if (this.BLOCKED_IP_RANGES.some(range => range.test(hostname))) {
          throw new BadRequestException('Forbidden IP range');
        }
      }

      return inputUrl;
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Invalid URL format');
    }
  }
}

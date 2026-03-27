// @ts-nocheck
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text: string | null): string | null {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(text: string | null): string | null {
  if (!text) return text;
  if (!text.includes(':')) return text; // Fallback
  const textParts = text.split(':');
  const ivStr = textParts.shift();
  if (!ivStr) return text;
  const iv = Buffer.from(ivStr, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

function getExtendedClient(prisma: PrismaClient) {
  return prisma.$extends({
    query: {
      consultationNote: {
        async create({ args, query }) {
          if (args.data.notes) {
            args.data.notes = encrypt(args.data.notes as string) as string;
          }
          return query(args);
        },
        async update({ args, query }) {
          if (args.data.notes) {
            args.data.notes = encrypt(args.data.notes as string) as string;
          }
          return query(args);
        },
      },
      labTest: {
        async create({ args, query }) {
          if (args.data.resultData) {
            args.data.resultData = encrypt(args.data.resultData as string) as string;
          }
          return query(args);
        },
        async update({ args, query }) {
          if (args.data.resultData) {
            args.data.resultData = encrypt(args.data.resultData as string) as string;
          }
          return query(args);
        },
      },
    },
    result: {
      consultationNote: {
        notes: {
          needs: { notes: true },
          compute(model) {
            return decrypt(model.notes) || '';
          },
        },
      },
      labTest: {
        resultData: {
          needs: { resultData: true },
          compute(model) {
            if (!model.resultData) return null;
            return decrypt(model.resultData);
          },
        },
      },
    },
  });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public client: ReturnType<typeof getExtendedClient>;

  constructor() {
    super();
    this.client = getExtendedClient(this);
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }
}

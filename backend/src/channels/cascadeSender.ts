import redis from '../db/redis';
import { sendMessage as sendTelegram } from './telegram';
import { sendMessage as sendMaxReal } from './max';
import { sendSMS as sendSmsReal } from './sms';
import { Channel, IClient, ICascadeResult, ISalon } from '../../../shared/types';

// Порядок попыток. WhatsApp намеренно убран (дорого, сложно, низкий приоритет в РФ).
const CHANNEL_ORDER: Channel[] = ['telegram', 'max', 'vk', 'sms'];
const STATUS_TTL = 300; // 5 минут

export class CascadeSender {
  // Отправляет сообщение, пробуя каналы по приоритету. Salon нужен для токенов ботов.
  async send(client: IClient, text: string, salon?: ISalon): Promise<ICascadeResult> {
    const attempted: Channel[] = [];

    // Сначала пробуем предпочитаемый клиентом канал
    const order = this.reorderByPreferred(client.preferredChannel);

    for (const channel of order) {
      attempted.push(channel);

      const userId = this.getUserIdForChannel(client, channel);
      if (!userId) continue;

      const available = await this.isChannelAvailable(channel);
      if (!available) {
        console.warn(`[cascade] канал ${channel} заблокирован, пропускаем`);
        continue;
      }

      try {
        const ok = await this.sendVia(channel, userId, text, salon);
        if (ok) {
          console.log(`[cascade] доставлено через ${channel} клиенту ${client.id}`);
          return { success: true, channel, attemptedChannels: attempted };
        }
      } catch (err) {
        console.error(`[cascade] ошибка в канале ${channel}:`, err);
        await this.markChannelBlocked(channel);
      }
    }

    return {
      success: false,
      attemptedChannels: attempted,
      error: 'Не удалось доставить сообщение ни через один канал',
    };
  }

  // Проверка доступности канала по Redis-кэшу
  async isChannelAvailable(channel: string): Promise<boolean> {
    try {
      const status = await redis.get(`channel_status:${channel}`);
      if (!status) return true;
      return status !== 'blocked';
    } catch {
      return true;
    }
  }

  async markChannelBlocked(channel: string): Promise<void> {
    try {
      await redis.set(`channel_status:${channel}`, 'blocked', 'EX', STATUS_TTL);
    } catch (err) {
      console.error('[cascade.markChannelBlocked] error:', err);
    }
  }

  private reorderByPreferred(preferred: Channel): Channel[] {
    if (!CHANNEL_ORDER.includes(preferred)) return CHANNEL_ORDER;
    return [preferred, ...CHANNEL_ORDER.filter((c) => c !== preferred)];
  }

  private getUserIdForChannel(client: IClient, channel: Channel): string | null {
    switch (channel) {
      case 'telegram':
        return client.telegramId || null;
      case 'max':
        return client.maxId || null;
      case 'vk':
        return client.vkId || null;
      case 'sms':
        return client.phone || null;
    }
  }

  private async sendVia(
    channel: Channel,
    userId: string,
    text: string,
    salon?: ISalon
  ): Promise<boolean> {
    switch (channel) {
      case 'telegram': {
        const token = salon?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
          console.warn('[cascade] нет telegram-токена ни в салоне, ни в env');
          return false;
        }
        return sendTelegram(token, userId, text);
      }
      case 'max':
        return this.sendMax(userId, text, salon);
      case 'vk':
        return this.sendVK(userId, text);
      case 'sms':
        return this.sendSMS(userId, text);
    }
  }

  // Заглушки — реализуются по мере подключения провайдеров (см. план Этапа 3)
  private async sendMax(to: string, text: string, salon?: ISalon): Promise<boolean> {
    const token = salon?.maxBotToken || process.env.MAX_API_KEY;
    if (!token) {
      console.warn('[cascade] нет max-токена ни в салоне, ни в env');
      return false;
    }
    return sendMaxReal(token, to, text);
  }

  private async sendVK(_to: string, _text: string): Promise<boolean> {
    console.warn('[cascade] VK не реализован');
    return false;
  }

  private async sendSMS(to: string, text: string): Promise<boolean> {
    return sendSmsReal(to, text);
  }
}

export const cascadeSender = new CascadeSender();

import redis from '../db/redis';
import { sendMessage as sendTelegram } from './telegram';
import { Channel, IClient, ICascadeResult, ISalon } from '../../../shared/types';

const CHANNEL_ORDER: Channel[] = ['telegram', 'whatsapp', 'max', 'sms'];
const STATUS_TTL = 300; // 5 минут

export class CascadeSender {
  // Отправляет сообщение, пробуя каналы по приоритету. Salon нужен для токенов botToken и др.
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
      if (!status) return true; // нет данных — считаем доступным
      return status !== 'blocked';
    } catch {
      return true; // если Redis недоступен — не блокируем отправку
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
      case 'whatsapp':
        return client.whatsappId || null;
      case 'max':
        return client.maxId || null;
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
        // Берём токен бота из салона; fallback на глобальный для обратной совместимости.
        const token = salon?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
          console.warn('[cascade] нет telegram-токена ни в салоне, ни в env');
          return false;
        }
        return sendTelegram(token, userId, text);
      }
      case 'whatsapp':
        return this.sendWhatsApp(userId, text);
      case 'max':
        return this.sendMax(userId, text);
      case 'sms':
        return this.sendSMS(userId, text);
    }
  }

  // Заглушки — реализовать когда подключим провайдеров
  private async sendWhatsApp(_to: string, _text: string): Promise<boolean> {
    console.warn('[cascade] WhatsApp не реализован');
    return false;
  }

  private async sendMax(_to: string, _text: string): Promise<boolean> {
    console.warn('[cascade] MAX не реализован');
    return false;
  }

  private async sendSMS(_to: string, _text: string): Promise<boolean> {
    console.warn('[cascade] SMS не реализован');
    return false;
  }
}

export const cascadeSender = new CascadeSender();

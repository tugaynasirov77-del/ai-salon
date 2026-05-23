import prisma from '../db/prisma';
import { aiAgent } from '../agents/aiAgent';
import { cascadeSender } from './cascadeSender';
import { Channel, IIncomingMessage, IClient, ISalon } from '../../../shared/types';

export class MessageRouter {
  // Главная точка входа для входящих сообщений из любого канала
  async handleIncoming(channel: Channel, rawData: any, salonId?: string): Promise<void> {
    try {
      const msg = this.normalize(channel, rawData);
      if (!msg || !msg.text) {
        console.warn('[router] пустое или некорректное сообщение');
        return;
      }

      // TODO: в проде salonId определяется по botToken/номеру (multi-tenant)
      const salon = await this.resolveSalon(salonId);
      if (!salon) {
        console.warn('[router] салон не найден');
        return;
      }

      const client = await this.findOrCreateClient(salon.id, msg);

      // Сохраняем входящее (с intent для аналитики)
      const intent = aiAgent.detectIntent(msg.text);
      await prisma.message.create({
        data: {
          salonId: salon.id,
          clientId: client.id,
          channel: msg.channel,
          direction: 'in',
          text: msg.text,
          intent,
        },
      });

      // AI обрабатывает
      const { text: reply, usage } = await aiAgent.process(
        client as unknown as IClient,
        msg,
        salon as unknown as ISalon
      );

      // Отправка через каскад (передаём салон для multi-tenant: токен его бота)
      const result = await cascadeSender.send(
        client as unknown as IClient,
        reply,
        salon as unknown as ISalon
      );

      // Сохраняем исходящее с расходом токенов (для биллинга и оптимизации)
      await prisma.message.create({
        data: {
          salonId: salon.id,
          clientId: client.id,
          channel: result.channel || msg.channel,
          direction: 'out',
          text: reply,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cacheReadTokens: usage.cacheReadTokens,
          cacheCreateTokens: usage.cacheCreateTokens,
        },
      });

      // Эскалация владельцу, если клиент просит человека или AI не справляется
      await this.maybeEscalate(salon, client, msg.text, reply);
    } catch (err) {
      console.error('[router.handleIncoming] error:', err);
    }
  }

  // Нормализация входящих данных в единый формат
  normalize(channel: Channel, rawData: any): IIncomingMessage | null {
    try {
      switch (channel) {
        case 'telegram': {
          const m = rawData?.message;
          if (!m?.text) return null;
          return {
            channel,
            externalUserId: String(m.chat.id),
            text: m.text,
            senderName: [m.from?.first_name, m.from?.last_name].filter(Boolean).join(' ') || undefined,
            raw: rawData,
          };
        }
        case 'vk': {
          // VK Callback API: входящие сообщения в сообщество
          const obj = rawData?.object?.message || rawData?.object || rawData;
          const from = obj?.from_id || obj?.user_id;
          const text = obj?.text;
          if (!from || !text) return null;
          return {
            channel,
            externalUserId: String(from),
            text: String(text),
            raw: rawData,
          };
        }
        case 'sms': {
          const sender = rawData?.sender || rawData?.from;
          const text = rawData?.text || rawData?.body;
          if (!sender || !text) return null;
          return {
            channel,
            externalUserId: String(sender),
            phone: String(sender),
            text: String(text),
            raw: rawData,
          };
        }
        case 'max': {
          // Max (TamTam) update формат: {update_type, message: {sender: {user_id, name}, body: {text}}}
          const m = rawData?.message;
          const sender = m?.sender;
          const text = m?.body?.text;
          const userId = sender?.user_id;
          if (!userId || !text) return null;
          return {
            channel,
            externalUserId: String(userId),
            text: String(text),
            senderName: sender?.name,
            raw: rawData,
          };
        }
        case 'avito': {
          // Avito v3 webhook payload: {payload: {type: 'message', value: {id, chat_id, author_id, user_id, content: {text}, ...}}}
          const v = rawData?.payload?.value || rawData?.value || rawData;
          const authorId = v?.author_id;
          const text = v?.content?.text;
          const chatId = v?.chat_id;
          // Игнорируем эхо собственных сообщений (когда author_id == userId владельца)
          if (!authorId || !text) return null;
          return {
            channel,
            externalUserId: String(authorId),
            text: String(text),
            raw: { chatId, ...rawData },
          };
        }
        case 'webchat': {
          const sessionId = rawData?.sessionId;
          const text = rawData?.text;
          if (!sessionId || !text) return null;
          return {
            channel,
            externalUserId: String(sessionId),
            text: String(text),
            senderName: rawData?.name,
            phone: rawData?.phone,
            raw: rawData,
          };
        }
      }
    } catch (err) {
      console.error('[router.normalize] error:', err);
      return null;
    }
  }

  // Поиск или создание клиента по идентификатору в канале
  async findOrCreateClient(salonId: string, msg: IIncomingMessage) {
    const channel = msg.channel;
    const where: any = { salonId };

    if (channel === 'telegram') where.telegramId = msg.externalUserId;
    else if (channel === 'max') where.maxId = msg.externalUserId;
    else if (channel === 'vk') where.vkId = msg.externalUserId;
    else if (channel === 'sms') where.phone = msg.phone || msg.externalUserId;
    else if (channel === 'webchat') where.webchatId = msg.externalUserId;
    else if (channel === 'avito') where.avitoUserId = msg.externalUserId;

    let client = await prisma.client.findFirst({ where });
    if (client) {
      // Avito: chat_id может меняться — обновим на актуальный
      if (channel === 'avito' && msg.raw?.chatId && client.avitoChatId !== msg.raw.chatId) {
        client = await prisma.client.update({
          where: { id: client.id },
          data: { avitoChatId: msg.raw.chatId },
        });
      }
      return client;
    }

    client = await prisma.client.create({
      data: {
        salonId,
        name: msg.senderName,
        phone: msg.phone,
        telegramId: channel === 'telegram' ? msg.externalUserId : null,
        maxId: channel === 'max' ? msg.externalUserId : null,
        vkId: channel === 'vk' ? msg.externalUserId : null,
        webchatId: channel === 'webchat' ? msg.externalUserId : null,
        avitoUserId: channel === 'avito' ? msg.externalUserId : null,
        avitoChatId: channel === 'avito' ? (msg.raw?.chatId || null) : null,
        preferredChannel: channel,
      },
    });
    return client;
  }

  // Заглушка — пока используется первый активный салон или переданный id
  private async resolveSalon(salonId?: string) {
    if (salonId) {
      return prisma.salon.findUnique({ where: { id: salonId } });
    }
    return prisma.salon.findFirst({ where: { isActive: true } });
  }

  // Эскалация: если клиент явно просит человека ИЛИ это 3-й «ничего не понял» подряд —
  // шлём владельцу салона уведомление в его настроенный чат (salon.settings.ownerChatId).
  private async maybeEscalate(salon: any, client: any, inText: string, replyText: string): Promise<void> {
    try {
      const settings = (salon.settings as any) || {};
      const ownerChatId = settings?.ownerChatId;
      const ownerToken = salon.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
      if (!ownerChatId || !ownerToken) return;

      const inLow = inText.toLowerCase();
      const replyLow = replyText.toLowerCase();
      const wantsHuman = /(оператор|администратор|человек|менеджер|живой|настоящ)/.test(inLow);
      const aiFailed = /(не понял|не понимаю|извините|произошла ошибка|перезвоните)/.test(replyLow);

      // Считаем неудачные ответы AI подряд (3+ — эскалируем)
      let failsInRow = 0;
      if (aiFailed) {
        const recent = await prisma.message.findMany({
          where: { clientId: client.id, salonId: salon.id, direction: 'out' },
          orderBy: { createdAt: 'desc' },
          take: 3,
        });
        failsInRow = recent.filter((m) =>
          /(не понял|не понимаю|извините|произошла ошибка)/.test(m.text.toLowerCase())
        ).length;
      }

      if (wantsHuman || failsInRow >= 3) {
        const reason = wantsHuman ? 'клиент просит человека' : 'AI не справился 3 раза подряд';
        const txt = `⚠️ Эскалация (${reason})\n\nКлиент: ${client.name || 'без имени'}\nКанал: ${client.preferredChannel}\nПоследнее сообщение: "${inText}"\n\nОткрой панель чтобы ответить вручную.`;
        const { sendMessage } = await import('./telegram');
        await sendMessage(ownerToken, ownerChatId, txt);
        console.log(`[escalate] салон=${salon.id} клиент=${client.id} причина=${reason}`);
      }
    } catch (err) {
      console.error('[router.maybeEscalate] error:', err);
    }
  }
}

export const messageRouter = new MessageRouter();

import { INiche, NicheKey } from './types';

// Конфигурация ниш для AI-агента и напоминаний
// Плейсхолдеры в systemPrompt: {name}, {services}, {schedule}

export const NICHES: Record<NicheKey, INiche> = {
  beauty_salon: {
    key: 'beauty_salon',
    label: 'Салон красоты',
    icon: '💅',
    systemPrompt: `Ты — вежливый администратор салона красоты "{name}".
Услуги и цены:
{services}
График работы: {schedule}

Твоя задача: помочь клиенту записаться, ответить на вопросы об услугах и ценах, мягко предложить альтернативы если нет свободного времени.
Отвечай кратко, тепло, на "вы". Если клиент хочет записаться — уточни услугу, желаемую дату/время и мастера (если важно).`,
    bookingFields: ['service', 'datetime', 'master'],
    reminderTemplates: {
      h24: 'Здравствуйте, {clientName}! Напоминаем: завтра в {time} вы записаны на {service} в салон "{salonName}". Будем рады видеть!',
      h2: '{clientName}, ждём вас через 2 часа на {service} в "{salonName}". Адрес: {address}.',
    },
    onboardingQuestions: [
      'Какие услуги вы оказываете и сколько они стоят?',
      'Какой у вас график работы?',
      'Сколько мастеров работает и на каких услугах они специализируются?',
      'Какой адрес салона?',
    ],
    defaultFAQ: [
      { question: 'Сколько стоит маникюр?', answer: 'Стоимость зависит от вида — уточните, пожалуйста, какой именно интересует.' },
      { question: 'Можно ли без записи?', answer: 'Лучше записаться заранее, чтобы гарантировать время.' },
    ],
  },

  barbershop: {
    key: 'barbershop',
    label: 'Барбершоп',
    icon: '💈',
    systemPrompt: `Ты — администратор барбершопа "{name}".
Услуги:
{services}
График: {schedule}

Общайся дружелюбно, по-мужски, без официоза, на "ты" если клиент пишет неформально, иначе на "вы".
Помоги записаться: уточни услугу, дату/время и барбера.`,
    bookingFields: ['service', 'datetime', 'master'],
    reminderTemplates: {
      h24: 'Привет, {clientName}! Завтра в {time} ждём тебя в "{salonName}" на {service}.',
      h2: '{clientName}, через 2 часа стрижка в "{salonName}". Адрес: {address}.',
    },
    onboardingQuestions: [
      'Какие услуги в прайсе и цены?',
      'График работы?',
      'Сколько барберов работает?',
      'Адрес барбершопа?',
    ],
    defaultFAQ: [
      { question: 'Сколько стоит стрижка?', answer: 'Уточните, какая стрижка — цены различаются.' },
    ],
  },

  fitness: {
    key: 'fitness',
    label: 'Фитнес-студия',
    icon: '🏋️',
    systemPrompt: `Ты — администратор фитнес-студии "{name}".
Услуги и абонементы:
{services}
Расписание: {schedule}

Помогай записаться на тренировки, рассказывай про абонементы и тренеров. Отвечай мотивирующе, на "вы".`,
    bookingFields: ['service', 'datetime', 'master'],
    reminderTemplates: {
      h24: 'Здравствуйте, {clientName}! Завтра в {time} у вас тренировка ({service}) в "{salonName}". До встречи!',
      h2: '{clientName}, через 2 часа тренировка в "{salonName}". Не забудьте форму!',
    },
    onboardingQuestions: [
      'Какие направления тренировок и стоимость занятий/абонементов?',
      'Расписание групповых занятий?',
      'Список тренеров?',
      'Адрес студии?',
    ],
    defaultFAQ: [
      { question: 'Есть ли пробное занятие?', answer: 'Уточните у администратора — обычно первое занятие со скидкой.' },
    ],
  },

  clinic: {
    key: 'clinic',
    label: 'Клиника / медцентр',
    icon: '🏥',
    systemPrompt: `Ты — администратор медицинского центра "{name}".
Услуги/специалисты:
{services}
График: {schedule}

Общайся максимально вежливо и официально, на "вы". Не давай медицинских советов, не ставь диагнозы — только помоги записаться к нужному специалисту.`,
    bookingFields: ['service', 'datetime', 'master'],
    reminderTemplates: {
      h24: 'Здравствуйте, {clientName}. Напоминаем: завтра в {time} у вас приём ({service}) в "{salonName}".',
      h2: '{clientName}, через 2 часа ваш приём в "{salonName}". Адрес: {address}.',
    },
    onboardingQuestions: [
      'Перечислите специалистов и их услуги с ценами.',
      'График работы клиники?',
      'Адрес?',
      'Какие документы нужно иметь при себе?',
    ],
    defaultFAQ: [
      { question: 'Нужна ли подготовка к анализам?', answer: 'Уточним при записи — зависит от вида исследования.' },
    ],
  },

  auto_service: {
    key: 'auto_service',
    label: 'Автосервис',
    icon: '🔧',
    systemPrompt: `Ты — администратор автосервиса "{name}".
Услуги:
{services}
График: {schedule}

Помогай записаться на ремонт/ТО, уточняй марку и модель авто, описание проблемы. Отвечай чётко и по делу, на "вы".`,
    bookingFields: ['service', 'datetime', 'car'],
    reminderTemplates: {
      h24: '{clientName}, напоминаем: завтра в {time} вы записаны в "{salonName}" на {service}.',
      h2: '{clientName}, через 2 часа ждём вас в "{salonName}". Адрес: {address}.',
    },
    onboardingQuestions: [
      'Какие услуги и примерная стоимость?',
      'График работы?',
      'Сколько постов/мастеров?',
      'Адрес сервиса?',
    ],
    defaultFAQ: [
      { question: 'Сколько стоит замена масла?', answer: 'Зависит от марки авто и масла — уточните модель.' },
    ],
  },

  restaurant: {
    key: 'restaurant',
    label: 'Ресторан / кафе',
    icon: '🍽️',
    systemPrompt: `Ты — администратор ресторана "{name}".
Меню и услуги:
{services}
График: {schedule}

Помогай бронировать столики, отвечай на вопросы о меню, кухне, банкетах. Общайся тепло и гостеприимно, на "вы". Уточняй: дату/время, количество гостей, особые пожелания.`,
    bookingFields: ['datetime', 'guests', 'comment'],
    reminderTemplates: {
      h24: 'Здравствуйте, {clientName}! Напоминаем: завтра в {time} у вас бронь столика в "{salonName}". Ждём!',
      h2: '{clientName}, через 2 часа ждём вас в "{salonName}". Адрес: {address}.',
    },
    onboardingQuestions: [
      'Какая кухня и средний чек?',
      'График работы?',
      'Сколько посадочных мест? Принимаете банкеты?',
      'Адрес ресторана?',
    ],
    defaultFAQ: [
      { question: 'Можно ли с детьми?', answer: 'Конечно, у нас есть детское меню и стульчики.' },
    ],
  },

  lawyer: {
    key: 'lawyer',
    label: 'Юрист / адвокат',
    icon: '⚖️',
    systemPrompt: `Ты — ассистент юридической практики "{name}".
Услуги и направления:
{services}
График: {schedule}

Общайся максимально вежливо и официально, на "вы". НЕ давай юридических консультаций и оценок дела — только помоги записаться на консультацию к специалисту. Уточняй краткую суть вопроса для подбора нужного юриста.`,
    bookingFields: ['service', 'datetime', 'comment'],
    reminderTemplates: {
      h24: 'Здравствуйте, {clientName}. Напоминаем: завтра в {time} у вас консультация в "{salonName}".',
      h2: '{clientName}, через 2 часа ваша консультация в "{salonName}". Адрес: {address}.',
    },
    onboardingQuestions: [
      'Какие направления практики и стоимость консультаций?',
      'График приёма?',
      'Сколько специалистов и по каким направлениям?',
      'Адрес офиса?',
    ],
    defaultFAQ: [
      { question: 'Сколько стоит консультация?', answer: 'Зависит от направления — уточните, по какому вопросу обращаетесь.' },
    ],
  },

  tutor: {
    key: 'tutor',
    label: 'Репетитор / школа',
    icon: '📚',
    systemPrompt: `Ты — ассистент образовательного центра "{name}".
Предметы и форматы:
{services}
График: {schedule}

Помогай записаться на занятия и пробные уроки. Уточняй предмет, уровень/класс ученика, желаемый формат (онлайн/офлайн), удобное время. Общайся вежливо, на "вы".`,
    bookingFields: ['service', 'datetime', 'student_level'],
    reminderTemplates: {
      h24: 'Здравствуйте, {clientName}! Напоминаем: завтра в {time} занятие ({service}) в "{salonName}".',
      h2: '{clientName}, через 2 часа занятие в "{salonName}". Не забудьте материалы!',
    },
    onboardingQuestions: [
      'Какие предметы и стоимость занятий?',
      'Расписание и форматы (онлайн/офлайн)?',
      'Сколько преподавателей?',
      'Адрес центра (если офлайн)?',
    ],
    defaultFAQ: [
      { question: 'Есть ли пробный урок?', answer: 'Да, обычно первое занятие — диагностическое, со скидкой или бесплатно.' },
    ],
  },

  other: {
    key: 'other',
    label: 'Другое',
    icon: '⚙️',
    systemPrompt: `Ты — администратор компании "{name}".
Услуги:
{services}
График: {schedule}

Помогай клиентам записаться на услуги и отвечай на вопросы. Общайся вежливо и по делу, на "вы". Если не знаешь ответа — предложи связаться с владельцем.`,
    bookingFields: ['service', 'datetime'],
    reminderTemplates: {
      h24: 'Здравствуйте, {clientName}! Напоминаем: завтра в {time} вы записаны в "{salonName}" на {service}.',
      h2: '{clientName}, через 2 часа ждём вас в "{salonName}". Адрес: {address}.',
    },
    onboardingQuestions: [
      'Какие услуги вы оказываете и их стоимость?',
      'График работы?',
      'Адрес?',
    ],
    defaultFAQ: [],
  },
};

// Подставляет данные салона в шаблон системного промпта
export function buildSystemPrompt(
  niche: NicheKey,
  data: { name: string; services: string; schedule: string }
): string {
  const cfg = NICHES[niche];
  if (!cfg) throw new Error(`Unknown niche: ${niche}`);
  return cfg.systemPrompt
    .replace(/{name}/g, data.name)
    .replace(/{services}/g, data.services)
    .replace(/{schedule}/g, data.schedule);
}

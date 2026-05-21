'use client';

import { useAppStore } from '@/lib/store';
import { formatPhone } from '@/lib/utils';
import { Input, Label, Textarea } from '@/components/ui/input';

export function BusinessForm() {
  const data = useAppStore((s) => s.onboarding.businessData);
  const setData = useAppStore((s) => s.setBusinessData);

  const weekdays = data.scheduleWeekdays || { from: '09:00', to: '20:00' };
  const weekend = data.scheduleWeekend || { from: '10:00', to: '18:00', closed: false };

  return (
    <div>
      <h2 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Расскажите о бизнесе
      </h2>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Эти данные увидят клиенты в сообщениях бота.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Название <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            value={data.name || ''}
            onChange={(e) => setData({ name: e.target.value })}
            placeholder='Например, "Студия Грация"'
          />
        </div>
        <div>
          <Label htmlFor="ownerName">Имя владельца <span className="text-red-500">*</span></Label>
          <Input
            id="ownerName"
            value={data.ownerName || ''}
            onChange={(e) => setData({ ownerName: e.target.value })}
            placeholder="Иван Петров"
          />
        </div>
        <div>
          <Label htmlFor="phone">Телефон <span className="text-red-500">*</span></Label>
          <Input
            id="phone"
            value={data.phone || ''}
            onChange={(e) => setData({ phone: formatPhone(e.target.value) })}
            placeholder="+7 (___) ___-__-__"
          />
        </div>
        <div>
          <Label htmlFor="address">Адрес</Label>
          <Input
            id="address"
            value={data.address || ''}
            onChange={(e) => setData({ address: e.target.value })}
            placeholder="Москва, ул. Тверская, 1"
          />
        </div>
      </div>

      <div className="mt-6">
        <Label>Часы работы</Label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Пн–Пт</div>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={weekdays.from}
                onChange={(e) => setData({ scheduleWeekdays: { ...weekdays, from: e.target.value } })}
              />
              <span className="text-slate-400">—</span>
              <Input
                type="time"
                value={weekdays.to}
                onChange={(e) => setData({ scheduleWeekdays: { ...weekdays, to: e.target.value } })}
              />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Сб–Вс</span>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={!!weekend.closed}
                  onChange={(e) => setData({ scheduleWeekend: { ...weekend, closed: e.target.checked } })}
                />
                Выходной
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                disabled={weekend.closed}
                value={weekend.from}
                onChange={(e) => setData({ scheduleWeekend: { ...weekend, from: e.target.value } })}
              />
              <span className="text-slate-400">—</span>
              <Input
                type="time"
                disabled={weekend.closed}
                value={weekend.to}
                onChange={(e) => setData({ scheduleWeekend: { ...weekend, to: e.target.value } })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function isBusinessFormValid(data: { name?: string; ownerName?: string; phone?: string }) {
  return Boolean(data.name && data.ownerName && data.phone && data.phone.replace(/\D/g, '').length >= 11);
}

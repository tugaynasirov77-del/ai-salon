'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye, EyeOff, Scissors, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  fetchServices,
  fetchMasters,
  createService,
  updateService,
  deleteService,
  type IService,
  type IMaster,
} from '@/lib/api';
import { useSalonId } from '@/lib/config';
import { cn } from '@/lib/utils';

interface FormState {
  name: string;
  price: string;
  durationMin: string;
  masterIds: string[];
}

function emptyForm(): FormState {
  return { name: '', price: '', durationMin: '60', masterIds: [] };
}

function formFromService(s: IService): FormState {
  return {
    name: s.name,
    price: String(s.price ?? ''),
    durationMin: s.durationMin ? String(s.durationMin) : '',
    masterIds: s.masters.map((m) => m.masterId),
  };
}

export default function ServicesPage() {
  const SALON_ID = useSalonId();
  const qc = useQueryClient();

  const services = useQuery({ queryKey: ['services', SALON_ID], queryFn: () => fetchServices(SALON_ID) });
  const masters = useQuery({ queryKey: ['masters', SALON_ID], queryFn: () => fetchMasters(SALON_ID) });

  const mastersById = useMemo(() => {
    const map = new Map<string, IMaster>();
    (masters.data || []).forEach((m) => map.set(m.id, m));
    return map;
  }, [masters.data]);

  const [editing, setEditing] = useState<IService | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<IService | null>(null);

  function openCreate() {
    setForm(emptyForm());
    setFormError(null);
    setCreating(true);
  }

  function openEdit(s: IService) {
    setForm(formFromService(s));
    setFormError(null);
    setEditing(s);
  }

  function closeModal() {
    setCreating(false);
    setEditing(null);
    setFormError(null);
  }

  const createMut = useMutation({
    mutationFn: (data: { name: string; price: number; durationMin?: number; masterIds?: string[] }) =>
      createService(SALON_ID, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services', SALON_ID] });
      closeModal();
    },
    onError: (e: any) => setFormError(e?.message || 'Не удалось создать'),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: string; patch: Partial<IService> & { masterIds?: string[] } }) =>
      updateService(SALON_ID, data.id, data.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services', SALON_ID] });
      closeModal();
    },
    onError: (e: any) => setFormError(e?.message || 'Не удалось сохранить'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteService(SALON_ID, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services', SALON_ID] });
      setConfirmDelete(null);
    },
  });

  const toggleActiveMut = useMutation({
    mutationFn: (s: IService) => updateService(SALON_ID, s.id, { isActive: !s.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services', SALON_ID] }),
  });

  function submit() {
    setFormError(null);
    const name = form.name.trim();
    const price = Number(form.price);
    const durationMin = form.durationMin ? Number(form.durationMin) : undefined;
    if (!name) return setFormError('Введите название услуги');
    if (!Number.isFinite(price) || price < 0) return setFormError('Цена должна быть положительным числом');
    if (durationMin !== undefined && (!Number.isFinite(durationMin) || durationMin <= 0))
      return setFormError('Длительность должна быть больше 0');

    if (editing) {
      updateMut.mutate({ id: editing.id, patch: { name, price, durationMin, masterIds: form.masterIds } });
    } else {
      createMut.mutate({ name, price, durationMin, masterIds: form.masterIds });
    }
  }

  function toggleMasterChip(id: string) {
    setForm((f) => ({
      ...f,
      masterIds: f.masterIds.includes(id) ? f.masterIds.filter((x) => x !== id) : [...f.masterIds, id],
    }));
  }

  const open = creating || !!editing;
  const list = services.data || [];
  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <PageHeader
          title="Услуги"
          description="Прайс-лист, который ИИ-администратор предлагает клиентам при записи. Без услуг ИИ не сможет оформлять записи."
        />
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Добавить услугу
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {services.isLoading ? (
          <div className="py-12">
            <LoadingSpinner label="Загружаем услуги…" />
          </div>
        ) : services.isError ? (
          <div className="px-6 py-12 text-center text-sm text-red-600">
            Не удалось загрузить услуги. Попробуйте обновить страницу.
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
              <Scissors className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mb-1 text-base font-medium text-slate-700 dark:text-slate-200">Пока нет услуг</div>
            <div className="mb-4 max-w-sm text-sm text-slate-500">
              Добавьте хотя бы одну услугу — без этого ИИ не сможет предлагать запись клиентам.
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Добавить первую услугу
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-[#1A1612]/50">
                <tr>
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3 text-right">Цена, ₽</th>
                  <th className="px-4 py-3 text-right">Длительность</th>
                  <th className="px-4 py-3">Мастера</th>
                  <th className="px-4 py-3 text-center">Статус</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {list.map((s) => {
                  const masterNames = s.masters
                    .map((m) => mastersById.get(m.masterId)?.name)
                    .filter(Boolean) as string[];
                  return (
                    <tr key={s.id} className={cn('hover:bg-slate-50 dark:hover:bg-[#1A1612]/40', !s.isActive && 'opacity-60')}>
                      <td className="px-4 py-3 font-medium text-[#1A1612] dark:text-slate-100">{s.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {s.price.toLocaleString('ru-RU')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {s.durationMin ? `${s.durationMin} мин` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {masterNames.length ? (
                          <div className="flex flex-wrap gap-1">
                            {masterNames.map((n) => (
                              <span
                                key={n}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800"
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">не указаны</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActiveMut.mutate(s)}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                          title={s.isActive ? 'Скрыть от ИИ' : 'Показать ИИ'}
                        >
                          {s.isActive ? (
                            <>
                              <Eye className="h-3.5 w-3.5 text-green-600" />
                              <span className="text-green-700 dark:text-green-400">Активна</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-slate-500">Скрыта</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800"
                            aria-label="Редактировать"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(s)}
                            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                            aria-label="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={closeModal}
        title={editing ? 'Редактировать услугу' : 'Новая услуга'}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal} disabled={saving}>
              Отмена
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="svc-name">Название</Label>
            <Input
              id="svc-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Стрижка женская"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="svc-price">Цена, ₽</Label>
              <Input
                id="svc-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="2500"
              />
            </div>
            <div>
              <Label htmlFor="svc-dur">Длительность, мин</Label>
              <Input
                id="svc-dur"
                type="number"
                min={0}
                value={form.durationMin}
                onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
                placeholder="60"
              />
            </div>
          </div>
          <div>
            <Label>Мастера, которые делают</Label>
            {(masters.data || []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-500 dark:border-slate-800">
                Мастера пока не добавлены. Добавьте их на странице «Мастера», чтобы привязывать к услугам.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(masters.data || []).map((m) => {
                  const active = form.masterIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMasterChip(m.id)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#1A1612] dark:text-slate-300',
                      )}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {formError && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{formError}</div>}
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Удалить услугу?"
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleteMut.isPending}>
              Отмена
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => confirmDelete && deleteMut.mutate(confirmDelete.id)}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Удалить
            </Button>
          </div>
        }
      >
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Услуга <b>«{confirmDelete?.name}»</b> будет удалена. ИИ перестанет её предлагать. Существующие записи останутся.
        </div>
      </Modal>
    </div>
  );
}

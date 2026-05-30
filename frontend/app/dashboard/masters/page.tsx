'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Eye, EyeOff, UserCog, Loader2, Phone } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  fetchMasters,
  fetchServices,
  createMaster,
  updateMaster,
  deleteMaster,
  type IMaster,
  type IService,
} from '@/lib/api';
import { useSalonId } from '@/lib/config';
import { cn, formatPhone } from '@/lib/utils';

interface FormState {
  name: string;
  phone: string;
  serviceIds: string[];
}

function emptyForm(): FormState {
  return { name: '', phone: '', serviceIds: [] };
}

function formFromMaster(m: IMaster): FormState {
  return {
    name: m.name,
    phone: m.phone || '',
    serviceIds: m.services.map((s) => s.serviceId),
  };
}

export default function MastersPage() {
  const SALON_ID = useSalonId();
  const qc = useQueryClient();

  const masters = useQuery({ queryKey: ['masters', SALON_ID], queryFn: () => fetchMasters(SALON_ID) });
  const services = useQuery({ queryKey: ['services', SALON_ID], queryFn: () => fetchServices(SALON_ID) });

  const servicesById = useMemo(() => {
    const map = new Map<string, IService>();
    (services.data || []).forEach((s) => map.set(s.id, s));
    return map;
  }, [services.data]);

  const [editing, setEditing] = useState<IMaster | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<IMaster | null>(null);

  function openCreate() {
    setForm(emptyForm());
    setFormError(null);
    setCreating(true);
  }

  function openEdit(m: IMaster) {
    setForm(formFromMaster(m));
    setFormError(null);
    setEditing(m);
  }

  function closeModal() {
    setCreating(false);
    setEditing(null);
    setFormError(null);
  }

  const createMut = useMutation({
    mutationFn: (data: { name: string; phone?: string; serviceIds?: string[] }) => createMaster(SALON_ID, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['masters', SALON_ID] });
      closeModal();
    },
    onError: (e: any) => setFormError(e?.message || 'Не удалось создать'),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: string; patch: Partial<IMaster> & { serviceIds?: string[] } }) =>
      updateMaster(SALON_ID, data.id, data.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['masters', SALON_ID] });
      closeModal();
    },
    onError: (e: any) => setFormError(e?.message || 'Не удалось сохранить'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteMaster(SALON_ID, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['masters', SALON_ID] });
      setConfirmDelete(null);
    },
  });

  const toggleActiveMut = useMutation({
    mutationFn: (m: IMaster) => updateMaster(SALON_ID, m.id, { isActive: !m.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['masters', SALON_ID] }),
  });

  function submit() {
    setFormError(null);
    const name = form.name.trim();
    const phone = form.phone.trim() || undefined;
    if (!name) return setFormError('Введите имя мастера');

    if (editing) {
      updateMut.mutate({ id: editing.id, patch: { name, phone, serviceIds: form.serviceIds } });
    } else {
      createMut.mutate({ name, phone, serviceIds: form.serviceIds });
    }
  }

  function toggleServiceChip(id: string) {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id],
    }));
  }

  const open = creating || !!editing;
  const list = masters.data || [];
  const saving = createMut.isPending || updateMut.isPending;
  const allServices = services.data || [];

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <PageHeader
          title="Мастера"
          description="Сотрудники, которые принимают записи. Привяжите мастеров к услугам — AI будет учитывать это при подборе времени."
        />
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Добавить мастера
        </Button>
      </div>

      {masters.isLoading ? (
        <Card className="p-0">
          <div className="py-12">
            <LoadingSpinner label="Загружаем мастеров…" />
          </div>
        </Card>
      ) : masters.isError ? (
        <Card>
          <div className="py-8 text-center text-sm text-red-600">Не удалось загрузить мастеров.</div>
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
              <UserCog className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mb-1 text-base font-medium text-slate-700 dark:text-slate-200">Пока нет мастеров</div>
            <div className="mb-4 max-w-sm text-sm text-slate-500">
              Добавьте сотрудников — AI сможет распределять записи по мастерам.
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Добавить первого мастера
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => {
            const serviceNames = m.services
              .map((x) => servicesById.get(x.serviceId)?.name)
              .filter(Boolean) as string[];
            return (
              <Card key={m.id} className={cn('flex flex-col p-4', !m.isActive && 'opacity-60')}>
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-base font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-[#12151C] dark:text-slate-100">{m.name}</div>
                    {m.phone ? (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <Phone className="h-3 w-3" />
                        {formatPhone(m.phone)}
                      </div>
                    ) : (
                      <div className="mt-0.5 text-xs text-slate-400">телефон не указан</div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleActiveMut.mutate(m)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={m.isActive ? 'Скрыть' : 'Показать'}
                  >
                    {m.isActive ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>

                <div className="mb-3 flex-1">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">Услуги</div>
                  {serviceNames.length ? (
                    <div className="flex flex-wrap gap-1">
                      {serviceNames.map((n) => (
                        <span key={n} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                          {n}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">не привязаны</div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <button
                    onClick={() => openEdit(m)}
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800"
                    aria-label="Редактировать"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(m)}
                    className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    aria-label="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={closeModal}
        title={editing ? 'Редактировать мастера' : 'Новый мастер'}
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
            <Label htmlFor="m-name">Имя</Label>
            <Input
              id="m-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Анна Иванова"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="m-phone">Телефон</Label>
            <Input
              id="m-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+7 (___) ___-__-__"
            />
          </div>
          <div>
            <Label>Услуги, которые делает</Label>
            {allServices.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-500 dark:border-slate-800">
                Услуги пока не добавлены. Добавьте их на странице «Услуги».
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allServices.map((s) => {
                  const active = form.serviceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleServiceChip(s.id)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#12151C] dark:text-slate-300',
                      )}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {formError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {formError}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Удалить мастера?"
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
          Мастер <b>«{confirmDelete?.name}»</b> будет удалён. Существующие записи к нему останутся в истории.
        </div>
      </Modal>
    </div>
  );
}

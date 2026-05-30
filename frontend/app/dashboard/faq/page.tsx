'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, HelpCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { fetchFaqs, createFaq, updateFaq, deleteFaq, type IFaq } from '@/lib/api';
import { useSalonId } from '@/lib/config';

interface FormState {
  question: string;
  answer: string;
}

function emptyForm(): FormState {
  return { question: '', answer: '' };
}

export default function FaqPage() {
  const SALON_ID = useSalonId();
  const qc = useQueryClient();

  const faqs = useQuery({ queryKey: ['faqs', SALON_ID], queryFn: () => fetchFaqs(SALON_ID) });

  const [editing, setEditing] = useState<IFaq | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<IFaq | null>(null);

  function openCreate() {
    setForm(emptyForm());
    setFormError(null);
    setCreating(true);
  }
  function openEdit(f: IFaq) {
    setForm({ question: f.question, answer: f.answer });
    setFormError(null);
    setEditing(f);
  }
  function closeModal() {
    setCreating(false);
    setEditing(null);
    setFormError(null);
  }

  const list = (faqs.data || []).slice().sort((a, b) => a.order - b.order);

  const createMut = useMutation({
    mutationFn: (data: { question: string; answer: string; order?: number }) => createFaq(SALON_ID, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faqs', SALON_ID] });
      closeModal();
    },
    onError: (e: any) => setFormError(e?.message || 'Не удалось создать'),
  });

  const updateMut = useMutation({
    mutationFn: (data: { id: string; patch: Partial<IFaq> }) => updateFaq(SALON_ID, data.id, data.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faqs', SALON_ID] });
      closeModal();
    },
    onError: (e: any) => setFormError(e?.message || 'Не удалось сохранить'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFaq(SALON_ID, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faqs', SALON_ID] });
      setConfirmDelete(null);
    },
  });

  // Перестановка двух соседей — обновляем order у обоих
  const swapMut = useMutation({
    mutationFn: async (data: { a: IFaq; b: IFaq }) => {
      await Promise.all([
        updateFaq(SALON_ID, data.a.id, { order: data.b.order }),
        updateFaq(SALON_ID, data.b.id, { order: data.a.order }),
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faqs', SALON_ID] }),
  });

  function move(idx: number, dir: -1 | 1) {
    const a = list[idx];
    const b = list[idx + dir];
    if (!a || !b) return;
    swapMut.mutate({ a, b });
  }

  function submit() {
    setFormError(null);
    const question = form.question.trim();
    const answer = form.answer.trim();
    if (!question) return setFormError('Введите вопрос');
    if (!answer) return setFormError('Введите ответ');

    if (editing) {
      updateMut.mutate({ id: editing.id, patch: { question, answer } });
    } else {
      const nextOrder = list.length ? Math.max(...list.map((f) => f.order)) + 1 : 0;
      createMut.mutate({ question, answer, order: nextOrder });
    }
  }

  const open = creating || !!editing;
  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <PageHeader
          title="FAQ"
          description="Частые вопросы и ответы. AI использует их как готовые шаблоны — это экономит токены и ускоряет ответ."
        />
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Добавить вопрос
        </Button>
      </div>

      {faqs.isLoading ? (
        <Card className="p-0">
          <div className="py-12">
            <LoadingSpinner label="Загружаем FAQ…" />
          </div>
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
              <HelpCircle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mb-1 text-base font-medium text-slate-700 dark:text-slate-200">Пока нет FAQ</div>
            <div className="mb-4 max-w-sm text-sm text-slate-500">
              Добавьте часто задаваемые вопросы — например, «Где вы находитесь?» или «Принимаете ли вы карту?».
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Добавить первый вопрос
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((f, idx) => (
            <Card key={f.id} className="flex gap-3 p-4">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0 || swapMut.isPending}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-amber-600 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-slate-800"
                  aria-label="Выше"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === list.length - 1 || swapMut.isPending}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-amber-600 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-slate-800"
                  aria-label="Ниже"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-[#12151C] dark:text-slate-100">{f.question}</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{f.answer}</div>
              </div>

              <div className="flex items-start gap-1">
                <button
                  onClick={() => openEdit(f)}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800"
                  aria-label="Редактировать"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmDelete(f)}
                  className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                  aria-label="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={closeModal}
        title={editing ? 'Редактировать вопрос' : 'Новый вопрос'}
        maxWidth="lg"
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
            <Label htmlFor="faq-q">Вопрос</Label>
            <Input
              id="faq-q"
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              placeholder="Где вы находитесь?"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="faq-a">Ответ</Label>
            <Textarea
              id="faq-a"
              value={form.answer}
              onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
              placeholder="Мы находимся по адресу: ул. Ленина, 1. Работаем с 9:00 до 21:00."
              rows={4}
            />
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
        title="Удалить вопрос?"
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
          Вопрос <b>«{confirmDelete?.question}»</b> будет удалён.
        </div>
      </Modal>
    </div>
  );
}

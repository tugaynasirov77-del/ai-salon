'use client';

import { useState, useRef } from 'react';
import { Upload, X, Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Input, Label, Textarea } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function ServicesForm() {
  const data = useAppStore((s) => s.onboarding.businessData);
  const setData = useAppStore((s) => s.setBusinessData);
  const [dragOver, setDragOver] = useState(false);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [newMaster, setNewMaster] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const masters = data.masters || [];

  function addMaster() {
    const v = newMaster.trim();
    if (!v) return;
    if (masters.includes(v)) return;
    setData({ masters: [...masters, v] });
    setNewMaster('');
  }

  function removeMaster(name: string) {
    setData({ masters: masters.filter((m) => m !== name) });
  }

  function handleFile(file: File | null) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Принимаем только PDF файлы');
      return;
    }
    setPdfName(file.name);
    // TODO: загрузить файл на бэкенд когда будет API
  }

  return (
    <div>
      <h2 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Услуги и цены
      </h2>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Бот будет использовать этот прайс при общении с клиентами.
      </p>

      <div className="mb-6">
        <Label htmlFor="priceList">Прайс-лист</Label>
        <Textarea
          id="priceList"
          rows={8}
          value={data.priceList || ''}
          onChange={(e) => setData({ priceList: e.target.value })}
          placeholder={'Стрижка - 1500₽\nМаникюр - 1200₽\nОкрашивание - 3500₽'}
        />
      </div>

      <div className="mb-6">
        <Label>Или загрузите PDF</Label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0] || null);
          }}
          onClick={() => fileInput.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors',
            dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : 'border-slate-300 hover:border-blue-400 dark:border-slate-700',
          )}
        >
          <Upload className="mb-2 h-8 w-8 text-slate-400" />
          {pdfName ? (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{pdfName}</span>
          ) : (
            <>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Перетащите PDF сюда
              </span>
              <span className="mt-1 text-xs text-slate-500">или нажмите, чтобы выбрать файл</span>
            </>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      <div>
        <Label>Мастера / сотрудники</Label>
        <div className="mb-2 flex flex-wrap gap-2">
          {masters.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {m}
              <button
                type="button"
                onClick={() => removeMaster(m)}
                className="text-slate-400 hover:text-red-500"
                aria-label={'Удалить ' + m}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {masters.length === 0 && (
            <span className="text-sm text-slate-400">Список пуст</span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={newMaster}
            onChange={(e) => setNewMaster(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addMaster();
              }
            }}
            placeholder="Имя мастера"
          />
          <button
            type="button"
            onClick={addMaster}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

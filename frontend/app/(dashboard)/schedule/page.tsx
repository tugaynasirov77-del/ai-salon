import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function SchedulePage() {
  return (
    <div>
      <PageHeader title="Расписание" description="Записи по дням." />
      <Card>
        <CardContent>
          <p className="text-sm text-slate-500">Скоро здесь будет календарь записей.</p>
        </CardContent>
      </Card>
    </div>
  );
}

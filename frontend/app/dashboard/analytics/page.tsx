import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Аналитика" description="Метрики и графики по работе бота." />
      <Card>
        <CardContent>
          <p className="text-sm text-slate-500">Скоро здесь будут графики.</p>
        </CardContent>
      </Card>
    </div>
  );
}

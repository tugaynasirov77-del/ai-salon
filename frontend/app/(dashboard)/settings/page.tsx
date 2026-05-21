import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Настройки" description="AI-агент, каналы, напоминания." />
      <Card>
        <CardContent>
          <p className="text-sm text-slate-500">Скоро здесь будут настройки.</p>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
  current: number;
  total: number;
  message?: string;
}

export const ProgressBar = ({ current, total, message }: ProgressBarProps) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <Card className="p-8 border-none shadow-brand bg-white animate-pulse">
      <div className="flex items-center gap-6 mb-6">
        <div className="bg-primary/10 p-4 rounded-full">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-xl mb-2 text-foreground">
            {message || 'Processando endereços...'}
          </h3>
          <p className="text-base text-muted-foreground">
            <strong className="text-foreground">{current.toLocaleString()}</strong> de <strong className="text-foreground">{total.toLocaleString()}</strong> registros processados
            <span className="ml-2 text-primary font-semibold">({percentage}%)</span>
          </p>
        </div>
      </div>
      <Progress value={percentage} className="h-3 bg-primary/10" />
    </Card>
  );
};

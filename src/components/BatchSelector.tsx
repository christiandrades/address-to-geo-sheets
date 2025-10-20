import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Settings } from 'lucide-react';

interface BatchSelectorProps {
  totalRecords: number;
  onStartGeocode: (startIndex: number, count: number) => void;
  disabled?: boolean;
}

export const BatchSelector = ({ totalRecords, onStartGeocode, disabled }: BatchSelectorProps) => {
  const [startIndex, setStartIndex] = useState(0);
  const [batchSize, setBatchSize] = useState(100);

  const handleStart = () => {
    const count = Math.min(batchSize, totalRecords - startIndex);
    onStartGeocode(startIndex, count);
  };

  const handleProcessAll = () => {
    onStartGeocode(0, totalRecords);
  };

  return (
    <Card className="p-6 bg-secondary/30">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Configurar Geocodificação</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <Label htmlFor="startIndex">Iniciar do registro</Label>
          <Input
            id="startIndex"
            type="number"
            min={0}
            max={totalRecords - 1}
            value={startIndex}
            onChange={(e) => setStartIndex(Math.max(0, parseInt(e.target.value) || 0))}
            disabled={disabled}
          />
        </div>
        
        <div>
          <Label htmlFor="batchSize">Quantidade de registros</Label>
          <Input
            id="batchSize"
            type="number"
            min={1}
            max={totalRecords}
            value={batchSize}
            onChange={(e) => setBatchSize(Math.min(totalRecords, Math.max(1, parseInt(e.target.value) || 100)))}
            disabled={disabled}
          />
        </div>
        
        <div className="flex items-end gap-2">
          <Button 
            onClick={handleStart} 
            disabled={disabled || startIndex >= totalRecords}
            className="flex-1"
          >
            Processar Lote
          </Button>
          <Button 
            onClick={handleProcessAll} 
            disabled={disabled}
            variant="secondary"
            className="flex-1"
          >
            Processar Tudo
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Total: {totalRecords.toLocaleString()} registros | 
        Processando: {startIndex + 1} até {Math.min(startIndex + batchSize, totalRecords)} |
        Tempo estimado: ~{Math.ceil(Math.min(batchSize, totalRecords - startIndex) * 1.1 / 60)} min
      </p>
    </Card>
  );
};

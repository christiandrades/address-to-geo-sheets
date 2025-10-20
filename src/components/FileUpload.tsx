import { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <Card
      className="border-2 border-dashed border-primary/30 hover:border-primary hover:shadow-brand transition-all duration-300 cursor-pointer bg-white"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <label className="flex flex-col items-center justify-center p-16 cursor-pointer">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <Upload className="w-16 h-16 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-3">
          Enviar Planilha
        </h3>
        <p className="text-muted-foreground text-center text-lg mb-2">
          Arraste seu arquivo aqui ou clique para selecionar
        </p>
        <p className="text-sm text-muted-foreground/70 text-center">
          Formatos aceitos: CSV e XLSX com dados de endereços
        </p>
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileInput}
          className="hidden"
        />
      </label>
    </Card>
  );
};

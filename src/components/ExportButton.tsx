import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { PatientData } from '@/types/patient';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  data: PatientData[];
  disabled?: boolean;
}

export const ExportButton = ({ data, disabled }: ExportButtonProps) => {
  const handleExport = () => {
    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
    
    // Generate Excel file and download
    const fileName = `relatorio_geocodificado_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled}
      size="lg"
      className="gap-2"
    >
      <Download className="w-5 h-5" />
      Exportar Planilha {data.filter(d => d.latitude).length > 0 ? 'Geocodificada' : 'Original'}
    </Button>
  );
};

import { PatientData } from '@/types/patient';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MapPin, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface DataTableProps {
  data: PatientData[];
}

const ITEMS_PER_PAGE = 50;

export const DataTable = ({ data }: DataTableProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, data.length);
  const currentData = data.slice(startIndex, endIndex);
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-accent" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-secondary/30 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1} - {endIndex} de {data.length} registros
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium px-3">
            Página {currentPage + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">CPF</TableHead>
              <TableHead className="font-semibold">Endereço</TableHead>
              <TableHead className="font-semibold">Município/UF</TableHead>
              <TableHead className="font-semibold">Coordenadas</TableHead>
              <TableHead className="font-semibold">Comorbidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((patient, index) => (
              <TableRow key={index} className="hover:bg-secondary/30 transition-colors">
                <TableCell>
                  {getStatusIcon(patient.geocodingStatus)}
                </TableCell>
                <TableCell className="font-medium">{patient.Nome}</TableCell>
                <TableCell className="text-muted-foreground">{patient.CPF}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {patient.Rua}, {patient.Número}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {patient.Bairro} - CEP: {patient.CEP}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {patient.Município}/{patient.UF}
                </TableCell>
                <TableCell>
                  {patient.latitude && patient.longitude ? (
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span className="font-mono">
                        {patient.latitude.toFixed(6)}, {patient.longitude.toFixed(6)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {patient.Comorbidade && (
                    <Badge variant="outline" className="text-xs">
                      {patient.Comorbidade}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

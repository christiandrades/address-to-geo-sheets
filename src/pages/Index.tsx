import { useState, useMemo } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DataTable } from '@/components/DataTable';
import { ProgressBar } from '@/components/ProgressBar';
import { ExportButton } from '@/components/ExportButton';
import { BatchSelector } from '@/components/BatchSelector';
import { ApiKeysConfig } from '@/components/ApiKeysConfig';
import { PatientData } from '@/types/patient';
import { geocodeBatch } from '@/services/geocodingMultiple';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Papa from 'papaparse';
import {
  MapPin,
  FileText,
  RotateCw,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [data, setData] = useState<PatientData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [apiKeys, setApiKeys] = useState<{
    locationiq?: string;
    positionstack?: string;
    opencage?: string;
  }>({
    locationiq: localStorage.getItem('locationiq_key') || '',
    positionstack: localStorage.getItem('positionstack_key') || '',
    opencage: localStorage.getItem('opencage_key') || ''
  });
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as PatientData[];
        const processedData = parsedData.map(item => ({
          ...item,
          geocodingStatus: undefined as 'pending' | 'success' | 'error' | undefined
        }));
        setData(processedData);

        const recordCount = processedData.length.toLocaleString();
        toast({
          title: 'Arquivo carregado!',
          description: `${recordCount} registros encontrados. Configure o lote para geocodificar.`,
        });
      },
      error: (error) => {
        toast({
          title: 'Erro ao carregar arquivo',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const handleGeocodeBatch = async (startIndex: number, count: number) => {
    if (data.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: count });

    try {
      const endIndex = Math.min(startIndex + count, data.length);
      const batchData = data.slice(startIndex, endIndex);

      const addresses = batchData.map(item => ({
        rua: item.Rua || '',
        numero: item.Número || '',
        bairro: item.Bairro || '',
        cidade: item.Município || '',
        uf: item.UF || '',
        cep: item.CEP || '',
      }));

      const results = await geocodeBatch(
        addresses,
        (current: number, total: number) => {
          setProgress({ current, total });
        },
        apiKeys
      );

      const updatedData = [...data];
      batchData.forEach((item, index) => {
        const result = results[index];
        const dataIndex = startIndex + index;
        updatedData[dataIndex] = {
          ...updatedData[dataIndex],
          latitude: result?.lat,
          longitude: result?.lon,
          enderecoCompleto: result?.display_name,
          geocodingStatus: result ? 'success' : 'error',
        };
      });

      setData(updatedData);

      const successCount = results.filter((r: any) => r !== null).length;
      toast({
        title: 'Lote concluído!',
        description: `${successCount} de ${count} endereços convertidos. Total processado: ${endIndex}/${data.length}`,
      });
    } catch (error) {
      toast({
        title: 'Erro na geocodificação',
        description: 'Ocorreu um erro ao processar os endereços.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setData([]);
    setProgress({ current: 0, total: 0 });
  };

  const geocodedCount = useMemo(
    () => data.filter(d => d.geocodingStatus === 'success').length,
    [data]
  );

  const errorCount = useMemo(
    () => data.filter(d => d.geocodingStatus === 'error').length,
    [data]
  );

  const pendingCount = useMemo(
    () => data.filter(d => !d.geocodingStatus || d.geocodingStatus === 'pending').length,
    [data]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MapPin className="w-12 h-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              GeoSaúde
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Converta endereços de pacientes em coordenadas geográficas automaticamente
          </p>
        </div>

        {/* Stats Cards */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{data.length.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Sucesso</p>
                  <p className="text-2xl font-bold text-foreground">{geocodedCount.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Erros</p>
                  <p className="text-2xl font-bold text-foreground">{errorCount.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-secondary to-secondary/50 border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-foreground">{pendingCount.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {data.length === 0 ? (
            <FileUpload onFileSelect={handleFileSelect} />
          ) : (
            <>
              {/* API Keys Configuration */}
              <ApiKeysConfig onSave={setApiKeys} />

              {/* Batch Selector */}
              <BatchSelector
                totalRecords={data.length}
                onStartGeocode={handleGeocodeBatch}
                disabled={isProcessing}
              />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <ExportButton data={data} disabled={isProcessing} />
                <Button
                  onClick={handleReset}
                  disabled={isProcessing}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <RotateCw className="w-5 h-5" />
                  Carregar Novo Arquivo
                </Button>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <ProgressBar
                  current={progress.current}
                  total={progress.total}
                  message="Convertendo endereços em coordenadas..."
                />
              )}

              {/* Data Table */}
              <DataTable data={data} />
            </>
          )}
        </div>

        {/* Footer Info */}
        <Card className="mt-12 p-6 bg-secondary/30">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Múltiplos Serviços de Geocodificação
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• <strong>Google Maps:</strong> 40.000 requisições/dia grátis</li>
            <li>• <strong>Mapbox:</strong> 100.000 requisições/mês grátis</li>
            <li>• <strong>Here Maps:</strong> 250.000 requisições/mês grátis</li>
            <li>• <strong>Nominatim (OpenStreetMap):</strong> Ilimitado, sem API key</li>
            <li>• <strong>LocationIQ:</strong> 5.000 requisições/dia grátis</li>
            <li>• <strong>Positionstack:</strong> 25.000 requisições/mês grátis</li>
            <li>• <strong>OpenCage:</strong> 2.500 requisições/dia grátis</li>
            <li>• <strong>Fallback automático:</strong> Se um serviço falhar, tenta o próximo</li>
            <li>• <strong>Exportação sempre ativa:</strong> Baixe a planilha a qualquer momento</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Index;

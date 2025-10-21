import { useState, useRef } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { readAddressFile, AddressData } from '@/services/fileReader';
import { geocodeAllAutomatic } from '@/services/hereGeocoding';
import { exportToKML } from '@/services/kmlExport';
import { GeocodingResult } from '@/types/patient';
import {
    MapPin,
    Download,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Play,
    RotateCw,
    StopCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const AutoGeocodingPage = () => {
    const [file, setFile] = useState<File | null>(null);
    const [addresses, setAddresses] = useState<AddressData[]>([]);
    const [results, setResults] = useState<GeocodingResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [stats, setStats] = useState({ success: 0, failed: 0, total: 0 });
    const [isCancelled, setIsCancelled] = useState(false);
    const { toast } = useToast();
    const startTimeRef = useRef<number>(0);
    const cancelledRef = useRef<boolean>(false);

    const handleFileSelect = async (selectedFile: File) => {
        try {
            setFile(selectedFile);
            toast({
                title: 'Lendo arquivo...',
                description: 'Processando planilha',
            });

            const extractedAddresses = await readAddressFile(selectedFile);
            setAddresses(extractedAddresses);
            setResults([]);
            setStats({ success: 0, failed: 0, total: extractedAddresses.length });

            toast({
                title: 'Arquivo carregado!',
                description: `${extractedAddresses.length} endereços encontrados. Clique em "Iniciar Geocodificação Automática".`,
            });
        } catch (error) {
            toast({
                title: 'Erro ao ler arquivo',
                description: error instanceof Error ? error.message : 'Erro desconhecido',
                variant: 'destructive',
            });
        }
    };

    const handleStartGeocoding = async () => {
        if (addresses.length === 0) return;

        setIsProcessing(true);
        setIsCancelled(false);
        cancelledRef.current = false;
        setProgress({ current: 0, total: addresses.length });
        setResults([]); // Limpa resultados anteriores
        startTimeRef.current = Date.now();

        try {
            toast({
                title: '🚀 Iniciando geocodificação automática',
                description: `Processando ${addresses.length} endereços com HERE API...`,
            });

            const geocodedResults = await geocodeAllAutomatic(
                addresses,
                (current, total, currentResult) => {
                    setProgress({ current, total });

                    // Atualiza resultados parciais durante o processamento
                    if (currentResult) {
                        setResults(prev => {
                            const updated = [...prev, currentResult];
                            
                            // Calcula estatísticas com base nos resultados atualizados
                            const successCount = updated.filter(r => r.success).length;
                            const failedCount = updated.length - successCount;
                            setStats({ success: successCount, failed: failedCount, total });
                            
                            return updated;
                        });
                    }

                    // Log a cada 10 endereços
                    if (current % 10 === 0) {
                        const elapsed = (Date.now() - startTimeRef.current) / 1000;
                        const rate = current / elapsed;
                        console.log(`Progresso: ${current}/${total} (${rate.toFixed(2)} req/s)`);
                    }
                },
                () => cancelledRef.current // Função para verificar se foi cancelado
            );

            setResults(geocodedResults);

            const successCount = geocodedResults.filter(r => r.success).length;
            const failedCount = geocodedResults.length - successCount;

            setStats({
                success: successCount,
                failed: failedCount,
                total: geocodedResults.length
            });

            const elapsed = ((Date.now() - startTimeRef.current) / 1000 / 60).toFixed(1);

            if (cancelledRef.current) {
                toast({
                    title: '⚠️ Processamento interrompido',
                    description: `${geocodedResults.length} endereços processados antes da interrupção. Você pode exportar os resultados.`,
                });
            } else {
                toast({
                    title: '✅ Geocodificação concluída!',
                    description: `${successCount} sucessos, ${failedCount} falhas. Tempo: ${elapsed} min. Baixe o KML agora!`,
                });
            }
        } catch (error) {
            toast({
                title: 'Erro na geocodificação',
                description: error instanceof Error ? error.message : 'Erro desconhecido',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
            setIsCancelled(false);
        }
    };

    const handleStopGeocoding = () => {
        cancelledRef.current = true;
        setIsCancelled(true);

        toast({
            title: '🛑 Parando processamento...',
            description: 'A geocodificação será interrompida após o endereço atual.',
        });
    };

    const handleExportKML = () => {
        if (results.length === 0) {
            toast({
                title: 'Nenhum resultado para exportar',
                description: 'Execute a geocodificação primeiro',
                variant: 'destructive',
            });
            return;
        }

        try {
            const filename = file ? file.name.replace(/\.[^.]+$/, '_geocoded.kml') : undefined;
            exportToKML(results, filename);

            toast({
                title: '📥 KML exportado!',
                description: `Arquivo pronto para Google Earth. ${stats.success} pontos incluídos.`,
            });
        } catch (error) {
            toast({
                title: 'Erro ao exportar KML',
                description: error instanceof Error ? error.message : 'Erro desconhecido',
                variant: 'destructive',
            });
        }
    };

    const handleExportCSV = () => {
        if (results.length === 0) return;

        const csvData = results.map((result, index) => ({
            ...result.originalData,
            latitude: result.lat,
            longitude: result.lon,
            endereco_encontrado: result.display_name,
            status: result.success ? 'sucesso' : 'falha',
            match_level: result.matchLevel || 'N/A',
            erro: result.error || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(csvData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Geocodificado');

        const filename = file ? file.name.replace(/\.[^.]+$/, '_geocoded.xlsx') : 'geocoded.xlsx';
        XLSX.writeFile(workbook, filename);

        toast({
            title: '📊 Planilha exportada!',
            description: `Arquivo Excel com coordenadas salvo.`,
        });
    };

    const handleReset = () => {
        setFile(null);
        setAddresses([]);
        setResults([]);
        setProgress({ current: 0, total: 0 });
        setStats({ success: 0, failed: 0, total: 0 });
        setIsCancelled(false);
        cancelledRef.current = false;
    };

    const estimatedTime = addresses.length > 0
        ? ((addresses.length * 0.2) / 60).toFixed(1)
        : '0';

    return (
        <div className="min-h-screen bg-background">
            {/* Header com Gradiente */}
            <div className="gradient-brand text-white py-16 shadow-brand">
                <div className="container mx-auto px-4 max-w-6xl text-center">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                            <MapPin className="w-12 h-12 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-balance">
                            Conversor Inteligente de Endereços
                        </h1>
                    </div>
                    <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto font-light">
                        Transforme planilhas em mapas no Google Earth, com um clique.
                    </p>
                    <div className="mt-8 inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium border border-white/20">
                        <CheckCircle className="w-5 h-5 text-accent" />
                        <span>Processamento Automático • 100% Gratuito • Resultados Instantâneos</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 max-w-6xl">
                {/* API Key Info - Design Limpo */}
                <Alert className="mb-8 border-primary/20 bg-primary/5">
                    <MapPin className="h-5 w-5 text-primary" />
                    <AlertDescription className="text-sm">
                        <strong className="text-primary">HERE API Configurada</strong> •
                        250.000 requisições/mês • Rate limit automático (5 req/s)
                    </AlertDescription>
                </Alert>                {/* Stats Cards */}
                {addresses.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                        <Card className="p-6 border-none shadow-brand bg-white hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-xl">
                                    <FileText className="w-7 h-7 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                                    <p className="text-3xl font-bold text-foreground">{stats.total.toLocaleString()}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-none shadow-brand bg-white hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="bg-green-50 p-3 rounded-xl">
                                    <CheckCircle className="w-7 h-7 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Sucessos</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.success.toLocaleString()}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-none shadow-brand bg-white hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="bg-red-50 p-3 rounded-xl">
                                    <XCircle className="w-7 h-7 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Endereços Inválidos</p>
                                    <p className="text-3xl font-bold text-red-600">{stats.failed.toLocaleString()}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-none shadow-brand bg-white hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="bg-amber-50 p-3 rounded-xl">
                                    <Clock className="w-7 h-7 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Tempo Estimado</p>
                                    <p className="text-3xl font-bold text-foreground">{estimatedTime} min</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Main Content */}
                <div className="space-y-6">
                    {addresses.length === 0 ? (
                        <FileUpload onFileSelect={handleFileSelect} />
                    ) : (
                        <>
                            {/* Action Buttons */}
                            <Card className="p-6 border-none shadow-brand bg-white">
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-wrap gap-4">
                                        {results.length === 0 && !isProcessing ? (
                                            <Button
                                                onClick={handleStartGeocoding}
                                                disabled={isProcessing}
                                                size="lg"
                                                className="gap-2 flex-1 min-w-[200px] bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all"
                                            >
                                                <Play className="w-5 h-5" />
                                                Geocodificar Agora
                                            </Button>
                                        ) : isProcessing ? (
                                            <Button
                                                onClick={handleStopGeocoding}
                                                disabled={isCancelled}
                                                size="lg"
                                                variant="destructive"
                                                className="gap-2 flex-1 min-w-[200px] shadow-lg hover:shadow-xl transition-all"
                                            >
                                                <StopCircle className="w-5 h-5" />
                                                {isCancelled ? 'Parando...' : 'Parar Processamento'}
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    onClick={handleExportKML}
                                                    size="lg"
                                                    className="gap-2 flex-1 min-w-[200px] bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transition-all"
                                                >
                                                    <Download className="w-5 h-5" />
                                                    Exportar para Google Earth
                                                </Button>
                                                <Button
                                                    onClick={handleExportCSV}
                                                    variant="secondary"
                                                    size="lg"
                                                    className="gap-2 flex-1 min-w-[200px] shadow-md hover:shadow-lg transition-all"
                                                >
                                                    <Download className="w-5 h-5" />
                                                    Baixar Planilha com Coordenadas
                                                </Button>
                                            </>
                                        )}
                                        {!isProcessing && (
                                            <Button
                                                onClick={handleReset}
                                                variant="outline"
                                                size="lg"
                                                disabled={isProcessing}
                                                className="gap-2 border-2 hover:bg-muted/50 transition-all"
                                            >
                                                <RotateCw className="w-5 h-5" />
                                                Novo Arquivo
                                            </Button>
                                        )}
                                    </div>

                                    {addresses.length > 0 && results.length === 0 && !isProcessing && (
                                        <Alert className="border-accent/30 bg-accent/10">
                                            <MapPin className="h-5 w-5 text-accent" />
                                            <AlertDescription className="text-foreground">
                                                <strong>{addresses.length.toLocaleString()} endereços</strong> prontos para geocodificação.
                                                O processo é <strong>totalmente automático</strong> e respeita o rate limit de 5 req/s.
                                                Tempo estimado: <strong>~{estimatedTime} minutos</strong>.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </Card>

                            {/* Progress Bar */}
                            {isProcessing && (
                                <ProgressBar
                                    current={progress.current}
                                    total={progress.total}
                                    message={`Geocodificando endereços com HERE API... (${((progress.current / progress.total) * 100).toFixed(1)}%)`}
                                />
                            )}

                            {/* Results Summary */}
                            {results.length > 0 && (
                                <Card className="p-8 border-none shadow-brand bg-white">
                                    <h3 className="font-bold mb-6 text-2xl flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                            <CheckCircle className="w-6 h-6 text-primary" />
                                        </div>
                                        Resumo dos Resultados
                                    </h3>
                                    <div className="space-y-4 text-base">
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <p className="text-green-900">
                                                <strong>{stats.success.toLocaleString()}</strong> endereços geocodificados com sucesso
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
                                            <XCircle className="w-5 h-5 text-red-600" />
                                            <p className="text-red-900">
                                                <strong>{stats.failed.toLocaleString()}</strong> endereços com falha
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/20">
                                            <MapPin className="w-5 h-5 text-accent-foreground" />
                                            <p className="text-accent-foreground">
                                                Taxa de sucesso: <strong>{((stats.success / stats.total) * 100).toFixed(1)}%</strong>
                                            </p>
                                        </div>
                                        <p className="text-muted-foreground mt-6 pt-6 border-t text-sm">
                                            Os arquivos exportados incluem todos os dados originais mais as coordenadas.
                                            O KML pode ser aberto diretamente no Google Earth com marcadores coloridos.
                                        </p>
                                    </div>
                                </Card>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Info */}
                <Card className="mt-12 p-8 border-none shadow-brand bg-white">
                    <h3 className="font-bold mb-6 text-xl flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        Como funciona o sistema
                    </h3>
                    <ul className="text-base text-foreground/80 space-y-3">
                        <li className="flex gap-3">
                            <span className="font-bold text-primary min-w-[30px]">1.</span>
                            <div>
                                <strong className="text-foreground">Upload:</strong> Envie arquivo CSV ou XLSX com colunas de endereço (rua, número, bairro, cidade, UF, CEP)
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold text-primary min-w-[30px]">2.</span>
                            <div>
                                <strong className="text-foreground">Geocodificação:</strong> Sistema processa todos os endereços automaticamente com HERE API
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold text-primary min-w-[30px]">3.</span>
                            <div>
                                <strong className="text-foreground">Rate Limit:</strong> 5 requisições por segundo (200ms entre cada) - totalmente controlado
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold text-primary min-w-[30px]">4.</span>
                            <div>
                                <strong className="text-foreground">Exportação KML:</strong> Baixe arquivo compatível com Google Earth
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold text-primary min-w-[30px]">5.</span>
                            <div>
                                <strong className="text-foreground">Exportação CSV:</strong> Planilha com coordenadas lat/lng adicionadas
                            </div>
                        </li>
                        <li className="flex gap-3 pt-4 border-t">
                            <span className="text-accent">📍</span>
                            <div className="text-sm text-muted-foreground">
                                <strong className="text-foreground">Ícones no Google Earth:</strong>
                                <span className="text-green-600"> ● Verde = Sucesso</span> |
                                <span className="text-red-600"> ● Vermelho = Falha</span>
                            </div>
                        </li>
                    </ul>
                </Card>

                {/* Footer Copyright */}
                <div className="mt-8 text-center pb-8">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} <strong className="text-primary">Christian Andrade</strong> • GeoSaúde v2.0 • Sistema de Geocodificação Automática
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Desenvolvido para processamento de grandes volumes de endereços com precisão e eficiência
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AutoGeocodingPage;
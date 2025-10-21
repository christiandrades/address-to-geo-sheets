import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Interface para dados extraídos da planilha
 */
export interface AddressData {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    [key: string]: any; // Permite campos adicionais
}

/**
 * Lê arquivo CSV ou XLSX e extrai endereços
 * @param file - Arquivo CSV ou XLSX
 * @returns Promise com array de endereços
 */
export const readAddressFile = async (file: File): Promise<AddressData[]> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
        return readCSV(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
        return readXLSX(file);
    } else {
        throw new Error('Formato de arquivo não suportado. Use CSV ou XLSX.');
    }
};

/**
 * Lê arquivo CSV
 */
const readCSV = async (file: File): Promise<AddressData[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            complete: (results) => {
                try {
                    const addresses = normalizeAddresses(results.data as any[]);
                    resolve(addresses);
                } catch (error) {
                    reject(error);
                }
            },
            error: (error) => {
                reject(new Error(`Erro ao ler CSV: ${error.message}`));
            },
        });
    });
};

/**
 * Lê arquivo XLSX
 */
const readXLSX = async (file: File): Promise<AddressData[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Pega primeira planilha
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                const addresses = normalizeAddresses(jsonData as any[]);
                resolve(addresses);
            } catch (error) {
                reject(new Error(`Erro ao ler XLSX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Erro ao ler arquivo'));
        };

        reader.readAsArrayBuffer(file);
    });
};

/**
 * Normaliza nomes de colunas para padrão
 * Detecta automaticamente variações de nomes
 */
const normalizeAddresses = (rawData: any[]): AddressData[] => {
    if (!rawData || rawData.length === 0) {
        throw new Error('Arquivo vazio ou sem dados');
    }

    const firstRow = rawData[0];
    const keys = Object.keys(firstRow);

    // Mapeia possíveis nomes de colunas
    const columnMap = detectColumns(keys);

    console.log('Colunas detectadas:', columnMap);

    const addresses = rawData.map((row, index) => {
        try {
            const address: AddressData = {
                rua: extractValue(row, columnMap.rua) || '',
                numero: extractValue(row, columnMap.numero) || '',
                bairro: extractValue(row, columnMap.bairro) || '',
                cidade: extractValue(row, columnMap.cidade) || '',
                uf: extractValue(row, columnMap.uf) || '',
                cep: extractValue(row, columnMap.cep) || ''
            };

            // Copia todos os outros campos
            Object.keys(row).forEach(key => {
                if (!Object.values(columnMap).includes(key)) {
                    address[key] = row[key];
                }
            });

            return address;
        } catch (error) {
            console.warn(`Linha ${index + 1} com erro:`, error);
            return null;
        }
    }).filter((addr): addr is AddressData => addr !== null);

    if (addresses.length === 0) {
        throw new Error('Nenhum endereço válido encontrado');
    }

    console.log(`✅ ${addresses.length} endereços carregados com sucesso`);

    return addresses;
};

/**
 * Detecta quais colunas correspondem a cada campo de endereço
 */
const detectColumns = (columns: string[]): Record<string, string> => {
    const map: Record<string, string> = {
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        uf: '',
        cep: ''
    };

    const patterns = {
        rua: /^(rua|logradouro|endereco|endereço|street|address)$/i,
        numero: /^(numero|número|num|n°|number|Número)$/i,
        bairro: /^(bairro|neighborhood|distrito|Bairro)$/i,
        cidade: /^(cidade|municipio|município|city|Município)$/i,
        uf: /^(uf|estado|state|UF)$/i,
        cep: /^(cep|postal.*code|zip.*code|CEP)$/i
    };

    columns.forEach(col => {
        const normalized = col.trim();

        Object.entries(patterns).forEach(([field, pattern]) => {
            if (pattern.test(normalized) && !map[field]) {
                map[field] = col;
            }
        });
    });

    // Verifica se encontrou campos essenciais
    const missingFields = Object.entries(map)
        .filter(([key, value]) => !value && key !== 'numero') // número é opcional
        .map(([key]) => key);

    if (missingFields.length > 0) {
        console.warn(`Atenção: Campos não detectados automaticamente: ${missingFields.join(', ')}`);
        console.warn('Colunas disponíveis:', columns);
    }

    return map;
};

/**
 * Extrai valor de uma célula, limpando espaços
 */
const extractValue = (row: any, columnName: string): string => {
    if (!columnName || !row[columnName]) return '';

    const value = row[columnName];

    if (typeof value === 'string') {
        return value.trim();
    }

    return String(value).trim();
};

/**
 * Valida se um arquivo tem formato válido
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension) {
        return { valid: false, error: 'Arquivo sem extensão' };
    }

    if (!['csv', 'xlsx', 'xls'].includes(extension)) {
        return { valid: false, error: 'Formato não suportado. Use CSV ou XLSX' };
    }

    if (file.size === 0) {
        return { valid: false, error: 'Arquivo vazio' };
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
        return { valid: false, error: 'Arquivo muito grande (máx 50MB)' };
    }

    return { valid: true };
};
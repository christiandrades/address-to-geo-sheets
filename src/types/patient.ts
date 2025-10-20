export interface PatientData {
  Nome: string;
  'Data de nascimento': string;
  Idade: string;
  Sexo: string;
  CPF: string;
  CNS: string;
  'Telefone celular': string;
  Microárea: string;
  Rua: string;
  Número: string;
  Complemento: string;
  Bairro: string;
  Município: string;
  UF: string;
  CEP: string;
  Comorbidade: string;
  UBS: string;
  ESF: string;
  latitude?: number;
  longitude?: number;
  enderecoCompleto?: string;
  geocodingStatus?: 'pending' | 'success' | 'error';
  matchLevel?: string;
  [key: string]: any; // Permite campos dinâmicos
}

export interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
  matchLevel?: string;
  fullAddress?: any;
  success?: boolean;
  error?: string;
  originalData?: any;
}

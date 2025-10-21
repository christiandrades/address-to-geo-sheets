import { GeocodingResult } from '@/types/patient';

// Limite de recursos por arquivo KML (Google Earth aceita até 10.000)
const MAX_FEATURES_PER_FILE = 9000;

/**
 * Gera arquivo KML compatível com Google Earth
 * @param results - Resultados da geocodificação
 * @param filename - Nome do arquivo KML
 * @param batchNumber - Número do lote (para arquivos divididos)
 * @param totalBatches - Total de lotes
 */
export const generateKML = (results: GeocodingResult[], batchNumber: number = 1, totalBatches: number = 1): string => {
  const successResults = results.filter(r => r.success && r.lat !== 0 && r.lon !== 0);
  const failedResults = results.filter(r => !r.success || r.lat === 0 || r.lon === 0);

  const batchInfo = totalBatches > 1 ? ` (Parte ${batchNumber} de ${totalBatches})` : '';

  const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Geocodificação${batchInfo} - ${new Date().toLocaleDateString('pt-BR')}</name>
    <description>Resultados da geocodificação de ${results.length} endereços${batchInfo}. Sucessos: ${successResults.length}, Falhas: ${failedResults.length}</description>
    
    <!-- Estilos -->
    <Style id="successIcon">
      <IconStyle>
        <color>ff00ff00</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/pushpin/grn-pushpin.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0.9</scale>
      </LabelStyle>
    </Style>
    
    <Style id="failedIcon">
      <IconStyle>
        <color>ff0000ff</color>
        <scale>1.0</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/pushpin/red-pushpin.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0.8</scale>
      </LabelStyle>
    </Style>
    
    <!-- Placemarks de Sucesso -->
    <Folder>
      <name>Endereços Geocodificados (${successResults.length})</name>
      <open>1</open>`;

  // Placemarks de sucesso
  const successPlacemarks = successResults.map((result, index) => {
    const name = result.originalData?.Nome || result.originalData?.rua || `Ponto ${index + 1}`;
    const description = createDescription(result, true);

    return `
      <Placemark>
        <name>${escapeXml(name)}</name>
        <description><![CDATA[${description}]]></description>
        <styleUrl>#successIcon</styleUrl>
        <Point>
          <coordinates>${result.lon},${result.lat},0</coordinates>
        </Point>
      </Placemark>`;
  }).join('');

  const middleSection = `
    </Folder>
    
    <!-- Placemarks com Falha -->
    <Folder>
      <name>Endereços com Falha (${failedResults.length})</name>
      <open>0</open>`;

  // Placemarks de falha
  const failedPlacemarks = failedResults.map((result, index) => {
    const name = result.originalData?.Nome || result.display_name || `Falha ${index + 1}`;
    const description = createDescription(result, false);

    return `
      <Placemark>
        <name>${escapeXml(name)}</name>
        <description><![CDATA[${description}]]></description>
        <styleUrl>#failedIcon</styleUrl>
        <ExtendedData>
          <Data name="status">
            <value>failed</value>
          </Data>
          <Data name="matchLevel">
            <value>${result.matchLevel || 'no_match'}</value>
          </Data>
        </ExtendedData>
      </Placemark>`;
  }).join('');

  const kmlFooter = `
    </Folder>
  </Document>
</kml>`;

  return kmlHeader + successPlacemarks + middleSection + failedPlacemarks + kmlFooter;
};

/**
 * Cria descrição HTML para o placemark
 */
function createDescription(result: GeocodingResult, isSuccess: boolean): string {
  const data = result.originalData || {};

  let html = '<div style="font-family: Arial, sans-serif; font-size: 12px;">';

  // Status
  if (isSuccess) {
    html += '<p style="color: green; font-weight: bold;">✅ Geocodificação bem-sucedida</p>';
  } else {
    html += '<p style="color: red; font-weight: bold;">❌ Falha na geocodificação</p>';
    html += `<p><strong>Motivo:</strong> ${result.matchLevel || 'Endereço não encontrado'}</p>`;
    if (result.error) {
      html += `<p><strong>Erro:</strong> ${result.error}</p>`;
    }
  }

  // Coordenadas
  if (isSuccess) {
    html += `<p><strong>Coordenadas:</strong> ${result.lat.toFixed(6)}, ${result.lon.toFixed(6)}</p>`;
    html += `<p><strong>Match Level:</strong> ${result.matchLevel || 'N/A'}</p>`;
  }

  // Endereço
  html += '<hr style="margin: 10px 0;">';
  html += '<p style="font-weight: bold;">Endereço Original:</p>';

  if (data.Rua || data.rua) {
    html += `<p><strong>Rua:</strong> ${data.Rua || data.rua}</p>`;
  }
  if (data.Número || data.numero) {
    html += `<p><strong>Número:</strong> ${data.Número || data.numero}</p>`;
  }
  if (data.Bairro || data.bairro) {
    html += `<p><strong>Bairro:</strong> ${data.Bairro || data.bairro}</p>`;
  }
  if (data.Município || data.cidade) {
    html += `<p><strong>Cidade:</strong> ${data.Município || data.cidade}</p>`;
  }
  if (data.UF || data.uf) {
    html += `<p><strong>UF:</strong> ${data.UF || data.uf}</p>`;
  }
  if (data.CEP || data.cep) {
    html += `<p><strong>CEP:</strong> ${data.CEP || data.cep}</p>`;
  }

  // Dados adicionais
  if (data.Nome) {
    html += '<hr style="margin: 10px 0;">';
    html += `<p><strong>Nome:</strong> ${data.Nome}</p>`;
  }
  if (data.CPF) {
    html += `<p><strong>CPF:</strong> ${data.CPF}</p>`;
  }
  if (data.Comorbidade) {
    html += `<p><strong>Comorbidade:</strong> ${data.Comorbidade}</p>`;
  }
  if (data.UBS) {
    html += `<p><strong>UBS:</strong> ${data.UBS}</p>`;
  }

  // Endereço completo retornado
  if (isSuccess && result.display_name) {
    html += '<hr style="margin: 10px 0;">';
    html += '<p style="font-weight: bold;">Endereço Encontrado:</p>';
    html += `<p>${result.display_name}</p>`;
  }

  html += '</div>';

  return html;
}

/**
 * Escapa caracteres especiais XML
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Faz download do arquivo KML
 */
export const downloadKML = (kmlContent: string, filename: string = 'geocoded_addresses.kml') => {
  const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Cria arquivo ZIP com múltiplos KMLs (para grandes volumes de dados)
 */
export const downloadMultipleKMLsAsZip = async (results: GeocodingResult[], baseFilename?: string) => {
  const totalResults = results.length;
  const totalBatches = Math.ceil(totalResults / MAX_FEATURES_PER_FILE);
  const baseName = baseFilename ? baseFilename.replace('.kml', '') : `geocoded_${new Date().toISOString().split('T')[0]}`;

  // Criar um objeto para armazenar os arquivos
  const kmlFiles: { filename: string; content: string }[] = [];

  for (let i = 0; i < totalBatches; i++) {
    const start = i * MAX_FEATURES_PER_FILE;
    const end = Math.min(start + MAX_FEATURES_PER_FILE, totalResults);
    const batchResults = results.slice(start, end);
    const batchNumber = i + 1;

    const kmlContent = generateKML(batchResults, batchNumber, totalBatches);
    const filename = `${baseName}_parte${batchNumber}_de_${totalBatches}.kml`;

    kmlFiles.push({ filename, content: kmlContent });
  }

  // Criar um README com instruções
  const readme = `INSTRUÇÕES PARA IMPORTAÇÃO NO GOOGLE EARTH

Total de Recursos: ${totalResults}
Arquivos KML: ${totalBatches}

Como importar:
1. Extraia este arquivo ZIP
2. Importe cada arquivo .kml separadamente no Google Earth
3. Cada arquivo contém até ${MAX_FEATURES_PER_FILE} recursos

Arquivos incluídos:
${kmlFiles.map(f => `- ${f.filename}`).join('\n')}

Data de Exportação: ${new Date().toLocaleString('pt-BR')}
`;

  kmlFiles.push({ filename: 'LEIA-ME.txt', content: readme });

  return kmlFiles;
};

/**
 * Gera e baixa KML em uma única chamada
 */
export const exportToKML = (results: GeocodingResult[], filename?: string) => {
  const totalResults = results.length;

  // Se os resultados cabem em um único arquivo
  if (totalResults <= MAX_FEATURES_PER_FILE) {
    const kmlContent = generateKML(results);
    const finalFilename = filename || `geocoded_${new Date().toISOString().split('T')[0]}.kml`;
    downloadKML(kmlContent, finalFilename);

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ KML exportado: ${successCount}/${results.length} endereços geocodificados`);
    return;
  }

  // Dividir em múltiplos arquivos
  const totalBatches = Math.ceil(totalResults / MAX_FEATURES_PER_FILE);
  const baseFilename = filename ? filename.replace('.kml', '') : `geocoded_${new Date().toISOString().split('T')[0]}`;

  console.log(`📦 Dividindo ${totalResults} recursos em ${totalBatches} arquivos KML...`);

  // Download das instruções primeiro
  downloadInstructions(totalBatches, totalResults, baseFilename);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * MAX_FEATURES_PER_FILE;
    const end = Math.min(start + MAX_FEATURES_PER_FILE, totalResults);
    const batchResults = results.slice(start, end);
    const batchNumber = i + 1;

    const kmlContent = generateKML(batchResults, batchNumber, totalBatches);
    const batchFilename = `${baseFilename}_parte${batchNumber}_de_${totalBatches}.kml`;

    downloadKML(kmlContent, batchFilename);

    const successCount = batchResults.filter(r => r.success).length;
    console.log(`✅ Parte ${batchNumber}/${totalBatches} exportada: ${successCount}/${batchResults.length} endereços (${start + 1}-${end})`);
  }

  const totalSuccess = results.filter(r => r.success).length;
  console.log(`\n✨ Exportação completa! ${totalSuccess}/${totalResults} endereços geocodificados em ${totalBatches} arquivos.`);
};

/**
 * Baixa arquivo de instruções para múltiplos KMLs
 */
const downloadInstructions = (totalBatches: number, totalResults: number, baseFilename: string) => {
  const instructions = `╔══════════════════════════════════════════════════════════════════╗
║         INSTRUÇÕES - IMPORTAÇÃO DE MÚLTIPLOS ARQUIVOS KML        ║
╚══════════════════════════════════════════════════════════════════╝

📊 INFORMAÇÕES DA EXPORTAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total de Recursos:     ${totalResults.toLocaleString('pt-BR')}
Arquivos Gerados:      ${totalBatches}
Recursos por Arquivo:  Até ${MAX_FEATURES_PER_FILE.toLocaleString('pt-BR')}
Data de Exportação:    ${new Date().toLocaleString('pt-BR')}

📁 ARQUIVOS INCLUÍDOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${Array.from({ length: totalBatches }, (_, i) =>
    `  ${i + 1}. ${baseFilename}_parte${i + 1}_de_${totalBatches}.kml`
  ).join('\n')}

🌍 COMO IMPORTAR NO GOOGLE EARTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GOOGLE EARTH DESKTOP:
  1. Abra o Google Earth Desktop
  2. Vá em: Arquivo → Abrir
  3. Selecione o primeiro arquivo KML
  4. Aguarde o carregamento completo
  5. Repita para cada arquivo restante

GOOGLE EARTH WEB (earth.google.com/web):
  1. Acesse o Google Earth Web
  2. Menu (☰) → Projetos → Novo projeto
  3. Clique em "Importar arquivo KML"
  4. Selecione um arquivo por vez
  5. Aguarde a importação completar antes do próximo

⚠️ IMPORTANTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Importe cada arquivo SEPARADAMENTE
• Aguarde o carregamento completo entre arquivos
• Os arquivos aparecerão como camadas independentes
• Você pode ativar/desativar cada camada no painel "Locais"

💡 DICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Se o Google Earth travar, feche outros projetos primeiro
• Para grandes volumes, use o Google Earth Desktop (mais robusto)
• Organize as camadas por nome para facilitar a visualização
• Use a função de zoom automático (duplo clique na camada)

📖 ESTRUTURA DOS ARQUIVOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cada arquivo KML contém duas pastas:

  📍 Endereços Geocodificados (Ícones Verdes)
     - Pontos com geocodificação bem-sucedida
     - Coordenadas precisas
     - Informações completas do endereço

  📍 Endereços com Falha (Ícones Vermelhos)
     - Endereços que não foram localizados
     - Informações do erro
     - Dados originais preservados

🔍 INFORMAÇÕES POR PONTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ao clicar em um ponto, você verá:
  • Nome/Identificador
  • Coordenadas geográficas
  • Endereço original completo
  • Endereço encontrado pelo geocodificador
  • Nível de precisão (match level)
  • Dados adicionais (CPF, UBS, Comorbidade, etc.)

❓ PROBLEMAS COMUNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Problema: "Memória insuficiente"
Solução: Use o Google Earth Desktop ou importe menos arquivos

Problema: Aplicação trava
Solução: Feche outros projetos e tente novamente

Problema: Pontos não aparecem
Solução: Verifique se a camada está ativada e dê zoom out

📚 DOCUMENTAÇÃO COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para mais detalhes, consulte o arquivo EXPORTACAO_KML.md no projeto.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏥 GeoSaúde UFAL | Sistema de Geocodificação de Endereços de Saúde
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  const blob = new Blob([instructions], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${baseFilename}_INSTRUCOES.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('📄 Arquivo de instruções baixado');
};
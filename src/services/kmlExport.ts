import { GeocodingResult } from '@/types/patient';

/**
 * Gera arquivo KML compatível com Google Earth
 * @param results - Resultados da geocodificação
 * @param filename - Nome do arquivo KML
 */
export const generateKML = (results: GeocodingResult[]): string => {
    const successResults = results.filter(r => r.success && r.lat !== 0 && r.lon !== 0);
    const failedResults = results.filter(r => !r.success || r.lat === 0 || r.lon === 0);

    const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Geocodificação - ${new Date().toLocaleDateString('pt-BR')}</name>
    <description>Resultados da geocodificação de ${results.length} endereços. Sucessos: ${successResults.length}, Falhas: ${failedResults.length}</description>
    
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
 * Gera e baixa KML em uma única chamada
 */
export const exportToKML = (results: GeocodingResult[], filename?: string) => {
    const kmlContent = generateKML(results);
    const finalFilename = filename || `geocoded_${new Date().toISOString().split('T')[0]}.kml`;
    downloadKML(kmlContent, finalFilename);

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ KML exportado: ${successCount}/${results.length} endereços geocodificados`);
};
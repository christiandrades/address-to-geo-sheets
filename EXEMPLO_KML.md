# 📄 Exemplo de KML Gerado

## Estrutura do Arquivo

O sistema gera um arquivo KML (Keyhole Markup Language) compatível com Google Earth contendo:

- ✅ Pontos geocodificados com sucesso (ícones verdes)
- ❌ Pontos que falharam na geocodificação (ícones vermelhos)
- 📋 Dados completos de cada endereço
- 🎨 Estilos personalizados para visualização

## Exemplo Completo

```xml
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Geocodificação - 09/10/2025</name>
    <description>Resultados da geocodificação de 100 endereços. Sucessos: 95, Falhas: 5</description>
    
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
    
    <!-- Pasta de Sucessos -->
    <Folder>
      <name>Endereços Geocodificados (95)</name>
      <open>1</open>
      
      <!-- Exemplo de Placemark Bem-Sucedido -->
      <Placemark>
        <name>ANA LUCIA RODRIGUES DA SILVA</name>
        <description><![CDATA[
          <div style="font-family: Arial, sans-serif; font-size: 12px;">
            <p style="color: green; font-weight: bold;">✅ Geocodificação bem-sucedida</p>
            <p><strong>Coordenadas:</strong> -9.747500, -36.661100</p>
            <p><strong>Match Level:</strong> houseNumber</p>
            <hr style="margin: 10px 0;">
            <p style="font-weight: bold;">Endereço Original:</p>
            <p><strong>Rua:</strong> Jurandir andré</p>
            <p><strong>Número:</strong> 05</p>
            <p><strong>Bairro:</strong> SÃO LUIZ I</p>
            <p><strong>Cidade:</strong> Arapiraca</p>
            <p><strong>UF:</strong> AL</p>
            <p><strong>CEP:</strong> 57301-310</p>
            <hr style="margin: 10px 0;">
            <p><strong>Nome:</strong> ANA LUCIA RODRIGUES DA SILVA</p>
            <p><strong>CPF:</strong> 384.489.714-34</p>
            <p><strong>Comorbidade:</strong> DIABETES</p>
            <p><strong>UBS:</strong> 1 CENTRO</p>
            <hr style="margin: 10px 0;">
            <p style="font-weight: bold;">Endereço Encontrado:</p>
            <p>Rua Jurandir André, 5 - São Luiz I, Arapiraca - AL, 57301-310, Brasil</p>
          </div>
        ]]></description>
        <styleUrl>#successIcon</styleUrl>
        <Point>
          <coordinates>-36.661100,-9.747500,0</coordinates>
        </Point>
      </Placemark>
      
      <!-- Mais placemarks... -->
      
    </Folder>
    
    <!-- Pasta de Falhas -->
    <Folder>
      <name>Endereços com Falha (5)</name>
      <open>0</open>
      
      <!-- Exemplo de Placemark com Falha -->
      <Placemark>
        <name>Endereço Incompleto</name>
        <description><![CDATA[
          <div style="font-family: Arial, sans-serif; font-size: 12px;">
            <p style="color: red; font-weight: bold;">❌ Falha na geocodificação</p>
            <p><strong>Motivo:</strong> no_match</p>
            <hr style="margin: 10px 0;">
            <p style="font-weight: bold;">Endereço Original:</p>
            <p><strong>Rua:</strong> Rua Inexistente</p>
            <p><strong>Número:</strong> 999</p>
            <p><strong>Bairro:</strong> Bairro Desconhecido</p>
            <p><strong>Cidade:</strong> Arapiraca</p>
            <p><strong>UF:</strong> AL</p>
            <p><strong>CEP:</strong> 00000-000</p>
          </div>
        ]]></description>
        <styleUrl>#failedIcon</styleUrl>
        <ExtendedData>
          <Data name="status">
            <value>failed</value>
          </Data>
          <Data name="matchLevel">
            <value>no_match</value>
          </Data>
        </ExtendedData>
      </Placemark>
      
    </Folder>
    
  </Document>
</kml>
```

## Elementos do KML

### Document

Contêiner principal do arquivo:

- `<name>` - Nome do arquivo (inclui data)
- `<description>` - Resumo com estatísticas

### Style

Define aparência dos ícones:

**successIcon** (Sucesso):

- Cor: Verde (`ff00ff00`)
- Escala: 1.2x
- Ícone: Pin verde

**failedIcon** (Falha):

- Cor: Vermelho (`ff0000ff`)
- Escala: 1.0x
- Ícone: Pin vermelho

### Folder

Agrupa placemarks por tipo:

- "Endereços Geocodificados" - Sucessos
- "Endereços com Falha" - Falhas

### Placemark

Cada ponto no mapa:

**Campos:**

- `<name>` - Nome do paciente ou identificador
- `<description>` - HTML com todos os dados
- `<styleUrl>` - Referência ao estilo
- `<Point><coordinates>` - lon, lat, altitude

**Descrição HTML:**

- Status (✅/❌)
- Coordenadas (se sucesso)
- Match level (precisão)
- Endereço original completo
- Dados extras (CPF, Nome, etc)
- Endereço encontrado pela API

### Match Levels

Níveis de precisão retornados pela HERE API:

| Match Level | Significado |
|-------------|-------------|
| `houseNumber` | Endereço exato (número da casa) |
| `street` | Rua encontrada, número aproximado |
| `district` | Apenas bairro identificado |
| `city` | Apenas cidade identificada |
| `postalCode` | Apenas CEP identificado |
| `no_match` | Nenhum resultado encontrado |
| `error` | Erro na requisição |

## Cores no KML

Formato: `AABBGGRR` (Alpha, Blue, Green, Red)

```text
ff00ff00 = Verde (opaco)
ff0000ff = Vermelho (opaco)
ffffff00 = Amarelo (opaco)
ff00ffff = Ciano (opaco)
80ffffff = Branco (semi-transparente)
```

## Coordenadas

Formato: `longitude,latitude,altitude`

Exemplo:

```xml
<coordinates>-36.661100,-9.747500,0</coordinates>
```

**Importante:**

- Longitude vem ANTES da latitude
- Valores negativos = Sul/Oeste
- Altitude geralmente é 0

## Visualização no Google Earth

### Organização

```text
📁 Geocodificação - 09/10/2025
  ├── 📂 Endereços Geocodificados (95) ✓
  │   ├── 📍 ANA LUCIA RODRIGUES DA SILVA
  │   ├── 📍 ARNALDO BARBOSA DE MELO
  │   └── ...
  └── 📂 Endereços com Falha (5) ✗
      ├── 📍 Endereço Incompleto
      └── ...
```

### Ações Disponíveis

1. **Clicar em pasta** - Expandir/recolher
2. **Clicar em ponto** - Ver descrição
3. **Duplo-clique** - Voar até o ponto
4. **Checkbox** - Mostrar/ocultar
5. **Botão direito** - Opções (exportar, editar, etc)

## Customizações Possíveis

### Trocar Ícones

Edite `src/services/kmlExport.ts`:

```typescript
// Ícones disponíveis no Google:
// http://maps.google.com/mapfiles/kml/pushpin/
//   - grn-pushpin.png (verde)
//   - red-pushpin.png (vermelho)
//   - ylw-pushpin.png (amarelo)
//   - blue-pushpin.png (azul)
//   - pink-pushpin.png (rosa)
//   - wht-pushpin.png (branco)
```

### Adicionar Campos

Edite função `createDescription()`:

```typescript
if (data.SeuCampoPersonalizado) {
  html += `<p><strong>Seu Campo:</strong> ${data.SeuCampoPersonalizado}</p>`;
}
```

### Alterar Cores

```typescript
<IconStyle>
  <color>ffAABBGGRR</color> <!-- Seu código de cor -->
</IconStyle>
```

## Validação do KML

Ferramentas para validar KML:

1. **Google Earth** - Abre e valida automaticamente
2. **KML Validator** - [developers.google.com/kml/documentation](https://developers.google.com/kml/documentation)
3. **Online Tools** - [kmlvalidator.com](http://www.kmlvalidator.com)

## Limitações

- **Tamanho máximo:** ~10MB recomendado
- **Pontos máximos:** ~10.000 (performance)
- **HTML na descrição:** Tags limitadas
- **Imagens externas:** Devem ser URLs públicas

## Referências

- [KML Tutorial](https://developers.google.com/kml/documentation/kml_tut)
- [KML Reference](https://developers.google.com/kml/documentation/kmlreference)
- [Google Earth User Guide](https://support.google.com/earth)

---

**Arquivo gerado por:** Sistema de Geocodificação Automática com HERE API

# 📍 Guia de Exportação KML

## Problema Resolvido

O Google Earth possui um limite de **10.000 recursos por importação**. Quando você tenta importar um arquivo KML muito grande, recebe o erro:

```
Falha na importação. Seu arquivo excedeu o limite de recursos (10.000 recursos por importação).
Reduza o número de recursos e tente novamente.
```

## Solução Implementada

A aplicação agora **divide automaticamente** os dados em múltiplos arquivos KML quando o total de recursos excede 9.000 (margem de segurança).

### Funcionamento

1. **Até 9.000 recursos**: Um único arquivo `.kml` é gerado
2. **Mais de 9.000 recursos**: Múltiplos arquivos são gerados automaticamente

### Exemplo

Se você tiver **25.000 recursos**:

- `dados_geocoded_parte1_de_3.kml` (9.000 recursos)
- `dados_geocoded_parte2_de_3.kml` (9.000 recursos)
- `dados_geocoded_parte3_de_3.kml` (7.000 recursos)

## Como Importar no Google Earth

### Google Earth Desktop

1. Abra o Google Earth Desktop
2. Vá em **Arquivo → Abrir**
3. Selecione o primeiro arquivo KML (`parte1_de_X.kml`)
4. Aguarde o carregamento completo
5. Repita para cada arquivo restante

**Dica**: Os arquivos aparecerão como camadas separadas no painel "Locais"

### Google Earth Web

1. Acesse [earth.google.com/web](https://earth.google.com/web)
2. Clique no ícone de **menu** (☰) → **Projetos**
3. Clique em **Novo projeto**
4. Clique em **Importar arquivo KML do computador**
5. Selecione o primeiro arquivo
6. Repita para cada arquivo adicional

**Importante**: Cada arquivo deve ser importado **separadamente**

## Estrutura dos Arquivos

Cada arquivo KML contém:

### Pastas Organizadas

- **Endereços Geocodificados**: Pontos com geocodificação bem-sucedida (📍 verde)
- **Endereços com Falha**: Pontos que falharam na geocodificação (📍 vermelho)

### Informações por Ponto

- Nome/Identificador
- Coordenadas (lat/lon)
- Endereço original completo
- Endereço encontrado
- Match level (precisão)
- Dados adicionais (Nome, CPF, UBS, etc.)

## Limites e Recomendações

| Situação | Limite | Ação |
|----------|--------|------|
| Total de recursos | < 9.000 | ✅ Arquivo único |
| Total de recursos | 9.000 - 90.000 | ⚠️ Múltiplos arquivos (até 10) |
| Total de recursos | > 90.000 | 🚨 Considere filtrar por região |

### Dicas para Grandes Volumes

Se você tem muitos dados (>50.000 recursos):

1. **Filtre por Município**: Exporte dados de cada cidade separadamente
2. **Filtre por UBS**: Crie arquivos por unidade de saúde
3. **Filtre por Data**: Divida por períodos temporais
4. **Use Camadas**: No Google Earth, organize por temas

## Solução de Problemas

### Google Earth trava ao abrir

**Causa**: Arquivo muito grande ou muitos arquivos abertos
**Solução**:

- Feche outros projetos no Google Earth
- Importe um arquivo por vez
- Reinicie o Google Earth entre importações

### "Memória insuficiente"

**Causa**: Limite de memória do navegador (Earth Web)
**Solução**:

- Use o Google Earth Desktop (mais robusto)
- Feche outras abas do navegador
- Importe menos arquivos simultaneamente

### Pontos não aparecem

**Causa**: Zoom inadequado ou camada desativada
**Solução**:

- Verifique se a camada está ativada no painel "Locais"
- Dê zoom out para ver todos os pontos
- Clique duas vezes na camada para centralizar

## Especificações Técnicas

### Formato KML

- Versão: KML 2.2
- Encoding: UTF-8
- Namespace: `http://www.opengis.net/kml/2.2`

### Estilos Aplicados

```xml
<!-- Sucesso -->
<Style id="successIcon">
  <IconStyle>
    <color>ff00ff00</color>  <!-- Verde -->
    <scale>1.2</scale>
    <Icon>grn-pushpin.png</Icon>
  </IconStyle>
</Style>

<!-- Falha -->
<Style id="failedIcon">
  <IconStyle>
    <color>ff0000ff</color>  <!-- Vermelho -->
    <scale>1.0</scale>
    <Icon>red-pushpin.png</Icon>
  </IconStyle>
</Style>
```

### Convenções de Nomenclatura

```
[nome_base]_parte[N]_de_[Total].kml
```

Exemplo:

```
relatorio_consolidado_parte1_de_3.kml
relatorio_consolidado_parte2_de_3.kml
relatorio_consolidado_parte3_de_3.kml
```

## Compatibilidade

| Software | Versão | Compatível |
|----------|--------|-----------|
| Google Earth Desktop | 7.x+ | ✅ Sim |
| Google Earth Pro | Todas | ✅ Sim |
| Google Earth Web | Atual | ✅ Sim |
| Google Maps | N/A | ⚠️ Limitado |
| QGIS | 3.x+ | ✅ Sim |
| ArcGIS | 10.x+ | ✅ Sim |

## Próximos Passos

Após importar os arquivos no Google Earth, você pode:

1. **Criar Tours**: Animações seguindo os pontos
2. **Adicionar Camadas**: Sobreponha dados de outras fontes
3. **Compartilhar**: Salve como projeto (.kml/.kmz)
4. **Análise Espacial**: Use ferramentas de medição e análise
5. **Exportar Imagens**: Capture visualizações para relatórios

## Suporte

Para mais informações sobre o Google Earth:

- [Documentação Oficial](https://www.google.com/earth/outreach/learn/)
- [Tutorial de KML](https://developers.google.com/kml/documentation/)
- [Fórum da Comunidade](https://support.google.com/earth/)

---

**Data de Atualização**: 21/10/2025
**Versão**: 2.0 (Suporte a múltiplos arquivos)

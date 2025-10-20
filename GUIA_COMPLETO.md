# 📖 Guia Completo de Uso

## 🎯 Visão Geral

Este sistema foi desenvolvido para geocodificar grandes volumes de endereços (até 55.593+) de forma **100% automática**, usando a **HERE Geocoding API** e gerando arquivos **KML** compatíveis com **Google Earth**.

## 🚀 Setup Inicial

### 1. Instalação Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/address-to-geo-sheets.git
cd address-to-geo-sheets

# Instale dependências
npm install

# Inicie servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:8080`

### 2. Configuração da API (Opcional)

A chave HERE API já está configurada, mas você pode trocar:

#### Opção A: Editar diretamente

```typescript
// src/services/hereGeocoding.ts
const HERE_API_KEY = 'sua-nova-chave-aqui';
```

#### Opção B: Usar variável de ambiente

```bash
# Crie arquivo .env na raiz
echo "VITE_HERE_API_KEY=sua-chave" > .env
```

## 📊 Preparando sua Planilha

### Formato CSV Recomendado

Crie um arquivo `dados.csv` com estas colunas:

```csv
nome,rua,numero,bairro,cidade,uf,cep
João Silva,Rua das Flores,123,Centro,São Paulo,SP,01310-100
Maria Santos,Av. Paulista,1000,Bela Vista,São Paulo,SP,01310-200
```

### Formato XLSX

Crie planilha Excel com as mesmas colunas acima.

### Colunas Aceitas (Sistema Detecta Automaticamente)

| Campo | Variações Aceitas |
|-------|-------------------|
| **Rua** | `rua`, `logradouro`, `endereco`, `endereço`, `street`, `address` |
| **Número** | `numero`, `número`, `num`, `n°`, `number` |
| **Bairro** | `bairro`, `neighborhood`, `distrito` |
| **Cidade** | `cidade`, `municipio`, `município`, `city` |
| **UF** | `uf`, `estado`, `state` |
| **CEP** | `cep`, `postal code`, `zip code` |

⚠️ **Importante:** O sistema é flexível com nomes de colunas, mas precisa encontrar pelo menos: `rua`, `cidade` e `uf`.

### Exemplo com Dados Reais

```csv
Nome,CPF,Rua,Número,Bairro,Município,UF,CEP,Comorbidade
ANA LUCIA RODRIGUES,384.489.714-34,Jurandir andré,05,SÃO LUIZ I,Arapiraca,AL,57301-310,DIABETES
ARNALDO BARBOSA,009.348.244-28,Menino alexandre,700,SÃO LUIZ I,Arapiraca,AL,57301-340,DIABETES
```

O sistema preserva **todos os campos** originais e adiciona `latitude` e `longitude`.

## 🎮 Passo a Passo de Uso

### Passo 1: Upload do Arquivo

1. Abra o sistema no navegador
2. Arraste seu arquivo CSV/XLSX para área de upload
3. OU clique para selecionar arquivo
4. Sistema valida e mostra quantos endereços foram detectados

**Validações Automáticas:**

- ✅ Formato do arquivo (CSV ou XLSX)
- ✅ Tamanho máximo (50MB)
- ✅ Colunas obrigatórias
- ✅ Dados válidos

### Passo 2: Geocodificação Automática

1. Clique no botão **"Iniciar Geocodificação Automática"**
2. Sistema processa TODOS os endereços sem parar
3. Acompanhe em tempo real:
   - Barra de progresso
   - Contador de sucessos/falhas
   - Tempo estimado

**O que acontece:**

- Sistema respeita limite de 5 req/s automaticamente
- Cada endereço é enviado para HERE API
- Retry automático em caso de erro 429 (rate limit)
- Resultados salvos em memória progressivamente

### Passo 3: Download do KML

1. Quando concluir, clique em **"Baixar KML (Google Earth)"**
2. Arquivo `.kml` é gerado e baixado automaticamente
3. Abra no Google Earth Pro

**Conteúdo do KML:**

- 🟢 **Ícones verdes** = Endereços geocodificados com sucesso
- 🔴 **Ícones vermelhos** = Endereços que falharam
- 📋 Cada ponto contém:
  - Nome
  - Coordenadas
  - Endereço original completo
  - Status da geocodificação
  - Match level (precisão)
  - Todos os campos extras da planilha

### Passo 4 (Opcional): Download da Planilha

1. Clique em **"Baixar Planilha com Coordenadas"**
2. Arquivo `.xlsx` é baixado
3. Abra no Excel/LibreOffice

**Colunas Adicionadas:**

- `latitude` - Coordenada decimal
- `longitude` - Coordenada decimal
- `endereco_encontrado` - Endereço retornado pela API
- `status` - "sucesso" ou "falha"
- `match_level` - Nível de precisão
- `erro` - Mensagem de erro (se houver)

## 🔍 Visualização no Google Earth

### Instalação do Google Earth Pro

1. Baixe gratuitamente: [google.com/earth/versions](https://www.google.com/earth/versions/)
2. Instale no seu computador
3. Abra o programa

### Importando o KML

#### Método 1: Arrastar e Soltar

- Arraste arquivo `.kml` para janela do Google Earth

#### Método 2: Menu Arquivo

- File → Open → Selecione o `.kml`

### Navegando pelos Pontos

1. No painel esquerdo, expanda a pasta "Endereços Geocodificados"
2. Clique em qualquer ponto para centralizar no mapa
3. Clique no ícone para ver detalhes em popup

### Filtros e Pastas

- **Pasta "Endereços Geocodificados"** - Somente sucessos
- **Pasta "Endereços com Falha"** - Endereços que não foram encontrados

Marque/desmarque checkboxes para mostrar/ocultar grupos.

## ⚡ Performance e Limites

### Estimativas de Tempo

| Quantidade | Tempo Aproximado |
|------------|------------------|
| 100 endereços | 20 segundos |
| 1.000 endereços | 3,3 minutos |
| 10.000 endereços | 33 minutos |
| 55.593 endereços | **~3 horas** |

**Cálculo:** `tempo = (quantidade / 5) segundos`

### Limites da HERE API

- **250.000 requisições/mês** (gratuito)
- **5 requisições/segundo** (controlado automaticamente)
- **Retry automático** para erros temporários

### Dicas para Grandes Volumes

1. **Não feche o navegador** durante o processo
2. **Mantenha computador ligado** (desabilite suspensão)
3. **Conexão estável** de internet
4. **Processe em horários de baixa demanda** (noite/madrugada)

## 🐛 Resolução de Problemas

### Erro: "Nenhum endereço válido encontrado"

**Causas:**

- Colunas com nomes não reconhecidos
- Arquivo vazio ou corrompido
- Separador errado no CSV

**Soluções:**

- Renomeie colunas para padrão: `rua`, `cidade`, `uf`, `cep`
- Use separador `,` (vírgula) no CSV
- Salve Excel como "CSV UTF-8"

### Geocodificação Muito Lenta

**Isso é normal!** 5 req/s é o máximo permitido pela API.

**Para acelerar:**

- ❌ Não há como acelerar sem violar termos da API
- ✅ Processe durante a noite
- ✅ Use plano pago da HERE (limites maiores)

### Alguns Endereços Falharam

**Causas comuns:**

- Endereço incompleto ou incorreto
- Rua não existe no cadastro HERE
- Número errado ou inexistente

**Soluções:**

- Verifique endereços manualmente
- Complete informações faltantes
- Use CEP correto

### KML Não Abre no Google Earth

**Verifique:**

- ✅ Arquivo tem extensão `.kml`
- ✅ Google Earth Pro instalado
- ✅ Versão atualizada do Google Earth

**Tente:**

- Arrastar arquivo para janela do programa
- File → Open → Selecionar arquivo
- Renomear arquivo removendo caracteres especiais

### Erro 429 (Rate Limit)

Sistema faz **retry automático**. Aguarde 1 segundo e continua.

Se persistir:

- Pode ter atingido limite mensal (250k/mês)
- Obtenha nova API key gratuita
- Aguarde início do próximo mês

## 🔧 Manutenção e Customização

### Trocar Ícones no KML

Edite `src/services/kmlExport.ts`:

```typescript
// Linha ~25 - Ícone de sucesso
<Icon>
  <href>http://maps.google.com/mapfiles/kml/pushpin/grn-pushpin.png</href>
</Icon>

// Linha ~35 - Ícone de falha
<Icon>
  <href>http://maps.google.com/mapfiles/kml/pushpin/red-pushpin.png</href>
</Icon>
```

**Opções de ícones:**

- `grn-pushpin.png` (verde)
- `red-pushpin.png` (vermelho)
- `ylw-pushpin.png` (amarelo)
- `blue-pushpin.png` (azul)

### Adicionar Mais Campos ao KML

Edite função `createDescription()` em `src/services/kmlExport.ts`:

```typescript
if (data.SeuCampo) {
  html += `<p><strong>Seu Campo:</strong> ${data.SeuCampo}</p>`;
}
```

### Alterar Rate Limit

Edite `src/services/hereGeocoding.ts`:

```typescript
const RATE_LIMIT = 5; // Altere aqui (máx recomendado: 5)
```

⚠️ **Atenção:** Valores acima de 5 podem resultar em bloqueio da API.

## 📈 Monitoramento

### Logs no Console

Abra DevTools (F12) → Console para ver:

```text
Iniciando geocodificação de 100 endereços...
[1/100] Geocodificando: Rua das Flores, 123, Centro...
✓ Sucesso com HERE Maps
Progresso: 10/100 (4.98 req/s)
...
Geocodificação concluída! Sucessos: 95/100
```

### Estatísticas em Tempo Real

Interface mostra cards com:

- 📊 **Total** - Quantidade de endereços
- ✅ **Sucessos** - Geocodificados com sucesso
- ❌ **Falhas** - Não encontrados
- ⏱️ **Tempo Estimado** - Baseado em 5 req/s

## 🚀 Deploy em Produção

### Vercel (Grátis)

```bash
# Instale CLI
npm i -g vercel

# Faça login
vercel login

# Deploy
vercel --prod
```

Acesse URL gerada (ex: `https://seu-projeto.vercel.app`)

### Netlify

```bash
# Build local
npm run build

# Deploy via CLI
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### GitHub Pages

```bash
# Build
npm run build

# Deploy
npm i -g gh-pages
gh-pages -d dist
```

Configure repositório: Settings → Pages → Source: gh-pages branch

## 📞 Suporte

**Problemas técnicos:**

- Abra issue no GitHub com logs do console

**Dúvidas sobre HERE API:**

- [Documentação Oficial](https://developer.here.com/documentation/geocoding-search-api)
- [Community Forum](https://community.here.com)

**Google Earth:**

- [KML Reference](https://developers.google.com/kml/documentation)
- [Earth Support](https://support.google.com/earth)

---

**Última atualização:** Outubro 2025

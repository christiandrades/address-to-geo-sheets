# Deploy no Vercel

## Passo 1: Instalar Vercel CLI

```bash
npm i -g vercel
```

## Passo 2: Login no Vercel

```bash
vercel login
```

## Passo 3: Deploy

```bash
# Na raiz do projeto
vercel --prod

# Ou para preview
vercel
```

## Passo 4: Configurar domínio (opcional)

```bash
vercel domains add seu-dominio.com
```

## Configurações do Vercel

O projeto já está configurado para deploy no Vercel. As seguintes configurações são aplicadas automaticamente:

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x ou superior

## Variáveis de Ambiente

Se precisar de variáveis de ambiente (como chaves de API), configure no painel do Vercel:

1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em Settings → Environment Variables
3. Adicione suas variáveis

## Otimizações

- Imagens são otimizadas automaticamente
- Code splitting ativo
- CDN Global: Distribuição automática
- SSL: Certificado gratuito incluído

## Troubleshooting

### Build falhando

```bash
# Teste localmente primeiro
npm run build
npm run preview
```

### Rotas não funcionando

Certifique-se que o `index.html` tem a configuração correta para SPA.

### Performance

- Imagens são otimizadas automaticamente
- Code splitting ativo
- Lazy loading de componentes

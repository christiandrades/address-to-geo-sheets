# 🚀 Deploy GitHub Pages - Instruções Finais

## ✅ Passos Concluídos Automaticamente

1. ✅ Configurado `vite.config.ts` com base path
2. ✅ Criado workflow GitHub Actions (`.github/workflows/deploy.yml`)
3. ✅ Inicializado repositório Git
4. ✅ Build testado com sucesso
5. ✅ Commit inicial criado

---

## 📋 Próximos Passos (FAÇA AGORA)

### 1️⃣ Criar Repositório no GitHub

Acesse: <https://github.com/new>

**Configure:**

- Repository name: `address-to-geo-sheets`
- Description: `Sistema de Geocodificação Automática - Christian Andrade`
- Visibility: **Public** (necessário para GitHub Pages grátis)
- ❌ NÃO marque "Add a README"
- ❌ NÃO marque "Add .gitignore"

Clique em **"Create repository"**

---

### 2️⃣ Conectar Repositório Local ao GitHub

No terminal, execute estes comandos (substitua SEU_USUARIO):

```bash
cd "f:\Dev\Projeto UFAL\address-to-geo-sheets"

# Conectar ao repositório remoto
git remote add origin https://github.com/SEU_USUARIO/address-to-geo-sheets.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push
git push -u origin main
```

**Exemplo com usuário "christianandrade":**

```bash
git remote add origin https://github.com/christianandrade/address-to-geo-sheets.git
git branch -M main
git push -u origin main
```

---

### 3️⃣ Configurar GitHub Pages

1. Vá para: `https://github.com/SEU_USUARIO/address-to-geo-sheets/settings/pages`

2. Em **"Source"**, selecione:
   - Source: **GitHub Actions**

3. Clique em **"Save"** (se aparecer)

---

### 4️⃣ Aguardar Deploy Automático

1. Vá para: `https://github.com/SEU_USUARIO/address-to-geo-sheets/actions`

2. Você verá um workflow chamado **"Deploy to GitHub Pages"** rodando

3. Aguarde ~2-3 minutos até aparecer ✅ verde

---

### 5️⃣ Acessar Sua Aplicação

Após o deploy concluir, acesse:

```text
https://SEU_USUARIO.github.io/address-to-geo-sheets/
```

**Exemplo:**

```text
https://christianandrade.github.io/address-to-geo-sheets/
```

---

## 🔄 Atualizações Futuras

Sempre que quiser fazer deploy de uma nova versão:

```bash
cd "f:\Dev\Projeto UFAL\address-to-geo-sheets"
git add .
git commit -m "Descrição das mudanças"
git push
```

O deploy será **automático** em ~2 minutos! ✨

---

## 🛠️ Comandos Prontos para Copiar

**Se seu usuário GitHub é "christianandrade":**

```bash
cd "f:\Dev\Projeto UFAL\address-to-geo-sheets"
git remote add origin https://github.com/christianandrade/address-to-geo-sheets.git
git branch -M main
git push -u origin main
```

**Se seu usuário GitHub é diferente, substitua "christianandrade" pelo seu.**

---

## 📊 Checklist Final

- [ ] Criar repositório no GitHub (público)
- [ ] Executar `git remote add origin ...`
- [ ] Executar `git push -u origin main`
- [ ] Configurar "Source" como "GitHub Actions" em Settings → Pages
- [ ] Aguardar workflow concluir
- [ ] Acessar URL: `https://SEU_USUARIO.github.io/address-to-geo-sheets/`

---

## 🎯 Resultado Esperado

Após completar os passos, sua aplicação estará:

✅ **Online 24/7** no GitHub Pages  
✅ **HTTPS grátis**  
✅ **CDN global**  
✅ **Deploy automático** a cada push  
✅ **Domínio gratuito** `.github.io`

---

## 🆘 Troubleshooting

### Se der erro de permissão no push

Você pode precisar autenticar. Use um dos métodos:

#### Opção 1: GitHub CLI

```bash
gh auth login
```

#### Opção 2: Personal Access Token

1. Vá em: <https://github.com/settings/tokens>
2. Generate new token (classic)
3. Marque: `repo`, `workflow`
4. Use o token como senha quando fizer push

#### Opção 3: SSH

```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -C "seu-email@example.com"

# Adicionar ao ssh-agent
ssh-add ~/.ssh/id_ed25519

# Adicionar chave pública ao GitHub
# Copie o conteúdo de: ~/.ssh/id_ed25519.pub
# Cole em: https://github.com/settings/ssh/new

# Usar SSH ao invés de HTTPS
git remote set-url origin git@github.com:SEU_USUARIO/address-to-geo-sheets.git
```

---

## 📝 Informações Técnicas

**Stack:**

- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- shadcn/ui
- HERE Geocoding API

**Build:**

- Output: `dist/`
- Base path: `/address-to-geo-sheets/`
- Code splitting: React + UI vendors

**Deploy:**

- Platform: GitHub Pages
- CI/CD: GitHub Actions
- Build time: ~5s
- Deploy time: ~2min

---

**Desenvolvido por Christian Andrade** 💙  
**Sistema de Geocodificação Automática v2.0**

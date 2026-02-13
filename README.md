# financeiro — Google Sheets -> data/data.json (automático)

Este pacote já vem **completo**: site + workflow do GitHub Actions para atualizar `data/data.json` direto do Google Sheets.

## Fonte (Google Sheets)
- Export XLSX: https://docs.google.com/spreadsheets/d/1gT0iBM9NiNGmmIgwS0QiJVQa6gmAdpQd/export?format=xlsx

⚠️ A planilha precisa estar pública:
**Compartilhar → Qualquer pessoa com o link → Leitor**

## Como subir no GitHub
1. Faça upload de **todos os arquivos** deste pacote na raiz do repositório (main).
2. Settings → Pages → Deploy from a branch → main / (root)
3. Actions → **Sync Google Sheets (XLSX -> data.json)** → Run workflow (para atualizar na hora)

## Permissões do Actions (importante)
Settings → Actions → General → Workflow permissions:
- ✅ Read and write permissions

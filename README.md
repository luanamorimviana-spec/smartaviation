# SmartAviation Site

Aplicação web com portfólio público, painel administrativo e backend Node.js para uploads e persistência local.

## Pré-requisitos
- Node.js 18+
- Git configurado com acesso ao repositório remoto (origin)

## Instalação
```
npm install
```

## Desenvolvimento
```
npm run dev
```
Servidor disponível em `http://localhost:3000`.

## Publicação automática no GitHub
Use o script `npm run publish` para adicionar, gerar commit e enviar tudo para o remoto configurado (`origin`).

```
npm run publish
```

É possível informar uma mensagem customizada:
```
npm run publish -- -Message "feat: nova seção"
```

O script ignora execuções quando não há alterações pendentes.

## Estrutura relevante
- `server.js`: API Express (uploads, login, conteúdo)
- `admin.html` / `admin.js`: painel administrativo
- `index.html` / `app.js`: site público
- `scripts/publish.ps1`: automação de push
- `data/data.json`: armazenamento local dos conteúdos

## Uploads
Arquivos enviados pelo painel são salvos em `uploads/` e disponibilizados via `/uploads/...`.

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

## Configuração do endpoint da API
O front-end procura pela variável global `window.SMART_API_CONFIG.apiBase` (arquivo `config.js`).
- Em desenvolvimento local, deixe `apiBase` vazio para usar `http://localhost:3000/api` (servido pelo Express).
- Em produção, defina o endereço do backend, incluindo `/api`, por exemplo:
  ```js
  window.SMART_API_CONFIG = { apiBase: 'https://seu-backend.com/api' };
  ```
  Você também pode usar `<meta name="smartaviation-api-base" content="https://seu-backend.com/api">` caso prefira configurar direto no HTML.

## Deploy sugerido
1. Faça deploy do backend (`server.js`) em um serviço que suporte Node (Render, Railway, Fly.io, VPS, etc.).
2. Atualize `config.js` (ou o meta) no front-end com a URL pública do backend.
3. Hospede os arquivos estáticos (`index.html`, `admin.html`, JS/CSS) em qualquer serviço de static hosting (Netlify, Vercel, GitHub Pages). Certifique-se de que os uploads enviados pelo painel tenham permissão de escrita no servidor escolhido.

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
- `config.js`: configurações opcionais para apontar o front-end para outro backend
- `scripts/publish.ps1`: automação de push
- `data/data.json`: armazenamento local dos conteúdos

## Uploads
Arquivos enviados pelo painel são salvos em `uploads/` e disponibilizados via `/uploads/...`.

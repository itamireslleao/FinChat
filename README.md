# FinChat — WhatsApp expense bot (FinChat)

Este é o pacote pronto do **FinChat**: um bot que registra gastos enviados por WhatsApp (ex: "Gastei 50 no Uber") usando **OpenAI + Twilio + Google Sheets**.

**O pacote não contém chaves**. Você deve colar suas chaves nas variáveis de ambiente no Render (ou no arquivo .env se for rodar localmente).

## Arquivos
- `server.js` — código principal (Express) que recebe mensagens, chama o OpenAI e salva na planilha.
- `googleSheet.js` — helper para gravar linhas no Google Sheets via service account.
- `package.json` — dependências.
- `.env.example` — exemplos de variáveis de ambiente.

---

## Passo a passo rápido (resumido)

### 1) Criar repositório no GitHub
1. Vá em https://github.com/new e crie um repositório chamado `FinChat` (public ok).
2. Faça upload dos arquivos deste projeto (ou descompacte o ZIP e use o desktop/Git).

### 2) Conectar Render ao GitHub (você já fez isso)
1. No Render, clique em **New → Web Service**.
2. Escolha o repositório `FinChat` e selecione `start` como comando.
3. Configure o build (usualmente `npm install` e `start`).

### 3) Variáveis de ambiente (no Render: Dashboard → Service → Environment)
Preencha todas as variáveis abaixo (não compartilhe estas chaves):
```
OPENAI_API_KEY
TWILIO_SID
TWILIO_TOKEN
TWILIO_NUMBER
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
SHEET_ID
```

### 4) Configurar Twilio WhatsApp Sandbox
1. No painel Twilio → Messaging → Try WhatsApp Sandbox.
2. Em "When a message comes in" cole: `https://<your-render-url>/webhook` (ex: https://finchat.onrender.com/webhook).
3. Salve. Envie a mensagem de teste do seu WhatsApp para o número do Sandbox ("join ...") e depois mande: `Gastei 50 no Uber`.

### 5) Configurar Google Sheets (service account)
1. Crie uma planilha no Google Sheets e nomeie a primeira aba como `Sheet1`.
2. Anote o ID da planilha (é a parte da URL entre `/d/` e `/edit`).
3. No Google Cloud Console, crie um **Service Account** e gere uma **JSON key**.
4. No painel do IAM, copie o **client_email** do service account e cole em `GOOGLE_SERVICE_ACCOUNT_EMAIL` no Render.
5. No Render, cole a **private_key** inteira (entre BEGIN/END) em `GOOGLE_PRIVATE_KEY` — substitua as novas linhas por `\n` (o README tem exemplo).
6. Compartilhe a planilha com o `client_email` (permissão Editor).
7. Defina `SHEET_ID` com o ID da sua planilha.

---

## Segurança — importante
- **NÃO** comite suas chaves no repositório público. Use variáveis de ambiente no Render.
- Se você já vazou uma chave em algum lugar público, regenere-a (OpenAI/Twilio) imediatamente.

---

## Rodando localmente (opcional)
1. Copie `.env.example` para `.env` e preencha os valores.
2. `npm install`
3. `node server.js`
4. Use ngrok ou similar para expor `http://localhost:3000/webhook` ao Twilio sandbox.

---

Se quiser, eu posso agora:
1. Gerar o ZIP com estes arquivos (já pronto) — **já gerei**
2. Te passar as instruções passo-a-passo para subir no GitHub + Render com prints e comandos simples.
3. Ajudar a criar a Service Account do Google (posso te fornecer os passos exatos).

Diga qual você prefere que eu faça agora!

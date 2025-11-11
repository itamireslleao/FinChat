import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
import { appendRow } from "./googleSheet.js";

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
const TWILIO_NUMBER = process.env.TWILIO_NUMBER; // ex: whatsapp:+14155238886

if (!OPENAI_API_KEY || !TWILIO_SID || !TWILIO_TOKEN || !TWILIO_NUMBER) {
  console.warn("⚠️ Warning: Missing required environment variables. See README.md for details.");
}

app.post("/webhook", async (req, res) => {
  try {
    const userMessage = req.body.Body || req.body.message || "";
    const from = req.body.From || req.body.from || "";
    console.log("Incoming:", from, userMessage);

    // Prompt for the LLM
    const prompt = `Você é um assistente financeiro simpático.
Receba frases como "Gastei 50 no Uber" e extraia: valor (número), categoria (transporte, alimentação, etc),
descrição (texto) e data (se não tiver, use hoje). Responda de modo curto e amigável e depois retorne uma linha pronta para inserir na planilha:
Formato da resposta (primeira linha = mensagem para o usuário, segunda linha = CSV para a planilha):
Mensagem: <texto para o usuário>
CSV: YYYY-MM-DD,valor,categoria,descrição
Exemplo:
Mensagem: Segurança primeiro, né? 🚗💜\n💰 R$50,00 | 🚕 Transporte | 📅 hoje
CSV: 2025-11-11,50,Transporte,Uber

Frase: "${userMessage}"`;

    // Call OpenAI
    const oresp = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 250,
      temperature: 0.1
    }, { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } });

    const botText = oresp.data.choices[0].message.content.trim();
    // Expecting two parts separated by a newline "CSV:" marker
    const lines = botText.split("\n").map(l => l.trim()).filter(Boolean);
    let replyMessage = botText;
    let csvLine = null;
    for (const l of lines) {
      if (l.toUpperCase().startsWith("CSV:")) {
        csvLine = l.slice(4).trim();
      } else if (replyMessage.length === 0) replyMessage = l;
    }

    // Fallback parsing if CSV not found: try to detect number and text
    if (!csvLine) {
      // simple regex parse
      const m = userMessage.replace(/,/g,'.').match(/([0-9]+(?:[.,][0-9]{1,2})?)/);
      const value = m ? m[1].replace(',', '.') : "";
      let category = "Outros";
      const textLower = userMessage.toLowerCase();
      if (/uber|ônibus|ônib|taxi|taxí|transporte/.test(textLower)) category = "Transporte";
      if (/supermercado|mercado|restaurante|lanchonete|comida|restô|padaria/.test(textLower)) category = "Alimentação";
      const desc = userMessage.replace(/.*?(no|na|no(a)?|em)\s+/i,"").slice(0,40);
      const today = new Date().toISOString().slice(0,10);
      csvLine = `${today},${value||0},${category},${desc||userMessage.slice(0,40)}`;
      replyMessage = replyMessage || `Ok! Registrei: R$${value||"0,00"} | ${category} | hoje`;
    }

    // Save to Google Sheet (if configured)
    try {
      if (process.env.SHEET_ID) {
        const parts = csvLine.split(",");
        await appendRow(parts); // date, value, category, description
        console.log("Saved to sheet:", parts);
      } else {
        console.log("SHEET_ID not set — skipping Google Sheets save.");
      }
    } catch (e) {
      console.error("Google Sheets error:", e.message || e);
    }

    // Send reply via Twilio
    if (TWILIO_SID && TWILIO_TOKEN) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
      const params = new URLSearchParams({
        From: TWILIO_NUMBER,
        To: from,
        Body: replyMessage
      });
      await axios.post(twilioUrl, params.toString(), {
        auth: { username: TWILIO_SID, password: TWILIO_TOKEN },
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
    } else {
      console.log("Twilio not configured — skipping outbound message.");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err.response?.data || err.message || err);
    res.status(500).send("error");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`FinChat rodando na porta ${port}`));

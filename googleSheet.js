import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
let sheetsClient = null;

function getClient() {
  if (sheetsClient) return sheetsClient;
  const client_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const private_key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!client_email || !private_key) {
    throw new Error("Missing Google service account credentials in env.");
  }
  const jwtClient = new google.auth.JWT(
    client_email,
    null,
    private_key,
    SCOPES
  );
  sheetsClient = google.sheets({ version: "v4", auth: jwtClient });
  return sheetsClient;
}

export async function appendRow([date, value, category, description]) {
  const sheets = getClient();
  const spreadsheetId = process.env.SHEET_ID;
  if (!spreadsheetId) throw new Error("SHEET_ID not set in environment.");
  const range = "Sheet1!A:D";
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[date, value, category, description]]
    }
  });
  return res.data;
}

/**
 * Baixa uma planilha do Google Sheets (XLSX) e converte para data/data.json
 * - Funciona em GitHub Actions (Node 20)
 * - Usa URL via env GOOGLE_SHEETS_XLSX_URL (recomendado) ou um padrão embutido.
 */
import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const DEFAULT_URL = "https://docs.google.com/spreadsheets/d/1gT0iBM9NiNGmmIgwS0QiJVQa6gmAdpQd/export?format=xlsx";
const SHEET_URL = process.env.GOOGLE_SHEETS_XLSX_URL || DEFAULT_URL;

const OUT_DIR = path.resolve("data");
const OUT_FILE = path.join(OUT_DIR, "data.json");

function assertOk(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function downloadArrayBuffer(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "github-actions-financeiro-sync",
      "accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*",
    },
  });
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);

  const isZip = buf.subarray(0, 2).toString("utf8") === "PK";
  if (!isZip) {
    const head = buf.subarray(0, 32).toString("utf8");
    const sample = buf.subarray(0, 200).toString("utf8").replace(/\s+/g, " ").trim();
    throw new Error(
      `Download não parece XLSX. Status=${res.status} CT=${ct}. ` +
      `Primeiros bytes="${head}". Amostra="${sample}".\n` +
      `Verifique se a planilha está pública: Compartilhar → Qualquer pessoa com o link → Leitor.`
    );
  }

  if (!res.ok) {
    throw new Error(`Falha ao baixar XLSX: status=${res.status} CT=${ct}.`);
  }
  return ab;
}

function sheetToJsonObjects(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

function workbookToData(wb) {
  const sheetNames = wb.SheetNames || [];
  const sheets = {};
  for (const name of sheetNames) {
    sheets[name] = sheetToJsonObjects(wb, name);
  }

  // primeira aba com linhas vira rows
  let rows = [];
  for (const name of sheetNames) {
    if (sheets[name] && sheets[name].length) {
      rows = sheets[name];
      break;
    }
  }

  return {
    meta: {
      source: "google-sheets-xlsx",
      url: SHEET_URL,
      updated_at: new Date().toISOString(),
      sheet_names: sheetNames,
    },
    rows,
    sheets,
  };
}

async function main() {
  console.log("SHEET_URL:", SHEET_URL);
  assertOk(typeof SHEET_URL === "string" && SHEET_URL.startsWith("http"), "GOOGLE_SHEETS_XLSX_URL inválida.");

  const ab = await downloadArrayBuffer(SHEET_URL);
  const wb = XLSX.read(Buffer.from(ab), { type: "buffer" });
  assertOk(wb && wb.SheetNames && wb.SheetNames.length, "Não foi possível ler nenhuma aba do XLSX.");

  const data = workbookToData(wb);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), "utf-8");
  console.log("Gerado:", OUT_FILE, "tamanho:", fs.statSync(OUT_FILE).size, "bytes");
}

main().catch((err) => {
  console.error("ERRO:", err?.message || err);
  process.exit(1);
});

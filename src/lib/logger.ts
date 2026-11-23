import winston from "winston";
import fs from "fs";
import path from "path";

const SENSITIVE_KEYS = new Set([
  "password",
  "senha",
  "pass",
  "smtp_pass",
  "cvv",
  "ccv",
  "securitycode",
  "cardnumber",
  "number",
  "token",
  "accesstoken",
  "refreshtoken",
  "apikey",
  "asaas_api_key",
  "authorization",
  "secret",
  "client_secret",
]);

/**
 * Mascara recursivamente campos sensíveis (senhas, cartões, CVV, tokens) antes de gravar nos logs
 */
export function redactSensitiveData(input: any, depth = 0): any {
  if (depth > 6 || input === null || input === undefined) return input;

  if (typeof input === "string") {
    // 1. Prevenir Log DoS / Disk Exhaustion truncando strings gigantes (ex: payload de 1MB)
    const bounded = input.length > 500 ? `${input.slice(0, 500)}...[TRUNCATED]` : input;
    // 2. Prevenir Log Injection / CRLF Forging removendo quebras de linha de inputs externos
    // 3. Mascarar possíveis sequências de 13 a 19 dígitos contínuos (cartão de crédito)
    return bounded
      .replace(/[\r\n]+/g, " ")
      .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_CARD]");
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item, depth + 1));
  }

  if (typeof input === "object") {
    const output: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      const normalizedKey = key.toLowerCase().replace(/[-_]/g, "");
      if (
        SENSITIVE_KEYS.has(key.toLowerCase()) ||
        SENSITIVE_KEYS.has(normalizedKey) ||
        normalizedKey.includes("password") ||
        normalizedKey.includes("secret") ||
        normalizedKey.includes("apikey") ||
        normalizedKey.includes("cvv")
      ) {
        output[key] = "[REDACTED]";
      } else {
        output[key] = redactSensitiveData(value, depth + 1);
      }
    }
    return output;
  }

  return input;
}

/**
 * Resolve o diretório de logs:
 * - Na VPS / Local: usa `<cwd>/logs`
 * - Em ambientes Serverless read-only (ex: Vercel): faz fallback automático para `/tmp/logs`
 */
export function resolveLogsDir(): string {
  const customDir = process.env.LOGS_DIR;
  const primaryDir = customDir ? path.resolve(customDir) : path.join(process.cwd(), "logs");

  try {
    if (!fs.existsSync(primaryDir)) {
      fs.mkdirSync(primaryDir, { recursive: true });
    }
    fs.accessSync(primaryDir, fs.constants.W_OK);
    return primaryDir;
  } catch {
    const fallbackDir = path.join("/tmp", "snapcase-logs");
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
    } catch {
      // Ignora se /tmp também não estiver disponível
    }
    return fallbackDir;
  }
}

const logsDir = resolveLogsDir();
export const COMBINED_LOG_PATH = path.join(logsDir, "combined.log");
export const ERROR_LOG_PATH = path.join(logsDir, "error.log");

// Formatador customizado do Winston para sanitizar metadados
const redactFormat = winston.format((info) => {
  const { level, message, timestamp, module, stack, ...meta } = info;
  const cleanMeta = redactSensitiveData(meta);
  for (const k of Object.keys(meta)) {
    delete info[k];
  }
  Object.assign(info, cleanMeta);
  if (typeof info.message === "string") {
    info.message = redactSensitiveData(info.message);
  }
  return info;
});

const fileLineFormat = winston.format.printf(({ timestamp, level, module, message, stack, ...meta }) => {
  const modTag = module ? `[${String(module).toUpperCase()}]` : "[APP]";
  const lvlTag = `[${String(level).toUpperCase()}]`;
  const metaKeys = Object.keys(meta);
  const metaStr = metaKeys.length > 0 ? ` | ${JSON.stringify(meta)}` : "";
  const stackStr = stack ? `\n  Stack: ${stack}` : "";
  return `[${timestamp}] ${lvlTag} ${modTag} ${message}${metaStr}${stackStr}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      fileLineFormat
    ),
  }),
];

try {
  transports.push(
    new winston.transports.File({
      filename: ERROR_LOG_PATH,
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5 MB por arquivo
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: COMBINED_LOG_PATH,
      level: "info",
      maxsize: 5 * 1024 * 1024, // 5 MB por arquivo
      maxFiles: 5,
    })
  );
} catch (err) {
  console.warn("Aviso: Não foi possível inicializar transporte de arquivo do Winston:", err);
}

export const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    redactFormat(),
    fileLineFormat
  ),
  transports,
});

export type LogModule =
  | "AUTH"
  | "ORDER"
  | "PAYMENT"
  | "WEBHOOK"
  | "SHIPPING"
  | "EMAIL"
  | "ADMIN"
  | "STORAGE"
  | "SECURITY";

export const logger = {
  info(module: LogModule, message: string, meta: Record<string, any> = {}) {
    winstonLogger.info(message, { module, ...meta });
  },
  warn(module: LogModule, message: string, meta: Record<string, any> = {}) {
    winstonLogger.warn(message, { module, ...meta });
  },
  error(module: LogModule, message: string, meta: Record<string, any> = {}) {
    if (meta.error instanceof Error) {
      winstonLogger.error(message, {
        module,
        errorMessage: meta.error.message,
        stack: meta.error.stack,
        ...meta,
        error: undefined,
      });
    } else {
      winstonLogger.error(message, { module, ...meta });
    }
  },
};


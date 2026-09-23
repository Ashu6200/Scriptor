import * as fs from "node:fs";
import * as path from "node:path";
import * as util from "node:util";
import pino from "pino";
import type { DestinationStream, LoggerOptions, Logger as PinoInstance } from "pino";
import pretty from "pino-pretty";

const isProd = process.env.NODE_ENV === "production";
const isNodeRuntime = process.env.NEXT_RUNTIME === "nodejs";

const isLoggingEnabled =
  process.env.ENABLE_LOGGING !== "false" &&
  process.env.LOG_ENABLED !== "false" &&
  process.env.LOG_LEVEL !== "silent";

const logLevel =
  process.env.LOG_LEVEL && process.env.LOG_LEVEL !== "silent"
    ? process.env.LOG_LEVEL
    : isProd
      ? "info"
      : "debug";

const logsDir = path.join(process.cwd(), "logs");
let localFileStream: fs.WriteStream | null = null;

if (!isProd && isNodeRuntime && isLoggingEnabled) {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    localFileStream = fs.createWriteStream(path.join(logsDir, "app.log"), { flags: "a" });
  } catch (error) {
    console.warn("[logger] Cannot create logs directory — local file stream disabled", error);
  }
}

function buildDestination(): DestinationStream {
  if (isProd) {
    return process.stdout;
  }

  const prettyStream = pretty({
    colorize: true,
    translateTime: "SYS:standard",
    ignore: "pid,hostname",
  });

  if (localFileStream) {
    return pino.multistream([{ stream: prettyStream }, { stream: localFileStream }]);
  }

  return prettyStream;
}

const pinoOptions: LoggerOptions = {
  level: logLevel,
  enabled: isLoggingEnabled,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
};

const basePino: PinoInstance = pino(pinoOptions, buildDestination());

class Logger {
  private pino: PinoInstance;
  private context?: string;

  constructor(pinoInstance: PinoInstance, context?: string) {
    this.pino = pinoInstance;
    this.context = context;
  }

  private formatArgs(message: string, args: unknown[]) {
    if (args.length === 0) {
      return { obj: undefined, msg: message };
    }
    if (args[0] instanceof Error) {
      const rest = args.slice(1);
      const suffix =
        rest.length > 0
          ? ` ${rest.map((a) => (typeof a === "object" ? util.inspect(a, { depth: 3 }) : a)).join(" ")}`
          : "";
      return { obj: { err: args[0] }, msg: `${message}${suffix}` };
    }
    if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
      return { obj: args[0] as Record<string, unknown>, msg: message };
    }
    const extra = args
      .map((a) => (typeof a === "object" ? util.inspect(a, { depth: 3 }) : a))
      .join(" ");
    return { obj: undefined, msg: `${message} ${extra}` };
  }

  debug(message: string, ...args: unknown[]): void {
    if (!isLoggingEnabled) return;
    const { obj, msg } = this.formatArgs(this.prefix(message), args);
    if (obj) this.pino.debug(obj, msg);
    else this.pino.debug(msg);
  }

  info(message: string, ...args: unknown[]): void {
    if (!isLoggingEnabled) return;
    const { obj, msg } = this.formatArgs(this.prefix(message), args);
    if (obj) this.pino.info(obj, msg);
    else this.pino.info(msg);
  }

  warn(message: string, ...args: unknown[]): void {
    if (!isLoggingEnabled) return;
    const { obj, msg } = this.formatArgs(this.prefix(message), args);
    if (obj) this.pino.warn(obj, msg);
    else this.pino.warn(msg);
  }

  error(message: string, ...args: unknown[]): void {
    if (!isLoggingEnabled) return;
    const { obj, msg } = this.formatArgs(this.prefix(message), args);
    if (obj) this.pino.error(obj, msg);
    else this.pino.error(msg);
  }

  child(context: string): Logger {
    const nextContext = this.context ? `${this.context}:${context}` : context;
    const childPino = this.pino.child({ context: nextContext });
    return new Logger(childPino, nextContext);
  }

  private prefix(message: string): string {
    return this.context ? `[${this.context}] ${message}` : message;
  }
}

export const logger = new Logger(basePino);

export const pinoLogger = basePino;

export const wLogger = pinoLogger;

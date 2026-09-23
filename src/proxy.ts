import { type NextRequest, NextResponse } from "next/server";

const BAD_BOTS = [
  "sqlmap",
  "nmap",
  "nikto",
  "acunetix",
  "wpscan",
  "dirbuster",
  "masscan",
  "gobuster",
  "nuclei",
  "hydra",
  "openvas",
  "burpsuite",
  "zaproxy",
  "havij",
  "w3af",
];

const PATH_TRAVERSAL = /(\.\.\/|\.\.\|%2e%2e%2f|%2e%2e%5c)/i;

const SQL_INJECTION =
  /UNION\s+SELECT|INSERT\s+INTO|UPDATE\s+.*SET|DELETE\s+FROM|DROP\s+TABLE|OR\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i;

function blocked(message: string, code: string, status: number) {
  return NextResponse.json(
    { success: false, statusCode: status, message, data: null, details: { code } },
    { status }
  );
}

export function proxy(req: NextRequest) {
  const ua = (req.headers.get("user-agent") || "").toLowerCase();
  if (ua && BAD_BOTS.some((bot) => ua.includes(bot))) {
    return blocked("Access denied", "BOT_BLOCKED", 403);
  }

  const rawUrl = req.nextUrl.pathname + req.nextUrl.search;

  let decoded = rawUrl;
  let previous: string;
  do {
    previous = decoded;
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      break;
    }
  } while (decoded !== previous);

  if (PATH_TRAVERSAL.test(rawUrl) || PATH_TRAVERSAL.test(decoded)) {
    return blocked("Malicious path detected", "SECURITY_BLOCK", 400);
  }

  if (SQL_INJECTION.test(rawUrl) || SQL_INJECTION.test(decoded)) {
    return blocked("Potential SQL injection detected", "SECURITY_BLOCK", 400);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

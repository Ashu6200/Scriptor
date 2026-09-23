const base = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 520px; margin: 40px auto; padding: 0 16px; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; }
    .logo { font-size: 20px; font-weight: 800; color: #fafafa; letter-spacing: -0.5px; margin-bottom: 28px; }
    .logo span { color: #ff5e1f; }
    h1 { font-size: 22px; font-weight: 700; color: #fafafa; margin: 0 0 8px; }
    p { font-size: 14px; color: #a1a1aa; line-height: 1.6; margin: 0 0 20px; }
    .btn { display: inline-block; background: #ff5e1f; color: #fff !important; text-decoration: none; padding: 11px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #52525b; }
    .url { word-break: break-all; font-size: 12px; color: #71717a; font-family: monospace; background: #27272a; padding: 8px 12px; border-radius: 6px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">Sc<span>r</span>iptor</div>
      ${content}
    </div>
    <div class="footer">© 2026 Scriptor · You received this because you have an account on Scriptor.</div>
  </div>
</body>
</html>
`;

export function resetPasswordEmail(url: string) {
  return base(`
    <h1>Reset your password</h1>
    <p>We received a request to reset the password for your Scriptor account. Click the button below to choose a new password.</p>
    <a href="${url}" class="btn">Reset Password</a>
    <div class="url">${url}</div>
    <p style="margin-top:20px;font-size:12px;color:#52525b;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
  `);
}

export function verificationEmail(url: string) {
  return base(`
    <h1>Verify your email</h1>
    <p>Thanks for signing up for Scriptor! Please verify your email address to get started.</p>
    <a href="${url}" class="btn">Verify Email</a>
    <div class="url">${url}</div>
    <p style="margin-top:20px;font-size:12px;color:#52525b;">If you didn't create a Scriptor account, you can safely ignore this email.</p>
  `);
}

export function welcomeEmail(name: string) {
  return base(`
    <h1>Welcome to Scriptor, ${name}!</h1>
    <p>Your account is ready. Start by creating a workspace and writing your first document.</p>
    <a href="${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/dashboard" class="btn">Get Started</a>
  `);
}

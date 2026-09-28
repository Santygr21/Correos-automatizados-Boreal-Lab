import express from "express";
import nodemailer from "nodemailer";
import { createHash } from "node:crypto";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: "2mb" }));

const DEFAULT_DELAY_MS = 7000;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const sigImageCache = new Map();
const MAX_IMAGES = 8;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const MAX_LIGHT_TARGET = 220;

function pickLightUrl(url, width) {
  if (!width) return url;
  const target = Math.min(Math.max(Math.round(Number(width) * 2), 16), MAX_LIGHT_TARGET);
  const m = String(url).match(/(=s)\d+$/);
  return m ? String(url).slice(0, m.index) + "=s" + target : url;
}

async function downloadImage(url) {
  if (sigImageCache.has(url)) return sigImageCache.get(url);
  const pending = (async () => {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = String(res.headers.get("content-type") || "");
    if (!/^image\//.test(contentType)) throw new Error("not an image");
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_IMAGE_SIZE) {
      throw new Error("unusable image size");
    }
    return { buffer, contentType };
  })();
  sigImageCache.set(url, pending);
  pending.catch(() => sigImageCache.delete(url));
  return pending;
}

async function embedImages(signatureHtml) {
  const html = String(signatureHtml || "");
  const imgRe = /<img[^>]*\bsrc=(["'])(https?:\/\/[^"']+)\1[^>]*>/gi;
  const matches = [...html.matchAll(imgRe)];

  if (matches.length === 0) {
    return { html, attachments: [] };
  }

  const seen = new Map(); // url -> cid
  const attachments = [];

  for (const m of matches) {
    if (seen.size >= MAX_IMAGES) break;
    const url = m[2];
    if (seen.has(url)) continue;

    const tag = m[0];
    const widthMatch = tag.match(/\bwidth\s*=\s*["']?(\d+)/i);
    const width = widthMatch ? Number(widthMatch[1]) : 0;
    const sourceUrl = pickLightUrl(url, width);

    try {
      const { buffer, contentType } = await downloadImage(sourceUrl);
      const id = `boreal-${createHash("sha1").update(sourceUrl).digest("hex").slice(0, 12)}`;
      attachments.push({
        cid: id,
        content: buffer,
        contentType,
        filename: false,
      });
      seen.set(url, id);
    } catch {
      try {
        const { buffer, contentType } = await downloadImage(pickLightUrl(url, width));
        const id = `boreal-${createHash("sha1").update(url).digest("hex").slice(0, 12)}`;
        attachments.push({
          cid: id,
          content: buffer,
          contentType,
          filename: false,
        });
        seen.set(url, id);
      } catch {
        seen.set(url, "skip");
      }
    }
  }

  let out = html;
  let offset = 0;
  for (const m of matches) {
    const url = m[2];
    const cid = seen.get(url);
    if (!cid || cid === "skip") continue;
    const quote = m[1];
    const start = m.index + offset;
    const tag = out.slice(start, start + m[0].length);
    const newTag = tag.replace(`src=${quote}${url}${quote}`, `src=${quote}cid:${cid}${quote}`);
    const delta = newTag.length - m[0].length;
    out = out.slice(0, start) + newTag + out.slice(start + m[0].length);
    offset += delta;
  }

  return { html: out, attachments };
}

function sendEvent(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

app.get("/", (req, res) => {
  res
    .type("html")
    .send(
      `<h1>Servidor de correos corriendo en :3001</h1><p>La interfaz vive en <a href="http://localhost:5173">http://localhost:5173</a> — ábrela ahí (no en este puerto).</p><p>Este servidor expone las APIs <code>/api/send</code>, <code>/api/test</code> y <code>/api/responses</code>.</p>`
    );
});

app.post("/api/test", async (req, res) => {
  const { smtpConfig } = req.body || {};
  const { host, port, user, pass } = smtpConfig || {};
  if (!host || !port || !user || !pass) {
    return res.status(400).json({ error: "SMTP config must include host, port, user, pass" });
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transport.verify();
    transport.close();
    return res.json({ ok: true, message: "Conexión verificada correctamente" });
  } catch (err) {
    transport.close();
    return res.status(401).json({ ok: false, error: err.message });
  }
});

const MAX_RESPONSES = 100;
const MAX_SNIPPET = 600;
const REPLY_RE = /^\s*(re|res|sv|aw|rv|fwd|r):/i;

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

app.post("/api/responses", async (req, res) => {
  const { user, pass, days } = req.body || {};
  if (!user || !pass) {
    return res.status(400).json({ error: "Necesito el usuario y la contraseña de aplicación para leer la bandeja" });
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  try {
    await client.connect();
  } catch (err) {
    const code = String(err?.code || err?.response || "").toUpperCase();
    const msg = code.includes("AUTHENTICATION")
      ? `No pude autenticar con la cuenta ${user}. Verifica que la contraseña de aplicación sea correcta.`
      : `No pude conectarme al correo: ${err.message}`;
    return res.status(401).json({ error: msg });
  }

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date(Date.now() - Number(days && days > 0 ? days : 60) * 86400000);
      const ids = await client.search({ since }, { uid: true });
      const ordered = Array.isArray(ids) ? ids : [...(ids || [])];
      const recent = ordered.slice(-MAX_RESPONSES);

      const messages = [];
      for (const uid of recent) {
        const item = await client.fetchOne(uid, { envelope: true }, { uid: true });
        const env = item?.envelope;
        if (!env) continue;
        const from = Array.isArray(env.from) && env.from.length > 0 ? env.from[0] : null;
        const fromAddress = normalizeEmail(from?.address);
        if (!fromAddress || fromAddress === normalizeEmail(user)) continue;

        const subject = String(env.subject || "");
        const inReplyTo = String(env.inReplyTo || "");
        const isReply = Boolean(inReplyTo) || REPLY_RE.test(subject);

        const full = await client.fetchOne(uid, { source: true }, { uid: true });
        let parsed = null;
        try {
          parsed = await simpleParser(full?.source || "");
        } catch {
          parsed = null;
        }

        const text = parsed?.text ? String(parsed.text) : "";
        const snippet = text.replace(/\s+/g, " ").trim().slice(0, MAX_SNIPPET);

        messages.unshift({
          id: String(env.messageId || uid),
          fromName: from?.name || fromAddress,
          fromEmail: fromAddress,
          date: env.date ? new Date(env.date).toISOString() : null,
          subject,
          isReply,
          snippet,
        });
      }

      const replies = messages.filter((m) => m.isReply);
      const others = messages.filter((m) => !m.isReply);

      return res.json({
        ok: true,
        scanned: messages.length,
        replies,
        others,
        since: since.toISOString(),
      });
    } finally {
      lock.release();
    }
  } catch (err) {
    return res.status(500).json({ error: "Error leyendo la bandeja: " + err.message });
  } finally {
    try {
      await client.logout();
    } catch {
      /* noop */
    }
  }
});

app.post("/api/send", async (req, res) => {
  const { smtpConfig, recipients, subject, body, delayMs, signatureHtml } = req.body || {};

  if (!smtpConfig || !recipients || !subject || !body) {
    return res
      .status(400)
      .json({ error: "Missing smtpConfig, recipients, subject or body" });
  }

  const { host, port, user, pass } = smtpConfig;
  if (!host || !port || !user || !pass) {
    return res
      .status(400)
      .json({ error: "SMTP config must include host, port, user, pass" });
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: "recipients must be a non-empty array" });
  }

  const delay = Number.isFinite(delayMs) && delayMs > 0 ? delayMs : DEFAULT_DELAY_MS;

  let sigPrepared = null;
  if (signatureHtml && String(signatureHtml).trim()) {
    sigPrepared = await embedImages(String(signatureHtml));
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i++) {
    const r = { name: String(recipients[i].name || "").trim(), email: String(recipients[i].email || "").trim(), motivo: String(recipients[i].motivo || "").trim() };
    const address = r.name ? `"${r.name}" <${r.email}>` : r.email;

    if (!emailRegex.test(r.email)) {
      failed++;
      sendEvent(res, "failed", {
        recipient: address,
        index: i,
        error: "dirección de correo inválida",
      });
      continue;
    }

    try {
      const plainText = String(body)
        .replaceAll("{{name}}", r.name)
        .replaceAll("{{motivo}}", r.motivo);
      const html =
        `<div>${escapeHtml(plainText).replace(/\r?\n/g, "<br>")}</div>` +
        (sigPrepared && sigPrepared.html
          ? `<div style="margin-top:24px;padding-top:20px;border-top:1px solid #e4e8e6;">${sigPrepared.html}</div>`
          : "");

      await transport.sendMail({
        from: `"Boreal Lab" <${user}>`,
        to: address,
        subject: String(subject)
          .replaceAll("{{name}}", r.name)
          .replaceAll("{{motivo}}", r.motivo),
        text: plainText,
        html,
        attachments: sigPrepared ? sigPrepared.attachments : [],
      });
      sent++;
      sendEvent(res, "sent", { recipient: address, index: i });
    } catch (err) {
      failed++;
      sendEvent(res, "failed", {
        recipient: address,
        index: i,
        error: err.message,
      });
    }

    if (i < recipients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  transport.close();
  sendEvent(res, "done", { sent, failed, total: recipients.length });
  res.end();
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `El puerto ${PORT} ya está en uso. Cierra la otra instancia del servidor y vuelve a intentarlo.`
    );
    console.error(`Para liberarlo: lsof -ti tcp:${PORT} | xargs kill -9`);
    process.exit(1);
  }
  throw err;
});
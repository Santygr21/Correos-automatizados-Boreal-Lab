import React, { useRef, useState } from "react";
import Papa from "papaparse";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_DELAY_MS = 7000;

const HEADER_ALIASES = {
  name: ["name", "nombre", "nombres", "nombre y apellido", "contacto", "destinatario"],
  email: ["email", "correo", "correo electronico", "correo electrónico", "mail", "e-mail"],
  motivo: ["motivo", "tema", "referencia", "contexto", "proyecto"],
};

function normalizeHeader(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectHeader(row) {
  const cells = (row || []).map((cell) => normalizeHeader(cell));
  const byIndex = {};
  cells.forEach((cell, i) => {
    if (!(cell in byIndex)) byIndex[cell] = i;
  });

  const map = {};
  let matched = false;
  for (const key of ["name", "email", "motivo"]) {
    for (const alias of HEADER_ALIASES[key]) {
      if (alias in byIndex) {
        map[key] = byIndex[alias];
        matched = true;
        break;
      }
    }
  }
  return matched ? map : null;
}

const SIG_LOGO =
  "https://docs.google.com/docs-images-rt/ALKuztYFhbB4RdbK-N2HJOGDzUtVKBAiF1cKy66PcxTcmY42O7y_Mn5HmzhAUEWRM0IlzcyhE7IeBBts3slZPlKHL4yRSvHRadjNYgjwoLL2Ax9gCVp4QMhir2ubUbbJgtwLfhQZz83JK7fvb2z3JdmvWrRzf3NspGNTZ7I725xwZw=s2048";
const SIG_PHONE =
  "https://docs.google.com/docs-images-rt/ALKuzta-A5sh5peelT2geaSJNo6yKnPGJt0XZGipOoWq4VlARfCtwnMHJlUlay5ek81hhRjfMKw0NhwTtAS7Ji0SiwagMmpnj15-YGB6Aim7nQ-w6EYin5bltP14ESi3B78071xuL0K3l2spQqc7tqixXkyMrcJbsS02XBLPAFMT8Q=s2048";
const SIG_MAIL =
  "https://docs.google.com/docs-images-rt/ALKuztYy32dQIPG5GsDDACncLnPIkaTOiqT8cYpPX-MRCms49kqtEVdXXdpCXPV_V84H_f3apWgvEwuWr2z6goQ62_h95Oa1qAOIafZ9DXTvzqWS_q4wzuGDgiZMIFRdis0FIaHoaKEicT6Jfy7h-YVnd0UxIMjTVUT-Rq8FL8w=s2048";
const SIG_ICON1 =
  "https://docs.google.com/docs-images-rt/ALKuztYs9Umpo1NpFrvrLNXl8fPrKcB5-VB44C75lEYCUU-RlKCfHa3-zHwhLxbhtCPv8k2cX8okrVx4rUeYyJJKsNy18HDxtRqYV8_3jPRbau3g2vuBbP_yTPnCFtVL_hJHgkq20TPY7rRMSR4n2JhsOkbVcx76EdkQ2LtjcAs=s2048";
const SIG_ICON2 =
  "https://docs.google.com/docs-images-rt/ALKuztbtm9Cj2f0MZe8UfzjF7A2SaS1rqiEy5sdZ2crGG4vcFusfwjAOAId_uTw7lBtYQlaItPyFFKK6VBDkFqz1voCgJ2mr2Qsa0WKIaFc0CYDp05RUQ6YzW5207xpgEmZgEChhymunCUUBay1C4qSFlryavJYSCimmjo8_GfM8Rg=s2048";
const SIG_ICON3 =
  "https://docs.google.com/docs-images-rt/ALKuztae1sjuOAkXCzllmtoFyLChLyOzflFfPbVzX5U8K8U2TX19HAAKvAkWCM_Bf6oGml8lQ6Ah5JH6IYLCceCqA98NvHMxr4bZwd_Z6lxZX2aiw2cumDQtDAbBHGGXy6pEu87ZqTBMvLeRqH8T6vS6uDoTPQlVQMrsYX_lHSM_4Q=s2048";

const DEFAULT_SIGNATURE = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:'Mulish',Arial,Helvetica,sans-serif;color:#1e1e1e;">
<tr>
  <td style="vertical-align:top;padding:0 16px 0 0;">
    <img src="${SIG_LOGO}" width="132" height="55" alt="Boreal Lab" style="display:block;border:0;outline:none;text-decoration:none;" />
  </td>
  <td style="vertical-align:top;padding:0;">
    <div style="font-family:'Work Sans','Mulish',Arial,sans-serif;font-size:20px;line-height:1.15;letter-spacing:-0.01em;">
      <span style="color:#0e9e67;font-weight:700;">Dilan </span><span style="color:#0e9e67;font-weight:300;font-style:italic;">Cano</span>
    </div>
    <div style="font-size:13px;line-height:1.55;color:#999999;font-weight:500;padding:3px 0 10px;">Co-founder</div>
    <div style="font-size:13px;line-height:1.8;">
      <img src="${SIG_PHONE}" width="16" height="14" alt="" style="vertical-align:middle;border:0;" />&nbsp;&nbsp;<a href="tel:+573019475769" style="color:#1e1e1e;text-decoration:none;">(+57) 301 947 5769</a>
    </div>
    <div style="font-size:13px;line-height:1.8;">
      <img src="${SIG_MAIL}" width="16" height="14" alt="" style="vertical-align:middle;border:0;" />&nbsp;&nbsp;<a href="mailto:helloboreallab@gmail.com" style="color:#0e9e67;text-decoration:none;">helloboreallab@gmail.com</a>
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:12px;">
    <tr>
      <td style="padding:0 8px 0 0;"><a href="https://www.linkedin.com/company/boreal-lab" style="text-decoration:none;display:block;"><img src="${SIG_ICON1}" width="28" height="28" alt="LinkedIn" style="display:block;border:0;" /></a></td>
      <td style="padding:0 8px 0 0;"><a href="https://www.behance.net/boreal-lab" style="text-decoration:none;display:block;"><img src="${SIG_ICON2}" width="28" height="28" alt="Behance" style="display:block;border:0;" /></a></td>
      <td style="padding:0;"><a href="https://dribbble.com/boreallab" style="text-decoration:none;display:block;"><img src="${SIG_ICON3}" width="28" height="28" alt="Dribbble" style="display:block;border:0;" /></a></td>
    </tr>
    </table>
  </td>
</tr>
</table>`;

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseCSV(text) {
  const data = Papa.parse(text.trim(), { skipEmptyLines: true }).data;
  const recipients = [];
  const errors = [];

  if (data.length === 0) return { recipients, errors };

  const headerMap = detectHeader(data[0]);
  const start = headerMap ? 1 : 0;

  for (let i = start; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;

    let first, second, motivo;
    if (headerMap) {
      first = headerMap.name != null ? String(row[headerMap.name] ?? "").trim() : "";
      second = headerMap.email != null ? String(row[headerMap.email] ?? "").trim() : "";
      motivo = headerMap.motivo != null ? String(row[headerMap.motivo] ?? "").trim() : "";
    } else {
      first = String(row[0] || "").trim();
      second = String(row[1] || "").trim();
      motivo = String(row[2] || "").trim();
    }

    if (!first && !second) continue;

    if (!first || !second) {
      errors.push(`Fila ${i + 1}: falta nombre o correo`);
      continue;
    }
    if (!emailRegex.test(second)) {
      errors.push(`Fila ${i + 1}: correo inválido (${second})`);
      continue;
    }
    recipients.push({ name: first, email: second, motivo });
  }

  return { recipients, errors };
}

function readSSEStream(response, onEvent, onError) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let event = "";

  function processBlock(block) {
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        try {
          onEvent(event, JSON.parse(line.slice(5).trim()));
        } catch {
          onError("Respuesta del servidor inválida");
        }
      }
    }
  }

  function pump({ done, value }) {
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop();
    blocks.forEach(processBlock);
    return reader.read().then(pump);
  }

  reader.read().then(pump).catch((e) => onError(e.message));
}

function BorealMark() {
  return (
    <span className="mark" aria-hidden="true">
      <span className="mark-core" />
      <span className="mark-orbit" />
    </span>
  );
}

function StatusDot({ status }) {
  const map = {
    pending: { cls: "dot", label: "en espera" },
    sending: { cls: "dot dot-sending", label: "enviando" },
    sent: { cls: "dot dot-sent", label: "enviado" },
    failed: { cls: "dot dot-failed", label: "fallo" },
  };
  const s = map[status] || map.pending;
  return <span className={s.cls} title={s.label} />;
}

export default function App() {
  const [smtp, setSmtp] = useState({
    host: "smtp.gmail.com",
    port: 465,
    user: "",
    pass: "",
  });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [includeSignature, setIncludeSignature] = useState(
    () => localStorage.getItem("sigOn") !== "0"
  );
  const [signatureHtml, setSignatureHtml] = useState(
    () => localStorage.getItem("sigHtml") ?? DEFAULT_SIGNATURE
  );
  const [recipients, setRecipients] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [csvName, setCsvName] = useState("");
  const [stage, setStage] = useState("edit"); // edit | preview | sending | done
  const [statuses, setStatuses] = useState([]);
  const [failures, setFailures] = useState([]);
  const [testStatus, setTestStatus] = useState(null); // {state, message}
  const [summary, setSummary] = useState(null);
  const [serverError, setServerError] = useState("");
  const fileRef = useRef(null);

  const [tab, setTab] = useState("send"); // "send" | "responses"
  const [respDays, setRespDays] = useState(60);
  const [respLoading, setRespLoading] = useState(false);
  const [respError, setRespError] = useState("");
  const [respResult, setRespResult] = useState(null);
  const [respRecipients, setRespRecipients] = useState([]);
  const [respCsvName, setRespCsvName] = useState("");
  const [respCsvErrors, setRespCsvErrors] = useState([]);
  const respFileRef = useRef(null);

  function updateSignature(value) {
    setSignatureHtml(value);
    localStorage.setItem("sigHtml", value);
  }

  function updateSignatureToggle(on) {
    setIncludeSignature(on);
    localStorage.setItem("sigOn", on ? "1" : "0");
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCsvName(file.name);
    setStage("edit");
    const reader = new FileReader();
    reader.onload = () => {
      const { recipients: recs, errors } = parseCSV(String(reader.result));
      setRecipients(recs);
      setCsvErrors(errors);
      setStatuses(recs.map(() => "pending"));
      setFailures([]);
    };
    reader.readAsText(file);
  }

  function buildPreview() {
    setServerError("");
    setStage("preview");
  }

  function handleRespFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setRespCsvName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const { recipients: recs, errors } = parseCSV(String(reader.result));
      setRespRecipients(recs);
      setRespCsvErrors(errors);
    };
    reader.readAsText(file);
  }

  async function fetchResponses() {
    setRespLoading(true);
    setRespError("");
    setRespResult(null);
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: smtp.user, pass: smtp.pass, days: respDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No pude leer el correo");
      setRespResult(data);
    } catch (err) {
      setRespError(err.message);
    } finally {
      setRespLoading(false);
    }
  }

  function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("es", {
      day: "numeric",
      month: "short",
    });
  }

  async function testConnection() {
    setTestStatus({ state: "testing", message: "Probando conexión…" });
    setServerError("");
    try {
      const res = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpConfig: {
            host: smtp.host,
            port: Number(smtp.port),
            user: smtp.user,
            pass: smtp.pass,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTestStatus({ state: "ok", message: data.message });
      } else {
        setTestStatus({ state: "error", message: data.error || "Falló la conexión" });
      }
    } catch (err) {
      setTestStatus({ state: "error", message: err.message });
    }
  }

  async function confirmAndSend() {
    setStage("sending");
    setStatuses(recipients.map(() => "sending"));
    setSummary(null);
    setServerError("");

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpConfig: {
            host: smtp.host,
            port: Number(smtp.port),
            user: smtp.user,
            pass: smtp.pass,
          },
          recipients,
          subject,
          body,
          signatureHtml: includeSignature ? signatureHtml : "",
          delayMs: DEFAULT_DELAY_MS,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error del servidor");
      }

      readSSEStream(
        res,
        (event, data) => {
          if (event === "sent" || event === "failed") {
            setStatuses((prev) =>
              prev.map((s, i) => (i === data.index ? event : s))
            );
            if (event === "failed") {
              setFailures((prev) => {
                const next = [...prev];
                next[data.index] = data.error;
                return next;
              });
            }
          } else if (event === "done") {
            setSummary(data);
            setStage("done");
          }
        },
        (msg) => {
          setServerError(msg);
          setStage("done");
        }
      );
    } catch (err) {
      setServerError(err.message);
      setStage("done");
    }
  }

  function reset() {
    setStage("edit");
    setRecipients([]);
    setCsvErrors([]);
    setCsvName("");
    setStatuses([]);
    setSummary(null);
    setServerError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const exampleBody = body
    .replaceAll("{{name}}", recipients[0]?.name || "[Nombre]")
    .replaceAll("{{motivo}}", recipients[0]?.motivo || "[Motivo]");
  const previewHtml = escapeHtml(exampleBody).replace(/\r?\n/g, "<br>");
  const hasMotivo = recipients.some((r) => r.motivo);
  const canPreview = recipients.length > 0 && subject.trim() && body.trim();

  const allRespMessages = respResult
    ? [...respResult.replies, ...respResult.others]
    : [];
  const respByEmail = {};
  allRespMessages.forEach((m) => {
    if (!respByEmail[m.fromEmail]) respByEmail[m.fromEmail] = [];
    respByEmail[m.fromEmail].push(m);
  });
  const respContactSet = new Set(respRecipients.map((r) => r.email.toLowerCase()));
  const respContacts = respRecipients.map((r) => {
    const msgs = respByEmail[r.email.toLowerCase()] || [];
    const replied = msgs.some((m) => m.isReply);
    return { ...r, replied, latest: msgs.length ? msgs[0] : null };
  });
  const respondedCount = respContacts.filter((c) => c.replied).length;
  const orphanReplies = respResult
    ? respResult.replies.filter((m) => !respContactSet.has(m.fromEmail))
    : [];

  return (
    <div className="page">
      <header className="site-header">
        <div className="brand">
          <span className="brand-name">
            Boreal Lab<BorealMark />
          </span>
          <span className="brand-tag">Diseño + tecnología + creatividad</span>
        </div>
      </header>

      <main className="content">
        <div className="intro">
          <h1>
            Correos con intención<span className="accent">.</span>
          </h1>
          <p>
            Sube tu lista, escribe un mensaje que se sienta personal y envíalo con calma.
            Priorizamos la conversación sobre el volumen.
          </p>
        </div>

        {stage === "edit" && (
          <>
            <div className="tabs">
              <button
                className={`tab ${tab === "send" ? "tab-active" : ""}`}
                onClick={() => setTab("send")}
              >
                Enviar
              </button>
              <button
                className={`tab ${tab === "responses" ? "tab-active" : ""}`}
                onClick={() => setTab("responses")}
              >
                Respuestas
              </button>
            </div>

            {tab === "send" && (
            <>
            <section className="card">
              <div className="sec-head">
                <span className="sec-num">01</span>
                <h2>Conexión</h2>
              </div>
              <p className="lede">
                Conecta tu cuenta para enviar. En Gmail, usa una contraseña de aplicación
                (requiere 2FA activado), no tu contraseña normal.
              </p>
              <div className="grid">
                <label>
                  Host
                  <input
                    value={smtp.host}
                    onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                  />
                </label>
                <label>
                  Puerto
                  <input
                    type="number"
                    value={smtp.port}
                    onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                  />
                </label>
                <label>
                  Usuario
                  <input
                    value={smtp.user}
                    onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                    placeholder="hola@tucorreo.com"
                  />
                </label>
                <label>
                  Contraseña de aplicación
                  <input
                    type="password"
                    value={smtp.pass}
                    onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                  />
                </label>
              </div>
              <div className="row">
                <button
                  className="btn btn-secondary"
                  onClick={testConnection}
                  disabled={!smtp.host || !smtp.port || !smtp.user || !smtp.pass}
                >
                  Probar conexión
                </button>
                {testStatus && (
                  <span
                    className={
                      testStatus.state === "ok"
                        ? "badge badge-ok"
                        : testStatus.state === "error"
                          ? "badge badge-fail"
                          : "badge badge-test"
                    }
                  >
                    {testStatus.message}
                  </span>
                )}
              </div>
            </section>

            <section className="card">
              <div className="sec-head">
                <span className="sec-num">02</span>
                <h2>Mensaje</h2>
              </div>
              <p className="lede">
                Corto, claro y con un solo llamado a la acción. Usa{" "}
                <code>{"{{name}}"}</code> para saludar a cada persona por su nombre y{" "}
                <code>{"{{motivo}}"}</code> (opcional) para mencionar algo específico de
                cada contacto.
              </p>
              <label>
                Asunto
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Una idea para tu equipo"
                />
              </label>
              <label>
                Cuerpo
                <textarea
                  rows={10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    "Hola {{name}} 👋\n\nEstuve viendo lo que están construyendo y me llamó la atención un detalle.\n\nSomos Boreal, un estudio de diseño digital. Trabajamos en productos, experiencias y sistemas.\n\n¿Te gustaría que lo conversemos unos minutos?\n\nUn abrazo,\nBoreal"
                  }
                />
              </label>

              <div className="sig-block">
                <label className="sig-toggle">
                  <input
                    type="checkbox"
                    checked={includeSignature}
                    onChange={(e) => updateSignatureToggle(e.target.checked)}
                  />
                  <span>Añadir firma / banner al final</span>
                </label>
                {includeSignature && (
                  <>
                    <label>
                      Firma (HTML)
                      <textarea
                        className="sig-editor"
                        rows={6}
                        value={signatureHtml}
                        onChange={(e) => updateSignature(e.target.value)}
                        placeholder="<table>…tu firma…</table>"
                      />
                    </label>
                    <p className="lede">
                      Se inserta al final del correo (versión HTML). Las
                      imágenes se incrustan automáticamente al enviar, así que
                      también se verán en el celular. Edítalo o pega aquí una
                      firma copiada desde Google Docs o Gmail.
                    </p>
                  </>
                )}
              </div>
            </section>

            <section className="card">
              <div className="sec-head">
                <span className="sec-num">03</span>
                <h2>Lista de contactos</h2>
              </div>
              <p className="lede">
                Sube un CSV con las columnas <code>name</code> y <code>email</code>.
                Si tu archivo tiene una columna <code>motivo</code> (o{" "}
                <code>tema</code>/<code>contexto</code>), se usa con{" "}
                <code>{"{{motivo}}"}</code>. La columna es opcional: sin ella, el
                correo se envía igual.
              </p>

              <label className="dropzone">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFile}
                />
                <span className="dz-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 16V4" />
                    <path d="m7 9 5-5 5 5" />
                    <path d="M4 20h16" />
                  </svg>
                </span>
                <span className="dz-title">Subir CSV</span>
                <span className="dz-sub">
                  {csvName ? csvName : "name, email"}
                </span>
              </label>

              {csvName && (
                <p className="meta">
                  <strong>{recipients.length}</strong> destinatarios válidos
                  {csvErrors.length > 0 && ` · ${csvErrors.length} filas con error`}
                </p>
              )}

              {recipients.length > 0 && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        {hasMotivo && <th>Motivo</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.slice(0, 10).map((r, i) => (
                        <tr key={i}>
                          <td>{r.name}</td>
                          <td>{r.email}</td>
                          {hasMotivo && <td>{r.motivo}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {recipients.length > 10 && (
                    <p className="meta">
                      y {recipients.length - 10} más…
                    </p>
                  )}
                </div>
              )}

              {csvErrors.length > 0 && (
                <ul className="errors">
                  {csvErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </section>

            <div className="actions">
              <button className="btn btn-primary" disabled={!canPreview} onClick={buildPreview}>
                Ver vista previa →
              </button>
            </div>
            </>
            )}

            {tab === "responses" && (
              <section className="card">
                <div className="sec-head">
                  <span className="sec-num">⇄</span>
                  <h2>Revisar respuestas</h2>
                </div>
                <p className="lede">
                  Lee la bandeja de <strong>{smtp.user || "tu cuenta"}</strong> y
                  busca quién respondió a tus correos. Usa la misma cuenta y
                  contraseña de aplicación de la sección Conexión (nunca se
                  guarda en disco, solo viaja en memoria).
                </p>

                <div className="grid">
                  <label>
                    Cuenta (IMAP)
                    <input value={smtp.user} disabled placeholder="hola@tucorreo.com" />
                  </label>
                  <label>
                    Revisar los últimos… días
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={respDays}
                      onChange={(e) => setRespDays(Number(e.target.value))}
                    />
                  </label>
                </div>

                <div className="row">
                  <button
                    className="btn btn-secondary"
                    onClick={fetchResponses}
                    disabled={!smtp.user || !smtp.pass || respLoading}
                  >
                    {respLoading ? "Leyendo bandeja…" : "Buscar respuestas"}
                  </button>
                  {!smtp.user || !smtp.pass ? (
                    <span className="badge badge-test">
                      Completa usuario y contraseña de aplicación en la sección Conexión
                    </span>
                  ) : null}
                </div>

                {respError && <p className="alert alert-fail">{respError}</p>}

                {respResult && (
                  <>
                    <p className="meta">
                      Revisé <strong>{respResult.scanned}</strong> mensajes desde el{" "}
                      {new Date(respResult.since).toLocaleDateString("es")}.
                    </p>

                    <label className="dropzone">
                      <input ref={respFileRef} type="file" accept=".csv,text/csv" onChange={handleRespFile} />
                      <span className="dz-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 16V4" />
                          <path d="m7 9 5-5 5 5" />
                          <path d="M4 20h16" />
                        </svg>
                      </span>
                      <span className="dz-title">Subir CSV para cruzar</span>
                      <span className="dz-sub">{respCsvName || "name, email"}</span>
                    </label>

                    {respCsvErrors.length > 0 && (
                      <ul className="errors">
                        {respCsvErrors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    )}

                    {respRecipients.length > 0 && (
                      <>
                        <div className="summary">
                          <div className="stat">
                            <span className="stat-num">{respRecipients.length}</span>
                            <span className="stat-label">contactos</span>
                          </div>
                          <div className="stat">
                            <span className="stat-num">{respondedCount}</span>
                            <span className="stat-label">respondieron</span>
                          </div>
                          <div className="stat">
                            <span className="stat-num">{respRecipients.length - respondedCount}</span>
                            <span className="stat-label">sin respuesta</span>
                          </div>
                        </div>

                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th>Estado</th>
                                <th>Última respuesta</th>
                              </tr>
                            </thead>
                            <tbody>
                              {respContacts.map((r, i) => (
                                <tr key={i}>
                                  <td>{r.name}</td>
                                  <td>{r.email}</td>
                                  <td>
                                    {r.replied ? (
                                      <span className="badge badge-ok">Respondió</span>
                                    ) : (
                                      <span className="badge">Sin respuesta</span>
                                    )}
                                  </td>
                                  <td>
                                    {r.latest ? (
                                      <div className="reply-preview">
                                        <span className="reply-date">
                                          {formatDate(r.latest.date)} · {r.latest.subject || "sin asunto"}
                                        </span>
                                        <span className="reply-text">{r.latest.snippet || "…"}</span>
                                      </div>
                                    ) : (
                                      <span className="muted">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {orphanReplies.length > 0 && (
                      <>
                        <h3 className="resp-sub">Respuestas de correos no listados en el CSV</h3>
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>De</th>
                                <th>Fecha</th>
                                <th>Asunto y preview</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orphanReplies.map((m, i) => (
                                <tr key={i}>
                                  <td>
                                    <strong>{m.fromName}</strong>
                                    <div className="muted">{m.fromEmail}</div>
                                  </td>
                                  <td>{formatDate(m.date)}</td>
                                  <td>
                                    <div className="reply-preview">
                                      <span className="reply-date">{m.subject || "sin asunto"}</span>
                                      <span className="reply-text">{m.snippet || "…"}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </>
                )}
              </section>
            )}
          </>
        )}

        {(stage === "preview" || stage === "sending") && (
          <section className="card">
            <div className="sec-head">
              <span className="sec-num">{stage === "preview" ? "04" : "→"}</span>
              <h2>{stage === "preview" ? "Vista previa" : "Enviando…"}</h2>
            </div>
            <p className="lede">
              {stage === "preview"
                ? "Revisa el correo antes de enviarlo."
                : `Enviando a ${recipients.length} destinatarios con ~7s entre cada uno.`}
            </p>

            <div className="mail">
              <div className="mail-top">
                <span className="mail-brand">
                  Boreal<BorealMark />
                </span>
                <span className="mail-from">{smtp.user}</span>
              </div>
              <p className="mail-subject">{subject}</p>
              <div
                className="mail-body"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
              {includeSignature && signatureHtml.trim() && (
                <div
                  className="mail-sig"
                  dangerouslySetInnerHTML={{ __html: signatureHtml }}
                />
              )}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    {hasMotivo && <th>Motivo</th>}
                    <th className="th-status">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r, i) => (
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td>{r.email}</td>
                      {hasMotivo && <td>{r.motivo}</td>}
                      <td>
                        <StatusDot status={statuses[i]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {stage === "preview" && (
              <div className="actions">
                <button className="btn btn-primary" onClick={confirmAndSend}>
                  Confirmar y enviar →
                </button>
                <button className="btn btn-text" onClick={() => setStage("edit")}>
                  Volver
                </button>
              </div>
            )}
          </section>
        )}

        {stage === "done" && (
          <section className="card">
            <div className="sec-head">
              <span className="sec-num">05</span>
              <h2>{serverError ? "Algo no salió" : "Listo"}</h2>
            </div>

            {serverError ? (
              <p className="alert alert-fail">{serverError}</p>
            ) : summary ? (
              <div className="summary">
                <div className="stat">
                  <span className="stat-num">{summary.sent}</span>
                  <span className="stat-label">enviados</span>
                </div>
                <div className="stat">
                  <span className="stat-num">{summary.failed}</span>
                  <span className="stat-label">fallidos</span>
                </div>
                <div className="stat">
                  <span className="stat-num">{summary.total}</span>
                  <span className="stat-label">total</span>
                </div>
              </div>
            ) : null}

            {summary && summary.failed > 0 && (
              <div className="failure-list">
                <h3>Correos que no salieron</h3>
                <ul>
                  {recipients.map((r, i) =>
                    failures[i] ? (
                      <li key={i}>
                        <strong>
                          {r.name} &lt;{r.email}&gt;
                        </strong>
                        <span>{failures[i]}</span>
                      </li>
                    ) : null
                  )}
                </ul>
              </div>
            )}

            <div className="actions">
              <button className="btn btn-primary" onClick={reset}>
                Enviar otra lista →
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <span>
          Built by Boreal<BorealMark />
        </span>
        <span>Diseño + tecnología + creatividad</span>
      </footer>
    </div>
  );
}

// Puerta de entrada de los pedidos. El navegador nunca escribe en la base directamente.
import { createClient } from "npm:@supabase/supabase-js@2";

const ORIGENES = (Deno.env.get("ORIGENES_PERMITIDOS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const TIPOS = ["salon", "retiro", "delivery"];

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

// Saca caracteres de control y corta al largo máximo.
const limpiar = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";

function telefonoValido(v: string) {
  if (!/^\+?\d+$/.test(v)) return false;
  let p = v.replace(/^\+/, "");
  if (p.length > 10 && p.startsWith("549")) p = p.slice(3);
  else if (p.length > 10 && p.startsWith("54")) p = p.slice(2);
  if (p.length === 11 && p[0] === "0") p = p.slice(1);
  return p.length === 10;
}

// Guardamos un hash con sal, no la IP, para poder limitar sin acumular datos personales.
async function huella(ip: string) {
  const bytes = new TextEncoder().encode(ip + (Deno.env.get("SAL_IP") ?? ""));
  const h = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function validar(b: Record<string, unknown>) {
  const tipo = limpiar(b.tipo, 10);
  if (!TIPOS.includes(tipo)) return "Tipo de pedido inválido";
  const hora = limpiar(b.hora, 5);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return "Horario inválido";
  const nombre = limpiar(b.nombre, 60), apellido = limpiar(b.apellido, 60), empresa = limpiar(b.empresa, 80);
  if (!nombre || !apellido || !empresa) return "Completá nombre, apellido y empresa";
  const telefono = limpiar(b.telefono, 14);
  if (!telefonoValido(telefono)) return "Teléfono inválido";

  if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 30) return "Pedido vacío o demasiado grande";
  const vistos = new Set<string>();
  const items = [];
  for (const it of b.items as Record<string, unknown>[]) {
    const codigo = limpiar(it?.codigo, 40);
    const cantidad = Number(it?.cantidad);
    if (!/^[a-z]+-\d{1,2}-\d{1,2}$/.test(codigo) || vistos.has(codigo)) return "Producto inválido";
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 20) return "Cantidad inválida";
    vistos.add(codigo);
    items.push({ codigo, cantidad, nota: limpiar(it?.nota, 120) });
  }
  return { tipo, hora, nombre, apellido, telefono, empresa, items };
}

Deno.serve(async (req) => {
  const origen = req.headers.get("origin") ?? "";
  const cors = {
    "Access-Control-Allow-Origin": ORIGENES.includes(origen) ? origen : (ORIGENES[0] ?? ""),
    "Access-Control-Allow-Headers": "authorization, content-type, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  const responder = (status: number, cuerpo: unknown) =>
    new Response(JSON.stringify(cuerpo), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return responder(405, { error: "Método no permitido" });
  // Filtro contra abuso casual desde otros sitios; fuera de un navegador el origen se puede falsificar.
  if (!ORIGENES.includes(origen)) return responder(403, { error: "Origen no permitido" });
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) return responder(415, { error: "Formato no soportado" });

  const texto = await req.text();
  if (texto.length > 10_000) return responder(413, { error: "Pedido demasiado grande" });
  let cuerpo: Record<string, unknown>;
  try { cuerpo = JSON.parse(texto); } catch { return responder(400, { error: "Datos inválidos" }); }

  const pedido = validar(cuerpo);
  if (typeof pedido === "string") return responder(400, { error: pedido });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconocida";
  const { data, error } = await db.rpc("crear_pedido", { p: pedido, p_ip_hash: await huella(ip) });

  if (error) {
    if (error.message.includes("LIMITE")) return responder(429, { error: "Demasiados pedidos seguidos" });
    if (error.message.includes("PRODUCTO")) return responder(400, { error: "Alguno de los productos ya no está disponible" });
    console.error("crear_pedido falló:", error.message); // el detalle queda en el log, no en la respuesta
    return responder(500, { error: "No pudimos registrar tu pedido" });
  }
  return responder(201, data[0]);
});

// Lo único que viaja son códigos y cantidades. Los precios los calcula el servidor.
function armarPedido() {
    return {
        tipo: order.type,
        hora: order.time,
        ...order.data,
        items: [...selected].map(([k, q]) => ({
            codigo: k.replace(/\|/g, '-'),
            cantidad: q,
            nota: (notes[k] || '').trim()
        }))
    };
}

async function enviarPedido(pedido) {
    const r = await fetch(`${CONFIG.FUNCIONES_URL}/crear-pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CONFIG.ANON_KEY}` },
        body: JSON.stringify(pedido),
        signal: AbortSignal.timeout(10000)
    }).catch(() => { throw new Error('Sin conexión. Revisá tu internet e intentá de nuevo.'); });

    if (r.status === 429) throw new Error('Hiciste varios pedidos seguidos. Esperá unos minutos.');
    const datos = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(datos.error || 'No pudimos enviar tu pedido. Intentá de nuevo.');
    return datos;
}

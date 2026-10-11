// Arma la carga inicial de la base leyendo src/js/datos-menu.js.
// Se corre una vez. Después los precios se editan en la base, no acá.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const MENU = vm.runInNewContext(readFileSync('src/js/datos-menu.js', 'utf8') + ';MENU');
const q = s => `'${String(s).replace(/'/g, "''")}'`;
const sql = ['-- Generado por scripts/generar-semilla.mjs. No editar a mano.', 'begin;'];
let orden = 0;

for (const [seccion, s] of Object.entries(MENU)) {
    s.cats.forEach((c, ci) => {
        const cod = `${seccion}-${ci}`;
        sql.push(`insert into categorias (codigo, seccion, nombre, icono, descripcion, orden, permite_cantidad) values (${q(cod)}, ${q(seccion)}, ${q(c.n)}, ${q(c.i)}, ${q(c.d)}, ${orden++}, ${c.q}) on conflict (codigo) do nothing;`);
        c.items.forEach((it, ii) => sql.push(`insert into productos (codigo, categoria_id, nombre, precio, nota, cantidad_inicial, orden) values (${q(`${cod}-${ii}`)}, (select id from categorias where codigo = ${q(cod)}), ${q(it.n)}, ${it.p}, ${q(it.note)}, ${it.start}, ${ii}) on conflict (codigo) do nothing;`));
    });
}
sql.push('commit;');
writeFileSync('supabase/migrations/0002_semilla_menu.sql', sql.join('\n') + '\n');
console.log('Listo: supabase/migrations/0002_semilla_menu.sql');

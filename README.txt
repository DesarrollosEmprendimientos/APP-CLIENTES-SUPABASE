RESTAURANTE DEL PARQUE - APP DE PEDIDOS
=======================================

1. QUE ES Y HASTA DONDE LLEGA ESTA ENTREGA
App web instalable (PWA) para pedir desde el celular: menu, cantidades,
aclaraciones, tipo de pedido, horario, datos de contacto, y registro seguro
del pedido en una base de datos Supabase.

Incluido ahora:    app del cliente + base de datos + funcion segura de pedidos.
Etapa siguiente:   tablero de control, impresora de comandas, planillas de
                   Google Sheets y avisos push (ver seccion 7). La base ya
                   tiene las columnas que esas piezas van a necesitar.

Antes de publicar, leer la seccion 8 (limites conocidos).


2. MAPA DEL PROYECTO Y POR QUE ESTA ASI

src/                          Lo unico que se edita a mano.
  index.html                  Estructura de la pantalla. Sin estilos ni logica
                              adentro: si algo se rompe, el error esta en un
                              archivo chico y con nombre claro.
  css/entrada.css             Estilos propios. Tailwind los compila a app.css.
  js/config.js                URL del proyecto y clave publica (ver 3.4).
  js/datos-menu.js            El menu. Es lo que mas cambia, por eso esta solo.
  js/validaciones.js          Regla del telefono (10 digitos con codigo de area).
  js/utilidades.js            Avisos en pantalla, boton "Instalar App", registro
                              del service worker.
  js/menu-ui.js               Dibujo del menu, categorias, cantidades, total.
  js/api.js                   Unica parte que habla con el servidor.
  js/pedido.js                Pantallas del pedido y datos guardados en el equipo.
  js/horario.js               Cartel Abierto/Cerrado (hora de Buenos Aires).
  sw.js                       Service worker (ver 3.3).
  manifest.webmanifest        Datos para instalar la app en el celular.
  _headers                    Cabeceras de seguridad (ver 3.5).
supabase/migrations/          Cambios de la base, numerados y en orden.
supabase/functions/           Codigo que corre en el servidor (crear-pedido).
scripts/generar-semilla.mjs   Arma la carga inicial del menu en la base.
tailwind.config.js            Colores y tipografias de la marca.
package.json                  Comandos del proyecto. Una sola dependencia.
.env.example                  Lista de secretos del servidor (sin valores).

Por que los JS estan separados: cada archivo tiene una sola responsabilidad.
Cambiar un precio toca datos-menu.js y nada mas; cambiar la regla del telefono
toca validaciones.js. Se cargan en orden desde index.html.


3. CADA BLOQUE: QUE HACE Y POR QUE SE ELIGIO

3.1 Sin framework (React, Vue, etc.)
La app tiene pocas pantallas. Un framework agregaria cientos de paquetes de
terceros que hay que mantener y actualizar por seguridad. Cuando se construya
el tablero se vuelve a evaluar.

3.2 Tailwind compilado, no por CDN
El CDN es para pruebas: baja un compilador de 300 KB en cada visita, depende
de un tercero y obliga a permitir scripts externos en la politica de
seguridad. Compilado genera un CSS de ~19 KB con solo lo que se usa.

3.3 Service worker (sw.js)
Permite abrir la app aunque la senal sea mala y la hace instalable. Usa "red
primero, copia guardada de respaldo": si hay internet siempre ve lo ultimo, y
solo sin conexion usa la copia. VERSION se sube en cada publicacion para que
los celulares descarten la copia vieja. Nunca toca los pedidos (otro origen).

3.4 config.js y la clave "anon"
La clave anon es publica por diseno; cualquiera puede verla en el navegador.
No es un secreto. Lo que protege los datos son las reglas de la base (3.6).
La clave "service_role" (acceso total) no va jamas en src/: vive solo en los
secretos del servidor, donde la usa la funcion.

3.5 _headers (cabeceras de seguridad)
- Content-Security-Policy: el navegador solo carga recursos de los origenes
  listados; bloquea objetos embebidos, <base> y que otro sitio meta la app en
  un iframe (clickjacking).
- Strict-Transport-Security: obliga HTTPS.
- X-Content-Type-Options, Referrer-Policy, Permissions-Policy: cierran
  comportamientos del navegador que la app no necesita.
Funciona tal cual en Cloudflare Pages y Netlify. Ver limite en 8.1.

3.6 Base de datos (0001_esquema.sql)
- Reglas CHECK en las tablas: aunque algo fallara antes, la base rechaza
  tipos invalidos, cantidades fuera de 1-20, textos demasiado largos.
- RLS (Row Level Security) activo en todas las tablas. Sin politicas, nadie
  puede leer ni escribir. Solo el menu activo es publico. Los pedidos no los
  puede leer ni el navegador ni la clave anon: ni los propios.
- pedido_items guarda copia del nombre y precio del momento: cambiar un
  precio hoy no altera los pedidos de ayer.
- impreso / sincronizado_sheets: columnas listas para la etapa siguiente.

3.7 Funcion crear_pedido (dentro de 0001)
Crea pedido y productos en una sola transaccion: o queda todo o nada.
- Busca cada producto por codigo y usa el precio de la BASE. Lo que el
  navegador diga sobre precios o totales se ignora.
- Limita el ritmo: 5 pedidos cada 10 minutos por IP y 3 por telefono.
- security definer + search_path fijo + permiso de ejecucion solo para
  service_role: ni anon ni usuarios logueados pueden llamarla.
- Usa jsonb y consultas con parametros: no se arma SQL con texto del usuario.

3.8 Edge Function crear-pedido
Es el filtro previo. El navegador no habla con la base: habla con esta
funcion, que:
1. acepta solo POST, solo JSON, maximo 10 KB;
2. acepta solo los origenes de ORIGENES_PERMITIDOS (CORS);
3. valida todo de nuevo (el chequeo del navegador es solo comodidad):
   tipo, hora, telefono, largos, hasta 30 productos, 1-20 unidades, sin
   codigos repetidos, quita caracteres de control;
4. guarda un hash con sal de la IP, no la IP;
5. devuelve errores genericos al cliente; el detalle queda en el log.

3.9 Semilla del menu (0002 + scripts/generar-semilla.mjs)
Se genera leyendo datos-menu.js, asi menu y base nunca difieren. Usa "on
conflict do nothing": correrla de nuevo NO pisa precios editados en la base.
El codigo de producto (ej. almuerzos-7-3) es el mismo en la app y la base.

3.10 Datos guardados en el equipo
"Recordar mis datos" usa localStorage del propio navegador: no pasan por el
servidor. Quien comparta el equipo podria verlos; hay opcion de borrarlos.


4. SEGURIDAD: AMENAZA -> DEFENSA

- Cambiar precios o total desde el navegador   -> el servidor recalcula con la base.
- Inyeccion SQL                                -> sin SQL armado con texto; jsonb y parametros.
- XSS (codigo malicioso en un texto)           -> CSP, limpieza de caracteres de control,
                                                  y el tablero debera mostrar todo como
                                                  TEXTO (textContent), nunca como HTML.
- Spam o pedidos masivos                       -> limite por IP y telefono, tope de tamano,
                                                  de items y de unidades.
- Leer pedidos de otras personas               -> RLS sin politicas + permisos revocados.
- Robo de claves                               -> service_role solo en secretos del servidor.
- CSRF                                         -> no hay sesion ni cookies; exige JSON y origen.
- Dato interno filtrado en errores             -> mensajes genericos; detalle solo en logs.
- Ataque de red masivo (DDoS)                  -> no lo cubre este codigo: poner Cloudflare
                                                  (plan gratis) delante del dominio.
- Datos personales                             -> se pide lo minimo. Aplica la Ley 25.326:
                                                  consultar con un profesional el aviso de
                                                  privacidad y si hay que inscribir la base.
- Dependencias                                 -> una sola (Tailwind, version fija, solo para
                                                  compilar). En produccion no se carga nada de npm.


5. PUESTA EN MARCHA, PASO A PASO
1. Instalar Node.js 20 o mas y la Supabase CLI.
2. Crear un proyecto en supabase.com (guardar la clave de base de datos).
3. En esta carpeta:  supabase init   y luego   supabase link --project-ref SU_REF
4. Crear la base:    supabase db push      (aplica 0001 y 0002 en orden)
5. Secretos:         supabase secrets set ORIGENES_PERMITIDOS=https://su-dominio.com SAL_IP=$(openssl rand -hex 16)
6. Publicar funcion: supabase functions deploy crear-pedido
7. En src/js/config.js poner la URL del proyecto y la clave anon
   (Project Settings > API).
8. Poner el logo en src/img/logo.png y los iconos src/img/icon-192.png y
   icon-512.png (se generan a partir del logo).
9. npm install  y  npm run build   (crea la carpeta dist/)
10. Publicar dist/ en Cloudflare Pages o Netlify, conectado al repositorio
    de GitHub: comando de build "npm run build", carpeta "dist".
11. Hacer un pedido de prueba y verlo en Supabase > Table Editor > pedidos.


6. COMO ACTUALIZAR SIN ROMPER TODO
- Todo el codigo en Git (GitHub). Nunca se edita directo lo publicado.
- Cada cambio va en una rama; Cloudflare/Netlify generan una direccion de
  prueba. Si esta bien se une a la rama principal; si no, se descarta.
- Si algo falla ya publicado, se vuelve a la version anterior con un clic.
- Cambios en la base: SIEMPRE un archivo nuevo (0003_..., 0004_...). Los
  ya aplicados no se editan.
- Antes de cada publicacion subir VERSION en src/sw.js.
- Hasta que exista el tablero, un cambio de precio se hace en datos-menu.js
  y en la tabla productos. El total valido es siempre el del servidor.


7. ETAPA SIGUIENTE: COMO ENCAJA CADA PIEZA
- Tablero: app aparte, acceso con Supabase Auth (con verificacion en dos
  pasos), rol de personal en una tabla, politicas RLS solo para ese rol,
  pedidos nuevos en tiempo real con sonido. Alta, baja y edicion de menu.
  El menu de la app pasara a leerse de la base.
- Impresora de comandas: programa en la PC del local que escucha pedidos con
  impreso=false, imprime y los marca.
- Google Sheets: funcion programada que toma pedidos con
  sincronizado_sheets=false y los escribe con una cuenta de servicio de
  Google. Si las planillas pudieran cambiar precios, esos cambios se
  validaran antes de llegar a la base.
- Avisos push: tabla de suscripciones, claves VAPID y una funcion de envio
  que dispara el tablero. En iPhone solo llegan si la app esta instalada.


8. LIMITES CONOCIDOS (HONESTOS)
8.1 La pantalla usa "onclick" dentro del HTML, y por eso la CSP necesita
    'unsafe-inline', que la debilita contra XSS. Hoy es un riesgo bajo
    (no se muestra texto ajeno como HTML), pero conviene cambiar los onclick
    por addEventListener y quitar 'unsafe-inline'.
8.2 Los JS comparten ambito global (sin modulos ES). Es simple pero fragil si
    el proyecto crece: migrar a modulos en la etapa del tablero.
8.3 El control de origen (CORS) frena abuso casual; fuera de un navegador se
    puede falsificar. La defensa real es validacion, limites y RLS.
8.4 El horario del pedido no se valida contra el horario del local.
8.5 No hay pruebas automaticas todavia, y esta entrega no se probo contra un
    proyecto Supabase real: hacer el pedido de prueba del paso 11.
8.6 Revisar en supabase.com/pricing las condiciones del plan gratuito
    (por ejemplo, pausa por inactividad), pues un local necesita que
    este siempre disponible.

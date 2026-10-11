// La clave "anon" es pública a propósito: va en el navegador de todos.
// Lo que protege los datos son las reglas de la base (RLS), no esconder esta clave.
// La clave "service_role" NO va nunca acá.
const CONFIG = {
    FUNCIONES_URL: 'https://TU-PROYECTO.supabase.co/functions/v1',
    ANON_KEY: 'TU-CLAVE-ANON'
};

// Mismas reglas que valida el servidor. Acá solo sirven para avisar rápido al usuario.
function validPhone(v) {
            if (!/^\+?\d+$/.test(v)) return false;
            let p = v.replace(/^\+/, '');
            if (p.length > 10 && p.startsWith('549')) p = p.slice(3);
            else if (p.length > 10 && p.startsWith('54')) p = p.slice(2);
            if (p.length === 11 && p[0] === '0') p = p.slice(1);
            return p.length === 10; // código de área + número
        }

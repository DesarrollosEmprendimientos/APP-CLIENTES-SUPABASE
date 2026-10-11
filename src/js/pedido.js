/* ---------- Flujo de pedido ---------- */
        const flowEl = () => document.getElementById('flow');
        const LOGO = `<img src="img/logo.png" alt="Restaurante del Parque" class="w-44 h-44 object-contain drop-shadow-2xl" onerror="this.onerror=null; this.src='logo restaurante del parque.png';">`;
        function flowScreen(title, sub, body, backFn) {
            const f = flowEl();
            f.classList.remove('hidden'); f.classList.add('flex');
            f.scrollTop = 0;
            f.innerHTML = `<div class="max-w-md w-full mx-auto flex flex-col flex-1">
                <button onclick="${backFn}" class="self-start text-xs font-bold text-rust-light hover:text-cream flex items-center space-x-2 pt-2"><i class="fa-solid fa-chevron-left"></i><span>Volver</span></button>
                <div class="text-center my-6">
                    <h2 class="text-2xl font-serif font-bold text-cream">${title}</h2>
                    ${sub ? `<p class="text-xs text-cream/70 mt-2">${sub}</p>` : ''}
                </div>${body}</div>`;
        }
        function closeFlow() { const f = flowEl(); f.classList.add('hidden'); f.classList.remove('flex'); }

        function startOrder() {
            if (!selected.size) { showToast('Elegí al menos un producto', 'fa-circle-exclamation'); return; }
            stepNotes();
        }

        let notes = {};
        function stepNotes() {
            const rows = [...selected].map(([k, q]) => {
                const it = itemOf(k);
                return `<div class="bg-navy-light rounded-2xl border border-cream/10 p-4">
                    <p class="text-sm font-bold text-cream">${q > 1 ? q + ' × ' : ''}${it.n}</p>
                    <input type="text" maxlength="120" autocomplete="off" value="${(notes[k] || '').replace(/"/g, '&quot;')}" oninput="notes['${k}']=this.value" placeholder="Ej: sin cebolla, bien cocida..." class="mt-2 w-full bg-navy border border-cream/20 rounded-xl px-3 py-3 text-cream placeholder-cream/40 focus:outline-none focus:border-rust">
                </div>`;
            }).join('');
            flowScreen('¿Querés especificar algo sobre algún pedido?', 'Es opcional: si no hace falta, continuá.', `<div class="space-y-3">${rows}</div>
                <button onclick="stepType()" class="mt-6 mb-2 w-full bg-rust hover:bg-rust-dark text-cream-light font-extrabold text-sm py-4 rounded-full shadow-lg uppercase tracking-wide active:scale-95 transition-all">Continuar</button>`, 'closeFlow()');
        }

        function stepType() {
            const b = (k, icon, label) => `<button onclick="pickType('${k}')" class="type-btn flex flex-col items-center justify-center gap-3 p-3 ${k === 'delivery' ? 'col-span-2 justify-self-center w-[calc(50%-.5rem)]' : ''}">${icon}<span class="text-[13px] font-extrabold text-navy leading-tight text-center">${label}</span></button>`;
            const moto = '<span class="moto text-4xl"><b></b><b></b><b></b><i class="fa-solid fa-motorcycle"></i></span>';
            flowScreen('Tu pedido es para...', '', `<div class="grid grid-cols-2 gap-4 my-auto pb-10">
                ${b('salon', '<i class="fa-solid fa-utensils text-4xl"></i>', 'Comer en salón')}
                ${b('retiro', '<i class="fa-solid fa-store text-4xl"></i>', 'Retirar por mostrador')}
                ${b('delivery', moto, 'Delivery')}</div>`, 'stepNotes()');
        }
        function pickType(k) { order.type = k; stepTime(); }

        function hhmm(min) {
            const d = new Date(Date.now() + min * 60000);
            d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
            return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        }
        function setTime(v) { document.getElementById('timeIn').value = v; document.getElementById('timeErr').textContent = ''; }
        function stepTime() {
            const chip = (m, l) => `<button onclick="setTime('${hhmm(m)}')" class="flex-1 py-2.5 rounded-xl border border-cream/20 bg-navy-light text-xs font-bold hover:border-rust active:bg-rust transition-colors">${l}<span class="block text-[11px] text-cream/60 font-semibold">${hhmm(m)}</span></button>`;
            flowScreen('¿Para qué hora lo querés?', 'Te sugerimos pedir con 30 minutos de anticipación.', `
                <div class="my-auto pb-10 space-y-4">
                    <input id="timeIn" type="time" value="${order.time || hhmm(30)}" class="w-full bg-navy-light border border-cream/20 rounded-2xl text-center text-4xl font-bold text-cream py-5 focus:outline-none focus:border-rust">
                    <div class="flex gap-2">${chip(30, '30 min')}${chip(45, '45 min')}${chip(60, '1 hora')}</div>
                    <p id="timeErr" class="text-xs text-rust-light font-bold text-center min-h-[1rem]"></p>
                    <button onclick="submitTime()" class="w-full bg-rust hover:bg-rust-dark text-cream-light font-extrabold text-sm py-4 rounded-full shadow-lg uppercase tracking-wide active:scale-95 transition-all">Continuar</button>
                </div>`, 'stepType()');
        }
        function submitTime() {
            const v = document.getElementById('timeIn').value;
            if (!v) { document.getElementById('timeErr').textContent = 'Elegí un horario para continuar.'; return; }
            order.time = v; stepData();
        }

        /* Datos guardados SOLO en este dispositivo (localStorage) */
        const LS = 'rdp_datos_v1';
        const loadSaved = () => { try { return JSON.parse(localStorage.getItem(LS)) || null; } catch (e) { return null; } };
        const saveData = d => { try { localStorage.setItem(LS, JSON.stringify(d)); } catch (e) {} };
        const forgetData = () => { try { localStorage.removeItem(LS); } catch (e) {} };

        function stepData() {
            const sv = loadSaved() || {};
            const fld = (id, label, ac, extra = '') => `<div><label for="${id}" class="text-xs font-bold text-cream/80">${label}</label>
                <input id="${id}" name="${id}" autocomplete="${ac}" ${extra} value="${(sv[id] || '').replace(/"/g, '&quot;')}" class="mt-1 w-full bg-navy-light border border-cream/20 rounded-xl px-4 py-3 text-cream focus:outline-none focus:border-rust">
                <p id="${id}Err" class="text-[11px] text-rust-light font-bold min-h-[1rem] mt-1"></p></div>`;
            flowScreen('Tus datos', 'Para avisarte cuando tu pedido esté listo.', `
                <form id="dataForm" onsubmit="submitData(event)" novalidate class="space-y-1 pb-8">
                    ${fld('nombre', 'Nombre', 'given-name')}
                    ${fld('apellido', 'Apellido', 'family-name')}
                    ${fld('telefono', 'Teléfono de contacto', 'tel', 'type="tel" inputmode="tel" maxlength="14" placeholder="Ej: 1167356810"')}
                    ${fld('empresa', 'Empresa', 'organization')}
                    <label class="flex items-center gap-3 py-2 text-xs text-cream/80 cursor-pointer">
                        <input type="checkbox" id="remember" ${sv.nombre ? 'checked' : ''} class="w-5 h-5 accent-orange-700">
                        <span>Recordar mis datos en este dispositivo</span>
                    </label>
                    ${sv.nombre ? '<button type="button" onclick="forgetData(); stepData();" class="text-[11px] text-rust-light font-bold underline pb-2">Borrar mis datos guardados</button>' : ''}
                    <p id="formErr" class="text-xs text-rust-light font-bold text-center min-h-[1rem] pb-2"></p>
                    <button type="submit" class="w-full bg-rust hover:bg-rust-dark text-cream-light font-extrabold text-sm py-4 rounded-full shadow-lg uppercase tracking-wide active:scale-95 transition-all">Confirmar pedido</button>
                </form>`, 'stepTime()');
            document.getElementById('telefono').addEventListener('input', e => { e.target.value = e.target.value.replace(/[^\d+]/g, ''); });
        }

        async function submitData(e) {
            e.preventDefault();
            const v = id => document.getElementById(id).value.trim();
            const d = { nombre: v('nombre'), apellido: v('apellido'), telefono: v('telefono'), empresa: v('empresa') };
            const errs = {};
            ['nombre', 'apellido', 'empresa'].forEach(k => { if (!d[k]) errs[k] = 'Este campo es obligatorio.'; });
            if (!d.telefono) errs.telefono = 'Ingresá tu teléfono.';
            else if (!validPhone(d.telefono)) errs.telefono = 'Ingresá 10 números: código de área + número, sin espacios, guiones, 0 ni 15 (ej: 1167356810).';
            Object.keys(d).forEach(k => { const el = document.getElementById(k + 'Err'); if (el) el.textContent = errs[k] || ''; });
            if (Object.keys(errs).length) { document.getElementById(Object.keys(errs)[0]).focus(); return; }
            document.getElementById('remember').checked ? saveData(d) : forgetData();
            order.data = d;
            const btn = e.submitter, aviso = document.getElementById('formErr');
            btn.disabled = true; aviso.textContent = '';
            try { await enviarPedido(armarPedido()); stepThanks(); }
            catch (err) { aviso.textContent = err.message; btn.disabled = false; }
        }

        function stepThanks() {
            const f = flowEl();
            f.innerHTML = `<div class="m-auto flex flex-col items-center text-center" style="perspective:800px">
                <div class="spin-logo">${LOGO}</div>
                <h2 class="text-2xl font-serif font-bold text-cream mt-8">Gracias por tu pedido</h2>
                <p class="mt-2 text-sm font-extrabold tracking-widest text-rust-light uppercase">Restaurante del Parque</p></div>`;
            setTimeout(() => {
                closeFlow(); closeMenu();
                selected.clear(); notes = {}; order = {}; state = { view: 'home', sec: null };
            }, 4000);
        }

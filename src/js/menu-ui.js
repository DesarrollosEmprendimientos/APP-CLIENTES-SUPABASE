const selected = new Map(); // clave -> cantidad
        let state = { view: 'home', sec: null };
        let order = {};
        const money = n => n.toLocaleString('es-AR');
        const itemOf = k => { const [s, c, i] = k.split('|'); return MENU[s].cats[c].items[i]; };

        function card(icon, name, desc, onclick) {
            return `<div class="bg-navy-light p-4 rounded-2xl border border-cream/10 flex items-center justify-between hover:border-rust cursor-pointer transition-all group" onclick="${onclick}">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-xl bg-rust/20 flex items-center justify-center text-rust-light group-hover:bg-rust group-hover:text-cream transition-colors"><i class="fa-solid ${icon} text-xl"></i></div>
                    <div><h4 class="font-bold text-cream group-hover:text-rust-light transition-colors">${name}</h4><p class="text-xs text-cream/60">${desc}</p></div>
                </div><i class="fa-solid fa-chevron-right text-cream/40 group-hover:translate-x-1 transition-transform"></i>
            </div>`;
        }

        function render() {
            const list = document.getElementById('viewList');
            const back = document.getElementById('backBtn');
            if (state.view === 'home') {
                back.classList.add('hidden'); back.classList.remove('flex');
                document.getElementById('viewEyebrow').textContent = '¡Bienvenido/a!';
                document.getElementById('viewTitle').textContent = '¿Qué te gustaría pedir hoy?';
                document.getElementById('overlaySub').textContent = 'Menú Principal';
                list.innerHTML = homeCards.map(h => card(h[1], h[2], h[3], `selectSection('${h[0]}')`)).join('');
            } else {
                const sec = MENU[state.sec];
                back.classList.remove('hidden'); back.classList.add('flex');
                document.getElementById('viewEyebrow').textContent = 'Elegí una categoría';
                document.getElementById('viewTitle').textContent = sec.title;
                document.getElementById('overlaySub').textContent = sec.title;
                list.innerHTML = sec.cats.map((c, ci) => `
                    <div>
                        <div id="cat-${ci}" class="bg-navy-light p-4 rounded-2xl border border-cream/10 flex items-center justify-between hover:border-rust cursor-pointer transition-all group" onclick="toggleCat(${ci})" role="button" aria-expanded="false">
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 rounded-xl bg-rust/20 flex items-center justify-center text-rust-light group-hover:bg-rust group-hover:text-cream transition-colors"><i class="fa-solid ${c.i} text-xl"></i></div>
                                <div><h4 class="font-bold text-cream">${c.n}</h4><p class="text-xs text-cream/60">${c.d}</p></div>
                            </div>
                            <i class="fa-solid fa-chevron-down text-cream/40 transition-transform duration-300"></i>
                        </div>
                        <div class="acc-body" id="acc-${ci}"><div>
                            <div class="grid grid-cols-1 gap-2 pt-2 pl-3 border-l-2 border-rust/40 ml-6 mt-1">${c.items.map((it, ii) => rowHTML(`${state.sec}|${ci}|${ii}`)).join('')}</div>
                        </div></div>
                    </div>`).join('') +
                    `<button onclick="startOrder()" class="mt-3 w-full bg-rust hover:bg-rust-dark text-cream-light font-extrabold text-sm py-4 rounded-full shadow-lg uppercase tracking-wide transition-all active:scale-95">Realizar pedido<span id="orderTotal" class="block text-xs font-bold mt-1 opacity-90">TOTAL: 0</span></button>`;
            }
            updateFooter();
        }

        const qOf = k => selected.get(k) || 0;
        function rowHTML(key) {
            const [sec, ci, ii] = key.split('|');
            const cat = MENU[sec].cats[ci], it = cat.items[ii], q = qOf(key), on = q > 0;
            const info = `<span class="min-w-0 flex-1 text-left"><span class="block text-sm font-semibold text-cream break-words">${it.n}</span>${it.note ? `<span class="block text-[11px] text-cream/60 leading-snug mt-0.5">${it.note}</span>` : ''}</span>`;
            const price = `<span class="text-xs font-bold text-cream shrink-0">${money(it.p)}</span>`;
            const cls = `opt ${on ? 'opt-on' : ''} w-full bg-navy-light px-4 py-3 rounded-xl border border-cream/10 transition-all duration-300`;
            const ic = (i) => `<span class="opt-ic w-6 h-6 rounded-full bg-rust/20 text-rust-light flex items-center justify-center text-[10px] transition-colors"><i class="fa-solid ${i}"></i></span>`;
            if (!cat.q) {
                return `<button data-key="${key}" onclick="toggleOpt('${key}')" aria-pressed="${on}" class="${cls} text-left flex items-center justify-between gap-3 hover:border-rust active:scale-[.98]">${info}<span class="flex items-center gap-2 shrink-0">${price}${ic(on ? 'fa-check' : 'fa-plus')}</span></button>`;
            }
            const stp = (d, i, l) => `<button aria-label="${l}" onclick="changeQ('${key}',${d})" class="w-10 h-10 rounded-full bg-cream text-rust flex items-center justify-center active:scale-90 transition-transform"><i class="fa-solid ${i}"></i></button>`;
            const ctl = on ? `<div class="flex items-center justify-end gap-4 mt-3">${stp(-1, 'fa-minus', 'Quitar uno')}<span class="min-w-[1.5rem] text-center font-extrabold text-lg text-cream">${q}</span>${stp(1, 'fa-plus', 'Agregar uno')}</div>` : '';
            return `<div data-key="${key}" class="${cls}"><button ${on ? '' : `onclick="changeQ('${key}',1)"`} class="w-full flex items-center justify-between gap-3 text-left">${info}<span class="flex items-center gap-2 shrink-0">${price}${on ? '' : ic('fa-plus')}</span></button>${ctl}</div>`;
        }
        function refreshRow(key) {
            const el = document.querySelector(`[data-key="${key}"]`);
            if (el) el.outerHTML = rowHTML(key);
            updateFooter();
        }
        function changeQ(key, d) {
            const cur = qOf(key);
            const q = (cur === 0 && d > 0) ? itemOf(key).start : Math.min(20, Math.max(0, cur + d));
            q ? selected.set(key, q) : selected.delete(key);
            refreshRow(key);
        }
        function toggleOpt(key) { selected.has(key) ? selected.delete(key) : selected.set(key, 1); refreshRow(key); }

        function toggleCat(ci) {
            const body = document.getElementById('acc-' + ci);
            const head = document.getElementById('cat-' + ci);
            const open = !body.classList.contains('open');
            document.querySelectorAll('.acc-body.open').forEach(el => {
                el.classList.remove('open');
                const h = document.getElementById(el.id.replace('acc', 'cat'));
                h.setAttribute('aria-expanded', 'false'); h.classList.remove('border-rust'); h.lastElementChild.style.transform = '';
            });
            if (open) {
                body.classList.add('open');
                head.setAttribute('aria-expanded', 'true'); head.classList.add('border-rust'); head.lastElementChild.style.transform = 'rotate(180deg)';
                setTimeout(() => head.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
            }
        }

        function updateFooter() {
            const n = [...selected.values()].reduce((a, b) => a + b, 0);
            const total = [...selected].reduce((t, [k, q]) => t + itemOf(k).p * q, 0);
            const ot = document.getElementById('orderTotal');
            if (ot) ot.textContent = 'TOTAL: ' + money(total);
            document.getElementById('footInfo').innerHTML = n
                ? `<i class="fa-solid fa-bag-shopping text-rust-light mr-1"></i> ${n} ${n === 1 ? 'producto' : 'productos'} · ${money(total)} · <button onclick="clearSelection()" class="underline text-rust-light font-bold">Limpiar</button>`
                : '<i class="fa-solid fa-clock text-rust-light mr-1"></i> Lunes a viernes de 8 a 15:30 hs';
        }
        function clearSelection() { selected.clear(); render(); }

        function openOverlay() {
            const o = document.getElementById('menuOverlay');
            o.classList.remove('opacity-0', 'pointer-events-none'); o.classList.add('opacity-100');
        }
        function enterRestaurant() {
            showToast('Cargando Carta Digital...', 'fa-circle-notch animate-spin');
            state = { view: 'home', sec: null };
            setTimeout(() => { render(); openOverlay(); }, 300);
        }
        function selectSection(key) { state = { view: 'cats', sec: key }; render(); document.getElementById('menuScroll').scrollTop = 0; }
        function goBack() { state = { view: 'home', sec: null }; render(); }
        function closeMenu() {
            const o = document.getElementById('menuOverlay');
            o.classList.remove('opacity-100'); o.classList.add('opacity-0', 'pointer-events-none');
        }

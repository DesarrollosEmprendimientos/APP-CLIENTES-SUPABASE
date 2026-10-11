function updateStatus() {
            const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
            const t = Object.fromEntries(fmt.formatToParts(new Date()).map(x => [x.type, x.value]));
            const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(t.weekday);
            const mins = (+t.hour) * 60 + (+t.minute);
            const open = day >= 1 && day <= 5 && mins >= 8 * 60 && mins < 15 * 60 + 30; // Lun-Vie 8:00 a 15:30
            document.getElementById('statusDot').className = 'w-2.5 h-2.5 rounded-full ' + (open ? 'bg-emerald-500 animate-pulse' : 'bg-red-500');
            document.getElementById('statusTxt').textContent = (open ? 'Abierto' : 'Cerrado') + ' • Parque Central';
        }
        updateStatus();
        setInterval(updateStatus, 30000);
        document.addEventListener('visibilitychange', updateStatus);

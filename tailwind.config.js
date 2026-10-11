// Los colores y fuentes de la marca salen del prototipo original.
const marca = {
            theme: {
                extend: {
                    colors: {
                        navy: {
                            DEFAULT: '#052d4b',
                            dark: '#031c30',
                            light: '#0a426d'
                        },
                        rust: {
                            DEFAULT: '#ac4c00',
                            dark: '#873c00',
                            light: '#d05e03'
                        },
                        cream: {
                            DEFAULT: '#f2edd2',
                            light: '#fefae8'
                        }
                    },
                    fontFamily: {
                        sans: ['Montserrat', 'sans-serif'],
                        serif: ['Playfair Display', 'serif']
                    },
                    animation: {
                        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }
                }
            }
        };

module.exports = { content: ['./src/**/*.{html,js}'], ...marca };

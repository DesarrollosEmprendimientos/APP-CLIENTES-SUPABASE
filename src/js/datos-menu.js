// Menú del local. Es lo que más va a cambiar, por eso vive solo en este archivo.
// El código de cada producto (seccion-categoria-posicion) es el mismo que usa la base.
const P = (n, i, d, items, q) => ({ n, i, d, q: !!q, items: items.map(t => { const [a, b, c, d] = t.split('|'); return { n: a, p: +b, note: c || '', start: +d || 1 }; }) });
        const MENU = {
            cafeteria: { title: 'Cafetería & Desayunos', cats: [
                P('Cafetería','fa-mug-hot','Cafés y tés',['Café pocillo|2000','Café jarrito|2500','Café doble|2800','Café con leche|3000','Té|1500','Té digestivo|1600','Té con leche|2000','Capuccino|3500','Submarino|3500'],1),
                P('Desayunos','fa-bread-slice','Medialunas y tostadas',['Medialunas c/u|700','Medialunas docena|8000','Medialunas de J y Q c/u|1200','Tostadas|4000|Mermelada o dulce de leche y queso crema|3'],1)
            ]},
            almuerzos: { title: 'Almuerzos', cats: [
                P('Entradas','fa-bowl-food','Para empezar',['Papas fritas c/s provenzal|5000','Bastones de muzzarella|5000','Tortilla de papas|5000','Bocaditos de pollo frito|5000|Con salsa de quesos']),
                P('Ensaladas','fa-leaf','Frescas y completas',['Ensalada completa con pollo|7500','Ensalada Caesar|7000','Ensalada de tres gustos|6000|Lechuga, tomate, arroz, zanahoria, huevo, arvejas, choclo, remolacha, cebolla, lentejas']),
                P('Guarniciones','fa-plate-wheat','Para acompañar',['Arroz|3500','Papas fritas|4000','Papas españolas|4000','Puré de papas|4000','Puré de calabaza|4000']),
                P('Empanadas','fa-moon','Horneadas',['Jamón y queso|1700','Carne cortada a cuchillo|1700','Carne picada|1700','Pollo|1700','Verdura|1700'],1),
                P('Pizza individual','fa-pizza-slice','Una por persona',['Muzzarella|6000','Jamón y huevo|7000','Jamón y morrón|7500']),
                P('Porciones','fa-bowl-rice','Porciones para compartir',['Arroz|4000','Papas fritas|5000','Papas españolas|5000','Puré de papas|5000','Puré de calabaza|5000']),
                P('Sandwich','fa-burger','Pan de pizza o pan árabe',['Simple|7500|Milanesa de pollo, carne, cerdo o pechuga grille','Completo|8000|Jamón, queso, lechuga y tomate','Adicional: huevo frito/hervido|1000']),
                P('Platos principales','fa-utensils','Todos vienen con guarnición',['Milanesa simple|8500','Milanesa napolitana|9500','Milanesa de berenjena|7000','Pechuga grille|8500','Pechuga a la crema de verdeo|9500','Omelette de jamón y queso|9000','Pastas caseras|9000','Churrasquitos de cerdo con salsa|10000','Bife a la riojana|12000']),
                P('Tostados','fa-bread-slice','Pan de pizza, árabe o de miga',['Jamón y queso|6000','Queso y tomate|5500']),
                P('Postres','fa-ice-cream','Para cerrar',['Flan|4000','Flan mixto|4500','Panqueque de dulce de leche|4000','Duraznos con crema y/o dulce de leche|4000','Adicional: dulce de leche o crema|500']),
                P('Bebidas','fa-glass-water','Sin alcohol',['Agua con gas|2000','Agua sin gas|2000','Agua saborizada|2400','Manaos 500 cc|2000','Coca Cola/Sprite 500 cc|2500','Agua 1,5 L|4000','Coca Cola/Sprite 1,5 L|5000','Manaos Cola 2,25 L|4500','Coca Cola/Sprite 2,25 L|6000','Exprimido de naranja|2500'],1)
            ]},
            vinos: { title: 'Vinos & Espumantes', cats: [
                P('Vinos y espumantes','fa-wine-glass','Botellas',['Alma Mora|13000','Las Perdices|15000','Nicassia|20000','Sidra 1888|15000'])
            ]}
        };
        const homeCards = [
            ['cafeteria','fa-mug-hot','Cafetería & Desayunos','Cafés, tés, medialunas y tostadas'],
            ['almuerzos','fa-utensils','Almuerzos','Entradas, platos, pizzas y postres'],
            ['vinos','fa-wine-glass','Vinos & Espumantes','Vinos y sidra']
        ];

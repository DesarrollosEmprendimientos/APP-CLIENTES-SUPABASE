-- Menú, pedidos y la función que los registra.

create table categorias (
    id int generated always as identity primary key,
    codigo text not null unique,
    seccion text not null,
    nombre text not null check (char_length(nombre) between 1 and 80),
    icono text not null default 'fa-utensils',
    descripcion text not null default '',
    orden int not null default 0,
    permite_cantidad boolean not null default false,
    activo boolean not null default true
);

create table productos (
    id int generated always as identity primary key,
    codigo text not null unique,
    categoria_id int not null references categorias(id),
    nombre text not null check (char_length(nombre) between 1 and 120),
    precio numeric(10,2) not null check (precio >= 0),
    nota text not null default '',
    cantidad_inicial int not null default 1 check (cantidad_inicial between 1 and 20),
    orden int not null default 0,
    activo boolean not null default true
);

create table pedidos (
    id uuid primary key default gen_random_uuid(),
    numero bigint generated always as identity,
    tipo text not null check (tipo in ('salon', 'retiro', 'delivery')),
    hora_retiro time not null,
    nombre text not null check (char_length(nombre) between 1 and 60),
    apellido text not null check (char_length(apellido) between 1 and 60),
    telefono text not null check (char_length(telefono) between 8 and 14),
    empresa text not null check (char_length(empresa) between 1 and 80),
    total numeric(12,2) not null default 0,
    estado text not null default 'nuevo' check (estado in ('nuevo', 'preparando', 'listo', 'entregado', 'cancelado')),
    ip_hash text,
    impreso boolean not null default false,          -- lo usará la impresora de comandas
    sincronizado_sheets boolean not null default false, -- lo usará la sincronización con Sheets
    creado_en timestamptz not null default now()
);

create table pedido_items (
    id bigint generated always as identity primary key,
    pedido_id uuid not null references pedidos(id) on delete cascade,
    producto_id int not null references productos(id),
    nombre text not null,              -- copia del nombre y precio al momento de pedir,
    precio_unitario numeric(10,2) not null, -- así un cambio de precio no altera pedidos viejos
    cantidad int not null check (cantidad between 1 and 20),
    nota text check (nota is null or char_length(nota) <= 120),
    unique (pedido_id, producto_id)
);

create index on pedidos (ip_hash, creado_en);
create index on pedidos (telefono, creado_en);
create index on pedidos (estado, creado_en desc);

-- RLS: sin políticas = nadie entra. Solo el menú activo es público.
alter table categorias enable row level security;
alter table productos enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;

create policy menu_publico on categorias for select to anon, authenticated using (activo);
create policy menu_publico on productos for select to anon, authenticated using (activo);
revoke all on pedidos, pedido_items from anon, authenticated;

-- Crea el pedido completo o no crea nada. Solo la puede llamar la Edge Function.
create or replace function crear_pedido(p jsonb, p_ip_hash text)
returns table (pedido_numero bigint, pedido_total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id uuid;
    v_num bigint;
    v_total numeric(12,2) := 0;
    it jsonb;
    prod productos%rowtype;
    v_cant int;
    v_permite boolean;
begin
    -- tope de ritmo: 5 pedidos cada 10 min por IP y 3 por teléfono
    if (select count(*) from pedidos where ip_hash = p_ip_hash and creado_en > now() - interval '10 minutes') >= 5
       or (select count(*) from pedidos where telefono = p->>'telefono' and creado_en > now() - interval '10 minutes') >= 3 then
        raise exception 'LIMITE';
    end if;

    insert into pedidos (tipo, hora_retiro, nombre, apellido, telefono, empresa, ip_hash)
    values (p->>'tipo', (p->>'hora')::time, p->>'nombre', p->>'apellido', p->>'telefono',
            p->>'empresa', p_ip_hash)
    returning id, numero into v_id, v_num;

    for it in select * from jsonb_array_elements(p->'items') loop
        select * into prod from productos where codigo = it->>'codigo' and activo;
        if not found then raise exception 'PRODUCTO'; end if;

        v_cant := (it->>'cantidad')::int;
        select permite_cantidad into v_permite from categorias where id = prod.categoria_id;
        if v_cant > 1 and not v_permite then raise exception 'PRODUCTO'; end if;

        insert into pedido_items (pedido_id, producto_id, nombre, precio_unitario, cantidad, nota)
        values (v_id, prod.id, prod.nombre, prod.precio, v_cant, nullif(it->>'nota', ''));
        v_total := v_total + prod.precio * v_cant;
    end loop;

    update pedidos set total = v_total where id = v_id;
    return query select v_num, v_total;
end;
$$;

revoke execute on function crear_pedido(jsonb, text) from public, anon, authenticated;
grant execute on function crear_pedido(jsonb, text) to service_role;

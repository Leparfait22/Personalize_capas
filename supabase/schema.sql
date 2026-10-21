-- ==============================================================================
-- SCHEMAS & TABLES FOR PERSONALIZE / SNAPCASE E-COMMERCE
-- Execute este script no SQL Editor do seu Supabase Dashboard para criar o banco de dados.
-- ==============================================================================

-- 1. Tabela de Modelos de Celulares
CREATE TABLE IF NOT EXISTS phone_models (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  popular BOOLEAN DEFAULT false,
  base_price NUMERIC(10, 2) NOT NULL,
  dimensions_mm JSONB NOT NULL,
  aspect_ratio NUMERIC(5, 4) NOT NULL,
  corner_radius NUMERIC(5, 2) DEFAULT 14,
  camera_module JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Acabamentos de Capinhas
CREATE TABLE IF NOT EXISTS case_finishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  price_add NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  badge TEXT,
  popular_badge BOOLEAN DEFAULT false,
  border_style TEXT NOT NULL,
  features JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela Principal de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  customer_cpf TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping_cost NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit_card', 'debit_card')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'pending', 'failed', 'refunded')),
  payment_details JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_production', 'printed', 'shipped', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Itens do Pedido (Capinhas Customizadas)
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  finish_id TEXT NOT NULL,
  finish_name TEXT NOT NULL,
  case_color TEXT NOT NULL,
  customization JSONB NOT NULL,
  preview_mockup_url TEXT NOT NULL,
  high_res_print_url TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Carrinho de Compras (Guest Cart & Usuários Logados)
CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_email TEXT,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  finish_id TEXT NOT NULL,
  finish_name TEXT NOT NULL,
  case_color TEXT NOT NULL,
  customization JSONB NOT NULL,
  preview_mockup_url TEXT NOT NULL,
  high_res_print_url TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Perfis de Usuários (Vinculada ao auth.users nativo do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para sincronizar automaticamente quando um novo usuário se cadastra no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabela legado/fallback `users`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização de busca rápida
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- SEED DE DADOS INICIAIS DE ACABAMENTOS
INSERT INTO case_finishes (id, name, subtitle, description, price_add, badge, popular_badge, border_style, features)
VALUES 
  ('anti-impact', 'Anti-Impacto Pro', 'Proteção Militar 360°', 'Bordas elevadas com amortecedores Air-Cushion nos 4 cantos e policarbonato rígido de altíssima durabilidade.', 0.00, 'Mais Vendido', true, 'heavy', '["Proteção contra quedas de até 3m", "Bordas reforçadas em TPU", "Impressão UV de alta definição"]'),
  ('velvet-soft', 'Velvet Soft Touch', 'Toque Aveludado Premium', 'Revestimento interno em microfibra macia para evitar arranhões no vidro do aparelho e acabamento externo fosco acetinado.', 0.00, 'Premium', false, 'matte', '["Forro interno em microfibra", "Toque ultra suave antiderrapante", "Proteção de câmera elevada"]'),
  ('transparent-crystal', 'Transparente Crystal', 'Silicone Anti-Amarelamento', 'Material TPU Bayer alemão com tecnologia anti-amarelamento que preserva a cor original das laterais do celular.', 0.00, 'Slim', false, 'transparent', '["TPU alemão anti-amarelamento", "Ultra fina e leve (1.2mm)", "Botões táteis de alta precisão"]')
ON CONFLICT (id) DO NOTHING;

-- SEED DE MODELOS DE CELULARES INICIAIS
INSERT INTO phone_models (id, brand, name, tagline, popular, base_price, dimensions_mm, aspect_ratio, corner_radius, camera_module)
VALUES
  ('apple-iphone-16-pro-max', 'Apple', 'iPhone 16 Pro Max', 'Flagship 2024 · 6.9"', true, 79.90, '{"width": 77.6, "height": 163.0, "thickness": 8.25}', 0.476, 15, '{"x": 6, "y": 3.5, "width": 42, "height": 23, "shape": "island-triple", "borderRadius": 20, "backgroundColor": "rgba(30, 41, 59, 0.85)"}'),
  ('apple-iphone-16-pro', 'Apple', 'iPhone 16 Pro', 'Titanium · 6.3"', false, 79.90, '{"width": 71.5, "height": 149.6, "thickness": 8.25}', 0.477, 15, '{"x": 6, "y": 3.5, "width": 42, "height": 23, "shape": "island-triple", "borderRadius": 20, "backgroundColor": "rgba(30, 41, 59, 0.85)"}'),
  ('apple-iphone-15-pro-max', 'Apple', 'iPhone 15 Pro Max', 'Titanium · 6.7"', true, 79.90, '{"width": 76.7, "height": 159.9, "thickness": 8.25}', 0.479, 14, '{"x": 6, "y": 3.5, "width": 42, "height": 23, "shape": "island-triple", "borderRadius": 20, "backgroundColor": "rgba(30, 41, 59, 0.85)"}'),
  ('apple-iphone-15-pro', 'Apple', 'iPhone 15 Pro', 'Titanium · 6.1"', false, 79.90, '{"width": 70.6, "height": 146.6, "thickness": 8.25}', 0.481, 14, '{"x": 6, "y": 3.5, "width": 42, "height": 23, "shape": "island-triple", "borderRadius": 20, "backgroundColor": "rgba(30, 41, 59, 0.85)"}'),
  ('samsung-galaxy-s24-ultra', 'Samsung', 'Galaxy S24 Ultra', 'Galaxy AI · 6.8"', true, 79.90, '{"width": 79.0, "height": 162.3, "thickness": 8.6}', 0.486, 6, '{"x": 8, "y": 4, "width": 28, "height": 45, "shape": "linear-column", "borderRadius": 10, "backgroundColor": "transparent"}'),
  ('samsung-galaxy-s24-plus', 'Samsung', 'Galaxy S24+', 'Dynamic AMOLED · 6.7"', false, 79.90, '{"width": 75.9, "height": 158.5, "thickness": 7.7}', 0.478, 14, '{"x": 8, "y": 4, "width": 25, "height": 38, "shape": "linear-column", "borderRadius": 10, "backgroundColor": "transparent"}'),
  ('xiaomi-redmi-note-13-pro', 'Xiaomi', 'Redmi Note 13 Pro 5G', '200 MP · 6.67"', false, 79.90, '{"width": 74.2, "height": 161.1, "thickness": 7.98}', 0.460, 12, '{"x": 7, "y": 3.5, "width": 42, "height": 24, "shape": "rounded-square", "borderRadius": 16, "backgroundColor": "rgba(30, 41, 59, 0.85)"}'),
  ('motorola-edge-50-pro', 'Motorola', 'Motorola Edge 50 Pro', 'Pantone Certified · 6.7"', false, 79.90, '{"width": 72.4, "height": 161.2, "thickness": 8.19}', 0.449, 14, '{"x": 7, "y": 3.5, "width": 40, "height": 24, "shape": "rounded-square", "borderRadius": 18, "backgroundColor": "rgba(30, 41, 59, 0.7)"}')
ON CONFLICT (id) DO NOTHING;

-- SEED DE USUÁRIOS PARA TESTES (ADMINS E CLIENTES)
INSERT INTO users (id, name, email, password_hash, role)
VALUES
  ('usr_admin_01', 'Administrador Principal', 'admin@snapcasebr.com', 'admin123', 'admin'),
  ('usr_admin_02', 'Gerente de Produção', 'gerente@snapcasebr.com', 'gerente123', 'admin'),
  ('usr_cliente_01', 'Carlos Silva', 'carlos.silva@gmail.com', 'cliente123', 'customer'),
  ('usr_cliente_02', 'Mariana Costa', 'mariana.costa@hotmail.com', 'cliente123', 'customer')
ON CONFLICT (email) DO NOTHING;

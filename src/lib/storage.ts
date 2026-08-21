import { Order, PhoneModel } from "@/types";
import { INITIAL_PHONE_MODELS, CASE_FINISHES } from "@/data/catalog";

const STORAGE_KEYS = {
  ORDERS: "personalize_cases_orders_v1",
  MODELS: "personalize_cases_models_v2",
  CART: "personalize_cases_cart_v1",
};

/**
 * Cria pedidos de demonstração para alimentar a visualização do Lojista
 * com pedidos de ontem e de hoje para teste imediato
 */
export function getInitialDemoOrders(): Order[] {
  const now = new Date();
  
  // Ontem às 14:30
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(14, 30, 0, 0);

  // Ontem às 19:15
  const yesterdayEvening = new Date(now);
  yesterdayEvening.setDate(yesterdayEvening.getDate() - 1);
  yesterdayEvening.setHours(19, 15, 0, 0);

  // Hoje de manhã
  const todayMorning = new Date(now);
  todayMorning.setHours(9, 45, 0, 0);

  return [
    {
      id: "ord_1001",
      orderNumber: "PC-8921",
      customer: {
        name: "Mariana Oliveira Costa",
        email: "mariana.costa@email.com",
        whatsapp: "11987654321",
        cpf: "342.189.048-22",
      },
      shippingAddress: {
        zipCode: "01310-100",
        street: "Avenida Paulista",
        number: "1578",
        complement: "Apto 84",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
      },
      items: [
        {
          id: "item_1",
          model: INITIAL_PHONE_MODELS[0], // iPhone 16 Pro Max
          finish: CASE_FINISHES[0], // Anti-impacto
          caseColor: "#111827",
          customization: {
            imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
            scale: 1.1,
            position: { x: 0, y: 0 },
            rotation: 0,
          },
          previewMockupUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
          highResPrintUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=95",
          quantity: 1,
          unitPrice: 79.90,
          totalPrice: 79.90,
          createdAt: yesterday.toISOString(),
        }
      ],
      subtotal: 79.90,
      shippingCost: 14.90,
      discount: 0,
      totalAmount: 94.80,
      paymentMethod: "pix",
      paymentStatus: "paid",
      status: "in_production",
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
      notes: "Cliente pediu acabamento fosco suave.",
    },
    {
      id: "ord_1002",
      orderNumber: "PC-8922",
      customer: {
        name: "Lucas Gabriel Santos",
        email: "lucas.gsantos@gmail.com",
        whatsapp: "21998877665",
        cpf: "198.543.210-99",
      },
      shippingAddress: {
        zipCode: "22041-001",
        street: "Rua Barata Ribeiro",
        number: "450",
        complement: "Bloco B, 302",
        neighborhood: "Copacabana",
        city: "Rio de Janeiro",
        state: "RJ",
      },
      items: [
        {
          id: "item_2",
          model: INITIAL_PHONE_MODELS[6], // Galaxy S24 Ultra
          finish: CASE_FINISHES[1], // Velvet Soft
          caseColor: "#1e3a8a",
          customization: {
            imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
            scale: 1.05,
            position: { x: 5, y: -10 },
            rotation: 0,
          },
          previewMockupUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
          highResPrintUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=95",
          quantity: 2,
          unitPrice: 84.90,
          totalPrice: 169.80,
          createdAt: yesterdayEvening.toISOString(),
        }
      ],
      subtotal: 169.80,
      shippingCost: 0, // Frete grátis
      discount: 15.00,
      totalAmount: 154.80,
      paymentMethod: "credit_card",
      paymentStatus: "paid",
      status: "pending",
      createdAt: yesterdayEvening.toISOString(),
      updatedAt: yesterdayEvening.toISOString(),
    },
    {
      id: "ord_1003",
      orderNumber: "PC-8923",
      customer: {
        name: "Camila Fernandes Ribeiro",
        email: "camila.ribeiro@outlook.com",
        whatsapp: "31971234567",
        cpf: "512.443.889-11",
      },
      shippingAddress: {
        zipCode: "30140-071",
        street: "Rua Fernandes Tourinho",
        number: "810",
        neighborhood: "Savassi",
        city: "Belo Horizonte",
        state: "MG",
      },
      items: [
        {
          id: "item_3",
          model: INITIAL_PHONE_MODELS[3], // iPhone 15 Pro
          finish: CASE_FINISHES[2], // Transparente Crystal
          caseColor: "transparent",
          customization: {
            imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
            scale: 1.2,
            position: { x: 0, y: 0 },
            rotation: 0,
          },
          previewMockupUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
          highResPrintUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop&q=95",
          quantity: 1,
          unitPrice: 64.90,
          totalPrice: 64.90,
          createdAt: todayMorning.toISOString(),
        }
      ],
      subtotal: 64.90,
      shippingCost: 16.50,
      discount: 0,
      totalAmount: 81.40,
      paymentMethod: "pix",
      paymentStatus: "paid",
      status: "pending",
      createdAt: todayMorning.toISOString(),
      updatedAt: todayMorning.toISOString(),
    }
  ];
}

// Funções de Acesso a Pedidos
export function getSavedOrders(): Order[] {
  if (typeof window === "undefined") return getInitialDemoOrders();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!data) {
      const demo = getInitialDemoOrders();
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(demo));
      return demo;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao carregar pedidos do localStorage:", err);
    return getInitialDemoOrders();
  }
}

export function saveNewOrder(order: Order): void {
  if (typeof window === "undefined") return;
  try {
    const orders = getSavedOrders();
    const updated = [order, ...orders];
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
  } catch (err) {
    console.error("Erro ao salvar novo pedido:", err);
  }
}

export function updateOrderStatus(orderId: string, status: Order["status"]): void {
  if (typeof window === "undefined") return;
  try {
    const orders = getSavedOrders();
    const updated = orders.map((ord) =>
      ord.id === orderId ? { ...ord, status, updatedAt: new Date().toISOString() } : ord
    );
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
  } catch (err) {
    console.error("Erro ao atualizar status do pedido:", err);
  }
}

// Funções de Modelos de Celulares
export function getStoredPhoneModels(): PhoneModel[] {
  if (typeof window === "undefined") return INITIAL_PHONE_MODELS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MODELS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(INITIAL_PHONE_MODELS));
      return INITIAL_PHONE_MODELS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao carregar modelos:", err);
    return INITIAL_PHONE_MODELS;
  }
}

export function saveNewPhoneModel(model: PhoneModel): void {
  if (typeof window === "undefined") return;
  try {
    const models = getStoredPhoneModels();
    const updated = [...models, model];
    localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(updated));
  } catch (err) {
    console.error("Erro ao cadastrar modelo:", err);
  }
}

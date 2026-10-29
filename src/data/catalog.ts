import { PhoneModel, CaseFinish, CameraModuleConfig } from "@/types";

export const INITIAL_PHONE_MODELS: PhoneModel[] = [
  // --- APPLE ---
  {
    id: "iphone-16-pro-max",
    brand: "Apple",
    name: "iPhone 16 Pro Max",
    tagline: "Flagship Titânio / Tela 6.9\" / Câmera Tripla Pro",
    popular: true,
    basePrice: 79.90,
    dimensionsMm: { width: 77.6, height: 163.0, thickness: 8.25 },
    aspectRatio: 77.6 / 163.0,
    cornerRadius: 15,
    cameraModule: {
      x: 6,
      y: 3.5,
      width: 45,
      height: 24,
      borderRadius: 24,
      shape: "island-triple",
      backgroundColor: "rgba(22, 29, 41, 0.94)",
      borderColor: "rgba(255, 255, 255, 0.22)",
      lenses: [
        { x: 17, y: 8, radius: 6.2, ringColor: "#cbd5e1" },
        { x: 17, y: 20, radius: 6.2, ringColor: "#cbd5e1" },
        { x: 35, y: 14, radius: 6.2, ringColor: "#cbd5e1" },
      ],
      flash: { x: 35, y: 7.5, radius: 2.2, shape: "circle" },
      lidar: { x: 35, y: 20.5, radius: 2.2 },
    },
  },
  {
    id: "iphone-16-pro",
    brand: "Apple",
    name: "iPhone 16 Pro",
    tagline: "Display 6.3\" Super Retina XDR / Titânio",
    popular: true,
    basePrice: 79.90,
    dimensionsMm: { width: 71.5, height: 149.6, thickness: 8.25 },
    aspectRatio: 71.5 / 149.6,
    cornerRadius: 15,
    cameraModule: {
      x: 6,
      y: 3.5,
      width: 46,
      height: 25,
      borderRadius: 24,
      shape: "island-triple",
      backgroundColor: "rgba(22, 29, 41, 0.94)",
      borderColor: "rgba(255, 255, 255, 0.22)",
      lenses: [
        { x: 17.5, y: 8.5, radius: 6.4, ringColor: "#cbd5e1" },
        { x: 17.5, y: 21, radius: 6.4, ringColor: "#cbd5e1" },
        { x: 36, y: 14.8, radius: 6.4, ringColor: "#cbd5e1" },
      ],
      flash: { x: 36, y: 8, radius: 2.2, shape: "circle" },
      lidar: { x: 36, y: 21.5, radius: 2.2 },
    },
  },
  {
    id: "iphone-16",
    brand: "Apple",
    name: "iPhone 16 / 16 Plus",
    tagline: "Novo Módulo Vertical Pill / Lentes Espaciais",
    popular: true,
    basePrice: 79.90,
    dimensionsMm: { width: 71.6, height: 147.6, thickness: 7.8 },
    aspectRatio: 71.6 / 147.6,
    cornerRadius: 14,
    cameraModule: {
      x: 6.5,
      y: 3.5,
      width: 21,
      height: 22,
      borderRadius: 30,
      shape: "vertical-pill",
      backgroundColor: "rgba(18, 24, 38, 0.96)",
      borderColor: "rgba(255, 255, 255, 0.28)",
      lenses: [
        { x: 17, y: 8.2, radius: 6.2, ringColor: "#e2e8f0" },
        { x: 17, y: 19.8, radius: 6.2, ringColor: "#e2e8f0" },
      ],
      flash: { x: 31, y: 14, radius: 2.4, shape: "circle" },
    },
  },
  {
    id: "iphone-15-pro-max",
    brand: "Apple",
    name: "iPhone 15 Pro Max",
    tagline: "Titânio Aeroespacial / Tela 6.7\"",
    popular: true,
    basePrice: 79.90,
    dimensionsMm: { width: 76.7, height: 159.9, thickness: 8.25 },
    aspectRatio: 76.7 / 159.9,
    cornerRadius: 14,
    cameraModule: {
      x: 6,
      y: 3.5,
      width: 44,
      height: 24,
      borderRadius: 22,
      shape: "island-triple",
      backgroundColor: "rgba(24, 30, 42, 0.92)",
      borderColor: "rgba(255, 255, 255, 0.2)",
      lenses: [
        { x: 16.5, y: 8, radius: 5.8, ringColor: "#94a3b8" },
        { x: 16.5, y: 20, radius: 5.8, ringColor: "#94a3b8" },
        { x: 33.5, y: 14, radius: 5.8, ringColor: "#94a3b8" },
      ],
      flash: { x: 33.5, y: 7.5, radius: 2.2, shape: "circle" },
      lidar: { x: 33.5, y: 20.5, radius: 2.2 },
    },
  },
  {
    id: "iphone-15-pro",
    brand: "Apple",
    name: "iPhone 15 Pro",
    tagline: "Titânio Aeroespacial / Tela 6.1\" / Câmera Tripla Pro",
    popular: false,
    basePrice: 79.90,
    dimensionsMm: { width: 70.6, height: 146.6, thickness: 8.25 },
    aspectRatio: 70.6 / 146.6,
    cornerRadius: 14,
    cameraModule: {
      x: 6,
      y: 3.5,
      width: 44,
      height: 24,
      borderRadius: 22,
      shape: "island-triple",
      backgroundColor: "rgba(24, 30, 42, 0.92)",
      borderColor: "rgba(255, 255, 255, 0.2)",
      lenses: [
        { x: 16.5, y: 8, radius: 5.8, ringColor: "#94a3b8" },
        { x: 16.5, y: 20, radius: 5.8, ringColor: "#94a3b8" },
        { x: 33.5, y: 14, radius: 5.8, ringColor: "#94a3b8" },
      ],
      flash: { x: 33.5, y: 7.5, radius: 2.2, shape: "circle" },
      lidar: { x: 33.5, y: 20.5, radius: 2.2 },
    },
  },
  {
    id: "iphone-15",
    brand: "Apple",
    name: "iPhone 15 / 15 Plus",
    tagline: "Dynamic Island / Duas Lentes Diagonais",
    popular: false,
    basePrice: 79.90,
    dimensionsMm: { width: 71.6, height: 147.6, thickness: 7.8 },
    aspectRatio: 71.6 / 147.6,
    cornerRadius: 14,
    cameraModule: {
      x: 6,
      y: 3.5,
      width: 42,
      height: 23,
      borderRadius: 22,
      shape: "rounded-square",
      backgroundColor: "rgba(24, 30, 42, 0.92)",
      borderColor: "rgba(255, 255, 255, 0.2)",
      lenses: [
        { x: 16, y: 8, radius: 6.0, ringColor: "#94a3b8" },
        { x: 33, y: 19, radius: 6.0, ringColor: "#94a3b8" },
      ],
      flash: { x: 33, y: 8, radius: 2.2, shape: "circle" },
    },
  },
  {
    id: "iphone-13",
    brand: "Apple",
    name: "iPhone 13 / 14",
    tagline: "Mais Popular no Brasil / Lentes Diagonais",
    popular: true,
    basePrice: 79.90,
    dimensionsMm: { width: 71.5, height: 146.7, thickness: 7.65 },
    aspectRatio: 71.5 / 146.7,
    cornerRadius: 13,
    cameraModule: {
      x: 6,
      y: 3.5,
      width: 42,
      height: 23,
      borderRadius: 20,
      shape: "rounded-square",
      backgroundColor: "rgba(24, 30, 42, 0.92)",
      borderColor: "rgba(255, 255, 255, 0.2)",
      lenses: [
        { x: 16, y: 8, radius: 6.0, ringColor: "#94a3b8" },
        { x: 33, y: 19, radius: 6.0, ringColor: "#94a3b8" },
      ],
      flash: { x: 33, y: 8, radius: 2.2, shape: "circle" },
    },
  },

  // --- SAMSUNG ---
  {
    id: "galaxy-s24-ultra",
    brand: "Samsung",
    name: "Samsung Galaxy S24 Ultra",
    tagline: "Design Retangular / 5 Câmeras Flutuantes",
    popular: true,
    basePrice: 79.90,
    dimensionsMm: { width: 79.0, height: 162.3, thickness: 8.6 },
    aspectRatio: 79.0 / 162.3,
    cornerRadius: 5, // Formato quadrado característico do Ultra/Note
    cameraModule: {
      x: 6,
      y: 3.0,
      width: 38,
      height: 33,
      borderRadius: 8,
      shape: "island-quad",
      backgroundColor: "transparent",
      borderColor: "transparent",
      lenses: [
        { x: 14.5, y: 6.5, radius: 5.8, ringColor: "#cbd5e1" },
        { x: 14.5, y: 17.5, radius: 5.8, ringColor: "#cbd5e1" },
        { x: 14.5, y: 28.5, radius: 5.8, ringColor: "#cbd5e1" },
        { x: 30, y: 20, radius: 4.2, ringColor: "#94a3b8" },
      ],
      flash: { x: 30, y: 6.5, radius: 2.2, shape: "circle" },
      lidar: { x: 30, y: 13, radius: 2.4 },
    },
  },
  {
    id: "galaxy-s24",
    brand: "Samsung",
    name: "Samsung Galaxy S24 / S24+",
    tagline: "Lentes Verticais Flutuantes Minimalistas",
    popular: true,
    basePrice: 79.90,
    dimensionsMm: { width: 70.6, height: 147.0, thickness: 7.6 },
    aspectRatio: 70.6 / 147.0,
    cornerRadius: 14,
    cameraModule: {
      x: 6,
      y: 3.5,
      width: 26,
      height: 32,
      borderRadius: 14,
      shape: "linear-column",
      backgroundColor: "transparent",
      borderColor: "transparent",
      lenses: [
        { x: 14, y: 7.5, radius: 5.8, ringColor: "#e2e8f0" },
        { x: 14, y: 18.5, radius: 5.8, ringColor: "#e2e8f0" },
        { x: 14, y: 29.5, radius: 5.8, ringColor: "#e2e8f0" },
      ],
      flash: { x: 26, y: 10, radius: 2.0, shape: "circle" },
    },
  },
  {
    id: "samsung-galaxy-s24-plus",
    brand: "Samsung",
    name: "Galaxy S24+",
    tagline: "Dynamic AMOLED 6.7\" / 3 Câmeras Verticais",
    popular: false,
    basePrice: 79.90,
    dimensionsMm: { width: 75.9, height: 158.5, thickness: 7.7 },
    aspectRatio: 75.9 / 158.5,
    cornerRadius: 14,
    cameraModule: {
      x: 6,
      y: 3.5,
      width: 26,
      height: 32,
      borderRadius: 14,
      shape: "linear-column",
      backgroundColor: "transparent",
      borderColor: "transparent",
      lenses: [
        { x: 14, y: 7.5, radius: 5.8, ringColor: "#e2e8f0" },
        { x: 14, y: 18.5, radius: 5.8, ringColor: "#e2e8f0" },
        { x: 14, y: 29.5, radius: 5.8, ringColor: "#e2e8f0" },
      ],
      flash: { x: 26, y: 10, radius: 2.0, shape: "circle" },
    },
  },
  {
    id: "galaxy-a55",
    brand: "Samsung",
    name: "Samsung Galaxy A55 5G",
    tagline: "Top Vendas Intermediário Brasil",
    popular: true,
    basePrice: 79.90,
    dimensionsMm: { width: 77.4, height: 161.1, thickness: 8.2 },
    aspectRatio: 77.4 / 161.1,
    cornerRadius: 13,
    cameraModule: {
      x: 6,
      y: 3.5,
      width: 26,
      height: 32,
      borderRadius: 12,
      shape: "linear-column",
      backgroundColor: "transparent",
      borderColor: "transparent",
      lenses: [
        { x: 14, y: 7.5, radius: 5.6, ringColor: "#94a3b8" },
        { x: 14, y: 18.5, radius: 5.6, ringColor: "#94a3b8" },
        { x: 14, y: 29.5, radius: 5.6, ringColor: "#94a3b8" },
      ],
      flash: { x: 25, y: 13, radius: 2.0, shape: "circle" },
    },
  },

  // --- XIAOMI / REDMI ---
  {
    id: "redmi-note-13-pro",
    brand: "Xiaomi",
    name: "Redmi Note 13 Pro 5G",
    tagline: "Módulo Deco com Vidro Dividido / 200MP",
    popular: true,
    basePrice: 79.90,
    dimensionsMm: { width: 74.2, height: 161.2, thickness: 7.98 },
    aspectRatio: 74.2 / 161.2,
    cornerRadius: 12,
    cameraModule: {
      x: 5.5,
      y: 3.0,
      width: 52,
      height: 27,
      borderRadius: 16,
      shape: "rounded-square",
      backgroundColor: "rgba(15, 23, 42, 0.96)",
      borderColor: "rgba(255, 255, 255, 0.22)",
      partitionLines: true,
      badgeText: "200MP OIS",
      badgePosition: { x: 40, y: 7 },
      lenses: [
        { x: 16.5, y: 8.5, radius: 6.8, ringColor: "#f1f5f9" },
        { x: 16.5, y: 21, radius: 6.8, ringColor: "#f1f5f9" },
        { x: 39, y: 14.5, radius: 3.6, ringColor: "#94a3b8" },
      ],
      flash: { x: 39, y: 22, radius: 2.4, shape: "pill" },
    },
  },
  {
    id: "xiaomi-14",
    brand: "Xiaomi",
    name: "Xiaomi 14 Pro / 14 (Leica)",
    tagline: "Módulo Quadrado Preto Cerâmica / 4 Câmeras Leica",
    popular: true,
    basePrice: 79.90,
    dimensionsMm: { width: 71.5, height: 152.8, thickness: 8.2 },
    aspectRatio: 71.5 / 152.8,
    cornerRadius: 13,
    cameraModule: {
      x: 5.5,
      y: 3.2,
      width: 48,
      height: 25.5,
      borderRadius: 18,
      shape: "island-quad",
      backgroundColor: "rgba(10, 15, 26, 0.97)",
      borderColor: "rgba(255, 255, 255, 0.28)",
      badgeText: "LEICA",
      badgePosition: { x: 29, y: 14.5 },
      lenses: [
        { x: 16, y: 8, radius: 5.6, ringColor: "#cbd5e1" },
        { x: 41, y: 8, radius: 5.6, ringColor: "#cbd5e1" },
        { x: 16, y: 20.5, radius: 5.6, ringColor: "#cbd5e1" },
        { x: 41, y: 20.5, radius: 5.6, ringColor: "#cbd5e1" },
      ],
      flash: { x: 29, y: 20.5, radius: 1.8, shape: "circle" },
    },
  },
  {
    id: "poco-x6-pro",
    brand: "Xiaomi",
    name: "Poco X6 Pro 5G",
    tagline: "Visor Preto Panorâmico POCO / 64MP OIS",
    popular: true,
    basePrice: 79.90,
    dimensionsMm: { width: 74.3, height: 160.5, thickness: 8.35 },
    aspectRatio: 74.3 / 160.5,
    cornerRadius: 12,
    cameraModule: {
      x: 4,
      y: 2.8,
      width: 92,
      height: 23,
      borderRadius: 14,
      shape: "full-visor",
      backgroundColor: "rgba(15, 23, 42, 0.96)",
      borderColor: "rgba(255, 255, 255, 0.22)",
      badgeText: "POCO 64MP",
      badgePosition: { x: 70, y: 13 },
      lenses: [
        { x: 16, y: 8.5, radius: 5.5, ringColor: "#cbd5e1" },
        { x: 35, y: 8.5, radius: 5.5, ringColor: "#cbd5e1" },
        { x: 16, y: 19.5, radius: 5.5, ringColor: "#cbd5e1" },
      ],
      flash: { x: 35, y: 19.5, radius: 3.5, shape: "circle" },
    },
  },

  // --- MOTOROLA ---
  {
    id: "moto-edge-50-pro",
    brand: "Motorola",
    name: "Motorola Edge 50 Pro",
    tagline: "Curvatura Suave / 50MP Pantonizado",
    popular: false,
    basePrice: 79.90,
    dimensionsMm: { width: 72.4, height: 161.2, thickness: 8.2 },
    aspectRatio: 72.4 / 161.2,
    cornerRadius: 16,
    cameraModule: {
      x: 6,
      y: 3.5,
      width: 44,
      height: 24,
      borderRadius: 22,
      shape: "rounded-square",
      backgroundColor: "rgba(255, 255, 255, 0.14)",
      borderColor: "rgba(255, 255, 255, 0.25)",
      badgeText: "50MP OIS",
      badgePosition: { x: 35, y: 21 },
      lenses: [
        { x: 16, y: 8.5, radius: 6.2, ringColor: "#cbd5e1" },
        { x: 16, y: 20, radius: 6.2, ringColor: "#cbd5e1" },
        { x: 35, y: 10, radius: 4.8, ringColor: "#cbd5e1" },
      ],
      flash: { x: 35, y: 16, radius: 2.0, shape: "circle" },
    },
  },
  {
    id: "motorola-moto-g54",
    brand: "Motorola",
    name: "Moto g54",
    tagline: "50MP OIS / 6.5\" 120Hz / Top Vendas Brasil",
    popular: true,
    basePrice: 79.90,
    dimensionsMm: { width: 73.8, height: 161.6, thickness: 8.0 },
    aspectRatio: 73.8 / 161.6,
    cornerRadius: 14,
    cameraModule: {
      x: 6,
      y: 3.5,
      width: 42,
      height: 24,
      borderRadius: 20,
      shape: "rounded-square",
      backgroundColor: "rgba(30, 41, 59, 0.9)",
      borderColor: "rgba(255, 255, 255, 0.2)",
      lenses: [
        { x: 16, y: 8, radius: 6.0, ringColor: "#cbd5e1" },
        { x: 16, y: 20, radius: 6.0, ringColor: "#cbd5e1" },
      ],
      flash: { x: 33, y: 14, radius: 2.2, shape: "circle" },
    },
  },
];

export const CASE_FINISHES: CaseFinish[] = [
  {
    id: "anti-impact",
    name: "Silicone Anti-Impacto com Borda Reforçada",
    subtitle: "Proteção Militar com Airbags nos 4 Cantos",
    description: "Nossa capinha mais resistente! Bordas elevadas que protegem tela e câmera contra quedas de até 2 metros. Impressão UV Ultra-HD direto na traseira rígida.",
    priceAdd: 0.00,
    badge: "MAIS VENDIDA",
    popularBadge: true,
    borderStyle: "heavy",
    features: [
      "Absorção de impacto de até 2 metros",
      "Airbags reforçados nos 4 cantos",
      "Bordas 1.5mm elevadas na tela e câmera",
      "Impressão UV de 9 cores em alta durabilidade"
    ]
  },
  {
    id: "velvet-soft",
    name: "Aveludada Soft Touch Premium",
    subtitle: "Toque Macio Aveludado com Forro Interno",
    description: "Inspirada nas capas originais. Acabamento externo acetinado que não marca digitais e forro interno aveludado em microfibra que evita riscos no aparelho.",
    priceAdd: 0.00,
    badge: "FINE TOUCH",
    popularBadge: false,
    borderStyle: "matte",
    features: [
      "Toque aveludado fosco ultra agradável",
      "Microfibra interna contra micro-riscos",
      "Acabamento anti-oleosidade e anti-manchas",
      "Cores vibrantes e textura matte"
    ]
  },
  {
    id: "clear-tpu",
    name: "Transparente Crystal Clear Flexível",
    subtitle: "TPU Alemão com Tecnologia Anti-Amarelamento",
    description: "Destaque o design original do seu smartphone com sua arte personalizada. Material transparente de alta flexibilidade e pegada firme.",
    priceAdd: 0.00,
    badge: "CLÁSSICA",
    popularBadge: false,
    borderStyle: "transparent",
    features: [
      "Transparência 99.8% com polímero anti-UV",
      "Maleável e fácil de colocar/remover",
      "Fina e super leve no bolso",
      "Excelente custo-benefício"
    ]
  },
  {
    id: "matte-black",
    name: "Black Matte Slim",
    subtitle: "Minimalismo Preto Fosco com Textura Grip",
    description: "Design ultrafino em preto fosco com textura que não escorrega da mão. Ideal para artes modernas, minimalistas ou fotos com fundo escuro.",
    priceAdd: 0.00,
    badge: "SLIM FIT",
    popularBadge: false,
    borderStyle: "colored",
    features: [
      "Espessura ultrafina de apenas 1.2mm",
      "Laterais com textura antiderrapante",
      "Preto acetinado de alta sofisticação",
      "Leve e discreta"
    ]
  }
];

export const CASE_COLORS = [
  { id: "black", name: "Preto Ônix", hex: "#111827", textColor: "#ffffff" },
  { id: "white", name: "Branco Puro", hex: "#f9fafb", textColor: "#111827" },
  { id: "transparent", name: "Transparente", hex: "rgba(255, 255, 255, 0.2)", textColor: "#ffffff", isTransparent: true },
  { id: "navy", name: "Azul Marinho", hex: "#1e3a8a", textColor: "#ffffff" },
  { id: "rose", name: "Rosa Quartz", hex: "#f43f5e", textColor: "#ffffff" },
  { id: "emerald", name: "Verde Militar", hex: "#065f46", textColor: "#ffffff" },
  { id: "purple", name: "Roxo Imperial", hex: "#6b21a8", textColor: "#ffffff" },
  { id: "wine", name: "Bordô / Vinho", hex: "#881337", textColor: "#ffffff" },
];

/**
 * Garante que qualquer modelo (do Supabase, localStorage ou customizado)
 * possua a configuração completa de lentes, flash, lidar e posicionamento
 * para renderizar com precisão os furos de câmera no mockup interativo.
 */
export function getEnrichedCameraModule(
  model: Partial<PhoneModel> | null | undefined
): CameraModuleConfig {
  if (!model) {
    return INITIAL_PHONE_MODELS[0].cameraModule;
  }

  const currentCam = model.cameraModule;
  // Se já possui lentes preenchidas e válidas, retorna direto
  if (currentCam && Array.isArray(currentCam.lenses) && currentCam.lenses.length > 0) {
    return currentCam as CameraModuleConfig;
  }

  const normalize = (str?: string) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

  const modelIdNorm = normalize(model.id);
  const modelNameNorm = normalize(model.name);

  // Procura correspondência em INITIAL_PHONE_MODELS por ID ou Nome
  const matched = INITIAL_PHONE_MODELS.find((m) => {
    const mIdNorm = normalize(m.id);
    const mNameNorm = normalize(m.name);

    if (mIdNorm === modelIdNorm || mNameNorm === modelNameNorm) return true;
    if (modelIdNorm && (mIdNorm.includes(modelIdNorm) || modelIdNorm.includes(mIdNorm))) return true;
    if (modelNameNorm && (mNameNorm.includes(modelNameNorm) || modelNameNorm.includes(mNameNorm))) return true;

    // Correspondências específicas para variações de IDs de banco
    if (modelNameNorm.includes("16promax") && mNameNorm.includes("16promax")) return true;
    if (modelNameNorm.includes("16pro") && !modelNameNorm.includes("max") && mNameNorm.includes("16pro") && !mNameNorm.includes("max")) return true;
    if (modelNameNorm.includes("15promax") && mNameNorm.includes("15promax")) return true;
    if (modelNameNorm.includes("15pro") && !modelNameNorm.includes("max") && mNameNorm.includes("15pro") && !mNameNorm.includes("max")) return true;
    if (modelNameNorm.includes("16") && !modelNameNorm.includes("pro") && mNameNorm.includes("16") && !mNameNorm.includes("pro")) return true;
    if (modelNameNorm.includes("15") && !modelNameNorm.includes("pro") && mNameNorm.includes("15") && !mNameNorm.includes("pro")) return true;
    if (modelNameNorm.includes("13") && mNameNorm.includes("13")) return true;
    if (modelNameNorm.includes("14") && !modelNameNorm.includes("xiaomi") && mNameNorm.includes("14") && !mNameNorm.includes("xiaomi")) return true;
    if (modelNameNorm.includes("s24ultra") && mNameNorm.includes("s24ultra")) return true;
    if ((modelNameNorm.includes("s24plus") || modelNameNorm.includes("s24+")) && (mNameNorm.includes("s24plus") || mNameNorm.includes("s24+"))) return true;
    if (modelNameNorm.includes("s24") && mNameNorm.includes("s24")) return true;
    if (modelNameNorm.includes("a55") && mNameNorm.includes("a55")) return true;
    if (modelNameNorm.includes("redminote13pro") && mNameNorm.includes("redminote13pro")) return true;
    if (modelNameNorm.includes("xiaomi14") && mNameNorm.includes("xiaomi14")) return true;
    if (modelNameNorm.includes("pocox6") && mNameNorm.includes("pocox6")) return true;
    if (modelNameNorm.includes("edge50pro") && mNameNorm.includes("edge50pro")) return true;
    if (modelNameNorm.includes("motog54") && mNameNorm.includes("motog54")) return true;

    return false;
  });

  if (matched?.cameraModule) {
    return {
      ...matched.cameraModule,
      ...(currentCam || {}),
      lenses: (currentCam?.lenses && currentCam.lenses.length > 0) ? currentCam.lenses : matched.cameraModule.lenses,
      flash: currentCam?.flash || matched.cameraModule.flash,
      lidar: currentCam?.lidar || matched.cameraModule.lidar,
      badgeText: currentCam?.badgeText || matched.cameraModule.badgeText,
      badgePosition: currentCam?.badgePosition || matched.cameraModule.badgePosition,
      partitionLines: currentCam?.partitionLines ?? matched.cameraModule.partitionLines,
      backgroundColor: currentCam?.backgroundColor ?? matched.cameraModule.backgroundColor,
      borderColor: currentCam?.borderColor ?? matched.cameraModule.borderColor,
    };
  }

  // Fallback baseado no formato físico do módulo (shape)
  const shape = currentCam?.shape || "island-triple";
  return generateFallbackCameraByShape(shape, currentCam);
}

function generateFallbackCameraByShape(
  shape: string,
  currentCam?: Partial<CameraModuleConfig>
): CameraModuleConfig {
  switch (shape) {
    case "island-triple":
      return {
        x: currentCam?.x ?? 6,
        y: currentCam?.y ?? 3.5,
        width: currentCam?.width ?? 45,
        height: currentCam?.height ?? 24,
        borderRadius: currentCam?.borderRadius ?? 24,
        shape: "island-triple",
        backgroundColor: currentCam?.backgroundColor ?? "rgba(22, 29, 41, 0.94)",
        borderColor: currentCam?.borderColor ?? "rgba(255, 255, 255, 0.22)",
        lenses: [
          { x: 17, y: 8, radius: 6.2, ringColor: "#cbd5e1" },
          { x: 17, y: 20, radius: 6.2, ringColor: "#cbd5e1" },
          { x: 35, y: 14, radius: 6.2, ringColor: "#cbd5e1" },
        ],
        flash: { x: 35, y: 7.5, radius: 2.2, shape: "circle" },
        lidar: { x: 35, y: 20.5, radius: 2.2 },
      };

    case "vertical-pill":
      return {
        x: currentCam?.x ?? 6.5,
        y: currentCam?.y ?? 3.5,
        width: currentCam?.width ?? 21,
        height: currentCam?.height ?? 22,
        borderRadius: currentCam?.borderRadius ?? 30,
        shape: "vertical-pill",
        backgroundColor: currentCam?.backgroundColor ?? "rgba(18, 24, 38, 0.96)",
        borderColor: currentCam?.borderColor ?? "rgba(255, 255, 255, 0.28)",
        lenses: [
          { x: 17, y: 8.2, radius: 6.2, ringColor: "#e2e8f0" },
          { x: 17, y: 19.8, radius: 6.2, ringColor: "#e2e8f0" },
        ],
        flash: { x: 31, y: 14, radius: 2.4, shape: "circle" },
      };

    case "linear-column":
      return {
        x: currentCam?.x ?? 6,
        y: currentCam?.y ?? 3.5,
        width: currentCam?.width ?? 26,
        height: currentCam?.height ?? 32,
        borderRadius: currentCam?.borderRadius ?? 14,
        shape: "linear-column",
        backgroundColor: currentCam?.backgroundColor ?? "transparent",
        borderColor: "transparent",
        lenses: [
          { x: 14, y: 7.5, radius: 5.8, ringColor: "#e2e8f0" },
          { x: 14, y: 18.5, radius: 5.8, ringColor: "#e2e8f0" },
          { x: 14, y: 29.5, radius: 5.8, ringColor: "#e2e8f0" },
        ],
        flash: { x: 26, y: 10, radius: 2.0, shape: "circle" },
      };

    case "island-quad":
      return {
        x: currentCam?.x ?? 6,
        y: currentCam?.y ?? 3.0,
        width: currentCam?.width ?? 38,
        height: currentCam?.height ?? 33,
        borderRadius: currentCam?.borderRadius ?? 8,
        shape: "island-quad",
        backgroundColor: currentCam?.backgroundColor ?? "transparent",
        borderColor: "transparent",
        lenses: [
          { x: 14.5, y: 6.5, radius: 5.8, ringColor: "#cbd5e1" },
          { x: 14.5, y: 17.5, radius: 5.8, ringColor: "#cbd5e1" },
          { x: 14.5, y: 28.5, radius: 5.8, ringColor: "#cbd5e1" },
          { x: 30, y: 20, radius: 4.2, ringColor: "#94a3b8" },
        ],
        flash: { x: 30, y: 6.5, radius: 2.2, shape: "circle" },
        lidar: { x: 30, y: 13, radius: 2.4 },
      };

    case "full-visor":
      return {
        x: currentCam?.x ?? 4,
        y: currentCam?.y ?? 2.8,
        width: currentCam?.width ?? 92,
        height: currentCam?.height ?? 23,
        borderRadius: currentCam?.borderRadius ?? 14,
        shape: "full-visor",
        backgroundColor: currentCam?.backgroundColor ?? "rgba(15, 23, 42, 0.96)",
        borderColor: currentCam?.borderColor ?? "rgba(255, 255, 255, 0.22)",
        badgeText: currentCam?.badgeText ?? "64MP OIS",
        badgePosition: currentCam?.badgePosition ?? { x: 70, y: 13 },
        lenses: [
          { x: 16, y: 8.5, radius: 5.5, ringColor: "#cbd5e1" },
          { x: 35, y: 8.5, radius: 5.5, ringColor: "#cbd5e1" },
          { x: 16, y: 19.5, radius: 5.5, ringColor: "#cbd5e1" },
        ],
        flash: { x: 35, y: 19.5, radius: 3.5, shape: "circle" },
      };

    case "rounded-square":
    default:
      return {
        x: currentCam?.x ?? 6,
        y: currentCam?.y ?? 3.5,
        width: currentCam?.width ?? 42,
        height: currentCam?.height ?? 23,
        borderRadius: currentCam?.borderRadius ?? 20,
        shape: "rounded-square",
        backgroundColor: currentCam?.backgroundColor ?? "rgba(24, 30, 42, 0.92)",
        borderColor: currentCam?.borderColor ?? "rgba(255, 255, 255, 0.2)",
        lenses: [
          { x: 16, y: 8, radius: 6.0, ringColor: "#94a3b8" },
          { x: 33, y: 19, radius: 6.0, ringColor: "#94a3b8" },
        ],
        flash: { x: 33, y: 8, radius: 2.2, shape: "circle" },
      };
  }
}


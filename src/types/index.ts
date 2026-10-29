export type SmartphoneBrand = "Apple" | "Samsung" | "Xiaomi" | "Motorola";

export interface CameraLens {
  x: number; // percentage from top-left of phone (0 to 100)
  y: number;
  radius: number; // in percentage of phone width
  ringColor?: string;
  hasReflection?: boolean;
}

export interface CameraModuleConfig {
  x: number; // percentage from top-left (e.g., 6% from left)
  y: number; // percentage from top (e.g., 4% from top)
  width: number; // percentage of phone width (e.g., 42%)
  height: number; // percentage of phone height (e.g., 22%)
  borderRadius: number; // in px or percentage
  shape: "rounded-square" | "vertical-pill" | "island-triple" | "island-quad" | "linear-column" | "full-visor" | "custom";
  lenses?: CameraLens[];
  backgroundColor?: string;
  borderColor?: string;
  flash?: { x: number; y: number; radius: number; shape?: "circle" | "pill" };
  lidar?: { x: number; y: number; radius: number };
  badgeText?: string;
  badgePosition?: { x: number; y: number };
  partitionLines?: boolean;
}

export interface PhoneModel {
  id: string;
  brand: SmartphoneBrand;
  name: string;
  tagline?: string;
  popular?: boolean;
  basePrice: number;
  dimensionsMm: {
    width: number;
    height: number;
    thickness: number;
  };
  // Aspect ratio for Canvas (width/height)
  aspectRatio: number;
  cornerRadius: number; // percentage
  cameraModule: CameraModuleConfig;
}

export interface CaseFinish {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  priceAdd: number;
  badge?: string;
  popularBadge?: boolean;
  borderStyle: "heavy" | "transparent" | "matte" | "colored";
  features: string[];
}

export interface ImageQualityRating {
  dpi: number;
  score: "excellent" | "good" | "fair" | "low";
  label: string;
  color: string;
  recommendation: string;
}

export interface CustomizationConfig {
  modelId: string;
  finishId: string;
  caseColor: string;
  imageUrl: string | null;
  imageFileName?: string;
  scale: number;
  position: { x: number; y: number };
  rotation: number;
  imageDimensions?: { width: number; height: number };
  qualityRating?: ImageQualityRating;
}

export interface CartItem {
  id: string;
  model: PhoneModel;
  finish: CaseFinish;
  caseColor: string;
  customization: {
    imageUrl: string;
    scale: number;
    position: { x: number; y: number };
    rotation: number;
  };
  previewMockupUrl: string;
  highResPrintUrl: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface OrderCustomer {
  name: string;
  email: string;
  whatsapp: string;
  cpf: string;
}

export interface OrderShippingAddress {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface ShippingOption {
  id: number | string;
  name: string; // Ex: "PAC", "SEDEX", ".Package", "Mini Envios"
  company: {
    id?: number;
    name: string; // Ex: "Correios", "Jadlog"
    picture?: string;
  };
  price: number;
  finalPrice: number;
  deliveryTime: number; // Prazo em dias úteis
  deliveryRange?: { min: number; max: number };
  error?: string;
}

export interface OrderShippingMethod {
  id: number | string;
  name: string;
  company: string;
  price: number;
  deliveryTime: number;
}

export type OrderStatus = "pending" | "in_production" | "printed" | "shipped" | "completed";

export type PaymentMethod = "pix" | "credit_card" | "debit_card";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

export interface PaymentDetails {
  gateway?: "asaas" | "mercadopago";
  asaasPaymentId?: string;
  asaasStatus?: string;
  asaasStatusDetail?: string;
  mercadopagoPaymentId?: string | number;
  mercadopagoStatus?: string;
  mercadopagoStatusDetail?: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  ticketUrl?: string;
  cardBrand?: string;
  cardLastFour?: string;
  installments?: number;
  installmentAmount?: number;
  preferenceId?: string;
  initPoint?: string;
  paidAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: OrderCustomer;
  shippingAddress: OrderShippingAddress;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  shippingMethod?: OrderShippingMethod;
  trackingCode?: string;
  labelUrl?: string;
  shipmentId?: string;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: PaymentDetails;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}



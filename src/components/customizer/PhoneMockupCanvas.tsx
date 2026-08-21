"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { PhoneModel, CaseFinish, CustomizationConfig } from "@/types";
import { evaluateImageQuality } from "@/lib/utils";

interface PhoneMockupCanvasProps {
  model: PhoneModel;
  finish: CaseFinish;
  customization: CustomizationConfig;
  onCustomizationChange: (newConfig: Partial<CustomizationConfig>) => void;
  onExportReady?: (getPreviews: () => { mockupUrl: string; highResUrl: string }) => void;
}

export default function PhoneMockupCanvas({
  model,
  finish,
  customization,
  onCustomizationChange,
  onExportReady,
}: PhoneMockupCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Carregar imagem quando URL mudar
  useEffect(() => {
    if (!customization.imageUrl) {
      imageElementRef.current = null;
      setImageLoaded(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = customization.imageUrl;
    img.onload = () => {
      imageElementRef.current = img;
      setImageLoaded(true);

      // Avaliar qualidade da imagem
      const quality = evaluateImageQuality(img.naturalWidth, img.naturalHeight);
      onCustomizationChange({
        imageDimensions: { width: img.naturalWidth, height: img.naturalHeight },
        qualityRating: quality,
      });
    };
  }, [customization.imageUrl]);

  // Função para desenhar o Canvas do Mockup
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resolução interna do canvas para alta nitidez na tela
    const width = 480;
    const height = Math.round(width / model.aspectRatio);
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const cornerRadius = (width * (model.cornerRadius || 14)) / 100;
    const padding = 8;
    const phoneW = width - padding * 2;
    const phoneH = height - padding * 2;
    const phoneX = padding;
    const phoneY = padding;

    // Helper: Caminho arredondado da capinha
    const createPhonePath = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // 1. Sombra exterior elegante da capinha
    ctx.save();
    createPhonePath(phoneX, phoneY, phoneW, phoneH, cornerRadius);
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = customization.caseColor === "transparent" ? "rgba(255,255,255,0.08)" : customization.caseColor;
    ctx.fill();
    ctx.restore();

    // 2. Fundo da capinha (Clipping Mask)
    ctx.save();
    createPhonePath(phoneX, phoneY, phoneW, phoneH, cornerRadius);
    ctx.clip();

    // Preenchimento de cor base
    if (customization.caseColor === "transparent") {
      // Fundo sutil com gradiente simulando TPU translúcido
      const grad = ctx.createLinearGradient(phoneX, phoneY, phoneX + phoneW, phoneY + phoneH);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.15)");
      grad.addColorStop(0.5, "rgba(200, 220, 240, 0.08)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0.12)");
      ctx.fillStyle = grad;
      ctx.fillRect(phoneX, phoneY, phoneW, phoneH);
    } else {
      ctx.fillStyle = customization.caseColor;
      ctx.fillRect(phoneX, phoneY, phoneW, phoneH);
    }

    // 3. Desenhar a Imagem do Cliente se existir
    if (imageElementRef.current) {
      const img = imageElementRef.current;
      ctx.save();

      const centerX = phoneX + phoneW / 2 + (customization.position.x * phoneW) / 100;
      const centerY = phoneY + phoneH / 2 + (customization.position.y * phoneH) / 100;

      ctx.translate(centerX, centerY);
      ctx.rotate((customization.rotation * Math.PI) / 180);

      // Calcular dimensões da imagem cobrindo a capa
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let drawW: number;
      let drawH: number;

      if (imgAspect > model.aspectRatio) {
        drawH = phoneH * customization.scale;
        drawW = drawH * imgAspect;
      } else {
        drawW = phoneW * customization.scale;
        drawH = drawW / imgAspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } else {
      // Placeholder elegante quando não há foto
      ctx.fillStyle = "rgba(0, 0, 0, 0.03)";
      ctx.fillRect(phoneX, phoneY, phoneW, phoneH);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "600 16px Inter, sans-serif";
      ctx.fillStyle = customization.caseColor === "transparent" ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.7)";
      ctx.fillText("Faça upload da sua foto", phoneX + phoneW / 2, phoneY + phoneH / 2 - 10);
      ctx.font = "400 13px Inter, sans-serif";
      ctx.fillStyle = customization.caseColor === "transparent" ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.45)";
      ctx.fillText("Arraste e ajuste no seu modelo", phoneX + phoneW / 2, phoneY + phoneH / 2 + 15);
    }

    // Brilho / Textura de superfície suave
    const surfaceGlow = ctx.createLinearGradient(phoneX, phoneY, phoneX + phoneW * 0.8, phoneY + phoneH);
    surfaceGlow.addColorStop(0, "rgba(255, 255, 255, 0.12)");
    surfaceGlow.addColorStop(0.3, "rgba(255, 255, 255, 0.02)");
    surfaceGlow.addColorStop(0.7, "rgba(0, 0, 0, 0.05)");
    surfaceGlow.addColorStop(1, "rgba(0, 0, 0, 0.2)");
    ctx.fillStyle = surfaceGlow;
    ctx.fillRect(phoneX, phoneY, phoneW, phoneH);

    ctx.restore(); // Fecha clipping da capa

    // 4. Módulo de Câmera e Lentes
    const cam = model.cameraModule;
    const camX = phoneX + (phoneW * cam.x) / 100;
    const camY = phoneY + (phoneH * cam.y) / 100;
    const camW = (phoneW * cam.width) / 100;
    const camH = (phoneH * cam.height) / 100;
    const camRadius = cam.borderRadius;

    // Se o modelo tem ilha de câmera (iPhone, Redmi, Xiaomi, etc.)
    if (cam.backgroundColor && cam.backgroundColor !== "transparent") {
      ctx.save();
      // Sombra da ilha
      ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      ctx.beginPath();
      ctx.roundRect(camX, camY, camW, camH, camRadius);
      ctx.fillStyle = cam.backgroundColor;
      ctx.fill();

      // Borda da ilha de câmera
      ctx.strokeStyle = cam.borderColor || "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Linhas de partição de vidro (Estilo exclusivo Deco Redmi Note 13 Pro)
      if (cam.partitionLines) {
        ctx.beginPath();
        ctx.roundRect(camX, camY, camW, camH, camRadius);
        ctx.clip();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
        ctx.lineWidth = 1;
        // Linha vertical separando sensores principais
        ctx.beginPath();
        ctx.moveTo(camX + camW * 0.65, camY);
        ctx.lineTo(camX + camW * 0.65, camY + camH);
        ctx.stroke();

        // Linha horizontal na seção direita
        ctx.beginPath();
        ctx.moveTo(camX + camW * 0.65, camY + camH * 0.52);
        ctx.lineTo(camX + camW, camY + camH * 0.52);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Texto de Badge (Ex: "200MP OIS", "LEICA", "POCO")
    if (cam.badgeText && cam.badgePosition) {
      ctx.save();
      const bx = phoneX + (phoneW * cam.badgePosition.x) / 100;
      const by = phoneY + (phoneH * cam.badgePosition.y) / 100;
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "bold 8.5px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cam.badgeText, bx, by);
      ctx.restore();
    }

    // Flash da Câmera (Circular ou Pill)
    if (cam.flash) {
      const fx = phoneX + (phoneW * cam.flash.x) / 100;
      const fy = phoneY + (phoneH * cam.flash.y) / 100;
      const fr = (phoneW * cam.flash.radius) / 100;
      ctx.save();

      if (cam.flash.shape === "pill") {
        // Dual Flash em formato Pill (Redmi Note 13 Pro)
        const pw = fr * 1.6;
        const ph = fr * 2.6;
        ctx.beginPath();
        ctx.roundRect(fx - pw / 2, fy - ph / 2, pw, ph, pw / 2);
        ctx.fillStyle = "#1e293b";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // LEDs âmbar e branco
        ctx.beginPath();
        ctx.arc(fx, fy - ph * 0.22, fr * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = "#fef08a";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(fx, fy + ph * 0.22, fr * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = "#fef9c3";
        ctx.fill();
      } else {
        // Flash True-Tone Circular
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fillStyle = "#1e293b";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(fx, fy, fr * 0.72, 0, Math.PI * 2);
        ctx.fillStyle = "#fef08a";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(fx, fy, fr * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
      ctx.restore();
    }

    // Sensor LiDAR / Laser AutoFocus (iPhone Pro / Galaxy Ultra)
    if (cam.lidar) {
      const lx = phoneX + (phoneW * cam.lidar.x) / 100;
      const ly = phoneY + (phoneH * cam.lidar.y) / 100;
      const lr = (phoneW * cam.lidar.radius) / 100;
      ctx.save();
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fillStyle = "#090d16";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Reflexo óptico infravermelho
      ctx.beginPath();
      ctx.arc(lx - lr * 0.2, ly - lr * 0.2, lr * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(99, 102, 241, 0.3)";
      ctx.fill();
      ctx.restore();
    }

    // Lentes da câmera
    if (cam.lenses && cam.lenses.length > 0) {
      cam.lenses.forEach((lens) => {
        const lx = phoneX + (phoneW * lens.x) / 100;
        const ly = phoneY + (phoneH * lens.y) / 100;
        const lr = (phoneW * lens.radius) / 100;

        ctx.save();
        // Aro metálico externo (com ringColor customizado)
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.fillStyle = "#1e293b";
        ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
        ctx.fill();
        ctx.strokeStyle = lens.ringColor || "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Lente interior escura
        ctx.beginPath();
        ctx.arc(lx, ly, lr * 0.78, 0, Math.PI * 2);
        ctx.fillStyle = "#090d16";
        ctx.fill();

        // Reflexos de luz azul/ciano na lente de vidro
        ctx.beginPath();
        ctx.arc(lx - lr * 0.25, ly - lr * 0.25, lr * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(147, 197, 253, 0.45)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(lx + lr * 0.2, ly + lr * 0.2, lr * 0.14, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fill();
        ctx.restore();
      });
    }

    // 5. Borda e Acabamento da Capinha (Airbags / Bumper)
    ctx.save();
    if (finish.borderStyle === "heavy") {
      // Borda reforçada com airbags nos 4 cantos
      createPhonePath(phoneX, phoneY, phoneW, phoneH, cornerRadius);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Destaques dos 4 airbags nos cantos
      const cornerSize = 14;
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      // Top-Left
      ctx.beginPath();
      ctx.arc(phoneX + cornerRadius * 0.6, phoneY + cornerRadius * 0.6, cornerSize / 2, 0, Math.PI * 2);
      ctx.fill();
      // Top-Right
      ctx.beginPath();
      ctx.arc(phoneX + phoneW - cornerRadius * 0.6, phoneY + cornerRadius * 0.6, cornerSize / 2, 0, Math.PI * 2);
      ctx.fill();
      // Bottom-Left
      ctx.beginPath();
      ctx.arc(phoneX + cornerRadius * 0.6, phoneY + phoneH - cornerRadius * 0.6, cornerSize / 2, 0, Math.PI * 2);
      ctx.fill();
      // Bottom-Right
      ctx.beginPath();
      ctx.arc(phoneX + phoneW - cornerRadius * 0.6, phoneY + phoneH - cornerRadius * 0.6, cornerSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (finish.borderStyle === "transparent") {
      createPhonePath(phoneX, phoneY, phoneW, phoneH, cornerRadius);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      createPhonePath(phoneX, phoneY, phoneW, phoneH, cornerRadius);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();
  }, [model, finish, customization, imageLoaded]);

  // Re-renderizar sempre que houver mudança
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Função para exportar tanto o Mockup quanto a Arte em Alta Resolução
  const getExportPreviews = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return {
        mockupUrl: customization.imageUrl || "",
        highResUrl: customization.imageUrl || "",
      };
    }

    try {
      const mockupUrl = canvas.toDataURL("image/png", 0.95);

      // Gerar arte em Alta Resolução (300 DPI - ~1200x2400) sem o overlay da capa
      const highResCanvas = document.createElement("canvas");
      const hrWidth = 1400;
      const hrHeight = Math.round(hrWidth / model.aspectRatio);
      highResCanvas.width = hrWidth;
      highResCanvas.height = hrHeight;
      const hrCtx = highResCanvas.getContext("2d");

      if (hrCtx) {
        // Cor de fundo
        hrCtx.fillStyle = customization.caseColor === "transparent" ? "#ffffff" : customization.caseColor;
        hrCtx.fillRect(0, 0, hrWidth, hrHeight);

        if (imageElementRef.current) {
          const img = imageElementRef.current;
          hrCtx.save();

          const centerX = hrWidth / 2 + (customization.position.x * hrWidth) / 100;
          const centerY = hrHeight / 2 + (customization.position.y * hrHeight) / 100;

          hrCtx.translate(centerX, centerY);
          hrCtx.rotate((customization.rotation * Math.PI) / 180);

          const imgAspect = img.naturalWidth / img.naturalHeight;
          let drawW: number;
          let drawH: number;

          if (imgAspect > model.aspectRatio) {
            drawH = hrHeight * customization.scale;
            drawW = drawH * imgAspect;
          } else {
            drawW = hrWidth * customization.scale;
            drawH = drawW / imgAspect;
          }

          hrCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          hrCtx.restore();
        }
      }

      const highResUrl = highResCanvas.toDataURL("image/png", 1.0);
      return { mockupUrl, highResUrl };
    } catch (err) {
      console.warn("Canvas export fallback:", err);
      return {
        mockupUrl: customization.imageUrl || "",
        highResUrl: customization.imageUrl || "",
      };
    }
  }, [model, customization]);

  // Passar função de exportação para componente pai
  useEffect(() => {
    if (onExportReady) {
      onExportReady(getExportPreviews);
    }
  }, [onExportReady, getExportPreviews]);

  // Gestos de Mouse / Touch para Arrastar e Posicionar
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!customization.imageUrl) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const deltaPercentX = (dx / canvasRef.current.clientWidth) * 100;
    const deltaPercentY = (dy / canvasRef.current.clientHeight) * 100;

    onCustomizationChange({
      position: {
        x: Math.max(-50, Math.min(50, customization.position.x + deltaPercentX)),
        y: Math.max(-50, Math.min(50, customization.position.y + deltaPercentY)),
      },
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers para Mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!customization.imageUrl || e.touches.length === 0) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;

    const deltaPercentX = (dx / canvasRef.current.clientWidth) * 100;
    const deltaPercentY = (dy / canvasRef.current.clientHeight) * 100;

    onCustomizationChange({
      position: {
        x: Math.max(-50, Math.min(50, customization.position.x + deltaPercentX)),
        y: Math.max(-50, Math.min(50, customization.position.y + deltaPercentY)),
      },
    });

    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center p-4 sm:p-8 bg-white rounded-3xl border border-zinc-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl"
    >
      {/* Badge do Modelo Ativo */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-zinc-900 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-zinc-800 shadow-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        {model.name}
      </div>

      {/* Canvas */}
      <div className="relative group cursor-grab active:cursor-grabbing max-w-[280px] sm:max-w-[320px] w-full transition-transform duration-300">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-auto drop-shadow-xl rounded-2xl select-none"
        />

        {/* Dica de interação ao passar o mouse */}
        {customization.imageUrl && (
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-white bg-zinc-950 px-3.5 py-1 rounded-full border border-zinc-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            👆 Clique e arraste para posicionar a foto
          </div>
        )}
      </div>
    </div>
  );
}

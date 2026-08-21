import React from "react";

interface LogoProps {
  variant?: "dark" | "light" | "auto";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
  iconPosition?: "left" | "right";
}

export default function Logo({
  variant = "auto",
  size = "md",
  showTagline = false,
  className = "",
  iconPosition = "right",
}: LogoProps) {
  // Configuração de tamanhos
  const textSize = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl sm:text-3xl",
  }[size];

  const iconSize = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }[size];

  // Cores de acordo com o tema
  const textColor = {
    dark: "text-zinc-950",
    light: "text-white",
    auto: "text-zinc-950 dark:text-white",
  }[variant];

  const iconBg = {
    dark: "bg-zinc-950 text-white",
    light: "bg-white text-zinc-950",
    auto: "bg-zinc-950 text-white",
  }[variant];

  // Ícone Squircle da Câmera estilo SnapCase oficial
  const CameraModuleIcon = () => (
    <div
      className={`${iconSize} rounded-[26%] ${iconBg} flex items-center justify-center p-1.5 shadow-sm shrink-0 transition-transform group-hover:scale-105`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Lente Superior Esquerda */}
        <circle cx="8" cy="8" r="4.2" fill="currentColor" fillOpacity="0.15" />
        <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="8" cy="8" r="1.2" fill="currentColor" />

        {/* Lente Inferior Direita */}
        <circle cx="20" cy="20" r="5" fill="currentColor" fillOpacity="0.15" />
        <circle cx="20" cy="20" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="20" r="1.5" fill="currentColor" />

        {/* Flash Pequeno Superior Direito */}
        <circle cx="20" cy="8" r="2" fill="currentColor" />
      </svg>
    </div>
  );

  return (
    <div className={`flex items-center gap-2 select-none group ${className}`}>
      {iconPosition === "left" && <CameraModuleIcon />}

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`${textSize} font-black tracking-tight ${textColor} font-display leading-none`}
          >
            SnapCase
          </span>
          {iconPosition === "right" && <CameraModuleIcon />}
        </div>
        {showTagline && (
          <span className="text-[10px] tracking-widest uppercase font-semibold text-zinc-400 mt-0.5">
            Estúdio de Capas
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

interface SquaresProps {
  direction?: "right" | "left" | "up" | "down" | "diagonal";
  speed?: number;
  squareSize?: number;
  borderColor?: string;
  hoverFillColor?: string;
  className?: string;
}

export function Squares({
  direction = "diagonal",
  speed = 0.4,
  squareSize = 48,
  borderColor = "rgba(79, 70, 229, 0.05)",
  hoverFillColor = "rgba(79, 70, 229, 0.08)",
  className = "",
}: SquaresProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let offsetX = 0;
    let offsetY = 0;

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    handleResize();

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (direction === "right") offsetX += speed;
      else if (direction === "left") offsetX -= speed;
      else if (direction === "down") offsetY += speed;
      else if (direction === "up") offsetY -= speed;
      else if (direction === "diagonal") {
        offsetX += speed;
        offsetY += speed;
      }

      offsetX %= squareSize;
      offsetY %= squareSize;

      const cols = Math.ceil(canvas.width / squareSize) + 2;
      const rows = Math.ceil(canvas.height / squareSize) + 2;

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;

      const hoverPos = hoverPosRef.current;

      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * squareSize + offsetX;
          const y = j * squareSize + offsetY;

          ctx.strokeRect(x, y, squareSize, squareSize);

          if (hoverPos) {
            const sqCenterX = x + squareSize / 2;
            const sqCenterY = y + squareSize / 2;
            const dist = Math.hypot(
              hoverPos.x - sqCenterX,
              hoverPos.y - sqCenterY,
            );
            if (dist < squareSize * 1.8) {
              const opacity = Math.max(0, 1 - dist / (squareSize * 1.8));
              ctx.fillStyle = hoverFillColor.replace(
                /[\d.]+\)$/,
                `${opacity * 0.12})`,
              );
              ctx.fillRect(x + 1, y + 1, squareSize - 2, squareSize - 2);
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      hoverPosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      hoverPosRef.current = null;
    };

    const container = canvas.parentElement;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [direction, speed, squareSize, borderColor, hoverFillColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${className}`}
    />
  );
}

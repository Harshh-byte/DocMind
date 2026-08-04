import React from "react";

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties["animationDuration"];
  thickness?: number;
};

const StarBorder = <T extends React.ElementType = "button">({
  as,
  className = "",
  color = "white",
  speed = "6s",
  thickness = 1,
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || "button";

  return (
    <>
      <style>{`
        .star-border-container {
          display: inline-block;
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .border-gradient-bottom {
          position: absolute;
          width: 300%;
          height: 50%;
          opacity: 0.85;
          bottom: -10px;
          right: -250%;
          border-radius: 50%;
          animation: star-movement-bottom linear infinite alternate;
          z-index: 0;
        }

        .border-gradient-top {
          position: absolute;
          opacity: 0.85;
          width: 300%;
          height: 50%;
          top: -10px;
          left: -250%;
          border-radius: 50%;
          animation: star-movement-top linear infinite alternate;
          z-index: 0;
        }

        .inner-content {
          position: relative;
          border: 1px solid rgba(79, 70, 229, 0.08);
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          color: #0f172a;
          font-size: 14px;
          font-weight: 700;
          text-align: center;
          padding: 10px 24px;
          border-radius: 16px;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .star-border-container:hover .inner-content {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(79, 70, 229, 0.2);
        }

        .star-border-container:hover {
          transform: translateY(-1px);
        }

        @keyframes star-movement-bottom {
          0% {
            transform: translate(0%, 0%);
            opacity: 1;
          }
          100% {
            transform: translate(-100%, 0%);
            opacity: 0.1;
          }
        }

        @keyframes star-movement-top {
          0% {
            transform: translate(0%, 0%);
            opacity: 1;
          }
          100% {
            transform: translate(100%, 0%);
            opacity: 0.1;
          }
        }
      `}</style>
      <Component
        className={`star-border-container ${className}`}
        {...(rest as any)}
        style={{
          padding: `${thickness}px`,
          ...(rest as any).style,
        }}
      >
        <div
          className="border-gradient-bottom"
          style={{
            background: `radial-gradient(circle, ${color}, transparent 10%)`,
            animationDuration: speed,
          }}
        />
        <div
          className="border-gradient-top"
          style={{
            background: `radial-gradient(circle, ${color}, transparent 10%)`,
            animationDuration: speed,
          }}
        />
        <div className="inner-content">{children}</div>
      </Component>
    </>
  );
};

export default StarBorder;

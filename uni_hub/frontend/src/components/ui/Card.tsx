import React, { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  className = "",
  headerAction,
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}
    >
      {title && (
        <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

export default Card;

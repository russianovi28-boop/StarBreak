import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "transition-all duration-300 transform active:scale-95 flex items-center justify-center";
  
  const variants = {
    primary: "px-8 py-3 rounded-sm font-display font-bold text-lg tracking-wider border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-cyan-600 border-cyan-400 text-white hover:bg-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:scale-105",
    secondary: "px-8 py-3 rounded-sm font-display font-bold text-lg tracking-wider border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-transparent border-slate-500 text-slate-300 hover:border-slate-300 hover:text-white hover:scale-105",
    danger: "px-8 py-3 rounded-sm font-display font-bold text-lg tracking-wider border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-red-600 border-red-400 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] hover:scale-105",
    outline: "px-10 py-4 border border-cyan-500 text-cyan-400 font-display tracking-[0.2em] text-sm uppercase bg-transparent hover:bg-cyan-500 hover:text-black hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:tracking-[0.25em]"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
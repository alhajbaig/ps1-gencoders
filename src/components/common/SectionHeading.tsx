import React from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  align?: 'left' | 'center';
  dark?: boolean;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  align = 'center',
  dark = false,
  className = '',
}) => {
  const isCenter = align === 'center';

  return (
    <div
      className={`max-w-3xl ${isCenter ? 'mx-auto text-center' : 'text-left'} ${className}`}
    >
      {eyebrow && (
        <span
          className={`inline-block text-xs font-semibold tracking-widest uppercase mb-3 ${
            dark ? 'text-red-400' : 'text-[#C1272D]'
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`font-poppins font-semibold tracking-tight text-3xl sm:text-4xl lg:text-5xl leading-[1.15] ${
          dark ? 'text-white' : 'text-[#0F172A]'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base sm:text-lg leading-relaxed font-normal text-balance ${
            dark ? 'text-slate-400' : 'text-[#64748B]'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
};

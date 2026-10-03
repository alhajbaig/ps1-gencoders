import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { PageTransition } from '../common/PageTransition';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, hideFooter = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#C1272D]/10 selection:text-[#C1272D]">
      <Navbar />
      <main className="flex-1 pt-18 sm:pt-20">
        <PageTransition>{children}</PageTransition>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

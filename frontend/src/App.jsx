import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/layout/Navbar';
import HeroSection from './components/sections/HeroSection';
import WhyChooseUsSection from './components/sections/WhyChooseUsSection';
import FeaturedListings from './components/sections/FeaturedListings';
import HowItWorksSection from './components/sections/HowItWorksSection';
import CommitmentSection from './components/sections/CommitmentSection';
import CTASection from './components/sections/CTASection';
import Footer from './components/layout/Footer';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SellCarPage from './pages/SellCarPage';
import MyListingsPage from './pages/MyListingsPage';
import BuyCarPage from './pages/BuyCarPage';
import AdminApprovalsPage from './pages/AdminApprovalsPage';

import './styles/global.css';

function HomePage() {
  return (
    <div className="app">
      <Navbar />
      <HeroSection />
      <WhyChooseUsSection />
      <HowItWorksSection />
      <CommitmentSection />
      <FeaturedListings />
      <CTASection />
      <Footer />
    </div>
  );
}

// Redirect to home if already logged in
function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

// Admin-only route
function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  return isAdmin ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/buy" element={<BuyCarPage />} />
      <Route path="/sell" element={<SellCarPage />} />
      <Route path="/my-listings" element={<MyListingsPage />} />
      <Route path="/admin/approvals" element={<AdminRoute><AdminApprovalsPage /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

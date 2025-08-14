import React, { useState } from "react";
import AuthModal from '../components/AuthModal';
import LandingPage from '../components/LandingPage';
import ClientInterface from '../components/ClientInterface';
import { useAuth } from '../hooks/useAuth';

export default function RestClient() {
  // Auth state
  const { user, isAuthenticated, loading: authLoading, handleAuthSuccess, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-cyan-950">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Loading AnMost...</p>
        </div>
      </div>
    );
  }

  const handleAuthSuccessAndClose = (user: any, token: string) => {
    handleAuthSuccess(user, token);
    setShowAuthModal(false);
  };

  return (
    <>
      {isAuthenticated ? (
        <ClientInterface user={user!} onLogout={logout} />
      ) : (
        <LandingPage onSignIn={() => setShowAuthModal(true)} />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccessAndClose}
      />
    </>
  );
}
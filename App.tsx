
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './pages/Layout';
import Marketplace from './pages/Marketplace';
import Notes from './pages/Notes';
import ScanTool from './pages/ScanTool';
import HandoverMap from './pages/HandoverMap';
import Login from './pages/Login';
import DealCompleted from './pages/DealCompleted';
import Profile from './pages/Profile';
import AddListing from './pages/AddListing';
import AddNote from './pages/AddNote';
import SupportHub from './pages/SupportHub';
import ItemDetail from './pages/ItemDetail';
import JWTHub from './pages/JWTHub';
import Onboarding from './components/Onboarding';
import { LanguageProvider } from './contexts/LanguageContext';
import { firestoreService } from './services/firestoreService';
import { User } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserStr = localStorage.getItem('user');
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    
    if (storedUserStr) {
      const initialUser = JSON.parse(storedUserStr) as User;
      setIsAuthenticated(true);
      if (!hasSeenOnboarding) setShowOnboarding(true);

      // Fix: Use UID for persistent cloud subscription
      const unsubscribe = firestoreService.subscribeToUser(initialUser.uid, (updatedUser) => {
        if (updatedUser) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          // If user document is lost, handle logout
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      });

      setLoading(false);
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setIsAuthenticated(true);
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = async () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr) as User;
      user.karma = (user.karma ?? 100) + 5;
      await firestoreService.saveUser(user);
    }
    
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <LanguageProvider>
      <Router>
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
        <Layout>
          <Routes>
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLoginSuccess} />} 
            />
            <Route 
              path="/" 
              element={isAuthenticated ? <Marketplace /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/notes" 
              element={isAuthenticated ? <Notes /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/scan" 
              element={isAuthenticated ? <ScanTool /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/map" 
              element={isAuthenticated ? <HandoverMap /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/profile" 
              element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/jwt-tool" 
              element={isAuthenticated ? <JWTHub /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/support" 
              element={isAuthenticated ? <SupportHub /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/add-listing" 
              element={isAuthenticated ? <AddListing /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/add-note" 
              element={isAuthenticated ? <AddNote /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/item/:type/:id" 
              element={isAuthenticated ? <ItemDetail /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/deal-completed" 
              element={isAuthenticated ? <DealCompleted /> : <Navigate to="/login" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </LanguageProvider>
  );
};

export default App;

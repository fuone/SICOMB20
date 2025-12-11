import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FuelForm from './components/FuelForm';
import FuelList from './components/FuelList';
import Dashboard from './components/Dashboard';
import { ViewState, Theme, FuelRecord } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('FORM');
  const [theme, setTheme] = useState<Theme>('light');
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('fuelTrackerTheme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-bs-theme', savedTheme);
    } else {
      // Default always to light as requested, ignoring system preference
      setTheme('light');
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('fuelTrackerTheme', newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
  };

  const handleEdit = (record: FuelRecord) => {
    setEditingRecord(record);
    setCurrentView('FORM');
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setCurrentView('LIST');
  };

  const handleNavigate = (view: ViewState) => {
    if (view === 'FORM' && currentView !== 'FORM') {
      // If navigating to form manually (via header), clear editing state
      setEditingRecord(null);
    }
    setCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case 'FORM':
        return (
          <FuelForm 
            initialData={editingRecord} 
            onSaveSuccess={() => setEditingRecord(null)} 
            onCancel={handleCancelEdit}
          />
        );
      case 'LIST':
        return <FuelList onEdit={handleEdit} />;
      case 'DASHBOARD':
        return <Dashboard />;
      default:
        return <FuelForm />;
    }
  };

  return (
    <div className="min-vh-100 pb-5">
      <Header 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />
      
      <main className="container pt-4">
        <div className="animate-fade-in">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
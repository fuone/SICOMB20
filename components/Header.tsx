
import React, { useState, useEffect } from 'react';
import { ViewState, Theme } from '../types';
import { Menu, X, BarChart3, PlusCircle, List, Sun, Moon, Info, Check } from 'lucide-react';
import { PROJ_NAME, PROJ_VERSION, PROJ_DESCRIPTION, PROJ_ICON } from '../constants';

var Build = 251215.01;
var Proj_version_full = PROJ_VERSION + " " + Build;

interface HeaderProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const BrandIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    xmlnsXlink="http://www.w3.org/1999/xlink" 
    viewBox="0 0 16 16" 
    xmlSpace="preserve"
    className={className}
    style={{ fill: 'var(--proj-icon-color)', ...style }}>
    <path d="M3,2.5C3,2.2,3.2,2,3.5,2h5C8.8,2,9,2.2,9,2.5v5C9,7.8,8.8,8,8.5,8h-5C3.2,8,3,7.8,3,7.5V2.5z"></path>
    <path d="M1,2c0-1.1,0.9-2,2-2h6c1.1,0,2,0.9,2,2v8c1.1,0,2,0.9,2,2v0.5c0,0.3,0.2,0.5,0.5,0.5s0.5-0.2,0.5-0.5V8h-0.5  C13.2,8,13,7.8,13,7.5V4.4c0-0.3,0.2-0.5,0.5-0.5H15c0-0.5-0.1-0.9-0.2-1.2c-0.1-0.2-0.2-0.4-0.4-0.5C14.2,2.1,13.9,2,13.5,2  C13.2,2,13,1.8,13,1.5S13.2,1,13.5,1c0.6,0,1,0.1,1.4,0.3c0.4,0.2,0.6,0.6,0.8,0.9C16,2.9,16,3.7,16,4.3v3.2C16,7.8,15.8,8,15.5,8  c0,0,0,0,0,0H15v4.5c0,0.8-0.7,1.5-1.5,1.5S12,13.3,12,12.5V12c0-0.6-0.4-1-1-1v4h0.5c0.3,0,0.5,0.2,0.5,0.5S11.8,16,11.5,16h-11  C0.2,16,0,15.8,0,15.5S0.2,15,0.5,15H1V2z M10,2c0-0.6-0.4-1-1-1H3C2.4,1,2,1.4,2,2v13h8V2z"></path>
  </svg>
);

const BrandIconFill = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    xmlnsXlink="http://www.w3.org/1999/xlink" 
    viewBox="0 0 16 16" 
    xmlSpace="preserve"
    className={className} 
    style={{ fill: 'var(--proj-icon-color)', ...style }}>
    <path d="M1,2c0-1.1,0.9-2,2-2h6c1.1,0,2,0.9,2,2v8c1.1,0,2,0.9,2,2v0.5c0,0.3,0.2,0.5,0.5,0.5s0.5-0.2,0.5-0.5V8h-0.5	C13.2,8,13,7.8,13,7.5V4.4c0-0.3,0.2-0.5,0.5-0.5H15c0-0.5-0.1-0.9-0.2-1.2c-0.1-0.2-0.2-0.4-0.4-0.5C14.2,2.1,13.9,2,13.5,2	C13.2,2,13,1.8,13,1.5S13.2,1,13.5,1c0.6,0,1,0.1,1.4,0.3c0.4,0.2,0.6,0.6,0.8,0.9C16,2.9,16,3.7,16,4.3v3.2C16,7.8,15.8,8,15.5,8	c0,0,0,0,0,0H15v4.5c0,0.8-0.7,1.5-1.5,1.5S12,13.3,12,12.5V12c0-0.6-0.4-1-1-1v4h0.5c0.3,0,0.5,0.2,0.5,0.5S11.8,16,11.5,16h-11	C0.2,16,0,15.8,0,15.5S0.2,15,0.5,15H1V2z M9,2.4C9,2.2,8.7,2,8.3,2H3.8C3.3,2,3,2.2,3,2.4V8h6V2.4z"/>
  </svg>
);

const FuoneBrand3 = ({className, style }: {className?: string, style?: React.CSSProperties }) => (
  <svg
    id="fuoneIcon2"
    xmlns="http://www.w3.org/2000/svg" 
    xmlnsXlink="http://www.w3.org/1999/xlink" 
    viewBox="0 0 1116.66 526.28" 
    xmlSpace="preserve"
    className= {('fuone-icon ') + className}
    style={{ fill: 'var(--f-icon-color-full,(--proj-icon-color))', ...style }}>
    <path className="f-icon-color-1" d="M270.91,531.85c-5.34-.2-9.13.08-14.15,0a19.55,19.55,0,0,0-3.53-.15c-21,0-41.63-3.4-62.14-7.85-22.54-4.88-43.7-13.37-63.8-24.34a255.89,255.89,0,0,1-35.88-23.88c-16-12.6-28.5-27.93-40.53-44.06-14.52-19.47-24.32-41.24-32-63.9C12.89,350,8.3,331.78,7,312.9,6.29,303,4.66,293,5.21,283c1.07-19.55,2.06-39,6.4-58.35,4.92-21.87,12.85-42.48,22.68-62.4a251.33,251.33,0,0,1,27-43.49,258.1,258.1,0,0,1,37.5-39.25c8-6.73,15.58-13.93,24.52-19.55,6.46-4.06,14-3.33,20.77-5.68,14.64-5.08,29.85-4.89,44.88-4.77,14.05.11,27.95,2.62,41.78,5.77,13.56,3.09,26.77,7.46,40.36,10.48a51,51,0,0,1,19.39,8.74c7.3,5.43,15.41,9.76,22.94,14.9a205.91,205.91,0,0,1,40.76,36.43,226.13,226.13,0,0,1,17.94,23.82c.58,1.27.64,2.26-1.2,2.22-8.12-3.93-14.89-10-22.58-14.57-10.17-6.1-21.38-8.9-32.68-11.59a95.82,95.82,0,0,0-27.09-2.13,170.33,170.33,0,0,0-47.68,9.51c-17.79,6.18-34.44,14.68-49.36,26.47a157.66,157.66,0,0,0-43.52,53c-5.66,11.16-10.69,22.54-13.7,34.7-2.26,9.18-4.32,18.41-4.54,27.93-.35,15.35-.35,30.7,3.69,45.66a173.44,173.44,0,0,0,23.75,52.86c13.72,20.2,31.65,35.4,52.49,47.63,14.71,8.63,30.72,13.86,46.85,19,7.81,2.48,15.76,1.92,23.64,2.78a168.06,168.06,0,0,0,18.94,1.2c15.69-.08,31.15-2.21,46.69-4,24.63-2.79,48.61-8.53,72.53-14.72,26.05-6.74,51.05-16.44,75.92-26.53a178.35,178.35,0,0,0,34.2-18.26,20.59,20.59,0,0,1,4.38-2.36c3-1.11,5.47,1,4.65,4.06-.76,2.88-1.74,5.8-3.81,8-12.91,14-25.76,28-38.82,41.82-11.12,11.76-24.58,20.77-37.08,30.91-14.15,11.48-30.07,20.13-45.62,29.3a259.64,259.64,0,0,1-35.75,17.42A294.79,294.79,0,0,1,322.1,526c-15.33,2.9-30.64,6.2-46.39,5.76C274.25,531.7,272.58,531.89,270.91,531.85Z" transform="translate(-5.09 -5.6)" fill="#303030"/>
    <path className="f-icon-color-2" d="M784.92,481.24a56.38,56.38,0,0,0-8.07-1.65c-11.8-3.38-24-5.12-35.88-8.2-8.56-2.22-16.29-6.43-24.69-9a226.91,226.91,0,0,1-49.88-22.48c-14.88-8.93-30.21-17.26-44-28C611.11,403.11,599.79,394.4,589,385c-4.19-3.65-8.14-7.68-12.26-11.49-10.52-9.74-20.84-19.72-30.67-30.15q-19.8-21-37.94-43.49c-8.52-10.63-17.82-20.63-26.68-31-8.42-9.84-16.72-19.78-25.09-29.67-4.51-5.32-8.93-10.73-13.58-15.93a644.88,644.88,0,0,0-47.43-48.27c-9.59-8.67-19.86-16.59-29.94-24.71-3.95-3.18-6.48-7.49-9.82-11.13C334,115.61,309.41,95.61,280.55,81.39c-24.12-11.89-49.44-20.16-76.24-23.65-13.88-1.81-27.81-3.46-41.78-2.75A363.15,363.15,0,0,0,126,58.24a206.69,206.69,0,0,1,25.35-16.49c17.74-10,36.5-17.43,56-23.3C225.7,12.93,244.2,9,263.31,7.57c11.63-.85,23.23-2.42,34.9-1.85,25,1.23,49.19,5.69,72.3,16.44A314.86,314.86,0,0,1,440.8,67.07a417.64,417.64,0,0,1,53.69,53.6c11.6,14.07,22.41,28.8,33,43.65,14.55,20.32,29.69,40.22,43.69,60.93,9.21,13.61,18.5,27.16,27.61,40.83,21.91,32.86,43.95,65.65,67.84,97.1,9.82,12.92,20.68,25.08,31.55,37.2,7.47,8.34,15,16.66,23.41,24,11.61,10.17,23.13,20.45,35.21,30.12,10.83,8.67,22.29,16.35,33.76,23.91,1.13.75,1.56,1.57,3.26,3.72A43.94,43.94,0,0,1,784.92,481.24Z" transform="translate(-5.09 -5.6)" fill="#454545"/>
    <path className="f-icon-color-2" d="M992.61,438.58h-1.55q-12.16-2.44-24.35-4.87c-.65-.13-1.44.08-2-.21-13.24-6.92-28.65-7.69-41.84-14.75-9.69-5.18-20-9.47-29-15.71-14.14-9.88-39.52-29.13-45.91-46-.59-4.89,23.16,9.41,28,11.32,7.54,3,15.34,4.07,23.31,5.09A102.3,102.3,0,0,0,938,371.25a125.32,125.32,0,0,0,39.8-18.13c9.66-6.58,18.52-13.8,25.45-23,8.79-11.69,16.77-23.86,21.22-38.17,3.94-12.67,7.79-25.28,6.65-38.63-1.2-14.2-1.44-28.89-9.11-41.53-4.36-7.19-9.33-14.08-14.4-20.89-11.29-15.17-25.63-26.57-42-35.46-11.76-6.39-24.56-10.16-37.72-12.73-12.11-2.36-24.32-2.34-36.49-1.83-10,.41-19.91,2.6-29.81,3.84a241.58,241.58,0,0,0-48.06,10.81c-12.36,4.22-24.59,9.05-36.79,13.81-11.35,4.42-21.89,10.48-33.26,14.69a79,79,0,0,0-12,6.14c-.91.53-1.8,1.13-2.71.35s-.34-1.77,0-2.75c1.41-4.31,5-7.12,7.68-10.4,19.74-23.74,42.15-44.61,67.95-61.7,26-17.23,54.23-29.25,84.87-35a286.24,286.24,0,0,1,37.17-4.52c26-1.42,51,3.37,75.65,10.76,23.47,7,43.23,20.23,61.54,36.19,8.81,7.67,15.12,17.14,22.45,25.93,13.87,16.62,21,36.29,27.81,56.05a137.93,137.93,0,0,1,7,37.69c.12,2.28.24,4.2.33,6.89l.51,19.84c-.27,5.65-.9,11.55-1.56,17.33-1.39,12.2-4.81,23.75-8.93,35.14-5.11,14.09-11,27.89-19.23,40.47-6.57,10-13.48,19.79-21.62,28.58-17.68,19.12-33.13,30.61-61.73,45.8C1000.3,438.33,998.15,438.13,992.61,438.58Z" transform="translate(-5.09 -5.6)" fill="#454545"/>
    <path className="f-icon-color-1" d="M738.86,229c9.8,11.29,19.71,22.49,29.37,33.89,11.6,13.67,22.65,27.81,34.56,41.19,11.31,12.7,22.9,25.2,35.9,36.32a293.13,293.13,0,0,1,29.67,29.41c10.93,12.45,24.19,22,38.39,30.49,13.43,8,28.21,12.44,42.77,17.62a186.72,186.72,0,0,0,60,11c3.14.06,6.17,1.38,9.82,2-4.77,2.36-9.3,5.77-14.31,7.09a233.35,233.35,0,0,1-49.7,17.45c-14.65,3.39-29.41,5.85-44.43,5.46-23-.61-45.39-4.83-65.95-15.4a228.89,228.89,0,0,1-46.2-31,368.18,368.18,0,0,1-38.29-39.35,719.46,719.46,0,0,1-47.16-62.26c-13.79-20.31-27-41-41.18-61.07-12-17.06-23.48-34.58-36.12-51.2-7.81-10.27-16.27-20.08-24.89-29.76a324.88,324.88,0,0,0-39.43-36.79c-8-6.42-15.67-13.06-24.24-18.86-4.4-3-4.74-3.72-4-7.1,1.86-.49,4.1.46,5.72.79,3.92,1.51,8.7,3,12.9,4.27,21.06,6.48,42.36,12.31,62,22.56a314.52,314.52,0,0,1,29.88,17.8c10.33,6.94,20.52,14,30.13,21.93,13.5,11.15,25.9,23.45,38.48,35.58C728.43,216.76,732.2,224.19,738.86,229Z" transform="translate(-5.09 -5.6)" fill="#303030"/>
  </svg>
);

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, theme, toggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isAboutOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isAboutOpen]);

  const handleNav = (view: ViewState) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const openAbout = () => {
    setIsAboutOpen(true);
    setIsMenuOpen(false);
  };

  const isActive = (view: ViewState) => currentView === view ? 'active' : '';

  return (
    <>
      <header className="sticky-top">
        <nav className="navbar navbar-expand-md">
          <div className="container ps-4 py-2">
            {/* Logo */}
            <div 
              className="proj-brand navbar-brand align-items-center cursor-pointer" 
              onClick={() => handleNav('FORM')}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-center">
                <BrandIconFill className="proj-icon" />
                <span className="proj-name">{PROJ_NAME}</span><span className="fw-normal">{PROJ_VERSION}</span>
              </div>
              <div className="div-description proj-description fw-normal">
                <span className="">{PROJ_DESCRIPTION}</span>
              </div>
            </div>

            {/* Mobile Toggles */}
            <div className="menu d-flex align-items-center gap-2 d-md-none">
              <button
                onClick={toggleTheme}
                className="d-none btn btn-link text-white p-1"
                aria-label="Alternar tema"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button 
                className="btn btn-link text-whitee p-1"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Menu"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>

            {/* Desktop Menu */}
            <div className="menu collapse navbar-collapse d-none d-md-block">
              <ul className="navbar-nav ms-auto align-items-center">
                <li className="nav-item">
                  <button 
                    onClick={() => handleNav('FORM')}
                    className={`nav-link btn btn-link text-decoration-none d-flex align-items-center gap-2 px-3 ${isActive('FORM')}`}
                  >
                    <PlusCircle size={16} /> Novo
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => handleNav('LIST')}
                    className={`nav-link btn btn-link text-decoration-none d-flex align-items-center gap-2 px-3 ${isActive('LIST')}`}
                  >
                    <List size={16} /> Registros
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    onClick={() => handleNav('DASHBOARD')}
                    className={`nav-link btn btn-link text-decoration-none d-flex align-items-center gap-2 px-3 ${isActive('DASHBOARD')}`}
                  >
                    <BarChart3 size={16} /> Dashboard
                  </button>
                </li>
                {/* Novo Item: Sobre */}
                <li className="nav-item">
                  <button 
                    onClick={openAbout}
                    className="nav-link btn btn-link text-decoration-none d-flex align-items-center gap-2 px-3"
                  >
                    <Info size={16} /> Sobre
                  </button>
                </li>

                <li className="d-none nav-item ms-2 border-start border-white border-opacity-25 ps-3">
                  <button
                    onClick={toggleTheme}
                    className="btn btn-link text-white p-1"
                    aria-label="Alternar tema"
                  >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="menu menu-open bg-primarye border-top border-white border-opacity-10 d-md-none animate-fade-in shadow-lg">
            <style>
              {`
                .mobile-nav-item { 
                  transition: all 0.2s ease; 
                  border-radius: 0.5rem; 
                }
                .mobile-nav-item:hover { 
                  background-color: rgba(0,0,0, 0.15) !important; 
                  padding-left: 1.25rem !important; /* Slight indent effect */
                }
                .mobile-nav-item:active { 
                  background-color: rgba(0,0,0, 0.25) !important; 
                  transform: scale(0.99);
                }
              `}
            </style>
            <div className="container py-3">
              <div className="d-flex flex-column gap-2">
                  <button 
                    onClick={() => handleNav('FORM')}
                    className={`btn text-start d-flex align-items-center gap-3 py-3 px-3 mobile-nav-item ${currentView === 'FORM' ? 'bg-white bg-opacity-25 fw-bold' : ''}`}
                  >
                    <PlusCircle size={20} /> Novo Registro
                  </button>
                  <button 
                    onClick={() => handleNav('LIST')}
                    className={`btn text-start d-flex align-items-center gap-3 py-3 px-3 mobile-nav-item ${currentView === 'LIST' ? 'bg-white bg-opacity-25 fw-bold' : ''}`}
                  >
                    <List size={20} /> Listar Registros
                  </button>
                  <button 
                    onClick={() => handleNav('DASHBOARD')}
                    className={`btn text-start d-flex align-items-center gap-3 py-3 px-3 mobile-nav-item ${currentView === 'DASHBOARD' ? 'bg-white bg-opacity-25 fw-bold' : ''}`}
                  >
                    <BarChart3 size={20} /> Dashboard
                  </button>
                  {/* Novo Item Mobile: Sobre */}
                  <button 
                    onClick={openAbout}
                    className="btn text-start d-flex align-items-center gap-3 py-3 px-3 mobile-nav-item"
                  >
                    <Info size={20} /> Sobre
                  </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Modal Sobre */}
      {isAboutOpen && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header border-bottom bg-body-tertiary">
                  <h5 className="modal-title fw-bold d-flex align-items-center">
                    <Info className="me-2 text-primary" size={24} />
                    Sobre o Projeto
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setIsAboutOpen(false)} aria-label="Close"></button>
                </div>
                <div className="modal-body p-4">
                  
                  {/* ==========================================================
                      ÁREA RESERVADA PARA O DESENVOLVEDOR INSERIR INFORMAÇÕES
                      ========================================================== */}
                  
                  <div className="proj-brand text-center mb-4">
                    <div className="d-inline-flex align-items-center justify-content-center p-0 mb-2">
                      <BrandIconFill style={{ width: 48, height: 48 }} />
                    </div>
                    <h4 className="proj-name m-0 p-0 lh-1">{PROJ_NAME}</h4>
                    <p className="text-muted m-0 mb-3 lh-1">{PROJ_DESCRIPTION}</p>
                    <span className="badge bg-info bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill mb-3">
                      Versão {Proj_version_full}
                    </span>
                  </div>

                  <hr className="my-4 opacity-25" />

                  {/* 
                      !!! DESENVOLVEDOR: INSIRA AQUI O CONTEÚDO SOBRE O PROJETO !!!
                      Exemplo: Tecnologias usadas, objetivo, funcionalidades, etc.
                  */}
                  <div className="mb-4 hide">
                    <h6 className="fw-bold text-uppercase text-muted small mb-3">Sobre a Aplicação</h6>
                    <div className="p-3 bg-light rounded border border-light-subtle text-secondary small">
                       {/* --- ESPAÇO PARA TEXTO DO PROJETO --- */}
                       <div className="m-auto justify-self-end">Em breve</div>
                    </div>
                  </div>

                  {/* 
                      !!! DESENVOLVEDOR: INSIRA AQUI O CONTEÚDO SOBRE O DESENVOLVEDOR !!!
                      Exemplo: Nome, contato, links sociais, etc.
                  */}
                  <div className="">
                    <h6 className="fw-bold text-uppercase text-muted small mb-3">Desenvolvedor</h6>
                     <div className="p-2 text-secondary d-flex align-items-center opacity-75">
                       {/* --- ESPAÇO PARA TEXTO DO DESENVOLVEDOR --- */}
                       <div className="pe-2 align-items-center border-end border-secondary">
                           {/*<FuoneBrand className="icon" style={{ width: 48, height: 48,}} />{/**/}
                          <FuoneBrand3 className="icon" style={{ width: 72, height: 48,}} />{/**/}
                        </div>
                       <div className="ps-2 border-left border-secondary">
                        <div className="fw-bold fs-6" style={{ lineHeight: 'normal' }}><a className=" text-muted no-decoration" href="https://b.link/f/aboutme" target="_blank">FuoneDev</a></div>
                        <div className="small"style={{ lineHeight: 'normal' }}><a className=" text-muted no-decoration" href="mailto:fuone.dev@gmail.com" target="_blank">fuone.dev@gmail.com</a></div>
                       </div>
                    </div>
                  </div>
                  
                  {/* ==========================================================
                      FIM DA ÁREA RESERVADA
                      ========================================================== */}

                </div>
                <hr className="my-1 opacity-25" />
                <div className="modal-footer bg-light border-top-0">
                  <button type="button" className="btn btn-sm btn-light d-flex align-items-center px-3 py-2 fw-medium transition-all hint--top hint--rounded" 
                    data-hint="Fechar"
                    onClick={() => setIsAboutOpen(false)}>                    
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>
        </>
      )}
    </>
  );
};

export default Header;

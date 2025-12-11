
import React, { useState, useEffect } from 'react';
import { ViewState, Theme } from '../types';
import { Menu, X, BarChart3, PlusCircle, List, Sun, Moon, Info, Check } from 'lucide-react';
import { PROJ_NAME, PROJ_VERSION, PROJ_DESCRIPTION, PROJ_ICON } from '../constants';

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

const FuoneBrand = ({className, style }: {className?: string, style?: React.CSSProperties }) => (
  <svg
    id="fuoneIcon"
    xmlns="http://www.w3.org/2000/svg" 
    xmlnsXlink="http://www.w3.org/1999/xlink" 
    viewBox="0 0 563 399" 
    xmlSpace="preserve"
    className= {('fuone-icon ') + className}
    style={{ fill: 'var(--f-icon-color-full,(--proj-icon-color))', ...style }}>
    <path className="f-icon-color-1" d="M23.7,279.6c17.2,27.1,40.8,45.9,71.1,55.8c21.3,7,43.2,8.6,65.6,6.9c23.7-1.8,46.3-7,68.5-15.2c4.5-1.7,6.7-4.4,7-8.9	c1.1-16.7,2.3-33.4,2.9-50.1c0.2-7.2-1.1-14.5-1.8-22.3c-6.7,3.5-12.8,7.1-19.2,9.8c-33,13.7-66.2,15.7-98.8-0.8	c-20-10.1-33-26.9-36.6-49c-2.9-17.7,1.7-34.7,13.4-48.9c14.6-17.8,33.5-27.3,56.8-26.7c17.8,0.4,32.8,8.4,46.4,19.4	c26.7,21.5,41.1,50.6,48.8,83.1c3.5,14.9,5.5,30.3,6,45.6c1.2,34.4-8.3,66.5-24.2,96.8c-3.4,6.5-7,13-10.5,19.4	c0.3,0.3,0.7,0.5,1,0.8c6.5-7.8,13.3-15.3,19.5-23.4c18.2-23.7,32.1-49.6,39.7-78.7c4.8-18.4,7-37,6.9-56	c-0.3-30.3-3.3-60-14.2-88.6c-9.1-23.9-22.1-45.2-40.8-62.8c-18.8-17.7-40.9-29-66.7-32.9c-4.2-0.6-8.3-1.3-12.5-1.9c-5,0-10,0-15,0	c-6.3,1-12.6,1.7-18.8,3C92.7,59.7,69,69.4,48.8,86.6c-24.7,21-38.5,48.3-45.6,79.3c-1.4,6.2-1.5,12.7-2.2,19c-0.1,1-0.6,2-1,3	c0,5.7,0,11.3,0,17c0.7,4.3,1.3,8.5,2,12.8C5.3,239.8,11.7,260.6,23.7,279.6z"/>
    <path className="f-icon-color-2" d="M563,200.9c-0.7,5-1.3,10.1-2,15.1c-4.1,31.7-14.1,61-35.2,85.8c-19,22.4-42.4,37.6-70.9,44.4c-44.4,10.6-82.9,0-114.1-33.9	c-15.9-17.2-26.4-37.8-31.8-60.5c-5-20.8-8.3-42-12.2-63c-4.4-24.2-10.1-48-22-69.8c-8.4-15.5-18.4-29.9-30.2-43	c-8.2-9-16.6-17.9-25.4-26.4C203,34.1,184.5,21.2,165.1,9.5c-2.6-1.6-5.2-3.2-7.5-5.7c3.2,0.7,6.4,1.3,9.5,2.2	c23,7.1,46,14.5,67.3,26c36.1,19.5,63.5,47.8,82.8,83.9c12.8,24,20.3,50.1,29.9,75.4c4.9,13,9.6,26.5,17,38	c14.4,22.2,35.7,33.7,62.7,31.5c17.2-1.4,30.2-11.2,40.9-24.3c32.2-39.8,8.9-91.2-29.9-105.4c-25.2-9.2-48.1-4.3-68.4,13	c-4.6,3.9-8.8,8.2-13.5,12.6c-10.2-25-22.6-49.3-39.4-72.3c8.4-5.3,16.1-10.6,24.3-15.3c27.6-15.8,57.7-21.8,89.1-18.9	c59.7,5.6,111,44.6,127.6,105.3c2.5,9.2,3,18.9,4.5,28.3c0.2,1.4,0.6,2.8,1,4.2C563,192.3,563,196.6,563,200.9z"/>
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
                      Versão {PROJ_VERSION}
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
                          <FuoneBrand className="icon" style={{ width: 48, height: 48,}} />
                        </div>
                       <div className="ps-2 border-left border-secondary">
                        <a className="text-muted no-decoration" href="https://b.link/f/aboutme" target="_blank"><span className="fw-bold fs-6">FuoneDev</span></a><br/>
                        <a className="text-muted no-decoration small" href="mailto:fuone.dev@gmail.com" target="_blank">fuone.dev@gmail.com</a>
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

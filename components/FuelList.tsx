
import React, { useEffect, useState } from 'react';
import { FuelRecord } from '../types';
import { fetchRecords, saveRecord } from '../services/sheetsService';
import { 
  Loader2, AlertCircle, Droplets, MapPin, Calendar, CreditCard, Eye, 
  X, User, Smartphone, FileText, Hash, Tag, DollarSign, Edit2, 
  Archive, ArchiveRestore, ChevronLeft, ChevronRight, TrendingDown, 
  Fuel, Receipt, ArrowDownRight, PiggyBank, Search, Car, AlertTriangle, Check, ListFilter, TrendingUp
} from 'lucide-react';

interface FuelListProps {
  onEdit: (record: FuelRecord) => void;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatVolume = (value: number) => {
  return value.toFixed(2).replace('.', ',')
};

// Helper to get unit based on fuel
const getUnit = (fuel: string) => {
  const lower = fuel.toLowerCase();
  if (lower.includes('elétrico') || lower.includes('eletrico') || lower.includes('kva')) return 'KVA';
  if (lower.includes('gnv') || lower.includes('gás')) return 'm³';
  return 'L';
};

// Helper to get dynamic style for fuel badges
const getFuelStyle = (fuel: string) => {
  let varName = 'var(--fuel-other)';
  const lower = fuel.toLowerCase();
  
  if (lower.includes('gasolina') && lower.includes('aditivada')) varName = 'var(--fuel-gas-additive)';
  else if (lower.includes('gasolina')) varName = 'var(--fuel-gasoline)';
  else if (lower.includes('etanol') || lower.includes('alcool')) varName = 'var(--fuel-ethanol)';
  else if (lower.includes('diesel') && lower.includes('s10')) varName = 'var(--fuel-diesel-s10)';
  else if (lower.includes('diesel')) varName = 'var(--fuel-diesel)';
  else if (lower.includes('gnv')) varName = 'var(--fuel-gnv)';
  else if (lower.includes('elétrico') || lower.includes('eletrico')) varName = 'var(--fuel-electric)';

  return {
    color: varName,
    backgroundColor: `color-mix(in srgb, ${varName}, transparent 85%)`,
    borderColor: `color-mix(in srgb, ${varName}, transparent 75%)`,
    borderWidth: '1px',
    borderStyle: 'solid'
  };
};

// Helper for detail items - Compact Version
const DetailItem = ({ icon, label, value, subValue }: { icon: any, label: string, value: React.ReactNode, subValue?: string }) => (
  <div className="d-flex align-items-center h-100 p-2 rounded border border-transparent hover-border-subtle transition-all">
    <div className="d-flex align-items-center justify-content-center rounded-circle bg-body-tertiary text-secondary me-3 flex-shrink-0" style={{width: '38px', height: '38px'}}>
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <div className="overflow-hidden w-100 align-self-end">
      <div className="text-muted text-uppercase fw-bold" style={{fontSize: '0.65rem', letterSpacing: '0.5px', lineHeight: '1.2'}}>{label}</div>
      <div className="fw-medium text-dark text-break" style={{fontSize: '0.95rem'}}>{value}</div>
      {subValue && <div className="text-muted" style={{fontSize: '0.75rem'}}>{subValue}</div>}
    </div>
  </div>
);

const FuelList: React.FC<FuelListProps> = ({ onEdit }) => {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<FuelRecord | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Confirmation Modal State
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Manage body scroll locking
  useEffect(() => {
    if (selectedRecord || showArchiveConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedRecord, showArchiveConfirm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchRecords();
      // Sort by date descending
      const sorted = data.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      setRecords(sorted);
    } catch (err) {
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset pagination when view mode or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, itemsPerPage, searchTerm]);

  const handleToggleStatus = async (record: FuelRecord) => {
    setProcessingId(record.id);
    try {
      const updatedRecord = { ...record, active: !record.active };
      const success = await saveRecord(updatedRecord, true);
      if (success) {
        setRecords(prev => prev.map(r => r.id === record.id ? updatedRecord : r));
        if (selectedRecord && selectedRecord.id === record.id) {
          setSelectedRecord(null); // Close modal if toggled
        }
      }
    } catch (e) {
      alert("Erro ao atualizar status");
    } finally {
      setProcessingId(null);
      setShowArchiveConfirm(false);
    }
  };

  const handleArchiveClick = () => {
    setShowArchiveConfirm(true);
  };

  const handleConfirmArchive = () => {
    if (selectedRecord) {
      handleToggleStatus(selectedRecord);
    }
  };

  // Filter and Pagination Logic
  const filteredRecords = records.filter(r => {
    // 1. Filter by Status (Active/Archived)
    const matchesStatus = viewMode === 'active' ? r.active : !r.active;
    if (!matchesStatus) return false;

    // 2. Filter by Search Term
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const dateStr = new Date(r.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    const formattedTotal = r.total.toFixed(2);
    const vehicle = r.veiculo ? r.veiculo.toLowerCase() : '';
    
    return (
      r.posto.toLowerCase().includes(searchLower) ||
      vehicle.includes(searchLower) ||
      r.combustivel.toLowerCase().includes(searchLower) ||
      dateStr.includes(searchLower) ||
      formattedTotal.includes(searchLower) ||
      r.km.toString().includes(searchLower) ||
      (r.obs && r.obs.toLowerCase().includes(searchLower)) ||
      (r.app && r.app.toLowerCase().includes(searchLower))
    );
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  // Helper to render App Brand
  const renderAppValue = (appName: string | null) => {
    if (!appName) {
      return <span className="text-muted">Não utilizado</span>;
    }

    // Determine colors based on known apps
    let colorClass = 'text-primary';
    
    const lowerName = appName.toLowerCase();
    if (lowerName.includes('shell')) {
      colorClass = 'text-warning'; // Shell Yellow/Red
    } else if (lowerName.includes('premmia')) {
      colorClass = 'text-danger';
    } else if (lowerName.includes('barat')) {
      colorClass = 'text-success';
    }

    return (
      <div className="d-flex align-items-center gap-2">
        <span className="fw-semibold">{appName}</span>
        <Tag size={12} className={colorClass} />
      </div>
    );
  };

  // Helper to calculate savings percentage
  const getSavingsPercent = (bomba: number, paid: number) => {
      if (!bomba || bomba <= 0) return 0;
      return ((bomba - paid) / bomba) * 100;
  };

  if (loading && records.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '300px' }}>
        <Loader2 className="animate-spin mb-3 text-primary" size={40} />
        <p className="text-secondary">Carregando registros...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-danger" style={{ height: '300px' }}>
        <AlertCircle size={40} className="mb-3" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header and Controls */}
      <div className="mb-4">
        {/* Row 1: Title and Status Toggles */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
          <h2 className="h4 fw-bold mb-0">Histórico</h2>
          
           {/* Filter Toggle */}
           <div className="btn-group w-50 ww-md-auto shadow-sm" role="group">
            <button 
              type="button" 
              className={`btn btn-sm flex-fill d-flex align-items-center justify-content-center ${viewMode === 'active' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('active')}
            >
              <ListFilter size={16} className="me-2" />
              Ativos
            </button>
            <button 
              type="button" 
              className={`btn btn-sm flex-fill d-flex align-items-center justify-content-center ${viewMode === 'archived' ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('archived')}
            >
              <Archive size={16} className="me-2" />
              Arquivados
            </button>
          </div>
        </div>

        {/* Row 2: Search Bar - Full Width below buttons */}
        <div className="position-relative w-100">
             <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={16} />
             <input 
                type="text" 
                className="form-control ps-5 bg-white" 
                placeholder="Buscar (posto, data, valor...)" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
             {searchTerm && (
                <button 
                  className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-1 me-1"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={14} />
                </button>
             )}
        </div>
      </div>
      
      {filteredRecords.length === 0 ? (
        <div className="text-center py-5 card border-0 shadow-sm">
          <div className="card-body">
            <div className="bg-body-secondary rounded-circle p-3 d-inline-block mb-3">
               <Droplets className="text-secondary" size={32} />
            </div>
            <h5 className="text-secondary fw-normal">
               {searchTerm 
                 ? `Nenhum registro encontrado para "${searchTerm}"`
                 : `Nenhum registro ${viewMode === 'active' ? 'ativo' : 'arquivado'} encontrado.`
               }
            </h5>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop/Tablet Table */}
          <div className="card border-0 shadow-sm overflow-hidden d-none d-md-block mb-3">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    {/* Tablet & Desktop */}
                    <th className="px-4 py-3 small fw-bold text-muted text-uppercase" style={{width: '60px'}}>#</th>
                    <th className="px-4 py-3 small fw-bold text-muted text-uppercase">Data</th>
                    
                    {/* Desktop Only (LG) */}
                    <th className="px-4 py-3 small fw-bold text-muted text-uppercase d-none d-lg-table-cell">Odômetro</th>
                    
                    {/* Tablet & Desktop */}
                    <th className="px-4 py-3 small fw-bold text-muted text-uppercase">Combustível</th>
                    <th className="px-4 py-3 small fw-bold text-muted text-uppercase">Volume</th>
                    
                    {/* Desktop Only (LG) */}
                    <th className="px-4 py-3 small fw-bold text-muted text-uppercase d-none d-lg-table-cell">Preço</th>
                    
                    {/* Tablet & Desktop */}
                    <th className="px-4 py-3 small fw-bold text-muted text-uppercase text-end">Total</th>
                    <th className="px-4 py-3 small fw-bold text-muted text-uppercase text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((record, index) => (
                    <tr key={record.id} className={!record.active ? 'opacity-75' : ''}>
                      {/* # */}
                      <td className="px-4 py-3 small text-muted fw-bold">
                         {startIndex + index + 1}
                      </td>
                      
                      {/* Data */}
                      <td className="px-4 py-3 small">
                        {new Date(record.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                      </td>

                      {/* Odômetro (Desktop) */}
                      <td className="px-4 py-3 small text-muted d-none d-lg-table-cell">{record.km}</td>

                      {/* Combustível */}
                      <td className="px-4 py-3 small">
                        <span 
                          className="badge fw-medium rounded-pill"
                          style={getFuelStyle(record.combustivel)}
                        >
                          {record.combustivel}
                        </span>
                      </td>

                      {/* Volume */}
                      <td className="px-4 py-3 small text-muted">
                        {formatVolume(record.qtd)} {getUnit(record.combustivel)}
                      </td>

                      {/* Preço (Desktop) */}
                      <td className="px-4 py-3 small text-muted d-none d-lg-table-cell">
                        {formatCurrency(record.precoL)}/{getUnit(record.combustivel)}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 small fw-bold text-primary text-end">
                        {formatCurrency(record.total)}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => setSelectedRecord(record)}
                          className="btn btn-sm btn-outline-secondary rounded-circle p-1 hint--top hint--rounded"
                          aria-label="Ver detalhes"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile List View (Compact Rows) */}
          <div className="d-md-none d-flex flex-column gap-2 mb-4">
            {currentRecords.map((record, index) => (
              <div key={record.id} className={`card border shadow-sm ${!record.active ? 'opacity-75 bg-body-secondary' : ''}`}>
                <div className="card-body p-3 d-flex align-items-center justify-content-between">
                  {/* Left: Index & Data & Fuel Badge */}
                  <div className="d-flex align-items-center gap-4">
                     <span className="fw-bold text-muted small" style={{minWidth: '24px'}}>
                        #{startIndex + index + 1}
                     </span>
                     <div className="d-flex flex-row gap-3">
                        <span className="fw-semibold text-dark">
                           {new Date(record.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                        </span>
                        {/* Changed from Posto to Combustivel Badge */}
                        <span 
                          className="badge rounded-pill mt-1" 
                          style={{
                             ...getFuelStyle(record.combustivel),
                             fontSize: '0.65rem', 
                             width: 'fit-content'
                          }}
                        >
                          {record.combustivel}
                        </span>
                     </div>
                  </div>

                  {/* Right: Total & Action */}
                  <div className="d-flex align-items-center gap-3">
                     <span className="fw-bold text-primary">
                        {Math.floor(record.total).toLocaleString('pt-BR')}
                        <small className="fs-7">,{(record.total % 1).toFixed(2).substring(2)}</small>
                     </span>
                     <button 
                        onClick={() => setSelectedRecord(record)}
                        className="btn btn-sm btn-light text-primary border rounded-circle p-2 hint--top hint--rounded"
                        aria-label="Ver detalhes"
                     >
                        <Eye size={18} />
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 py-2">
             <div className="paging paging-select d-flex align-items-center gap-2">
                <span className="small text-muted text-end">Exibir:</span>
                <select 
                   className="form-select form-select-sm w-auto" 
                   value={itemsPerPage} 
                   onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                   <option value={10}>10</option>
                   <option value={20}>20</option>
                   <option value={50}>50</option>
                   <option value={100}>100</option>
                </select>
                <span className="small text-muted ms-1 text-start">
                   {filteredRecords.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredRecords.length)} de {filteredRecords.length}
                </span>
             </div>

             {totalPages > 1 && (
               <nav aria-label="Navegação">
                  <ul className="pagination pagination-sm mb-0">
                     <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                           <ChevronLeft size={14} />
                        </button>
                     </li>
                     
                     {currentPage > 2 && (
                        <li className="page-item d-none d-sm-block">
                           <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
                        </li>
                     )}
                     
                     <li className="page-item active">
                        <button className="page-link">{currentPage}</button>
                     </li>
                     
                     {currentPage < totalPages && (
                        <li className="page-item">
                           <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>{currentPage + 1}</button>
                        </li>
                     )}
                     
                     <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                           <ChevronRight size={14} />
                        </button>
                     </li>
                  </ul>
               </nav>
             )}
          </div>
        </>
      )}

      {/* Elegant Modern Detail Modal - Refactored for Desktop Size */}
      {selectedRecord && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{zIndex: 1060}}>
            {/* CHANGED: modal-sm to modal-lg for wider desktop view */}
            <div className="modal-dialog modal-dialog-centered modal-lg"> 
              <div className="modal-content border-0 shadow-lg overflow-hidden" style={{borderRadius: 'var(--app-border-radius)'}}>
                
                {/* Hero Header Section */}
                <div className="position-relative bg-primary text-white p-4">
                  {/* Background Decoration */}
                  <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{opacity: 0.1}}>
                     <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-100 h-100">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                     </svg>
                  </div>

                  <div className="d-flex justify-content-between align-items-start position-relative z-1 mb-3">
                     <div>
                        <span className="badge bg-white bg-opacity-25 border border-white border-opacity-25 rounded-pill px-3 py-1 fw-normal">
                          {new Date(selectedRecord.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                        </span>
                     </div>
                     <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedRecord(null)} aria-label="Close">
                        <X size={16} />
                     </button>
                  </div>

                  <div className="text-center position-relative z-1 pb-2">
                     <p className="text-white text-opacity-75 text-uppercase fw-bold mb-1" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>Valor Total Pago</p>
                     <h2 className="display-4 fw-bold mb-0">{formatCurrency(selectedRecord.total)}</h2>
                     {selectedRecord.veiculo && (
                        <div className="hide mt-2 d-inline-flex align-items-center bg-white bg-opacity-10 px-3 py-1 rounded-pill">
                           <Car size={16} className="me-2" />
                           <small>{selectedRecord.veiculo}</small>
                        </div>
                     )}
                     {!selectedRecord.active && <span className="d-inline-flex badge bg-warning text-dark mt-2 d-block w-auto mx-auto">Arquivado</span>}
                  </div>
                </div>

                <div className="modal-body p-0 d-flex">
                   {/* Main Stats Row */}
                      <div className="flex-fill p-2 text-center border-end border-bottom">
                         <div className="text-muted text-uppercase mb-1x fw-bold" style={{fontSize: '0.75rem'}}>Combustível</div>
                         <div className="fw-semibold" style={{color: getFuelStyle(selectedRecord.combustivel).color}}>{selectedRecord.combustivel}</div>
                      </div>
                      <div className="flex-fill p-2 text-center border-end border-bottom">
                         <div className="text-muted text-uppercase mb-1x fw-bold" style={{fontSize: '0.75rem'}}>Volume</div>
                         <div className="fw-semibold">{formatVolume(selectedRecord.qtd)} {getUnit(selectedRecord.combustivel)}</div>
                      </div>
                      <div className="flex-fill p-2 text-center border-bottom">
                         <div className="text-muted text-uppercase mb-1x fw-bold" style={{fontSize: '0.75rem'}}>Preço</div>
                         <div className="fw-semibold">{formatCurrency(selectedRecord.precoL)}/{getUnit(selectedRecord.combustivel)}</div>
                      </div>
                   </div>

                   {/* Content Padding */}
                   <div className="p-4 border-bottom">
                      
                      {/* Savings Alert */}
                      {selectedRecord.app && selectedRecord.precoBomba && selectedRecord.precoBomba > selectedRecord.precoL && (
                         <div className="alert alert-success d-flex align-items-center border-0 bg-success bg-opacity-10 mb-4 p-3 rounded-3 animate-fade-in shadow-sm">
                             <div className="p-2 bg-success text-white rounded-circle me-3 shadow-sm d-flex align-items-center justify-content-center">
                                <PiggyBank size={20} />
                             </div>
                             <div>
                                <h6 className="fw-bold text-success mb-1">Economia Confirmada!</h6>
                                <p className="mb-0 text-success text-opacity-75 lh-sm small">
                                   O preço original era <strong> {formatCurrency(selectedRecord.precoBomba)}</strong>. 
                                   Você economizou <strong>{formatCurrency((selectedRecord.precoBomba - selectedRecord.precoL) * selectedRecord.qtd)} ({getSavingsPercent(selectedRecord.precoBomba, selectedRecord.precoL).toFixed(0)}%)</strong> nesta abastecida.
                                </p>
                             </div>
                         </div>
                      )}

                      {/* Loss Alert */}
                      {selectedRecord.app && selectedRecord.precoBomba && selectedRecord.precoL > selectedRecord.precoBomba && (
                         <div className="alert alert-danger d-flex align-items-center border-0 bg-danger bg-opacity-10 mb-4 p-3 rounded-3 animate-fade-in shadow-sm">
                             <div className="p-2 bg-danger text-white rounded-circle me-3 shadow-sm d-flex align-items-center justify-content-center">
                                <TrendingUp size={20} />
                             </div>
                             <div>
                                <h6 className="fw-bold text-danger mb-1">Custo Adicional</h6>
                                <p className="mb-0 text-danger text-opacity-75 lh-sm small">
                                    O preço original era <strong> {formatCurrency(selectedRecord.precoBomba)}</strong>. 
                                   Você pagou <strong>{formatCurrency((selectedRecord.precoL - selectedRecord.precoBomba) * selectedRecord.qtd)} ({Math.abs(getSavingsPercent(selectedRecord.precoBomba, selectedRecord.precoL)).toFixed(0)}%)</strong> a mais.
                                </p>
                             </div>
                         </div>
                      )}

                      {/* Detail List - Adjusted Layout */}
                      <div className="row g-2">
                         {/* LINE 0: car */}
                         <div className="col-12">
                            <DetailItem 
                               icon={<Car />} 
                               label="Veículo" 
                               value={selectedRecord.veiculo} 
                            />
                         </div>

                         {/* LINE 1: Odometer & Driver */}
                         <div className="col-12  col-md">
                            <DetailItem 
                               icon={<Hash />} 
                               label="Odômetro" 
                               value={`${selectedRecord.km} Km`} 
                            />
                         </div>
                         <div className="hide col-12 col-md-6">
                            <DetailItem 
                              icon={<User />} 
                              label="Motorista" 
                              value={selectedRecord.user} 
                            />
                        </div>                         

                         {/* LINE 2: Station (Full Width) */}
                         <div className="col-12">
                            <DetailItem 
                               icon={<MapPin />} 
                               label="Posto / Estabelecimento" 
                               value={selectedRecord.posto} 
                            />
                         </div>

                         {/* LINE 3: App & Payment */}
                         {selectedRecord.app ? (
                            <>
                              <div className="col-12 col-md">
                                  <DetailItem 
                                    icon={<Smartphone />} 
                                    label="Aplicativo" 
                                    value={renderAppValue(selectedRecord.app)} 
                                  />
                              </div>
                              <div className="col-12 col-md">
                                  <DetailItem 
                                    icon={<CreditCard />} 
                                    label="Forma de Pagamento" 
                                    value={selectedRecord.formaPagto} 
                                  />
                              </div>
                            </>
                         ) : (
                          <div className="col-12 col-md">
                              <DetailItem 
                                icon={<CreditCard />} 
                                label="Forma de Pagamento" 
                                value={selectedRecord.formaPagto} 
                              />
                          </div>
                         )}
                      </div>

                      {/* Observations */}
                      {selectedRecord.obs && (
                         <div className="mt-4 p-3 pb-2" style={{background:'var(--neutral-100)'}}>
                            <div className="d-flex gap-3">
                               <div className="mt-1 p-2 text-muted">
                                  <FileText size={16} />
                                </div>
                               <div>
                                  <span className="fw-bold text-muted small text-uppercase">Observações</span>
                                  <p className="text-secondary mb-0 mt-1">"{selectedRecord.obs}"</p>
                               </div>
                            </div>
                         </div>
                      )}
                   </div>

                {/* Footer Actions - Right Aligned with Text Close Button */}
                <div className="modal-footer bg-light px-4 py-3 border-top-0 d-flex align-items-center">
                   <div className="small text-muted font-monospace opacity-50 me-auto">
                      {selectedRecord.id}
                   </div>
                   <div className="d-flex gap-2">
                      <button 
                         className={`btn btn-sm d-flex align-items-center px-3 py-2 fw-medium transition-all ${selectedRecord.active ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                         onClick={handleArchiveClick}
                         disabled={processingId === selectedRecord.id}
                      >
                         {processingId === selectedRecord.id ? (
                            <Loader2 size={16} className="animate-spin" />
                         ) : selectedRecord.active ? (
                            <>
                               <Archive size={16} className="me-2" /> Arquivar
                            </>
                         ) : (
                            <>
                               <ArchiveRestore size={16} className="me-2" /> Restaurar
                            </>
                         )}
                      </button>
                      
                      {selectedRecord.active && (
                         <button 
                            className="btn btn-sm btn-primary d-flex align-items-center px-4 py-2 fw-medium shadow-sm transition-all"
                            onClick={() => {
                               onEdit(selectedRecord);
                               setSelectedRecord(null);
                            }}
                         >
                            <Edit2 size={16} className="me-2" /> Editar
                         </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-sm btn-light d-flex align-items-center px-3 py-2 fw-medium transition-all hint--top hint--rounded"
                        data-hint="Fechar"
                        onClick={() => setSelectedRecord(null)}>
                         <X size={16} className=""/>
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{zIndex: 1055}}></div>
        </>
      )}

      {/* Confirmation Archive Modal */}
      {showArchiveConfirm && selectedRecord && (
        <>
           <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{zIndex: 1070}}>
              <div className="modal-dialog modal-dialog-centered">
                 <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header border-bottom-0">
                       <h5 className="modal-title fw-bold d-flex align-items-center">
                          {selectedRecord.active ? (
                              <div className="bg-warning bg-opacity-10 p-2 rounded-circle me-2 text-warning">
                                  <AlertTriangle size={24} />
                              </div>
                          ) : (
                              <div className="bg-success bg-opacity-10 p-2 rounded-circle me-2 text-success">
                                  <ArchiveRestore size={24} />
                              </div>
                          )}
                          {selectedRecord.active ? 'Confirmar Arquivamento' : 'Confirmar Restauração'}
                       </h5>
                       <button type="button" className="btn-close" onClick={() => setShowArchiveConfirm(false)} aria-label="Close"></button>
                    </div>
                    <div className="modal-body pt-0">
                       {selectedRecord.active ? (
                          <>
                            <p className="text-secondary mb-3">
                               Tem certeza que deseja arquivar este registro?
                            </p>
                            <div className="alert alert-warning border-0 bg-warning bg-opacity-10 d-flex align-items-start small">
                               <AlertTriangle size={18} className="text-warning me-2 flex-shrink-0 mt-1" />
                               <span>
                                  <strong>Atenção:</strong> Se arquivado, o registro será ocultado das listagens principais e <span className="fw-bold">não será computado para estatísticas no dashboard</span>.
                               </span>
                            </div>
                          </>
                       ) : (
                          <>
                             <p className="text-secondary mb-3">
                                Deseja realmente restaurar este registro?
                             </p>
                             <div className="alert alert-success border-0 bg-success bg-opacity-10 d-flex align-items-start small">
                                <ArchiveRestore size={18} className="text-success me-2 flex-shrink-0 mt-1" />
                                <span>
                                   Ele voltará a aparecer nas listagens e <strong>será incluído novamente nos cálculos e estatísticas do Dashboard</strong>.
                                </span>
                             </div>
                          </>
                       )}
                    </div>
                    <div className="modal-footer border-top-0 pt-0">
                       <button type="button" className="btn btn-light d-flex align-items-center" onClick={() => setShowArchiveConfirm(false)} disabled={processingId === selectedRecord.id}>
                          <X size={18} className="me-2" />
                          Cancelar
                       </button>
                       <button 
                          type="button" 
                          className={`btn ${selectedRecord.active ? 'btn-warning' : 'btn-success'} fw-medium px-4 d-flex align-items-center`}
                          onClick={handleConfirmArchive}
                          disabled={processingId === selectedRecord.id}
                       >
                          {processingId === selectedRecord.id ? (
                             <>
                                <Loader2 size={18} className="animate-spin me-2" />
                                Processando...
                             </>
                          ) : (
                             selectedRecord.active ? (
                                <>
                                    <Archive size={18} className="me-2" />
                                    Sim, Arquivar
                                </>
                             ) : (
                                <>
                                    <Check size={18} className="me-2" />
                                    Sim, Restaurar
                                </>
                             )
                          )}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
           <div className="modal-backdrop fade show" style={{zIndex: 1065}}></div>
        </>
      )}

    </div>
  );
};

export default FuelList;

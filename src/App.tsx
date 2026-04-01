import React, { useState, useMemo, useEffect } from 'react';
import { subDays, format, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { 
  Transaction, 
  Gateway, 
  ReconResult, 
  PSPConfig, 
  ImportLog,
  Settlement,
  Brand
} from './types';
import { generateMockData, generateSettlementMockData, generatePSPMockData } from './mockData';
import { runReconciliationLogic } from './lib/reconciliation/matching';

// Shared Components
import { Sidebar } from './components/shared/Sidebar';
import { Toast } from './components/shared/Toast';

// Page Components
import { TransactionsPage } from './components/pages/TransactionsPage';
import { ReconciliationPage } from './components/pages/ReconciliationPage';
import { ReportsPage } from './components/pages/ReportsPage';
import { PSPConfigPage } from './components/pages/PSPConfigPage';
import { SettlementCalendarPage } from './components/pages/SettlementCalendarPage';

// Modal Components
import { ImportModal } from './components/modals/ImportModal';
import { ImportHistoryPanel } from './components/modals/ImportHistoryPanel';
import { TransactionDetailsModal } from './components/modals/TransactionDetailsModal';
import { ManualMatchModal } from './components/modals/ManualMatchModal';
import { PSPConfigModal } from './components/modals/PSPConfigModal';
import { PSPHistoryModal } from './components/modals/PSPHistoryModal';

import { motion, AnimatePresence } from 'motion/react';

const App = () => {
  // --- Global State ---
  const [activePage, setActivePage] = useState<'Transactions' | 'Reconciliation' | 'Reports' | 'PSP Config' | 'Settlement Calendar'>('Transactions');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [pspConfigs, setPspConfigs] = useState<PSPConfig[]>([]);
  const [importLog, setImportLog] = useState<ImportLog[]>([]);
  const [toasts, setToasts] = useState<{ id: number, message: string, type: 'success' | 'error' }[]>([]);

  // --- Modal States ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [showManualMatch, setShowManualMatch] = useState<ReconResult | null>(null);
  const [editingPsp, setEditingPsp] = useState<PSPConfig | null>(null);
  const [showPspModal, setShowPspModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPsp, setHistoryPsp] = useState<PSPConfig | null>(null);

  // --- Reconciliation States ---
  const [pspFile, setPspFile] = useState<{ name: string, rows: number, data: any[] } | null>(null);
  const [reconResults, setReconResults] = useState<ReconResult[]>([]);
  const [isReconciling, setIsReconciling] = useState(false);

  // --- Initial Data ---
  useEffect(() => {
    setAllTransactions(generateMockData(200));
    setSettlements(generateSettlementMockData());
    setPspConfigs(generatePSPMockData());
  }, []);

  // --- Handlers ---
  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleImport = (data: Transaction[], log: ImportLog) => {
    setAllTransactions(prev => [...data, ...prev]);
    setImportLog(prev => [log, ...prev]);
    setShowImportModal(false);
    addToast(`Successfully imported ${data.length} transactions`, 'success');
  };

  const handleUndoImport = (batchId: string) => {
    setAllTransactions(prev => prev.filter(t => t.batchId !== batchId));
    setImportLog(prev => prev.filter(l => l.batchId !== batchId));
    addToast('Import undone successfully', 'success');
  };

  const handleClearHistory = () => {
    setImportLog([]);
    addToast('Import history cleared', 'success');
  };

  const handleRunRecon = (gateway: Gateway, matchBy: string) => {
    if (!pspFile) return;
    setIsReconciling(true);
    
    setTimeout(() => {
      const results = runReconciliationLogic(allTransactions, {
        reconGateway: gateway,
        reconMatchBy: matchBy as any,
        pspRows: pspFile.data
      });
      setReconResults(results);
      setIsReconciling(false);
      addToast('Reconciliation completed', 'success');
    }, 1200);
  };

  const handleManualMatch = (pspRow: any) => {
    if (!showManualMatch) return;

    setReconResults(prev => prev.map(r => {
      if (r.id === showManualMatch.id) {
        const diff = Math.abs(pspRow['Amount'] - (r.ourAmount || 0));
        return {
          ...r,
          status: diff > 0.01 ? 'Amount diff' : 'Matched',
          pspRefId: pspRow['PSP Reference ID'],
          pspAmount: pspRow['Amount'],
          difference: diff
        };
      }
      return r;
    }));

    setShowManualMatch(null);
    addToast('Manual match confirmed', 'success');
  };

  const handleSavePsp = (psp: PSPConfig) => {
    if (editingPsp) {
      setPspConfigs(prev => prev.map(p => p.id === psp.id ? psp : p));
      addToast('PSP configuration updated', 'success');
    } else {
      setPspConfigs(prev => [...prev, psp]);
      addToast('New PSP added', 'success');
    }
    setShowPspModal(false);
    setEditingPsp(null);
  };

  const handleDeletePsp = (id: string) => {
    setPspConfigs(prev => prev.filter(p => p.id !== id));
    addToast('PSP configuration deleted', 'success');
  };

  const handleTogglePspStatus = (id: string) => {
    setPspConfigs(prev => prev.map(p => 
      p.id === id ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' } : p
    ));
  };

  const handleUploadPsp = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const XLSX = (window as any).XLSX;
      if (!XLSX) {
        addToast('Excel parser not loaded', 'error');
        return;
      }
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      setPspFile({
        name: file.name,
        rows: data.length,
        data: data
      });
      addToast(`Loaded ${data.length} records from ${file.name}`, 'success');
    };
    reader.readAsBinaryString(file);
  };

  const handleLoadDemoPsp = () => {
    const demoPspData = allTransactions.slice(0, 40).map(t => ({
      'Transaction ID': t.txnId,
      'PSP Reference ID': `PSP-${t.txnId.split('-')[1]}`,
      'Date': t.timestamp,
      'Amount': t.amount,
      'Currency': t.currency
    }));

    // Add some discrepancies
    demoPspData[0]['Amount'] += 10.50;
    demoPspData[1]['Amount'] -= 5.00;
    demoPspData.push({
      'Transaction ID': '',
      'PSP Reference ID': 'PSP-EXTRA-999',
      'Date': new Date(),
      'Amount': 150.00,
      'Currency': 'EUR'
    });

    setPspFile({ 
      name: 'Demo_PSP_Report.xlsx', 
      rows: demoPspData.length,
      data: demoPspData
    });
    addToast('Demo PSP data loaded', 'success');
  };

  const handleExport = (format: 'csv' | 'excel') => {
    addToast(`Exporting transactions as ${format.toUpperCase()}...`, 'success');
    // In a real app, this would trigger a download
  };

  return (
    <div className="flex min-h-screen bg-bg-page font-sans text-text-primary selection:bg-accent-interactive/20 selection:text-accent-interactive">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto relative">
          <AnimatePresence mode="wait">
            {activePage === 'Transactions' && (
              <motion.div 
                key="transactions"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TransactionsPage 
                  allTransactions={allTransactions}
                  onSelectTxn={setSelectedTxn}
                  onImport={() => setShowImportModal(true)}
                  onShowHistory={() => setShowHistoryPanel(!showHistoryPanel)}
                  onExport={handleExport}
                />
              </motion.div>
            )}

            {activePage === 'Reconciliation' && (
              <motion.div 
                key="reconciliation"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ReconciliationPage 
                  allTransactions={allTransactions}
                  pspFile={pspFile}
                  reconResults={reconResults}
                  isReconciling={isReconciling}
                  onRunRecon={handleRunRecon}
                  onManualMatch={setShowManualMatch}
                  onClearRecon={() => { setReconResults([]); setPspFile(null); }}
                  onExportRecon={() => addToast('Exporting reconciliation results...', 'success')}
                  onUploadPsp={handleUploadPsp}
                  onLoadDemoData={handleLoadDemoPsp}
                />
              </motion.div>
            )}

            {activePage === 'Reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ReportsPage 
                  allTransactions={allTransactions}
                  onExport={(data, filename) => addToast(`Exporting ${filename}...`, 'success')}
                />
              </motion.div>
            )}

            {activePage === 'PSP Config' && (
              <motion.div 
                key="psp-config"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PSPConfigPage 
                  pspConfigs={pspConfigs}
                  onEditPsp={(psp) => { setEditingPsp(psp); setShowPspModal(true); }}
                  onAddPsp={() => { setEditingPsp(null); setShowPspModal(true); }}
                  onDeletePsp={handleDeletePsp}
                  onToggleStatus={handleTogglePspStatus}
                  onViewHistory={(psp) => { setHistoryPsp(psp); setShowHistoryModal(true); }}
                />
              </motion.div>
            )}

            {activePage === 'Settlement Calendar' && (
              <motion.div 
                key="settlement-calendar"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SettlementCalendarPage 
                  settlements={settlements}
                  onAddSettlement={(s) => { setSettlements(prev => [...prev, s]); addToast('New settlement added', 'success'); }}
                  onUpdateSettlement={(s) => { setSettlements(prev => prev.map(item => item.id === s.id ? s : item)); addToast('Settlement updated', 'success'); }}
                  onDeleteSettlement={(id) => { setSettlements(prev => prev.filter(item => item.id !== id)); addToast('Settlement deleted', 'success'); }}
                  gateways={pspConfigs.map(p => p.name as Gateway)}
                  brands={['BetNova', 'SpinOrbit', 'GalaxyBet', 'StarPlay', 'NebulaCasino']}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Import History Panel */}
          <AnimatePresence>
            {showHistoryPanel && (
              <ImportHistoryPanel 
                history={importLog}
                onUndo={handleUndoImport}
                onClear={handleClearHistory}
                onClose={() => setShowHistoryPanel(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showImportModal && (
          <ImportModal 
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleImport}
            existingTxnIds={new Set(allTransactions.map(t => t.txnId))}
            gateways={pspConfigs.map(p => p.name)}
          />
        )}

        {selectedTxn && (
          <TransactionDetailsModal 
            isOpen={!!selectedTxn}
            onClose={() => setSelectedTxn(null)}
            selectedTxn={selectedTxn}
          />
        )}

        {showManualMatch && (
          <ManualMatchModal 
            isOpen={!!showManualMatch}
            onClose={() => setShowManualMatch(null)}
            reconItem={showManualMatch}
            pspFile={pspFile?.data || null}
            onMatch={handleManualMatch}
          />
        )}

        {showPspModal && (
          <PSPConfigModal 
            isOpen={showPspModal}
            onClose={() => { setShowPspModal(false); setEditingPsp(null); }}
            psp={editingPsp}
            onSave={handleSavePsp}
          />
        )}

        {showHistoryModal && (
          <PSPHistoryModal 
            isOpen={showHistoryModal}
            onClose={() => { setShowHistoryModal(false); setHistoryPsp(null); }}
            psp={historyPsp}
          />
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-[200]">
        <AnimatePresence>
          {toasts.map(t => (
            <Toast 
              key={t.id}
              message={t.message}
              type={t.type}
              onClose={() => removeToast(t.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;

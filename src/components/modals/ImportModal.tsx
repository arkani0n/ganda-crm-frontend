import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Upload, Check, ArrowRight, ArrowLeft, FileText, 
  FileSpreadsheet, AlertTriangle, CheckCircle2, XCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { Transaction, ImportLog, Status } from '../../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Transaction[], log: ImportLog) => void;
  existingTxnIds: Set<string>;
  gateways: string[];
}

export const ImportModal = ({ 
  isOpen, 
  onClose, 
  onImport,
  existingTxnIds,
  gateways
}: ImportModalProps) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [sourceMetadata, setSourceMetadata] = useState({
    method: '',
    gateway: 'Other / Manual',
    fromDate: '',
    toDate: ''
  });
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'import' | 'update'>('skip');
  const [isParsing, setIsParsing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const settleXFields = [
    'Transaction ID', 'Date & Time', 'Client Name', 'Brand', 
    'Gateway', 'Amount', 'Currency', 'Status', 'Notes',
    '— Skip this column —'
  ];

  const requiredFields = ['Transaction ID', 'Date & Time', 'Amount'];

  const autoMap = (header: string) => {
    const h = header.toLowerCase().trim();
    if (['id', 'txn', 'transaction_id', 'ref', 'transaction id'].some(k => h.includes(k))) return 'Transaction ID';
    if (['date', 'time', 'datetime', 'created'].some(k => h.includes(k))) return 'Date & Time';
    if (['client', 'customer', 'player', 'name', 'user'].some(k => h.includes(k))) return 'Client Name';
    if (['brand', 'operator', 'site'].some(k => h.includes(k))) return 'Brand';
    if (['gateway', 'psp', 'provider', 'method', 'payment'].some(k => h.includes(k))) return 'Gateway';
    if (['amount', 'sum', 'value', 'total'].some(k => h.includes(k))) return 'Amount';
    if (['currency', 'ccy', 'cur'].some(k => h.includes(k))) return 'Currency';
    if (['status', 'state', 'result'].some(k => h.includes(k))) return 'Status';
    if (['note', 'notes', 'comment'].some(k => h.includes(k))) return 'Notes';
    return '— Skip this column —';
  };

  const handleFileSelect = (selectedFile: File) => {
    setValidationError(null);
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (!['csv', 'xls', 'xlsx'].includes(extension || '')) {
      setValidationError('Unsupported file format. Please upload CSV or Excel.');
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    const reader = new FileReader();

    if (extension === 'csv') {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const Papa = (window as any).Papa;
        if (!Papa) {
          setValidationError('CSV parser not loaded. Please try again.');
          setIsParsing(false);
          return;
        }
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results: any) => {
            if (results.data.length === 0) {
              setValidationError('The uploaded file is empty.');
              setFile(null);
            } else {
              setParsedData(results.data);
              const detectedHeaders = results.meta.fields || [];
              setHeaders(detectedHeaders);
              const initialMapping: Record<string, string> = {};
              detectedHeaders.forEach((h: string) => {
                initialMapping[h] = autoMap(h);
              });
              setMapping(initialMapping);
            }
            setIsParsing(false);
          },
          error: (err: any) => {
            setValidationError(`Error parsing CSV: ${err.message}`);
            setIsParsing(false);
          }
        });
      };
      reader.readAsText(selectedFile);
    } else {
      reader.onload = (e) => {
        const data = e.target?.result;
        const XLSX = (window as any).XLSX;
        if (!XLSX) {
          setValidationError('Excel parser not loaded. Please try again.');
          setIsParsing(false);
          return;
        }
        try {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (json.length <= 1) {
            setValidationError('The uploaded file is empty or missing data rows.');
            setFile(null);
          } else {
            const detectedHeaders = json[0] as string[];
            const rows = json.slice(1).map((row: any) => {
              const obj: any = {};
              detectedHeaders.forEach((h, i) => {
                obj[h] = row[i];
              });
              return obj;
            });
            setParsedData(rows);
            setHeaders(detectedHeaders);
            const initialMapping: Record<string, string> = {};
            detectedHeaders.forEach((h: string) => {
              initialMapping[h] = autoMap(h);
            });
            setMapping(initialMapping);
          }
        } catch (err: any) {
          setValidationError(`Error parsing Excel: ${err.message}`);
          setFile(null);
        }
        setIsParsing(false);
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const parseAmount = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = val.toString().replace(/[€$£,\s]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const parseDate = (val: any) => {
    if (val instanceof Date) return val;
    if (!val) return new Date();
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    return new Date();
  };

  const normalizeStatus = (val: any): Status => {
    const s = val?.toString().toLowerCase().trim() || '';
    if (['success', 'successful', 'approved', 'ok', 'completed'].includes(s)) return 'Completed';
    if (['pending', 'processing', 'in progress'].includes(s)) return 'Pending';
    if (['failed', 'declined', 'rejected', 'fail'].includes(s)) return 'Failed';
    if (['dispute', 'chargeback', 'disputed'].includes(s)) return 'Disputed';
    return 'Pending';
  };

  const processedRows = useMemo(() => {
    return parsedData.map((row, idx) => {
      const mapped: any = {
        id: `man-${Date.now()}-${idx}`,
        source: 'manual',
        recon: 'Pending'
      };

      Object.entries(mapping).forEach(([fileCol, settleXField]) => {
        if (settleXField === '— Skip this column —') return;
        
        const val = row[fileCol];
        if (settleXField === 'Transaction ID') mapped.txnId = val?.toString();
        if (settleXField === 'Date & Time') mapped.timestamp = parseDate(val);
        if (settleXField === 'Client Name') mapped.client = val?.toString();
        if (settleXField === 'Brand') mapped.brand = val?.toString();
        if (settleXField === 'Gateway') mapped.gateway = val?.toString();
        if (settleXField === 'Amount') mapped.amount = parseAmount(val);
        if (settleXField === 'Currency') mapped.currency = val?.toString();
        if (settleXField === 'Status') mapped.status = normalizeStatus(val);
        if (settleXField === 'Notes') mapped.notes = val?.toString();
      });

      // Default values for missing mapped fields
      if (!mapped.txnId) mapped.txnId = '';
      if (!mapped.timestamp) mapped.timestamp = new Date();
      if (!mapped.client) mapped.client = 'Unknown Client';
      if (!mapped.brand) mapped.brand = 'NebulaCasino';
      if (!mapped.gateway) mapped.gateway = sourceMetadata.gateway;
      if (mapped.amount === undefined) mapped.amount = 0;
      if (!mapped.currency) mapped.currency = 'EUR';
      if (!mapped.status) mapped.status = 'Pending';

      const isDuplicate = mapped.txnId ? existingTxnIds.has(mapped.txnId) : false;
      const hasError = !mapped.txnId || isNaN(mapped.amount) || !mapped.timestamp;

      return { ...mapped, isDuplicate, hasError };
    });
  }, [parsedData, mapping, sourceMetadata, existingTxnIds]);

  const stats = useMemo(() => {
    const total = processedRows.length;
    const duplicates = processedRows.filter(r => r.isDuplicate).length;
    const errors = processedRows.filter(r => r.hasError).length;
    const newRecords = total - duplicates - errors;
    return { total, duplicates, errors, newRecords };
  }, [processedRows]);

  const handleImport = () => {
    const batchId = Date.now().toString();
    const finalData = processedRows
      .filter(r => !r.hasError)
      .map(r => {
        let txnId = r.txnId;
        if (r.isDuplicate) {
          if (duplicateHandling === 'skip') return null;
          if (duplicateHandling === 'import') txnId = `${r.txnId}-DUP`;
        }
        return {
          ...r,
          txnId,
          batchId,
          source: 'manual' as const
        };
      })
      .filter(Boolean) as Transaction[];

    const log: ImportLog = {
      id: `log-${batchId}`,
      filename: file?.name || 'imported_file',
      timestamp: new Date(),
      rowCount: finalData.length,
      gateway: sourceMetadata.gateway,
      method: sourceMetadata.method,
      batchId
    };

    onImport(finalData, log);
    onClose();
    resetState();
  };

  const resetState = () => {
    setStep(1);
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setMapping({});
    setSourceMetadata({ method: '', gateway: 'Other / Manual', fromDate: '', toDate: '' });
    setDuplicateHandling('skip');
    setShowCancelConfirm(false);
    setValidationError(null);
  };

  const handleClose = () => {
    if (step > 1 || file) {
      setShowCancelConfirm(true);
    } else {
      onClose();
      resetState();
    }
  };

  const downloadTemplate = (type: 'csv' | 'xlsx') => {
    const headers = ['Transaction ID', 'Date', 'Client Name', 'Brand', 'Gateway', 'Amount', 'Currency', 'Status', 'Notes'];
    const data = [
      ['TXN-B123456', '2024-03-25 14:30', 'Alexander Fischer', 'BetNova', 'Binance Pay', '150.00', 'EUR', 'Completed', 'P2P Deposit'],
      ['TXN-B789012', '2024-03-26 09:15', 'Elena Rodriguez', 'SpinOrbit', 'Bank Transfer', '500.00', 'EUR', 'Pending', 'Manual Bank Wire'],
      ['TXN-B345678', '2024-03-26 11:45', 'Marco Rossi', 'GalaxyBet', 'Binance Pay', '75.50', 'EUR', 'Failed', 'Insufficient funds']
    ];

    if (type === 'csv') {
      const csvContent = [headers.join(','), ...data.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'SettleX_Import_Template.csv');
      link.click();
    } else {
      const XLSX = (window as any).XLSX;
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "SettleX_Import_Template.xlsx");
    }
  };

  if (!isOpen) return null;

  const isNextDisabled = step === 2 && !requiredFields.every(rf => Object.values(mapping).includes(rf));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[640px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h2 id="import-modal-title" className="text-[15px] font-bold text-text-primary">Import Transactions</h2>
            <span className="text-[12px] font-medium text-text-secondary">Step {step} of 3</span>
          </div>
          <div className="h-[3px] w-full bg-bg-page rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(step / 3) * 100}%` }}
              className="h-full bg-accent-interactive transition-all duration-500"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {step === 1 && (
            <div className="flex flex-col gap-6">
              {validationError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive text-[13px]">
                  <AlertCircle size={18} />
                  {validationError}
                </div>
              )}
              
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile) handleFileSelect(droppedFile);
                }}
                className={cn(
                  "border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all",
                  file ? "border-green-200 bg-green-50/30 h-[140px]" : "border-border-subtle hover:border-accent-interactive/50 h-[180px]"
                )}
              >
                {file ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                      <Check size={20} />
                    </div>
                    <div className="text-[13px] font-bold text-text-primary mb-1">{file.name}</div>
                    <div className="text-[11px] text-text-tertiary flex items-center gap-2">
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{parsedData.length} rows detected</span>
                    </div>
                    <button 
                      onClick={() => { setFile(null); setParsedData([]); }}
                      className="mt-3 text-[11px] font-semibold text-accent-interactive hover:underline"
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-accent-hover text-accent-interactive rounded-full flex items-center justify-center mb-4">
                      <Upload size={24} />
                    </div>
                    <p className="text-[14px] font-medium text-text-primary mb-1">Drop your CSV or Excel file here</p>
                    <p className="text-[12px] text-text-secondary mb-4">Supports .csv, .xls, .xlsx — max 10MB</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[13px] font-semibold text-accent-interactive hover:underline"
                    >
                      or browse files
                    </button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv,.xls,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) handleFileSelect(selectedFile);
                      }}
                    />
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Payment method</label>
                  <input 
                    type="text" 
                    placeholder="e.g. P2P, Bank Transfer, Manual..."
                    value={sourceMetadata.method}
                    onChange={(e) => setSourceMetadata(prev => ({ ...prev, method: e.target.value }))}
                    className="w-full border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Gateway</label>
                  <select 
                    value={sourceMetadata.gateway}
                    onChange={(e) => setSourceMetadata(prev => ({ ...prev, gateway: e.target.value }))}
                    className="w-full border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors"
                  >
                    {gateways.map(g => <option key={g} value={g}>{g}</option>)}
                    <option value="Other / Manual">Other / Manual</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Period From</label>
                  <input 
                    type="date" 
                    value={sourceMetadata.fromDate}
                    onChange={(e) => setSourceMetadata(prev => ({ ...prev, fromDate: e.target.value }))}
                    className="w-full border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase">Period To</label>
                  <input 
                    type="date" 
                    value={sourceMetadata.toDate}
                    onChange={(e) => setSourceMetadata(prev => ({ ...prev, toDate: e.target.value }))}
                    className="w-full border border-border-subtle rounded-lg px-3 py-2 text-[13px] outline-none focus:border-accent-interactive transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle text-center">
                <p className="text-[12px] text-text-secondary mb-2">Don't have the right format? Download our template</p>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => downloadTemplate('csv')} className="text-[12px] font-semibold text-accent-interactive hover:underline flex items-center gap-1.5">
                    <FileText size={14} /> CSV Template
                  </button>
                  <button onClick={() => downloadTemplate('xlsx')} className="text-[12px] font-semibold text-accent-interactive hover:underline flex items-center gap-1.5">
                    <FileSpreadsheet size={14} /> Excel Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-[14px] font-bold text-text-primary mb-1">Map your file columns to SettleX fields</h3>
                <p className="text-[12px] text-text-secondary">We detected {headers.length} columns. Match each to the correct field.</p>
              </div>

              <div className="flex flex-col gap-2">
                {headers.map((header) => {
                  const mappedField = mapping[header];
                  const isAutoMatched = mappedField !== '— Skip this column —';
                  const isRequired = requiredFields.includes(mappedField);
                  const previewValues = parsedData.slice(0, 3).map(row => row[header]).join(', ');

                  return (
                    <div key={header} className="bg-bg-page border border-border-subtle rounded-xl p-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-white border border-border-subtle rounded text-[10px] font-mono text-text-secondary truncate max-w-[150px]">
                            {header}
                          </span>
                          <ArrowRight size={12} className="text-text-tertiary" />
                        </div>
                        <div className="text-[11px] text-text-tertiary truncate italic">
                          Preview: {previewValues || '(empty)'}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2">
                          {isAutoMatched ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                              <Check size={10} /> ✓ auto-matched
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                              <AlertTriangle size={10} /> ⚠ unmapped
                            </span>
                          )}
                          <select 
                            value={mappedField}
                            onChange={(e) => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                            className={cn(
                              "border rounded-lg px-3 py-1.5 text-[12px] outline-none transition-colors min-w-[160px]",
                              isRequired ? "border-accent-interactive bg-accent-hover/20" : "border-border-subtle"
                            )}
                          >
                            {settleXFields.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 p-3 bg-accent-hover/30 rounded-lg border border-accent-interactive/10">
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  <span className="font-bold text-text-primary">Required fields:</span> Transaction ID, Date, Amount. <br />
                  <span className="font-bold text-text-primary">Optional but recommended:</span> Client, Gateway, Currency, Status.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-border-subtle rounded-xl p-3 text-center">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase mb-1">Rows to import</div>
                  <div className="text-[18px] font-bold text-text-primary">{stats.total - stats.errors}</div>
                </div>
                <div className="bg-white border border-border-subtle rounded-xl p-3 text-center">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase mb-1">Duplicates</div>
                  <div className={cn("text-[18px] font-bold", stats.duplicates > 0 ? "text-amber-600" : "text-text-primary")}>
                    {stats.duplicates}
                  </div>
                </div>
                <div className="bg-white border border-border-subtle rounded-xl p-3 text-center">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase mb-1">New Records</div>
                  <div className="text-[18px] font-bold text-green-600">{stats.newRecords}</div>
                </div>
              </div>

              {stats.duplicates > 0 && (
                <div className="bg-white border border-border-subtle rounded-xl p-4">
                  <h4 className="text-[12px] font-bold text-text-primary mb-3">Duplicate Handling</h4>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'skip', label: 'Skip duplicates', desc: "Don't import rows with existing TXN ID" },
                      { id: 'import', label: 'Import anyway', desc: 'Add as new rows (TXN ID gets suffix "-DUP")' },
                      { id: 'update', label: 'Update existing', desc: 'Overwrite matching records with file data' }
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-3 p-2 hover:bg-bg-page rounded-lg cursor-pointer transition-colors">
                        <input 
                          type="radio" 
                          name="dup" 
                          checked={duplicateHandling === opt.id}
                          onChange={() => setDuplicateHandling(opt.id as any)}
                          className="w-4 h-4 text-accent-interactive focus:ring-accent-interactive" 
                        />
                        <div>
                          <div className="text-[13px] font-semibold text-text-primary">{opt.label}</div>
                          <div className="text-[11px] text-text-tertiary">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <h4 className="text-[12px] font-bold text-text-primary">Preview (First 10 rows)</h4>
                <div className="border border-border-subtle rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-bg-page border-b border-border-subtle">
                      <tr className="text-[10px] font-bold text-text-tertiary uppercase">
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">TXN ID</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Client</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {processedRows.slice(0, 10).map((row, i) => (
                        <tr key={i} className={cn(
                          "text-[11px]",
                          row.hasError ? "border-l-4 border-l-destructive bg-destructive/5" : 
                          row.isDuplicate ? "border-l-4 border-l-amber-500 bg-amber-50/30" : 
                          "border-l-4 border-l-green-500 bg-green-50/30"
                        )}>
                          <td className="px-3 py-2 text-text-tertiary">{i + 1}</td>
                          <td className="px-3 py-2 font-mono font-medium text-text-primary">{row.txnId || 'MISSING'}</td>
                          <td className="px-3 py-2 text-text-secondary">{format(row.timestamp, 'dd MMM HH:mm')}</td>
                          <td className="px-3 py-2 text-text-primary font-medium">{row.client}</td>
                          <td className="px-3 py-2 text-right font-bold text-text-primary">{row.amount.toLocaleString()} {row.currency}</td>
                          <td className="px-3 py-2">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase",
                              row.status === 'Completed' ? "bg-green-100 text-green-700" :
                              row.status === 'Pending' ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            )}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {row.hasError ? (
                              <span className="flex items-center gap-1 text-destructive font-bold"><XCircle size={10} /> Error</span>
                            ) : row.isDuplicate ? (
                              <span className="flex items-center gap-1 text-amber-600 font-bold"><AlertTriangle size={10} /> Duplicate</span>
                            ) : (
                              <span className="flex items-center gap-1 text-green-600 font-bold"><CheckCircle2 size={10} /> New</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-text-tertiary italic">
                  {stats.total - stats.errors} rows will be imported, {stats.duplicates} duplicates {duplicateHandling === 'skip' ? 'skipped' : 'processed'}, {stats.errors} rows with errors skipped.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle bg-bg-page flex items-center justify-between">
          <button 
            onClick={handleClose}
            className="text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button 
                onClick={() => setStep(prev => prev - 1)}
                className="px-4 py-2 border border-border-subtle rounded-lg text-[13px] font-medium text-text-secondary hover:bg-white transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
            
            {step < 3 ? (
              <button 
                disabled={!file || isParsing || isNextDisabled}
                onClick={() => setStep(prev => prev + 1)}
                className={cn(
                  "px-6 py-2 rounded-lg text-[13px] font-bold text-white transition-all flex items-center gap-2",
                  (!file || isParsing || isNextDisabled) ? "bg-text-tertiary cursor-not-allowed" : "bg-accent-interactive hover:opacity-90 shadow-lg shadow-accent-interactive/20"
                )}
                title={isNextDisabled ? "Please map required fields first" : ""}
              >
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button 
                onClick={handleImport}
                className="px-8 py-2 bg-accent-interactive text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-all shadow-lg shadow-accent-interactive/20 flex items-center gap-2"
              >
                <Upload size={14} /> Complete Import
              </button>
            )}
          </div>
        </div>

        {/* Cancel Confirmation */}
        <AnimatePresence>
          {showCancelConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[110] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h4 className="text-[16px] font-bold text-text-primary mb-2">Cancel Import?</h4>
              <p className="text-[13px] text-text-secondary mb-6 max-w-[300px]">
                You have unsaved progress. Are you sure you want to cancel the import process?
              </p>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-6 py-2 border border-border-subtle rounded-lg text-[13px] font-medium text-text-secondary hover:bg-bg-page transition-colors"
                >
                  No, stay
                </button>
                <button 
                  onClick={() => { resetState(); onClose(); }}
                  className="px-6 py-2 bg-destructive text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-colors"
                >
                  Yes, cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const AlertCircle = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

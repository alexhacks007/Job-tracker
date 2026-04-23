import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const EXPECTED_FIELDS = [
  { key: 'name', label: 'Company Name', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'mobile', label: 'Mobile', required: false },
  { key: 'address', label: 'Location / Address', required: false },
  { key: 'website', label: 'Website', required: false },
  { key: 'company_size', label: 'Company Size', required: false },
  { key: 'company_type', label: 'Company Type', required: false },
  { key: 'notes', label: 'Notes', required: false }
];

const BulkUploadModal = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [fileData, setFileData] = useState(null); // Array of raw rows (objects)
  const [fileHeaders, setFileHeaders] = useState([]);
  
  // mapping[expectedKey] = fileHeaderKey
  const [mapping, setMapping] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    
    if (extension === 'csv') {
       Papa.parse(file, {
         header: true,
         skipEmptyLines: true,
         complete: (results) => {
           if (results.data.length > 0) {
              setFileData(results.data);
              setFileHeaders(Object.keys(results.data[0]));
              autoMap(Object.keys(results.data[0]));
              setStep(2);
           } else {
              toast.error("File is empty");
           }
         }
       });
    } else if (extension === 'xlsx' || extension === 'xls') {
       const reader = new FileReader();
       reader.onload = (evt) => {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          if (data.length > 0) {
             setFileData(data);
             setFileHeaders(Object.keys(data[0]));
             autoMap(Object.keys(data[0]));
             setStep(2);
          } else {
             toast.error("File is empty");
          }
       };
       reader.readAsBinaryString(file);
    } else {
       toast.error("Unsupported file format. Use .csv or .xlsx");
    }
  };

  const autoMap = (headers) => {
    const newMapping = {};
    headers.forEach(h => {
       const hLower = h.toLowerCase();
       if (hLower.includes('name') || hLower.includes('company')) newMapping.name = h;
       if (hLower.includes('mail')) newMapping.email = h;
       if (hLower.includes('phone') || hLower.includes('mobile')) newMapping.mobile = h;
       if (hLower.includes('address') || hLower.includes('location') || hLower.includes('city')) newMapping.address = h;
       if (hLower.includes('web') || hLower.includes('url')) newMapping.website = h;
       if (hLower.includes('size') || hLower.includes('employees')) newMapping.company_size = h;
       if (hLower.includes('type') || hLower.includes('industry')) newMapping.company_type = h;
       if (hLower.includes('note') || hLower.includes('desc')) newMapping.notes = h;
    });
    setMapping(newMapping);
  };

  const handleUpload = async () => {
    // Validate required mappings
    if (!mapping.name) {
       toast.error("Company Name mapping is required!");
       return;
    }

    // Transform data
    const transformedData = fileData.map(row => {
       const mappedObj = {};
       Object.keys(mapping).forEach(expectedKey => {
          if (mapping[expectedKey]) {
             mappedObj[expectedKey] = row[mapping[expectedKey]];
          }
       });
       return mappedObj;
    });

    try {
      setIsUploading(true);
      const res = await fetch('/api/companies/bulk_upload', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify(transformedData)
      });
      
      if (res.ok) {
         const data = await res.json();
         toast.success(data.message || 'Import successful');
         onSuccess();
         onClose();
      } else {
         toast.error("Upload failed");
      }
    } catch (err) {
      toast.error("An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Upload size={20} className="text-brand-indigo" /> Advanced Bulk Import</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6">
          {/* STEP INDICATOR */}
          <div className="flex items-center gap-4 mb-8">
             <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 1 ? 'bg-brand-indigo text-white' : 'bg-slate-800 text-slate-500'}`}>1</div>
             <div className={`h-1 flex-1 rounded ${step >= 2 ? 'bg-brand-indigo' : 'bg-slate-800'}`}></div>
             <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 2 ? 'bg-brand-indigo text-white' : 'bg-slate-800 text-slate-500'}`}>2</div>
             <div className={`h-1 flex-1 rounded ${step >= 3 ? 'bg-brand-indigo' : 'bg-slate-800'}`}></div>
             <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 3 ? 'bg-brand-indigo text-white' : 'bg-slate-800 text-slate-500'}`}>3</div>
          </div>

          {step === 1 && (
             <div className="text-center py-12">
                <Upload size={64} className="mx-auto text-slate-600 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">Upload your Company Data</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">Supports .csv and .xlsx files. Don't worry about column names, our AI will help you map them in the next step.</p>
                <input type="file" id="bulk-upload" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                <label htmlFor="bulk-upload" className="btn-primary inline-flex items-center gap-2 cursor-pointer py-3 px-8 rounded-xl text-lg">
                   Browse Files
                </label>
             </div>
          )}

          {step === 2 && (
             <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-white">Map Your Columns</h3>
                   <p className="text-sm text-slate-400">Found {fileData.length} rows</p>
                </div>
                
                <div className="bg-slate-800/50 rounded-xl overflow-y-auto max-h-[50vh] border border-slate-700 custom-scrollbar">
                   <table className="w-full text-left">
                      <thead className="sticky top-0 bg-slate-800 z-10">
                         <tr>
                            <th className="p-4 text-sm font-bold text-slate-300 border-b border-slate-700">Database Field</th>
                            <th className="p-4 text-sm font-bold text-slate-300 border-b border-slate-700">Your File Column</th>
                         </tr>
                      </thead>
                      <tbody>
                         {EXPECTED_FIELDS.map(field => (
                            <tr key={field.key} className="border-b border-slate-700/50">
                               <td className="p-4">
                                  <span className="text-white font-medium block">{field.label}</span>
                                  {field.required && <span className="text-xs text-red-400 font-bold">Required</span>}
                               </td>
                               <td className="p-4">
                                  <select 
                                     className={`w-full bg-slate-900 border ${field.required && !mapping[field.key] ? 'border-red-500' : 'border-slate-600'} rounded-lg p-2.5 text-white outline-none focus:border-brand-indigo`}
                                     value={mapping[field.key] || ''}
                                     onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}
                                  >
                                     <option value="">-- Ignore this field --</option>
                                     {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                  </select>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>

                <div className="mt-8 flex justify-between">
                   <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
                   <button 
                      onClick={() => {
                         if (!mapping.name) {
                            toast.error("Company Name must be mapped!");
                            return;
                         }
                         setStep(3);
                      }} 
                      className="btn-primary flex items-center gap-2"
                   >
                      Next: Preview <ArrowRight size={18} />
                   </button>
                </div>
             </div>
          )}

          {step === 3 && (
             <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-6 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-emerald-400">
                   <CheckCircle size={24} />
                   <div>
                      <h4 className="font-bold">Mapping Successful</h4>
                      <p className="text-sm opacity-80">Ready to import {fileData.length} companies into your directory.</p>
                   </div>
                </div>

                <h4 className="font-bold text-white mb-4">Preview (First 3 rows)</h4>
                <div className="overflow-auto max-h-[50vh] bg-slate-800/50 rounded-xl border border-slate-700 custom-scrollbar">
                   <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="sticky top-0 bg-slate-800 z-10">
                         <tr>
                            {EXPECTED_FIELDS.filter(f => mapping[f.key]).map(f => (
                               <th key={f.key} className="p-3 text-slate-400 font-bold border-b border-slate-700">{f.label}</th>
                            ))}
                         </tr>
                      </thead>
                      <tbody>
                         {fileData.slice(0, 3).map((row, i) => (
                            <tr key={i} className="border-b border-slate-700/50">
                               {EXPECTED_FIELDS.filter(f => mapping[f.key]).map(f => (
                                  <td key={f.key} className="p-3 text-white">{row[mapping[f.key]] || '-'}</td>
                               ))}
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>

                <div className="mt-8 flex justify-between">
                   <button onClick={() => setStep(2)} className="btn-secondary" disabled={isUploading}>Back</button>
                   <button onClick={handleUpload} disabled={isUploading} className="btn-primary bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
                      {isUploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Upload size={18} />}
                      {isUploading ? 'Importing...' : `Import ${fileData.length} Companies`}
                   </button>
                </div>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BulkUploadModal;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileUp, AlertCircle, CheckCircle, Download, AlertTriangle, Info, RefreshCw, ArrowRight, Shield } from 'lucide-react';

export default function DataIngestion() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null);
    const [batchId, setBatchId] = useState(null);
    const [batches, setBatches] = useState([]);
    const [validation, setValidation] = useState(null);
    const [committing, setCommitting] = useState(false);

    const fetchBatches = async () => {
        try {
            const res = await axios.get('/api/ingest/batches', { withCredentials: true });
            setBatches(res.data);
        } catch (err) {
            console.error("Failed to fetch batches", err);
        }
    };

    useEffect(() => { fetchBatches(); }, []);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setStatus(null);
            setValidation(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setStatus(null);
        setValidation(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('/api/ingest/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            const data = res.data;
            setBatchId(data.batchId);
            setValidation(data.validation);

            if (data.validation?.adminActions?.length > 0) {
                setStatus({ type: 'warning', message: `${data.rowCount} rows parsed — but some items need to be created in Admin first.` });
            } else if (data.validation?.errorCount > 0) {
                setStatus({ type: 'warning', message: `${data.rowCount} rows parsed. ${data.validation.validCount} valid, ${data.validation.errorCount} with errors.` });
            } else {
                setStatus({ type: 'success', message: `${data.rowCount} rows parsed and ready to commit!` });
            }

            setFile(null);
            // Reset the file input
            const inp = document.getElementById('file-upload');
            if (inp) inp.value = '';
            fetchBatches();
        } catch (err) {
            const msg = err.response?.data?.details
                ? err.response.data.details.join('; ')
                : err.response?.data?.error || err.message;
            setStatus({ type: 'error', message: msg });
        } finally {
            setUploading(false);
        }
    };

    const handleCommit = async (id) => {
        setCommitting(true);
        try {
            const res = await axios.post(`/api/ingest/batches/${id}/commit`, {}, { withCredentials: true });
            if (res.data.success) {
                setStatus({ type: 'success', message: res.data.message });
                setValidation(null);
                setBatchId(null);
            } else {
                // Has admin actions
                setValidation({
                    adminActions: res.data.adminActions || [],
                    validCount: res.data.validCount || 0,
                    errorCount: res.data.errorCount || 0,
                });
                setStatus({ type: 'warning', message: res.data.message });
            }
            fetchBatches();
        } catch (err) {
            const errData = err.response?.data;
            if (errData?.adminActions) {
                setValidation({
                    adminActions: errData.adminActions,
                    validCount: errData.validCount || 0,
                    errorCount: errData.errorCount || 0,
                });
                setStatus({ type: 'warning', message: errData.message });
            } else {
                setStatus({ type: 'error', message: 'Commit failed: ' + (errData?.error || err.message) });
            }
        } finally {
            setCommitting(false);
        }
    };

    const handleRevalidate = async (id) => {
        try {
            const res = await axios.get(`/api/ingest/batches/${id}/validate`, { withCredentials: true });
            setBatchId(id);
            setValidation(res.data);
            if (res.data.adminActions?.length > 0) {
                setStatus({ type: 'warning', message: 'Some items still need to be created in Admin.' });
            } else if (res.data.errorCount > 0) {
                setStatus({ type: 'warning', message: `${res.data.validCount} valid, ${res.data.errorCount} errors.` });
            } else {
                setStatus({ type: 'success', message: `All ${res.data.validCount} rows are valid and ready to commit!` });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Validation failed: ' + err.message });
        }
    };

    const downloadTemplate = () => {
        window.open('/api/ingest/template', '_blank');
    };

    return (
        <div style={{ padding: '28px 28px 100px 28px', maxWidth: 900, margin: '0 auto' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>
                Data Ingestion
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
                Import drilling data from Excel files into the database
            </p>

            {/* Template Download */}
            <div style={{
                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 12, padding: '14px 18px', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Info size={18} style={{ color: '#3b82f6' }} />
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>
                        <strong style={{ color: '#e2e8f0' }}>Use the import template</strong> — download it, fill in your data, then upload here.
                    </span>
                </div>
                <button
                    onClick={downloadTemplate}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(59,130,246,0.3)',
                        background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    <Download size={14} /> Download Template
                </button>
            </div>

            {/* Upload Card */}
            <div style={{
                background: '#111827', borderRadius: 16, padding: 32,
                border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20, textAlign: 'center',
            }}>
                <div style={{
                    border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 12, padding: '36px 20px',
                    transition: 'border-color 0.2s',
                }}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#f97316'; }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    onDrop={e => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        if (e.dataTransfer.files[0]) {
                            setFile(e.dataTransfer.files[0]);
                            setStatus(null);
                            setValidation(null);
                        }
                    }}
                >
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} style={{ display: 'none' }} id="file-upload" />
                    <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <FileUp size={48} style={{ color: '#334155', marginBottom: 12 }} />
                        <span style={{ fontSize: 15, color: '#94a3b8' }}>
                            {file ? file.name : 'Click to select or drag an Excel file'}
                        </span>
                        <span style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
                            Supported: .xlsx, .xls, .csv
                        </span>
                    </label>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    style={{
                        marginTop: 20, padding: '12px 28px', borderRadius: 12, border: 'none',
                        background: !file || uploading ? '#334155' : 'linear-gradient(135deg, #f97316, #ea580c)',
                        color: 'white', fontWeight: 600, fontSize: 14, cursor: !file || uploading ? 'not-allowed' : 'pointer',
                        width: '100%', transition: 'all 0.2s',
                        boxShadow: file && !uploading ? '0 4px 16px rgba(249,115,22,0.3)' : 'none',
                    }}
                >
                    {uploading ? 'Processing...' : 'Upload & Validate'}
                </button>

                {/* Status Message */}
                {status && (
                    <div style={{
                        marginTop: 16, padding: '12px 16px', borderRadius: 10,
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        background: status.type === 'success' ? 'rgba(16,185,129,0.1)'
                            : status.type === 'warning' ? 'rgba(245,158,11,0.1)'
                                : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${status.type === 'success' ? 'rgba(16,185,129,0.2)'
                            : status.type === 'warning' ? 'rgba(245,158,11,0.2)'
                                : 'rgba(239,68,68,0.2)'}`,
                    }}>
                        {status.type === 'success' ? <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }} />
                            : status.type === 'warning' ? <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                                : <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />}
                        <span style={{
                            fontSize: 13,
                            color: status.type === 'success' ? '#6ee7b7'
                                : status.type === 'warning' ? '#fcd34d'
                                    : '#fca5a5',
                        }}>
                            {status.message}
                        </span>
                    </div>
                )}
            </div>

            {/* ═══════════ ADMIN ACTIONS REQUIRED ═══════════ */}
            {validation?.adminActions?.length > 0 && (
                <div style={{
                    background: '#111827', borderRadius: 16, padding: 24,
                    border: '1px solid rgba(245,158,11,0.2)', marginBottom: 20,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <Shield size={20} style={{ color: '#f59e0b' }} />
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24', margin: 0 }}>
                            Action Required — Create Missing Items in Admin
                        </h2>
                    </div>

                    {validation.adminActions.map((action, i) => (
                        <div key={i} style={{
                            background: 'rgba(245,158,11,0.06)', borderRadius: 10,
                            padding: '14px 16px', marginBottom: i < validation.adminActions.length - 1 ? 12 : 0,
                            border: '1px solid rgba(245,158,11,0.1)',
                        }}>
                            <p style={{ fontSize: 13, color: '#fcd34d', marginBottom: 10, fontWeight: 500 }}>
                                {action.message}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                {action.items.map((item, j) => (
                                    <span key={j} style={{
                                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                        background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                    }}>
                                        {item}
                                    </span>
                                ))}
                            </div>
                            {action.existingItems?.length > 0 && (
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                                        Currently in Admin ({action.type === 'rig' ? 'Rigs' : 'Projects'}):
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {action.existingItems.map((item, j) => (
                                            <span key={j} style={{
                                                padding: '3px 10px', borderRadius: 16, fontSize: 11,
                                                background: 'rgba(16,185,129,0.1)', color: '#6ee7b7',
                                                border: '1px solid rgba(16,185,129,0.15)',
                                            }}>
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            After creating the missing items in Admin →
                        </span>
                        <button
                            onClick={() => handleRevalidate(batchId)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)',
                                background: 'rgba(245,158,11,0.1)', color: '#fbbf24',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            <RefreshCw size={12} /> Re-validate
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════════ VALIDATION ERRORS ═══════════ */}
            {validation?.sampleErrors?.length > 0 && (
                <div style={{
                    background: '#111827', borderRadius: 16, padding: 20,
                    border: '1px solid rgba(239,68,68,0.15)', marginBottom: 20,
                }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fca5a5', marginBottom: 12 }}>
                        Row Errors ({validation.errorCount} total)
                    </h3>
                    {validation.sampleErrors.map((err, i) => (
                        <div key={i} style={{
                            padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                            background: 'rgba(239,68,68,0.05)', fontSize: 12, color: '#94a3b8',
                        }}>
                            <strong style={{ color: '#f87171' }}>Row {err.row}:</strong>{' '}
                            {err.errors.join(' · ')}
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════════ COMMIT BUTTON ═══════════ */}
            {batchId && validation && !validation.adminActions?.length && validation.validCount > 0 && (
                <div style={{
                    background: '#111827', borderRadius: 16, padding: 20,
                    border: '1px solid rgba(16,185,129,0.15)', marginBottom: 20,
                    textAlign: 'center',
                }}>
                    <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 14 }}>
                        <strong style={{ color: '#6ee7b7' }}>{validation.validCount}</strong> rows ready to import
                        {validation.errorCount > 0 && (
                            <span style={{ color: '#f87171' }}> ({validation.errorCount} will be skipped)</span>
                        )}
                    </p>
                    <button
                        onClick={() => handleCommit(batchId)}
                        disabled={committing}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '12px 28px', borderRadius: 12, border: 'none',
                            background: committing ? '#334155' : 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white', fontWeight: 600, fontSize: 14, cursor: committing ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                        }}
                    >
                        {committing ? 'Importing...' : <><ArrowRight size={16} /> Commit to Database</>}
                    </button>
                </div>
            )}

            {/* ═══════════ BATCH HISTORY ═══════════ */}
            <div style={{
                background: '#111827', borderRadius: 16, padding: '20px 24px',
                border: '1px solid rgba(255,255,255,0.06)',
            }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                    Import History
                </h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Batch ID</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rows</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Uploaded</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '32px 12px', textAlign: 'center', color: '#475569', fontStyle: 'italic' }}>
                                        No imports yet. Upload an Excel file to get started.
                                    </td>
                                </tr>
                            ) : (
                                batches.map((batch) => (
                                    <tr key={batch.batchId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#f97316', fontSize: 12 }}>
                                            {batch.batchId?.slice(0, 8)}...
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                                background: batch.status === 'Imported' ? 'rgba(16,185,129,0.15)' :
                                                    batch.status === 'Pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                                color: batch.status === 'Imported' ? '#6ee7b7' :
                                                    batch.status === 'Pending' ? '#fcd34d' : '#fca5a5',
                                            }}>
                                                {batch.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                                            {batch.totalRows || 'N/A'}
                                        </td>
                                        <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>
                                            {batch.createdAt ? new Date(batch.createdAt).toLocaleString() : '—'}
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                            {batch.status === 'Pending' && (
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button
                                                        onClick={() => handleRevalidate(batch.batchId)}
                                                        style={{
                                                            padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(59,130,246,0.3)',
                                                            background: 'transparent', color: '#60a5fa', fontSize: 11, cursor: 'pointer',
                                                        }}
                                                    >
                                                        Validate
                                                    </button>
                                                    <button
                                                        onClick={() => handleCommit(batch.batchId)}
                                                        style={{
                                                            padding: '4px 10px', borderRadius: 6, border: 'none',
                                                            background: '#f97316', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                                        }}
                                                    >
                                                        Commit
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mandatory Fields Info */}
            <div style={{
                marginTop: 20, background: '#111827', borderRadius: 16, padding: '18px 22px',
                border: '1px solid rgba(255,255,255,0.06)',
            }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>
                    Template Column Reference
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: 12 }}>
                    <div><span style={{ color: '#f87171' }}>*</span> <span style={{ color: '#e2e8f0' }}>Date</span> <span style={{ color: '#475569' }}>— YYYY-MM-DD</span></div>
                    <div><span style={{ color: '#f87171' }}>*</span> <span style={{ color: '#e2e8f0' }}>Rig</span> <span style={{ color: '#475569' }}>— must exist in Admin</span></div>
                    <div><span style={{ color: '#f87171' }}>*</span> <span style={{ color: '#e2e8f0' }}>Project</span> <span style={{ color: '#475569' }}>— must exist in Admin</span></div>
                    <div><span style={{ color: '#f87171' }}>*</span> <span style={{ color: '#e2e8f0' }}>Shift</span> <span style={{ color: '#475569' }}>— Day or Night</span></div>
                    <div><span style={{ color: '#f87171' }}>*</span> <span style={{ color: '#e2e8f0' }}>Meters Drilled</span> <span style={{ color: '#475569' }}>— number</span></div>
                    <div style={{ color: '#475569' }}>+ 17 optional fields (hours, costs, notes...)</div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Sparkles, MessageSquare, Loader2, ChevronRight } from 'lucide-react';
import axios from 'axios';

export default function AIDEPanel({ isOpen, onClose }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '👋 Welcome to **Equinox AI**. I can answer questions about your drilling operations, rig performance, equipment health, and more.\n\nTry asking me something like:\n- "What is my best performing rig?"\n- "Show me NPT breakdown"\n- "Which equipment needs service?"' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchSuggestions();
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchSuggestions = async () => {
        try {
            const res = await axios.get('/api/ai/suggestions', { withCredentials: true });
            setSuggestions(res.data.suggestions || []);
        } catch (e) {
            console.error('Failed to fetch suggestions:', e);
        }
    };

    const sendMessage = async (text) => {
        const msg = text || input.trim();
        if (!msg || loading) return;

        const userMsg = { role: 'user', content: msg };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.filter(m => m.role !== 'system').map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                content: m.content,
            }));
            const res = await axios.post('/api/ai/chat', { message: msg, history }, { withCredentials: true });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Failed to get response. Check server connection.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Simple markdown-ish renderer
    const renderContent = (text) => {
        // Tables
        if (text.includes('|') && text.includes('---')) {
            const parts = text.split('\n');
            const result = [];
            let tableRows = [];
            let inTable = false;

            for (const line of parts) {
                if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                    if (line.includes('---')) { inTable = true; continue; }
                    const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
                    tableRows.push(cells);
                    inTable = true;
                } else {
                    if (inTable && tableRows.length > 0) {
                        const headers = tableRows[0];
                        const rows = tableRows.slice(1);
                        result.push(
                            <div key={result.length} style={{ overflowX: 'auto', margin: '8px 0' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <thead>
                                        <tr>{headers.map((h, i) => <th key={i} style={{ padding: '6px 8px', borderBottom: '1px solid #f97316', textAlign: 'left', color: '#f97316', fontWeight: 600 }}>{h}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, ri) => (
                                            <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                {row.map((cell, ci) => <td key={ci} style={{ padding: '5px 8px', color: '#cbd5e1' }}>{cell}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                        tableRows = [];
                        inTable = false;
                    }
                    // Bold
                    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                        .replace(/`(.*?)`/g, '<code style="background:rgba(249,115,22,0.15);padding:1px 4px;border-radius:3px;color:#fb923c;font-size:11px">$1</code>');
                    if (line.trim()) {
                        result.push(<p key={result.length} style={{ margin: '4px 0' }} dangerouslySetInnerHTML={{ __html: formatted }} />);
                    }
                }
            }

            // Flush remaining table
            if (tableRows.length > 0) {
                const headers = tableRows[0];
                const rows = tableRows.slice(1);
                result.push(
                    <div key={result.length} style={{ overflowX: 'auto', margin: '8px 0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr>{headers.map((h, i) => <th key={i} style={{ padding: '6px 8px', borderBottom: '1px solid #f97316', textAlign: 'left', color: '#f97316', fontWeight: 600 }}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {rows.map((row, ri) => (
                                    <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        {row.map((cell, ci) => <td key={ci} style={{ padding: '5px 8px', color: '#cbd5e1' }}>{cell}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }

            return result;
        }

        // Simple text with bold/code
        return text.split('\n').map((line, i) => {
            const formatted = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/`(.*?)`/g, '<code style="background:rgba(249,115,22,0.15);padding:1px 4px;border-radius:3px;color:#fb923c;font-size:11px">$1</code>');
            if (line.startsWith('- ')) {
                return <div key={i} style={{ paddingLeft: 12, margin: '2px 0', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#f97316' }}>›</span>
                    <span dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />
                </div>;
            }
            return line.trim() ? <p key={i} style={{ margin: '3px 0' }} dangerouslySetInnerHTML={{ __html: formatted }} /> : <br key={i} />;
        });
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)', zIndex: 998,
                animation: 'fadeIn 0.2s ease-out'
            }} />

            {/* Panel */}
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', maxWidth: '100vw',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderLeft: '1px solid rgba(249,115,22,0.2)',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
                zIndex: 999, display: 'flex', flexDirection: 'column',
                animation: 'slideInRight 0.3s ease-out',
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(249,115,22,0.05)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #f97316, #ea580c)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Sparkles size={18} color="white" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>Equinox AI</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Drilling Intelligence Assistant</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8',
                        width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                        onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = '#f1f5f9'; }}
                        onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = '#94a3b8'; }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Messages */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '16px 20px',
                    display: 'flex', flexDirection: 'column', gap: 16,
                }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} style={{
                            display: 'flex', gap: 10,
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        }}>
                            {msg.role === 'assistant' && (
                                <div style={{
                                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
                                }}>
                                    <Bot size={14} color="white" />
                                </div>
                            )}
                            <div style={{
                                maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
                                fontSize: 13, lineHeight: 1.6, color: '#e2e8f0',
                                background: msg.role === 'user'
                                    ? 'linear-gradient(135deg, #f97316, #ea580c)'
                                    : 'rgba(255,255,255,0.05)',
                                border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                            }}>
                                {renderContent(msg.content)}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Bot size={14} color="white" />
                            </div>
                            <div style={{
                                padding: '12px 16px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <Loader2 size={14} className="aide-spinner" style={{ color: '#f97316' }} />
                                <span style={{ fontSize: 13, color: '#94a3b8' }}>Analyzing your data...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                {messages.length <= 1 && suggestions.length > 0 && (
                    <div style={{
                        padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: 6
                    }}>
                        {suggestions.slice(0, 4).map((s, i) => (
                            <button key={i} onClick={() => sendMessage(s)} style={{
                                background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
                                color: '#fb923c', borderRadius: 20, padding: '6px 12px', fontSize: 11,
                                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                            }}
                                onMouseEnter={e => { e.target.style.background = 'rgba(249,115,22,0.2)'; }}
                                onMouseLeave={e => { e.target.style.background = 'rgba(249,115,22,0.1)'; }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div style={{
                    padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(0,0,0,0.2)',
                }}>
                    <div style={{
                        display: 'flex', gap: 8, alignItems: 'flex-end',
                        background: 'rgba(255,255,255,0.05)', borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.1)', padding: '4px',
                    }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your drilling operations..."
                            rows={1}
                            style={{
                                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                color: '#e2e8f0', fontSize: 13, padding: '8px 12px',
                                resize: 'none', fontFamily: 'Inter, system-ui, sans-serif',
                                maxHeight: 100, overflowY: 'auto',
                            }}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                            style={{
                                width: 36, height: 36, borderRadius: 10, border: 'none',
                                background: input.trim() ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'rgba(255,255,255,0.05)',
                                color: input.trim() ? 'white' : '#475569',
                                cursor: input.trim() ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s', flexShrink: 0,
                            }}
                        >
                            <Send size={14} />
                        </button>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 10, color: '#475569', marginTop: 6 }}>
                        Powered by Gemini AI · Queries your actual drilling data
                    </div>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .aide-spinner { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}

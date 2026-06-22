'use client';
import { Banknote, CreditCard, Smartphone, ArrowRight, Plus, Trash2, Split, Loader2, Clock, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import NumericKeypad from './NumericKeypad';

export default function PaymentSection({ 
    total, availableMethods, payments, setPayments, onFinalize, 
    loading, cartEmpty, onAlert,
    showMixed, setShowMixed, cashReceived, setCashReceived,
    useScreenKeyboards, selectedCustomer
}) {
    const [tempAmount, setTempAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [showCashNumpad, setShowCashNumpad] = useState(false);
    const [showMixedNumpad, setShowMixedNumpad] = useState(false);

    const [creditInfo, setCreditInfo] = useState(null);
    const [loadingCredit, setLoadingCredit] = useState(false);

    const hasCredit = selectedCustomer && selectedCustomer.mcredi > 0 && selectedCustomer.code !== 'C00000';

    useEffect(() => {
        if (hasCredit) {
            setLoadingCredit(true);
            fetch(`/api/customers/credit-status?codcli=${selectedCustomer.code}`)
                .then(res => res.json())
                .then(json => {
                    if (json.success) {
                        setCreditInfo(json.data);
                    }
                })
                .catch(err => console.error('Error fetching customer credit status in payment:', err))
                .finally(() => setLoadingCredit(false));
        } else {
            setCreditInfo(null);
        }
    }, [selectedCustomer, hasCredit]);

    const subtotal = total / 1.18;
    const igv = total - subtotal;
    const ICONS = { 1: Banknote, 2: CreditCard, 3: Smartphone, 'CR': Clock };

    const paidAmount = payments.reduce((acc, p) => acc + p.amount, 0);
    const remaining = total - paidAmount;

    // Cálculo del vuelto (solo si el pago es EFECTIVO y el monto recibido es mayor)
    const isCashOnly = !showMixed && payments.length === 1 && payments[0].id === 'EF';
    const change = isCashOnly && parseFloat(cashReceived) > total ? parseFloat(cashReceived) - total : 0;

    const addPayment = () => {
        const amt = parseFloat(tempAmount) || remaining;
        if (amt <= 0 || !selectedMethod) return;
        if (amt > remaining + 0.01) return onAlert('Error de Pago', 'El monto ingresado supera el saldo pendiente del ticket.', 'warning');

        if (selectedMethod.id === 'CR' && creditInfo && amt > creditInfo.available) {
            return onAlert('Crédito Insuficiente', `El monto (S/ ${amt.toFixed(2)}) supera el crédito disponible del socio (S/ ${creditInfo.available.toFixed(2)}).`, 'warning');
        }

        const newPayment = {
            id: selectedMethod.id,
            type: selectedMethod.type,
            name: selectedMethod.name,
            amount: amt
        };

        setPayments([...payments, newPayment]);
        setTempAmount('');
        setSelectedMethod(null);
    };

    const removePayment = (index) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    const handleSimpleMethod = (m) => {
        if (m.id === 'CR' && creditInfo && total > creditInfo.available) {
            return onAlert('Crédito Insuficiente', `El total de la venta (S/ ${total.toFixed(2)}) supera el crédito disponible del socio (S/ ${creditInfo.available.toFixed(2)}). Intente un pago mixto o sugiera amortizar deudas.`, 'warning');
        }

        setPayments([{
            id: m.id,
            type: m.type,
            name: m.name,
            amount: total
        }]);
        if (m.id !== 'EF') setCashReceived('');
    };

    // Handlers para el teclado numérico de Efectivo Recibido
    const handleCashNumpadKeyPress = (key) => {
        if (key === '.') {
            if (!cashReceived.includes('.')) setCashReceived(prev => prev + '.');
        } else {
            setCashReceived(prev => prev + key);
        }
    };

    const handleCashNumpadDelete = () => {
        setCashReceived(prev => prev.slice(0, -1));
    };

    // Handlers para el teclado numérico de Pago Mixto
    const handleMixedNumpadKeyPress = (key) => {
        if (key === '.') {
            if (!tempAmount.includes('.')) setTempAmount(prev => prev + '.');
        } else {
            setTempAmount(prev => prev + key);
        }
    };

    const handleMixedNumpadDelete = () => {
        setTempAmount(prev => prev.slice(0, -1));
    };

    const handleFinalizeWithChange = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (loading) return;
        onFinalize({
            cashReceived: parseFloat(cashReceived) || total,
            changeGiven: change,
            isMixed: showMixed
        });
    };

    useEffect(() => {
        if (!showMixed && payments.length === 1 && payments[0].amount !== total) {
            setPayments([{
                ...payments[0],
                amount: total
            }]);
        }
    }, [total, showMixed, payments, setPayments]);

    const showCreditOption = hasCredit && !showMixed;
    const finalMethods = showCreditOption
        ? [...availableMethods, { id: 'CR', type: 2, name: 'CRÉDITO' }]
        : availableMethods;

    const creditPayment = payments.find(p => p.id === 'CR');
    const isCreditLimitExceeded = creditPayment && creditInfo && creditPayment.amount > creditInfo.available;

    return (
        <div style={containerStyle}>
            {/* Cabecera / Selector de Modo */}
            <div style={headerActionStyle}>
                <p style={labelStyle}>Método de pago</p>
                <button
                    disabled={cartEmpty}
                    onClick={() => { setShowMixed(!showMixed); setPayments([]); setCashReceived(''); }}
                    style={{ 
                        ...modeBtnStyle, 
                        color: showMixed ? '#3b82f6' : '#94a3b8',
                        opacity: cartEmpty ? 0.5 : 1,
                        cursor: cartEmpty ? 'not-allowed' : 'pointer'
                    }}
                >
                    <Split size={12} /> {showMixed ? 'Volver a Simple' : 'Pago Mixto'}
                </button>
            </div>

            {/* Area de Selección */}
            <div style={gridStyle}>
                {finalMethods.map(m => {
                    const Icon = ICONS[m.id] || ICONS[m.type] || Banknote;
                    const isSelectedInSimple = !showMixed && payments.length === 1 && payments[0].id === m.id;
                    const isSelectedInMixed = showMixed && selectedMethod?.id === m.id;
                    const isActive = isSelectedInSimple || isSelectedInMixed;

                    return (
                        <button 
                            key={m.id} 
                            disabled={cartEmpty}
                            onClick={() => showMixed ? setSelectedMethod(m) : handleSimpleMethod(m)}
                            style={{
                                ...methodBtnStyle,
                                borderColor: isActive ? '#3b82f6' : '#f1f5f9',
                                background: isActive ? '#3b82f6' : '#f8fafc',
                                color: isActive ? '#fff' : '#64748b',
                                opacity: cartEmpty ? 0.5 : 1,
                                cursor: cartEmpty ? 'not-allowed' : 'pointer',
                            }}>
                            <Icon size={12} />
                            <span style={methodNameStyle}>{m.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Input de Efectivo Recibido (Modo Simple) */}
            {isCashOnly && (
                <div style={mixedPanelStyle}>
                    <p style={{ ...labelStyle, marginBottom: '8px', color: '#64748b' }}>Efectivo Recibido</p>
                    <div style={inputGroupStyle}>
                        <Banknote size={15} style={{ color: '#10b981', alignSelf: 'center' }} />
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input
                                type="text"
                                inputMode={useScreenKeyboards ? "none" : "decimal"}
                                placeholder={`Monto (ej. ${total + 10})`}
                                value={cashReceived}
                                onChange={e => setCashReceived(e.target.value)}
                                onFocus={() => useScreenKeyboards && setShowCashNumpad(true)}
                                style={{ ...inputStyle, width: '100%', fontSize: '15px', fontWeight: 800, color: '#10b981' }}
                            />
                            <NumericKeypad 
                                isOpen={showCashNumpad}
                                onClose={() => setShowCashNumpad(false)}
                                onKeyPress={handleCashNumpadKeyPress}
                                onDelete={handleCashNumpadDelete}
                                value={cashReceived}
                            />
                        </div>
                    </div>
                    {change > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', padding: '8px', background: '#ecfdf5', borderRadius: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#047857' }}>Vuelto a entregar:</span>
                            <span style={{ fontSize: '14px', fontWeight: 900, color: '#047857' }}>S/ {change.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Panel de Cobro Mixto */}
            {showMixed && (
                <div style={mixedPanelStyle}>
                    <div style={inputGroupStyle}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input
                                type="text"
                                inputMode={useScreenKeyboards ? "none" : "decimal"}
                                placeholder={`Monto (S/ ${remaining.toFixed(2)})`}
                                value={tempAmount}
                                onChange={e => setTempAmount(e.target.value)}
                                onFocus={() => useScreenKeyboards && setShowMixedNumpad(true)}
                                style={{ ...inputStyle, width: '100%' }}
                            />
                            <NumericKeypad 
                                isOpen={showMixedNumpad}
                                onClose={() => setShowMixedNumpad(false)}
                                onKeyPress={handleMixedNumpadKeyPress}
                                onDelete={handleMixedNumpadDelete}
                                value={tempAmount}
                            />
                        </div>
                        <button onClick={addPayment} style={addBtnStyle} disabled={!selectedMethod}>
                            <Plus size={15} />
                        </button>
                    </div>

                    {payments.length > 0 && (
                        <div style={paymentsListStyle}>
                            {payments.map((p, i) => (
                                <div key={i} style={paymentRowStyle}>
                                    <span style={{ fontWeight: 700 }}>{p.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: 900 }}>S/ {p.amount.toFixed(2)}</span>
                                        <button onClick={() => removePayment(i)} style={deleteBtnStyle}><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Totales */}
            <div style={totalsBoxStyle}>
                <div style={summaryRowStyle}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 700 }}>S/ {subtotal.toFixed(2)}</span>
                </div>
                {showMixed && (
                    <div style={{ ...summaryRowStyle, color: '#10b981' }}>
                        <span>Pagado</span>
                        <span style={{ fontWeight: 800 }}>S/ {paidAmount.toFixed(2)}</span>
                    </div>
                )}
                <div style={totalRowStyle}>
                    <span style={totalLabelStyle}>{showMixed ? 'Pendiente' : 'Total'}</span>
                    <span style={{ ...totalValueStyle, color: (showMixed && remaining > 0) ? '#ef4444' : '#0f172a' }}>
                        S/ {(showMixed ? remaining : total).toFixed(2)}
                    </span>
                </div>
            </div>

            {isCreditLimitExceeded && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    color: '#b91c1c',
                    fontSize: '11px',
                    fontWeight: 700,
                    marginBottom: '8px'
                }}>
                    <AlertCircle size={14} />
                    <span>Límite de crédito excedido. Disponible: S/ {creditInfo.available.toFixed(2)}</span>
                </div>
            )}

            <button
                disabled={cartEmpty || loading || (showMixed && Math.abs(remaining) > 0.01) || (!showMixed && payments.length === 0) || isCreditLimitExceeded}
                onClick={handleFinalizeWithChange}
                style={{
                    ...finalizeBtnStyle,
                    background: (cartEmpty || loading || (showMixed && remaining > 0.01) || (!showMixed && payments.length === 0) || isCreditLimitExceeded) ? '#e2e8f0' : 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
                    color: (cartEmpty || loading || (showMixed && remaining > 0.01) || (!showMixed && payments.length === 0) || isCreditLimitExceeded) ? '#94a3b8' : '#fff',
                    boxShadow: (cartEmpty || loading || (showMixed && remaining > 0.01) || (!showMixed && payments.length === 0) || isCreditLimitExceeded) ? 'none' : '0 8px 20px rgba(168, 85, 247, 0.3)',
                    cursor: (cartEmpty || loading || (showMixed && remaining > 0.01) || (!showMixed && payments.length === 0) || isCreditLimitExceeded) ? 'not-allowed' : 'pointer',
                    transform: (cartEmpty || loading || (showMixed && remaining > 0.01) || (!showMixed && payments.length === 0) || isCreditLimitExceeded) ? 'none' : 'translateY(-1px)',
                }}
            >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>Finalizar Venta <ArrowRight size={15} /></>}
            </button>
        </div>
    );
}

// Estilos
const containerStyle = { flexShrink: 0, background: '#fff', borderTop: 'none', padding: '10px' };
const headerActionStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' };
const labelStyle = { fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 };
const modeBtnStyle = { background: 'none', border: 'none', fontSize: '9px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' };
const methodBtnStyle = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const methodNameStyle = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const mixedPanelStyle = { background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', borderRadius: '12px', padding: '8px', marginBottom: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' };
const inputGroupStyle = { display: 'flex', gap: '6px', marginBottom: '6px' };
const inputStyle = { flex: 1, padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#f1f5f9', fontSize: '12px', outline: 'none' };
const addBtnStyle = { background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 8px', cursor: 'pointer' };
const paymentsListStyle = { display: 'flex', flexDirection: 'column', gap: '4px', borderTop: 'none', paddingTop: '6px' };
const paymentRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#1e293b' };
const deleteBtnStyle = { background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer' };
const totalsBoxStyle = { background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '12px', padding: '10px', marginBottom: '8px', border: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' };
const summaryRowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: '2px' };
const totalRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '6px', borderTop: 'none' };
const totalLabelStyle = { fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' };
const totalValueStyle = { fontSize: '18px', fontWeight: 900, lineHeight: 1 };
const finalizeBtnStyle = { width: '100%', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s ease' };


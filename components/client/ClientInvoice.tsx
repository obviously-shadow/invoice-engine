"use client"

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer, PenTool, CheckCircle2, AlertCircle, Eraser, Maximize2, Minimize2, X } from "lucide-react";

export default function ClientInvoice({ 
  invoice, 
  items, 
  settings 
}: { 
  invoice: any; 
  items: any[]; 
  settings: any;
}) {
  const [status, setStatus] = useState(invoice.status);
  const [isApproving, setIsApproving] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  const [isEraser, setIsEraser] = useState(false);
  const [isMobileSigOpen, setIsMobileSigOpen] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const hst = subtotal * (invoice.tax_rate / 100);
  const total = subtotal + hst;
  const hasTbdItems = items.some(item => item.is_tbd === 1);
  const isWholeInvoiceTbd = invoice.is_tbd === 1;

  const groups = Array.from(new Set(items.map(item => item.group_name)));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && status === 'draft') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = isEraser ? 25 : 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
        ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
      }
    }
  }, [status, isEraser, isMobileSigOpen]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    draw(e);
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.beginPath();
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!isEraser) setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const toggleEnlarge = () => {
    setIsMobileSigOpen(!isMobileSigOpen);
    setHasSignature(false);
  };

  const handleApprove = async () => {
    if (settings.require_signature && !hasSignature) {
      alert("A signature is required to authorize this document.");
      return;
    }
    setIsApproving(true);
    const signatureData = hasSignature ? canvasRef.current?.toDataURL('image/png') : null;
    try {
      const res = await fetch(`/api/invoices/${invoice.token}/approve`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signatureData })
      });
      
      if (res.ok) {
        window.location.reload();
      } else if (res.status === 409) {
        alert("This document has already been signed or updated.");
        window.location.reload();
      } else {
        alert("Error saving signature. Please try again.");
      }
    } catch (e) { 
      console.error(e); 
    }
    setIsApproving(false);
  };

  // Safe Date Parsing
  const issueDate = new Date(invoice.created_at).toLocaleDateString();
  let dueDate = issueDate;

  if (invoice.due_date) {
    // If a custom due date exists, append a time to force local parsing without timezone shifting
    dueDate = new Date(`${invoice.due_date}T12:00:00`).toLocaleDateString();
  } else if (settings.payment_terms.toLowerCase().includes('net')) {
    const days = parseInt(settings.payment_terms.replace(/[^0-9]/g, '')) || 0;
    if (days > 0) {
      const d = new Date(invoice.created_at);
      d.setDate(d.getDate() + days);
      dueDate = d.toLocaleDateString();
    }
  }

  const invoiceNumber = invoice.display_number 
    ? invoice.display_number.toString() 
    : invoice.id.toString().padStart(6, '0');
  
  let formattedSignedDate = "";
  if (invoice.signed_at) {
    const isoDate = invoice.signed_at.replace(' ', 'T') + 'Z';
    formattedSignedDate = new Date(isoDate).toLocaleString();
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; max-width: 100% !important; border: none !important; padding: 0 !important; }
          @page { margin: 1cm; size: auto; }
        }
      `}} />
      <div className="min-h-screen bg-white md:bg-zinc-100 text-zinc-950 py-0 md:py-12 px-0 md:px-4 flex justify-center font-sans selection:bg-zinc-300">
        <div className="w-full max-w-[850px]">
          
          <div className="no-print mb-8 w-full flex flex-col md:flex-row justify-between items-center gap-4 px-4 md:px-0 mt-4 md:mt-0">
            <div className="w-full">
              {status === 'approved' && (
                <div className="p-4 md:p-5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-950 shadow-sm font-bold text-sm md:text-base flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  Estimate Approved & Authorized
                </div>
              )}
              {status === 'paid' && (
                <div className="p-4 md:p-5 bg-blue-100 border border-blue-300 rounded-xl text-blue-950 shadow-sm font-bold text-sm md:text-base flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0" />
                  Invoice Paid in Full
                </div>
              )}
              {status === 'draft' && (
                <div className="p-4 md:p-5 bg-white border border-zinc-300 rounded-xl text-zinc-900 shadow-sm font-semibold text-sm md:text-base flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                  Action Required: Please review and approve this document below.
                </div>
              )}
            </div>
            
            {(status === 'draft' || status === 'paid' || status === 'approved') && (
              <Button onClick={() => window.print()} variant="outline" className="bg-white border-2 border-zinc-300 text-zinc-900 hover:bg-zinc-50 shrink-0 w-full md:w-auto h-12 md:h-12 px-6 rounded-xl shadow-sm font-bold">
                <Printer className="w-5 h-5 mr-2 text-zinc-600" /> Print Document
              </Button>
            )}
          </div>

          <div className="print-area bg-white md:shadow-2xl md:rounded-xl p-6 sm:p-8 md:p-16 border-t md:border border-zinc-200 relative overflow-hidden z-10 min-h-screen md:min-h-0">
            
            {/* LARGE WATERMARK BACKGROUND */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden opacity-[0.02]">
              <span className="text-[100px] md:text-[180px] font-black uppercase tracking-widest text-black rotate-[-30deg] select-none">
                {status === 'draft' ? 'ESTIMATE' : 'INVOICE'}
              </span>
            </div>

            {status === 'paid' && (
              <div className="absolute top-1/4 right-0 left-0 bottom-0 flex justify-center opacity-[0.04] pointer-events-none rotate-[-15deg] z-10 overflow-hidden">
                <span className="text-[120px] md:text-[150px] font-black border-[16px] border-black px-12 py-4 inline-block text-black uppercase tracking-widest rounded-[3rem] h-fit">
                  PAID
                </span>
              </div>
            )}

            {status === 'approved' && (
              <div className="absolute top-1/4 right-0 left-0 bottom-0 flex justify-center opacity-[0.03] pointer-events-none rotate-[-15deg] z-10 overflow-hidden">
                <span className="text-[80px] md:text-[120px] font-black border-[16px] border-black px-12 py-4 inline-block text-black uppercase tracking-widest rounded-[3rem] h-fit">
                  APPROVED
                </span>
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start mb-12 md:mb-16 relative z-20">
              <div className="w-full md:w-1/2">
                <img src="/LOGO.png" alt="Company Logo" className="h-28 md:h-36 w-auto max-w-[300px] object-contain mb-6 print:mb-4" onError={(e) => e.currentTarget.style.display = 'none'} />
                
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-black mb-6">{settings.company_name}</h1>
                <div className="text-zinc-800 text-sm space-y-1.5 leading-relaxed font-semibold break-words">
                  {settings.business_address && <p className="whitespace-pre-wrap mb-4 text-black">{settings.business_address}</p>}
                  {settings.business_phone && <p>{settings.business_phone}</p>}
                  {settings.business_email && <p>{settings.business_email}</p>}
                  {settings.business_website && <p>{settings.business_website}</p>}
                  {settings.business_number && <p className="mt-4 text-xs font-mono text-zinc-500">BN: {settings.business_number}</p>}
                </div>
              </div>
              <div className="mt-12 md:mt-0 text-left md:text-right w-full md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold text-zinc-300 uppercase tracking-widest">
                  {status === 'draft' ? 'Estimate' : 'Invoice'}
                </h2>
                <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 text-sm text-black md:ml-auto md:max-w-[300px]">
                  <div className="text-zinc-500 md:text-right font-bold uppercase tracking-wider text-xs">Date</div>
                  <div className="md:text-right font-bold" suppressHydrationWarning>{issueDate}</div>
                  
                  <div className="text-zinc-500 md:text-right font-bold uppercase tracking-wider text-xs">Document #</div>
                  <div className="md:text-right font-mono font-bold text-base">{invoiceNumber}</div>
                  
                  <div className="text-zinc-500 md:text-right font-bold uppercase tracking-wider text-xs">Terms</div>
                  <div className="md:text-right font-bold">{settings.payment_terms}</div>
                  
                  <div className="text-zinc-500 md:text-right font-bold uppercase tracking-wider text-xs">Due Date</div>
                  <div className="md:text-right font-bold text-red-600" suppressHydrationWarning>{dueDate}</div>
                </div>
              </div>
            </div>

            <div className="mb-14 relative z-20">
              <h3 className="text-xs font-black text-black uppercase tracking-widest mb-4 border-b-[3px] border-black inline-block pb-1">Billed To</h3>
              <div className="text-zinc-800 text-base leading-relaxed break-words">
                <p className="font-black text-xl text-black mb-1">{invoice.client_name}</p>
                {invoice.client_address && <p className="whitespace-pre-wrap font-semibold">{invoice.client_address}</p>}
                {invoice.client_email && <p className="font-semibold text-zinc-600">{invoice.client_email}</p>}
              </div>
            </div>

            <div className="mb-16 w-full relative z-20">
              {groups.map((group, index) => (
                <div key={index} className="mb-10">
                  {group && (
                    <div className="bg-zinc-100 px-4 py-2 mb-4 border-l-4 border-black">
                      <h4 className="text-sm font-black uppercase tracking-widest text-black">{group}</h4>
                    </div>
                  )}
                  <div className="overflow-x-auto pb-4 w-full">
                    <table className="w-full text-left text-sm border-collapse min-w-[600px] md:min-w-full mb-4">
                      {index === 0 && (
                        <thead>
                          <tr className="border-b-[3px] border-black text-black">
                            <th className="py-4 px-2 font-black w-7/12 uppercase tracking-wider text-xs">Description</th>
                            <th className="py-4 px-2 font-black text-right uppercase tracking-wider text-xs">Qty</th>
                            <th className="py-4 px-2 font-black text-right uppercase tracking-wider text-xs">Rate</th>
                            <th className="py-4 px-2 font-black text-right uppercase tracking-wider text-xs">Amount</th>
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {items.filter(item => item.group_name === group).map((item) => (
                          <tr key={item.id} className="border-b border-zinc-200 last:border-0">
                            <td className="py-6 px-2 align-top">
                              <p className="font-bold text-black text-base">{item.title}</p>
                              {item.description && <p className="text-zinc-600 text-sm mt-1.5 leading-relaxed max-w-xl font-medium">{item.description}</p>}
                            </td>
                            <td className="py-6 px-2 text-right text-black font-bold align-top text-base">{item.qty}</td>
                            <td className="py-6 px-2 text-right text-zinc-800 align-top font-semibold">
                              {item.is_tbd === 1 ? (
                                <span className="text-zinc-400 text-sm">--</span>
                              ) : (
                                `$${item.rate.toFixed(2)}`
                              )}
                            </td>
                            <td className="py-6 px-2 text-right text-black font-bold align-top text-base">
                              {item.is_tbd === 1 ? (
                                <span className="bg-amber-100 text-amber-900 border-2 border-amber-400 px-2 py-1 rounded text-xs font-black tracking-widest uppercase shadow-sm">TBD</span>
                              ) : (
                                `$${item.total.toFixed(2)}`
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row justify-between mb-16 gap-12 relative z-20">
              <div className="w-full md:w-1/2 order-2 md:order-1 bg-zinc-50 p-6 rounded-xl border border-zinc-300 shadow-sm">
                <p className="font-black text-black text-sm mb-3 uppercase tracking-widest">Notes & Instructions</p>
                <p className="text-zinc-800 text-sm whitespace-pre-wrap leading-relaxed font-semibold">{invoice.notes || `Thank you for choosing ${settings.company_name}. We appreciate your business.`}</p>
              </div>
              
              <div className="w-full md:w-1/2 flex md:justify-end order-1 md:order-2">
                <table className="w-full md:w-80 text-right text-sm ml-auto">
                  <tbody>
                    {!isWholeInvoiceTbd && (
                      <>
                        <tr>
                          <td className="pb-4 text-zinc-600 font-bold uppercase tracking-wider text-xs">Subtotal</td>
                          <td className="pb-4 font-mono font-bold text-black text-lg">${subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="pb-6 text-zinc-600 font-bold uppercase tracking-wider text-xs border-b-2 border-zinc-300">Tax ({invoice.tax_rate}%)</td>
                          <td className="pb-6 font-mono font-bold text-black text-lg border-b-2 border-zinc-300">${hst.toFixed(2)}</td>
                        </tr>
                      </>
                    )}
                    <tr className="text-2xl">
                      <td className="pt-6 font-black text-black uppercase tracking-widest text-sm">
                        Total Due
                        {!isWholeInvoiceTbd && hasTbdItems && <div className="text-amber-600 text-[10px] uppercase mt-1 tracking-widest font-black">+ Variable Costs</div>}
                      </td>
                      <td className="pt-6 font-mono font-black text-black tracking-tight">
                        {isWholeInvoiceTbd ? (
                          <span className="bg-amber-100 text-amber-900 border-2 border-amber-400 px-3 py-1 rounded text-lg font-black tracking-widest uppercase shadow-sm">TBD</span>
                        ) : (
                          <>
                            ${total.toFixed(2)}
                            {hasTbdItems && <span className="text-amber-500 ml-2 text-lg">+ TBD</span>}
                          </>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {(hasTbdItems || isWholeInvoiceTbd) && (
              <div className="mb-12 p-5 bg-amber-50 rounded-xl border-2 border-amber-300 text-sm text-amber-950 leading-relaxed font-semibold flex gap-4 relative z-20 shadow-sm">
                <AlertCircle className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <span className="font-black uppercase tracking-widest">Pricing Notice:</span> This document contains variable (TBD) pricing for certain requirements. The final total will be adjusted upon completion based on the actual material dimensions, hours, and scope of work specifications.
                </p>
              </div>
            )}

            {status === 'draft' ? (
              <div className="no-print bg-zinc-900 border border-black p-5 md:p-8 rounded-2xl w-full text-white shadow-2xl relative z-30 mt-12">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                  <span className="font-bold text-base text-white flex items-center gap-3">
                    <PenTool className="w-5 h-5 text-emerald-400"/>
                    Client Authorization {settings.require_signature ? "(Required)" : "(Optional)"}
                  </span>
                </div>

                <div className={isMobileSigOpen ? "fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center" : ""}>
                   <div className={isMobileSigOpen ? "bg-zinc-900 p-5 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col h-[90vh] border border-zinc-800" : "w-full flex flex-col"}>

                      {isMobileSigOpen && (
                         <div className="flex justify-between items-center mb-5 text-white">
                            <span className="font-bold flex items-center gap-2 text-lg"><PenTool className="w-5 h-5 text-emerald-400"/> Sign Document</span>
                            <Button variant="ghost" size="icon" onClick={toggleEnlarge} className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full"><X className="w-6 h-6"/></Button>
                         </div>
                      )}

                      <div className="flex flex-wrap gap-2 mb-3 items-center">
                          <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setIsEraser(false)}
                              className={`h-10 px-4 text-sm font-bold transition-colors ${!isEraser ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'}`}
                          >
                              <PenTool className="w-4 h-4 mr-2" /> Draw
                          </Button>
                          <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setIsEraser(true)}
                              className={`h-10 px-4 text-sm font-bold transition-colors ${isEraser ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'}`}
                          >
                              <Eraser className="w-4 h-4 mr-2" /> Erase
                          </Button>
                          <div className="flex-1" />
                          <Button type="button" variant="ghost" onClick={clearSignature} className="h-10 px-4 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10">
                             Clear
                          </Button>
                          <Button
                              type="button"
                              variant="secondary"
                              onClick={toggleEnlarge}
                              className="md:hidden h-10 px-4 text-sm font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700"
                          >
                              {isMobileSigOpen ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
                              {isMobileSigOpen ? "Minimize" : "Enlarge"}
                          </Button>
                      </div>

                      <div className={`relative w-full cursor-crosshair rounded-xl overflow-hidden shadow-inner border-4 ${isEraser ? 'border-amber-500' : 'border-zinc-800'} bg-white ${isMobileSigOpen ? 'flex-1 mb-4' : 'h-64 mb-6'}`}>
                        <canvas
                          ref={canvasRef}
                          width={isMobileSigOpen ? 800 : 800}
                          height={isMobileSigOpen ? 1200 : 300}
                          className="w-full h-full touch-none object-contain"
                          onPointerDown={startDrawing}
                          onPointerMove={draw}
                          onPointerUp={stopDrawing}
                          onPointerOut={stopDrawing}
                          onPointerCancel={stopDrawing}
                        />
                      </div>

                      {isMobileSigOpen && (
                          <Button onClick={handleApprove} disabled={isApproving} className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 shadow-lg">
                              {isApproving ? "Processing..." : <><CheckCircle2 className="w-5 h-5 mr-2" /> Approve & Submit</>}
                          </Button>
                      )}
                   </div>
                </div>

                {!isMobileSigOpen && (
                   <Button onClick={handleApprove} disabled={isApproving} className="w-full bg-emerald-600 text-white hover:bg-emerald-500 font-bold h-16 rounded-xl text-lg shadow-lg">
                     {isApproving ? "Processing..." : "Approve & Sign Document"}
                   </Button>
                )}
              </div>
            ) : (
              (invoice.signature_data || invoice.signed_at) && (
                <div className="mt-16 pt-12 border-t-[3px] border-zinc-200 break-inside-avoid w-full relative z-30">
                  <p className="font-black text-xs uppercase tracking-widest text-zinc-500 mb-6 block">Authorized Signature</p>
                  <div className="w-full max-w-[300px]">
                    {invoice.signature_data && (
                      <img src={invoice.signature_data} alt="Client Signature" className="max-h-32 object-contain mix-blend-multiply opacity-90 border-b-[3px] border-zinc-300 pb-4 w-full" />
                    )}
                    <p className="text-[11px] text-zinc-500 mt-3 font-bold uppercase tracking-wider" suppressHydrationWarning>
                      Signed electronically {formattedSignedDate ? `on ${formattedSignedDate}` : ''}.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
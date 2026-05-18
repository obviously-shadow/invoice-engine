"use client"

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download, Package, PenTool, CheckCircle2, Eraser, Maximize2, Minimize2, X, AlertCircle } from "lucide-react";

export default function ClientMaterial({ 
  receipt, 
  items, 
  settings
}: { 
  receipt: any; 
  items: any[]; 
  settings: any;
}) {
  const [status, setStatus] = useState(receipt.status || 'draft');
  const [isApproving, setIsApproving] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [isMobileSigOpen, setIsMobileSigOpen] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const baseCost = receipt.total_cost || 0;
  const sourcingFeeAmount = receipt.sourcing_fee || 0;
  const subtotal = baseCost + sourcingFeeAmount;
  const hst = subtotal * (receipt.tax_rate / 100);
  const total = subtotal + hst;
  const requiresDeposit = receipt.deposit_amount && receipt.deposit_amount > 0;

  const issueDate = new Date(receipt.created_at).toLocaleDateString();
  const receiptNumber = receipt.display_number 
    ? receipt.display_number.toString() 
    : receipt.id.toString().padStart(6, '0');

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
      const res = await fetch(`/api/materials/${receipt.token}/approve`, { 
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

  let formattedSignedDate = "";
  if (receipt.signed_at) {
    const isoDate = receipt.signed_at.replace(' ', 'T') + 'Z';
    formattedSignedDate = new Date(isoDate).toLocaleString();
  }

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      if (!(window as any).html2pdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      const html2pdf = (window as any).html2pdf;
      const element = document.getElementById('printable-document');
      
      const noPrintElements = document.querySelectorAll('.no-print');
      noPrintElements.forEach(el => (el as HTMLElement).style.display = 'none');
      
      const opt = {
        margin: [0.5, 0.5],
        filename: `Materials_${receiptNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
      
      noPrintElements.forEach(el => (el as HTMLElement).style.display = '');
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF. Please try printing instead.');
    }
    setIsGeneratingPDF(false);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { 
            background: white !important; 
            color: black !important;
            margin: 0 !important; 
            padding: 0 !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .print-area { 
            box-shadow: none !important; 
            max-width: 100% !important; 
            width: 100% !important;
            border: none !important; 
            padding: 0 !important; 
            margin: 0 !important;
          }
          .print-break-avoid { break-inside: avoid !important; }
          @page { margin: 1.5cm; size: portrait; }
        }
      `}} />
      
      <div className="min-h-screen bg-white md:bg-zinc-100 text-zinc-950 py-0 md:py-12 px-0 md:px-4 flex justify-center font-sans selection:bg-zinc-300">
        <div className="w-full max-w-[850px]">
          
          <div className="no-print mb-8 w-full flex flex-col md:flex-row justify-between items-center gap-4 px-4 md:px-0 mt-4 md:mt-0">
            <div className="w-full">
               {status === 'approved' && (
                <div className="p-4 md:p-5 bg-amber-100 border border-amber-300 rounded-xl text-amber-950 shadow-sm font-bold text-sm md:text-base flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-amber-600 shrink-0" />
                  Report Approved & Authorized
                </div>
              )}
              {status === 'draft' && (
                <div className="p-4 md:p-5 bg-white border border-zinc-300 rounded-xl text-zinc-900 shadow-sm font-semibold text-sm md:text-base flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                  Action Required: Please review and approve this document below.
                </div>
              )}
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Button onClick={() => window.print()} variant="outline" className="flex-1 bg-white border-2 border-zinc-300 text-zinc-900 hover:bg-zinc-50 h-12 px-6 rounded-xl shadow-sm font-bold">
                <Printer className="w-5 h-5 mr-2 text-zinc-600" /> Print
              </Button>
              <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 h-12 px-6 rounded-xl shadow-sm font-bold">
                {isGeneratingPDF ? "Generating..." : <><Download className="w-5 h-5 mr-2" /> PDF</>}
              </Button>
            </div>
          </div>

          <div id="printable-document" className="print-area bg-white md:shadow-2xl md:rounded-xl p-6 sm:p-8 md:p-16 border-t md:border border-zinc-200 relative overflow-hidden z-10 min-h-screen md:min-h-0">
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden opacity-[0.02]">
              <span className="text-[90px] md:text-[90px] font-black uppercase tracking-widest text-black rotate-[-30deg] select-none whitespace-nowrap">
                MATERIAL COST
              </span>
            </div>

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
                <h2 className="text-3xl md:text-4xl font-bold text-amber-500/80 uppercase tracking-widest flex items-center md:justify-end gap-3">
                  <Package className="w-8 h-8"/> Material Log
                </h2>
                <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 text-sm text-black md:ml-auto md:max-w-[300px]">
                  <div className="text-zinc-500 md:text-right font-bold uppercase tracking-wider text-xs">Date Logged</div>
                  <div className="md:text-right font-bold">{issueDate}</div>
                  
                  <div className="text-zinc-500 md:text-right font-bold uppercase tracking-wider text-xs">Reference #</div>
                  <div className="md:text-right font-mono font-bold text-base">{receiptNumber}</div>
                </div>
              </div>
            </div>

            <div className="mb-14 relative z-20">
              <h3 className="text-xs font-black text-black uppercase tracking-widest mb-4 border-b-[3px] border-black inline-block pb-1">Project Reference</h3>
              <div className="text-zinc-800 text-base leading-relaxed break-words">
                <p className="font-black text-xl text-black mb-1">{receipt.client_name}</p>
                {receipt.client_address && <p className="whitespace-pre-wrap font-semibold">{receipt.client_address}</p>}
                {receipt.client_email && <p className="font-semibold text-zinc-600">{receipt.client_email}</p>}
              </div>
            </div>

            <div className="mb-16 w-full relative z-20 print-break-avoid">
               <div className="overflow-x-auto print:overflow-visible pb-4 w-full">
                  <table className="w-full text-left text-sm border-collapse min-w-[600px] md:min-w-full mb-4">
                     <thead>
                        <tr className="border-b-[3px] border-black text-black">
                           <th className="py-4 px-2 font-black w-7/12 uppercase tracking-wider text-xs">Item / Store</th>
                           <th className="py-4 px-2 font-black text-right uppercase tracking-wider text-xs">Qty</th>
                           <th className="py-4 px-2 font-black text-right uppercase tracking-wider text-xs">Cost</th>
                           <th className="py-4 px-2 font-black text-right uppercase tracking-wider text-xs">Total</th>
                        </tr>
                     </thead>
                     <tbody>
                        {items.map((item) => (
                           <tr key={item.id} className="border-b border-zinc-200 last:border-0 print-break-avoid">
                           <td className="py-6 px-2 align-top">
                              <div className="flex items-center gap-2 mb-1.5">
                                 <p className={`font-bold text-base ${item.total < 0 ? 'text-red-600' : 'text-black'}`}>{item.title}</p>
                                 {item.total < 0 && <span className="bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Return</span>}
                              </div>
                              {item.description && <p className="text-zinc-600 text-sm mt-1.5 leading-relaxed max-w-xl font-medium">{item.description}</p>}
                           </td>
                           <td className={`py-6 px-2 text-right font-bold align-top text-base ${item.total < 0 ? 'text-red-600' : 'text-black'}`}>{item.qty}</td>
                           <td className={`py-6 px-2 text-right align-top font-semibold ${item.total < 0 ? 'text-red-600' : 'text-zinc-800'}`}>
                              ${item.cost.toFixed(2)}
                           </td>
                           <td className={`py-6 px-2 text-right font-bold align-top text-base ${item.total < 0 ? 'text-red-600' : 'text-black'}`}>
                              ${item.total.toFixed(2)}
                           </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between mb-16 gap-12 relative z-20 print-break-avoid">
              <div className="w-full md:w-1/2 flex md:justify-end md:ml-auto">
                <table className="w-full md:w-80 text-right text-sm ml-auto">
                  <tbody>
                    <tr>
                      <td className="pb-4 text-zinc-600 font-bold uppercase tracking-wider text-xs">Total Material Cost</td>
                      <td className="pb-4 font-mono font-bold text-black text-lg">${baseCost.toFixed(2)}</td>
                    </tr>
                    {sourcingFeeAmount > 0 && (
                       <tr>
                         <td className="pb-4 text-zinc-600 font-bold uppercase tracking-wider text-xs">Sourcing/Handling Fee</td>
                         <td className="pb-4 font-mono font-bold text-black text-lg">${sourcingFeeAmount.toFixed(2)}</td>
                       </tr>
                    )}
                    <tr>
                      <td className="pb-6 text-zinc-600 font-bold uppercase tracking-wider text-xs border-b-2 border-zinc-300">Tax ({receipt.tax_rate}%)</td>
                      <td className="pb-6 font-mono font-bold text-black text-lg border-b-2 border-zinc-300">${hst.toFixed(2)}</td>
                    </tr>
                    <tr className="text-2xl">
                      <td className={`pt-6 font-black uppercase tracking-widest text-sm pr-4 ${requiresDeposit ? 'text-zinc-500' : 'text-black'}`}>
                        Total Amount Due
                      </td>
                      <td className={`pt-6 font-mono font-black tracking-tight ${requiresDeposit ? 'text-zinc-500' : 'text-amber-600'}`}>
                        ${total.toFixed(2)}
                      </td>
                    </tr>
                    {requiresDeposit && (
                       <tr className="text-xl">
                         <td className="pt-4 font-black text-amber-600 uppercase tracking-widest text-sm pr-4">
                            Required Deposit
                         </td>
                         <td className="pt-4 font-mono font-black text-amber-600 tracking-tight">
                            ${receipt.deposit_amount.toFixed(2)}
                         </td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {status === 'draft' ? (
              <div className="no-print bg-zinc-900 border border-black p-5 md:p-8 rounded-2xl w-full text-white shadow-2xl relative z-30 mt-12">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                  <span className="font-bold text-base text-white flex items-center gap-3">
                    <PenTool className="w-5 h-5 text-amber-400"/>
                    Client Authorization {settings.require_signature ? "(Required)" : "(Optional)"}
                  </span>
                </div>

                <div className={isMobileSigOpen ? "fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center" : ""}>
                   <div className={isMobileSigOpen ? "bg-zinc-900 p-5 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col h-[90vh] border border-zinc-800" : "w-full flex flex-col"}>

                      {isMobileSigOpen && (
                         <div className="flex justify-between items-center mb-5 text-white">
                            <span className="font-bold flex items-center gap-2 text-lg"><PenTool className="w-5 h-5 text-amber-400"/> Sign Document</span>
                            <Button variant="ghost" size="icon" onClick={toggleEnlarge} className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full"><X className="w-6 h-6"/></Button>
                         </div>
                      )}

                      <div className="flex flex-wrap gap-2 mb-3 items-center">
                          <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setIsEraser(false)}
                              className={`h-10 px-4 text-sm font-bold transition-colors ${!isEraser ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'}`}
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
                          <Button onClick={handleApprove} disabled={isApproving} className="w-full h-14 text-lg font-bold bg-amber-600 hover:bg-amber-500 text-black shrink-0 shadow-lg">
                             {isApproving ? "Processing..." : <><CheckCircle2 className="w-5 h-5 mr-2" /> Approve & Submit</>}
                          </Button>
                      )}
                   </div>
                </div>

                {!isMobileSigOpen && (
                   <Button onClick={handleApprove} disabled={isApproving} className="w-full bg-amber-600 text-black hover:bg-amber-500 font-bold h-16 rounded-xl text-lg shadow-lg">
                     {isApproving ? "Processing..." : "Approve & Sign Document"}
                   </Button>
                )}
              </div>
            ) : (
              (receipt.signature_data || receipt.signed_at) && (
                <div className="mt-16 pt-12 border-t-[3px] border-zinc-200 w-full relative z-30 print-break-avoid">
                  <p className="font-black text-xs uppercase tracking-widest text-zinc-500 mb-6 block">Authorized Signature</p>
                  <div className="w-full max-w-[300px]">
                    {receipt.signature_data && (
                      <img src={receipt.signature_data} alt="Client Signature" className="max-h-32 object-contain mix-blend-multiply opacity-90 border-b-[3px] border-zinc-300 pb-4 w-full block" />
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
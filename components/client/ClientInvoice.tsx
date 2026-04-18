"use client"

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer, PenTool } from "lucide-react";

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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const hst = subtotal * (invoice.tax_rate / 100);
  const total = subtotal + hst;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && status === 'draft') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
      }
    }
  }, [status]);

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

    setHasSignature(true);

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
      } else if (res.status === 413) {
        alert("Signature is too large. Please clear and try a simpler signature.");
      } else {
        alert("Error saving signature. Please try again.");
      }
    } catch (e) { 
      console.error(e); 
    }
    setIsApproving(false);
  };

  const issueDate = new Date(invoice.created_at).toLocaleDateString();
  
  let dueDate = issueDate;
  if (settings.payment_terms.toLowerCase().includes('net')) {
    const days = parseInt(settings.payment_terms.replace(/[^0-9]/g, '')) || 0;
    if (days > 0) {
      const d = new Date(invoice.created_at);
      d.setDate(d.getDate() + days);
      dueDate = d.toLocaleDateString();
    }
  }

  const invoiceNumber = `${invoice.id.toString().padStart(6, '0')}`;
  
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
      <div className="min-h-screen bg-zinc-100 text-zinc-900 py-4 md:py-8 px-2 md:px-4 flex justify-center font-sans">
        <div className="w-full max-w-4xl">
          
          <div className="no-print mb-6 w-full flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="w-full">
              {status === 'approved' && (
                <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 shadow-sm font-medium text-sm md:text-base">
                  Estimate Approved. We have received your authorization.
                </div>
              )}
              {status === 'paid' && (
                <div className="p-4 bg-blue-50 border-l-4 border-blue-600 text-blue-800 shadow-sm font-medium text-sm md:text-base">
                  Invoice Paid in Full. Thank you for your business.
                </div>
              )}
            </div>
            
            {(status === 'draft' || status === 'paid' || status === 'approved') && (
              <Button onClick={() => window.print()} variant="outline" className="bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 shrink-0 w-full md:w-auto">
                <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
              </Button>
            )}
          </div>

          <div className="print-area bg-white shadow-2xl p-6 md:p-16 border border-zinc-200 relative overflow-hidden">
            
            {status === 'paid' && (
              <div className="absolute top-24 right-12 opacity-10 pointer-events-none rotate-[-15deg]">
                <span className="text-6xl md:text-8xl font-black border-8 border-black p-4 inline-block text-black uppercase tracking-widest">
                  PAID
                </span>
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start mb-8 md:mb-12 border-b border-zinc-200 pb-8">
              <div className="w-full md:w-1/2">
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-4">{settings.company_name}</h1>
                <div className="text-zinc-600 text-sm space-y-0.5">
                  {settings.business_address && <p className="whitespace-pre-wrap mb-2">{settings.business_address}</p>}
                  {settings.business_phone && <p>{settings.business_phone}</p>}
                  {settings.business_email && <p>{settings.business_email}</p>}
                  {settings.business_website && <p>{settings.business_website}</p>}
                  {settings.business_number && <p className="mt-2 text-xs font-mono">BN: {settings.business_number}</p>}
                </div>
              </div>
              <div className="mt-8 md:mt-0 text-left md:text-right w-full md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-light text-zinc-300 uppercase tracking-widest">
                  {status === 'draft' ? 'Estimate' : 'Invoice'}
                </h2>
                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-zinc-800 md:ml-auto md:max-w-[250px]">
                  <div className="font-semibold text-zinc-500 md:text-right">Date:</div>
                  <div className="md:text-right" suppressHydrationWarning>{issueDate}</div>
                  <div className="font-semibold text-zinc-500 md:text-right">Invoice #:</div>
                  <div className="md:text-right font-mono">{invoiceNumber}</div>
                  <div className="font-semibold text-zinc-500 md:text-right">Terms:</div>
                  <div className="md:text-right">{settings.payment_terms}</div>
                  <div className="font-semibold text-zinc-500 md:text-right">Due Date:</div>
                  <div className="md:text-right font-medium" suppressHydrationWarning>{dueDate}</div>
                </div>
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider border-b-2 border-emerald-600 inline-block pb-1 mb-3">Bill To</h3>
              <div className="text-zinc-800 text-sm leading-relaxed">
                <p className="font-bold text-lg text-zinc-900">{invoice.client_name}</p>
                {invoice.client_address && <p className="whitespace-pre-wrap mt-1">{invoice.client_address}</p>}
                {invoice.client_email && <p className="mt-1">{invoice.client_email}</p>}
              </div>
            </div>

            <div className="mb-10 overflow-x-auto w-full pb-4">
              <table className="w-full text-left text-sm border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300">
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold text-right w-24">Qty/Hrs</th>
                    <th className="py-3 px-4 font-semibold text-right w-32">Rate</th>
                    <th className="py-3 px-4 font-semibold text-right w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 px-4 align-top">
                        <p className="font-bold text-zinc-900">{item.title}</p>
                        {item.description && <p className="text-zinc-500 text-xs mt-1">{item.description}</p>}
                      </td>
                      <td className="py-4 px-4 text-right text-zinc-800 font-mono align-top">{item.qty}</td>
                      <td className="py-4 px-4 text-right text-zinc-800 font-mono align-top">${item.rate.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right text-zinc-900 font-mono font-bold align-top">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row justify-between mb-12 gap-8">
              <div className="w-full md:w-1/2 order-2 md:order-1">
                <p className="font-semibold text-zinc-500 text-sm mb-2">Notes:</p>
                <p className="text-zinc-700 text-sm whitespace-pre-wrap">{invoice.notes || `Thank you for choosing ${settings.company_name}.`}</p>
              </div>
              
              <div className="w-full md:w-1/2 flex md:justify-end order-1 md:order-2">
                <table className="w-full md:w-72 text-right text-sm">
                  <tbody>
                    <tr>
                      <td className="pb-3 text-zinc-600">Subtotal</td>
                      <td className="pb-3 font-mono font-medium text-zinc-900">${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="pb-3 text-zinc-600 border-b border-zinc-200">Tax ({invoice.tax_rate}%)</td>
                      <td className="pb-3 font-mono font-medium text-zinc-900 border-b border-zinc-200">${hst.toFixed(2)}</td>
                    </tr>
                    <tr className="text-lg">
                      <td className="pt-4 font-bold text-zinc-900">Amount Due</td>
                      <td className="pt-4 font-mono font-bold text-zinc-900">${total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {status === 'draft' ? (
              <div className="no-print bg-zinc-50 border border-zinc-200 p-4 md:p-6 rounded-lg w-full">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-zinc-500"/>
                    Authorization {settings.require_signature ? "(Required)" : "(Optional)"}
                  </span>
                  {hasSignature && <button onClick={clearSignature} className="text-xs text-zinc-500 hover:text-red-600 hover:underline font-semibold">Clear Pad</button>}
                </div>
                <div className="border border-zinc-300 bg-white h-40 w-full mb-6 cursor-crosshair rounded-md overflow-hidden">
                  <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={160} 
                    className="w-full h-full touch-none" 
                    onPointerDown={startDrawing} 
                    onPointerMove={draw} 
                    onPointerUp={stopDrawing} 
                    onPointerOut={stopDrawing} 
                    onPointerCancel={stopDrawing}
                  />
                </div>
                <Button onClick={handleApprove} disabled={isApproving} className="w-full bg-zinc-900 text-white hover:bg-black font-bold h-12">
                  {isApproving ? "Processing..." : "Approve & Authorize Document"}
                </Button>
              </div>
            ) : (
              (invoice.signature_data || invoice.signed_at) && (
                <div className="mt-8 pt-8 break-inside-avoid w-full">
                  <p className="font-bold text-sm uppercase tracking-wider text-zinc-500 mb-4 block">Authorized Signature</p>
                  <div className="w-full max-w-[300px]">
                    {invoice.signature_data && (
                      <img src={invoice.signature_data} alt="Client Signature" className="max-h-24 object-contain mix-blend-multiply opacity-90 border-b border-zinc-900 pb-2 w-full" />
                    )}
                    <p className="text-xs text-zinc-500 mt-2 font-medium" suppressHydrationWarning>
                      Signed electronically by client {formattedSignedDate ? `on ${formattedSignedDate}` : ''}.
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
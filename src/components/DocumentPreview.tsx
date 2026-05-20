import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink } from 'lucide-react';

// Note: pdfjs-dist is used dynamically to avoid loading on non-PDF previews.

interface DocumentPreviewProps {
  url: string;
  name?: string;
  onClose: () => void;
}

function getFileExtension(url: string) {
  try {
    const u = new URL(url, window.location.href);
    const path = u.pathname;
    const idx = path.lastIndexOf('.');
    if (idx === -1) return '';
    return path.slice(idx + 1).toLowerCase();
  } catch {
    const idx = url.lastIndexOf('.');
    if (idx === -1) return '';
    return url.slice(idx + 1).toLowerCase();
  }
}

export default function DocumentPreview({ url, name, onClose }: DocumentPreviewProps) {
  const ext = getFileExtension(url);
  const isPdf = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadPdf() {
      if (!isPdf) return;
      try {
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        // set workerSrc for Vite
        // @ts-ignore
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages || 0);

        // generate thumbnails (low-res) sequentially
        const thumbs: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.2 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            // @ts-ignore
            await page.render({ canvasContext: ctx, viewport }).promise;
            thumbs.push(canvas.toDataURL('image/png'));
            // avoid blocking main thread too long
            await new Promise((r) => setTimeout(r, 50));
          } catch (e) {
            thumbs.push('');
          }
        }
        if (!cancelled) setThumbnails(thumbs);
      } catch (error) {
        console.error('Error loading PDF', error);
      }
    }

    loadPdf();
    return () => { cancelled = true; };
  }, [url, isPdf]);

  useEffect(() => {
    let cancelled = false;
    async function renderPage(pageNum: number) {
      if (!isPdf || !pdfDoc) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        // @ts-ignore
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (e) {
        console.error('Error rendering page', e);
      }
    }

    renderPage(currentPage);
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, isPdf]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name || url.split('/').pop() || 'file';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <p className="font-semibold">{name || url.split('/').pop()}</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <ExternalLink className="h-4 w-4" /> Buka di tab baru
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <button onClick={onClose} className="p-2 rounded hover:bg-muted">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="bg-muted/10 p-4 overflow-hidden h-[min(70vh,calc(100vh-160px))] flex">
          {isPdf ? (
            <div className="w-full flex gap-4">
              <div className="w-28 overflow-y-auto pr-2">
                {thumbnails.length > 0 ? (
                  thumbnails.map((t, idx) => (
                    <button key={idx} onClick={() => setCurrentPage(idx + 1)} className={`mb-2 w-full rounded border ${currentPage === idx + 1 ? 'border-primary' : 'border-border'} overflow-hidden`}>
                      {t ? <img src={t} alt={`page-${idx+1}`} className="w-full block" /> : <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">Tidak tersedia</div>}
                      <div className="text-xs text-center py-1 bg-card">Halaman {idx + 1}</div>
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">Mempersiapkan thumbnail...</div>
                )}
              </div>

              <div className="flex-1 overflow-auto flex flex-col">
                <div className="mb-2 flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(numPages || p, p + 1))}>Next</Button>
                  <div className="text-sm text-muted-foreground ml-2">Halaman {currentPage} / {numPages || '-'}</div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <canvas ref={canvasRef} className="max-w-full max-h-full" />
                </div>
              </div>
            </div>
          ) : isImage ? (
            <img src={url} alt={name || 'preview'} className="max-w-full max-h-full object-contain mx-auto" />
          ) : (
            <div className="text-center">
              <p className="mb-4">Jenis file tidak dapat dipreview langsung.</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Buka file di tab baru</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

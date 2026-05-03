'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UploadSimple, FilePdf, WarningCircle, CheckCircle } from '@phosphor-icons/react';
import { uploadAndParseInvoice } from '@/lib/invoice-actions';

export function UploadInvoiceModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [bank, setBank] = useState<'ITAU' | 'C6'>('ITAU');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor, selecione um arquivo.');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bank', bank);

    const result = await uploadAndParseInvoice(formData);

    setIsUploading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UploadSimple size={18} />
          <span>Importar Fatura (PDF)</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Fatura do Cartão</DialogTitle>
          <DialogDescription>
            Faça o upload do PDF da fatura do seu banco para extrair as despesas automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Banco da Fatura</Label>
            <div className="flex gap-4 mt-2">
              <label className={`flex-1 flex flex-col items-center justify-center border rounded-xl p-4 cursor-pointer transition-all ${bank === 'ITAU' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
                <input type="radio" name="bank" value="ITAU" checked={bank === 'ITAU'} onChange={() => setBank('ITAU')} className="hidden" />
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">Itaú</span>
              </label>
              <label className={`flex-1 flex flex-col items-center justify-center border rounded-xl p-4 cursor-pointer transition-all ${bank === 'C6' ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-50 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
                <input type="radio" name="bank" value="C6" checked={bank === 'C6'} onChange={() => setBank('C6')} className="hidden" />
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">C6 Bank</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Arquivo PDF</Label>
            <div 
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${file ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".pdf,application/pdf" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              {file ? (
                <>
                  <FilePdf size={40} className="text-green-500 mb-2" weight="duotone" />
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{file.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB - Clique para trocar</p>
                </>
              ) : (
                <>
                  <UploadSimple size={40} className="text-zinc-400 mb-2" />
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Clique ou arraste o PDF aqui</p>
                  <p className="text-xs text-zinc-500 mt-1">Apenas arquivos .pdf são suportados</p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm flex items-start gap-2">
              <WarningCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isUploading}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? 'Iniciando...' : 'Importar Fatura'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

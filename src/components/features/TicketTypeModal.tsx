import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TicketType } from '@/types';
import { toast } from '@/lib/toast';

interface TicketTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TicketType, 'id' | 'event_id' | 'sold' | 'created_at' | 'updated_at' | 'is_active'>) => Promise<void>;
  initialData?: TicketType;
  isLoading?: boolean;
}

export function TicketTypeModal({ isOpen, onClose, onSubmit, initialData, isLoading }: TicketTypeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    max_per_order: '4',
    sale_start: '',
    sale_end: '',
  });

  const [prevInitialData, setPrevInitialData] = useState<TicketType | undefined>(initialData);
  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);

  if (isOpen !== prevIsOpen || initialData !== prevInitialData) {
    setPrevIsOpen(isOpen);
    setPrevInitialData(initialData);

    if (initialData && isOpen) {
      const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
      };
      
      let desc = '';
      if (typeof initialData.description === 'string') {
        desc = initialData.description;
      } else if (initialData.description?.Valid) {
        desc = initialData.description.String;
      }

      let maxPO = 4;
      if (typeof initialData.max_per_order === 'number') {
        maxPO = initialData.max_per_order;
      } else if (initialData.max_per_order?.Valid) {
        maxPO = initialData.max_per_order.Int32;
      }

      setFormData({
        name: initialData.name || '',
        description: desc,
        price: initialData.price ? String(initialData.price) : '0',
        quantity: initialData.quantity ? String(initialData.quantity) : '0',
        max_per_order: String(maxPO),
        sale_start: formatDate(initialData.sale_start),
        sale_end: formatDate(initialData.sale_end),
      });
    } else if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        price: '',
        quantity: '',
        max_per_order: '4',
        sale_start: '',
        sale_end: '',
      });
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || formData.price === '' || !formData.quantity || !formData.sale_start || !formData.sale_end) {
      toast.error('Mohon lengkapi kolom yang wajib diisi');
      return;
    }
    
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price) || 0,
        quantity: parseInt(formData.quantity, 10) || 0,
        max_per_order: parseInt(formData.max_per_order, 10) || 4,
        sale_start: new Date(formData.sale_start).toISOString(),
        sale_end: new Date(formData.sale_end).toISOString(),
      });
      onClose();
    } catch {
      // Error handled by parent
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Tipe Tiket" : "Buat Tipe Tiket Baru"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Nama Tiket <span className="text-red-500">*</span></label>
          <Input 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="Contoh: VIP, Reguler, Early Bird"
            required
            className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2 text-xs focus:bg-white focus:border-zinc-950"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Harga (Rp) <span className="text-red-500">*</span></label>
          <Input 
            type="number"
            name="price" 
            value={formData.price} 
            onChange={handleChange} 
            placeholder="0 jika gratis"
            min="0"
            required
            className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2 text-xs focus:bg-white focus:border-zinc-950"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Kuota Total <span className="text-red-500">*</span></label>
            <Input 
              type="number"
              name="quantity" 
              value={formData.quantity} 
              onChange={handleChange} 
              placeholder="Jumlah tiket"
              min="1"
              required
              className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2 text-xs focus:bg-white focus:border-zinc-950"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Maks. per Orang</label>
            <Input 
              type="number"
              name="max_per_order" 
              value={formData.max_per_order} 
              onChange={handleChange} 
              min="1"
              className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2 text-xs focus:bg-white focus:border-zinc-950"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Mulai Dijual <span className="text-red-500">*</span></label>
            <Input 
              type="datetime-local"
              name="sale_start" 
              value={formData.sale_start} 
              onChange={handleChange} 
              required
              className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2 text-xs focus:bg-white focus:border-zinc-950"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Selesai Dijual <span className="text-red-500">*</span></label>
            <Input 
              type="datetime-local"
              name="sale_end" 
              value={formData.sale_end} 
              onChange={handleChange} 
              required
              className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2 text-xs focus:bg-white focus:border-zinc-950"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Deskripsi (Opsional)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full bg-zinc-50 border-0 shadow-none rounded-2xl py-3 px-4 text-zinc-950 text-xs focus:outline-none focus:ring-0 focus:bg-white transition-all font-medium placeholder:text-zinc-400 resize-none"
            rows={3}
            placeholder="Fasilitas yang didapat (misal: Akses VIP Lounge, dsb)"
          />
        </div>

        <div className="pt-3 flex justify-end gap-2.5 border-t border-zinc-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="rounded-full border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs px-4 py-2 font-bold">
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading} className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs px-5 py-2 shadow-none">
            {isLoading ? 'Menyimpan...' : 'Simpan Tiket'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

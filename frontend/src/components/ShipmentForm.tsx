import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Shipment } from '../types';

interface Props {
  shipment?: Shipment;
}

export default function ShipmentForm({ shipment }: Props) {
  const navigate = useNavigate();
  const isEditing = !!shipment;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: shipment?.title || '',
    senderName: shipment?.senderName || '',
    receiverName: shipment?.receiverName || '',
    origin: shipment?.origin || '',
    destination: shipment?.destination || '',
    shipmentType: shipment?.shipmentType || 'Standard',
    weight: shipment?.weight?.toString() || '',
    description: shipment?.description || '',
    estimatedDeliveryDate: shipment?.estimatedDeliveryDate
      ? new Date(shipment.estimatedDeliveryDate).toISOString().split('T')[0]
      : '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        weight: parseFloat(formData.weight),
        estimatedDeliveryDate: formData.estimatedDeliveryDate || undefined,
      };
      if (isEditing) {
        await api.put(`/shipments/${shipment.id}`, payload);
        toast.success('Shipment updated successfully');
      } else {
        const { data } = await api.post('/shipments', payload);
        toast.success(`Shipment created! Tracking: ${data.trackingNumber}`);
      }
      navigate('/shipments');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputClass = "w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label htmlFor="title" className={labelClass}>Shipment Title *</label>
          <input id="title" name="title" type="text" required value={formData.title}
            onChange={handleChange} placeholder="e.g., Electronics Package" className={inputClass} />
        </div>

        <div>
          <label htmlFor="senderName" className={labelClass}>Sender Name *</label>
          <input id="senderName" name="senderName" type="text" required value={formData.senderName}
            onChange={handleChange} placeholder="Sender name or company" className={inputClass} />
        </div>

        <div>
          <label htmlFor="receiverName" className={labelClass}>Receiver Name *</label>
          <input id="receiverName" name="receiverName" type="text" required value={formData.receiverName}
            onChange={handleChange} placeholder="Receiver name or company" className={inputClass} />
        </div>

        <div>
          <label htmlFor="origin" className={labelClass}>Origin *</label>
          <input id="origin" name="origin" type="text" required value={formData.origin}
            onChange={handleChange} placeholder="e.g., New York, NY" className={inputClass} />
        </div>

        <div>
          <label htmlFor="destination" className={labelClass}>Destination *</label>
          <input id="destination" name="destination" type="text" required value={formData.destination}
            onChange={handleChange} placeholder="e.g., Los Angeles, CA" className={inputClass} />
        </div>

        <div>
          <label htmlFor="shipmentType" className={labelClass}>Shipment Type *</label>
          <select id="shipmentType" name="shipmentType" required value={formData.shipmentType}
            onChange={handleChange} className={inputClass}>
            <option value="Standard">Standard</option>
            <option value="Express">Express</option>
            <option value="Priority">Priority</option>
            <option value="Freight">Freight</option>
            <option value="International">International</option>
          </select>
        </div>

        <div>
          <label htmlFor="weight" className={labelClass}>Weight (kg) *</label>
          <input id="weight" name="weight" type="number" step="0.01" min="0.01" required
            value={formData.weight} onChange={handleChange} placeholder="0.00" className={inputClass} />
        </div>

        <div>
          <label htmlFor="estimatedDeliveryDate" className={labelClass}>Est. Delivery Date</label>
          <input id="estimatedDeliveryDate" name="estimatedDeliveryDate" type="date"
            value={formData.estimatedDeliveryDate} onChange={handleChange} className={inputClass} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className={labelClass}>Description</label>
          <textarea id="description" name="description" rows={3} value={formData.description}
            onChange={handleChange} placeholder="Optional notes about the shipment..."
            className={inputClass} />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-700/50">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-amber-500 text-slate-900 text-sm font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading && <div className="w-3.5 h-3.5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />}
          {loading ? 'Saving...' : isEditing ? 'Update Shipment' : 'Create Shipment'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/shipments')}
          className="px-5 py-2.5 bg-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-600 hover:text-slate-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

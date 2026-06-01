import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { Shipment } from '../types';
import Layout from '../components/Layout';
import TrackingTimeline, { StatusBadge } from '../components/TrackingTimeline';
import DocumentUpload from '../components/DocumentUpload';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  XCircle,
  MapPin,
  Weight,
  Calendar,
  User,
  Package,
  Copy,
  Truck,
} from 'lucide-react';

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: shipment, isLoading } = useQuery<Shipment>({
    queryKey: ['shipment', id],
    queryFn: async () => {
      const { data } = await api.get(`/shipments/${id}`);
      return data;
    },
  });

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this shipment?')) return;
    try {
      await api.delete(`/shipments/${id}`);
      toast.success('Shipment cancelled');
      queryClient.invalidateQueries({ queryKey: ['shipment', id] });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel shipment');
    }
  };

  const copyTracking = () => {
    if (shipment) {
      navigator.clipboard.writeText(shipment.trackingNumber);
      toast.success('Tracking number copied!');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!shipment) {
    return (
      <Layout>
        <div className="text-center py-16">
          <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Shipment not found</p>
        </div>
      </Layout>
    );
  }

  const canEdit = !['DELIVERED', 'CANCELLED'].includes(shipment.status);

  const infoItems = [
    { icon: User, label: 'Sender', value: shipment.senderName },
    { icon: User, label: 'Receiver', value: shipment.receiverName },
    { icon: Package, label: 'Type', value: shipment.shipmentType },
    { icon: MapPin, label: 'Origin', value: shipment.origin },
    { icon: MapPin, label: 'Destination', value: shipment.destination },
    { icon: Weight, label: 'Weight', value: `${shipment.weight} kg` },
    ...(shipment.estimatedDeliveryDate ? [{
      icon: Calendar, label: 'Est. Delivery',
      value: new Date(shipment.estimatedDeliveryDate).toLocaleDateString(),
    }] : []),
    { icon: Calendar, label: 'Created', value: new Date(shipment.createdAt).toLocaleDateString() },
  ];

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/shipments')}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Shipments
            </button>
            <h1 className="text-xl font-bold text-slate-100">{shipment.title}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <button
                onClick={copyTracking}
                className="flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Truck className="w-3 h-3" />
                {shipment.trackingNumber}
                <Copy className="w-3 h-3" />
              </button>
              <StatusBadge status={shipment.status} />
            </div>
          </div>
          {canEdit && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-colors self-start"
            >
              <XCircle className="w-4 h-4" />
              Cancel Shipment
            </button>
          )}
        </div>

        {/* Shipment Info Grid */}
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Shipment Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {infoItems.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <item.icon className="w-3.5 h-3.5 text-slate-600" />
                  <p className="text-xs text-slate-600">{item.label}</p>
                </div>
                <p className="text-sm font-medium text-slate-200 pl-5">{item.value}</p>
              </div>
            ))}
          </div>
          {shipment.description && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-600 mb-1">Description</p>
              <p className="text-sm text-slate-400">{shipment.description}</p>
            </div>
          )}
        </div>

        {/* Tracking Timeline */}
        {shipment.trackingEvents && shipment.trackingEvents.length > 0 && (
          <TrackingTimeline events={shipment.trackingEvents} currentStatus={shipment.status} />
        )}

        {/* Documents */}
        <DocumentUpload
          shipmentId={shipment.id}
          documents={shipment.documents || []}
          onUploaded={() => queryClient.invalidateQueries({ queryKey: ['shipment', id] })}
        />
      </div>
    </Layout>
  );
}

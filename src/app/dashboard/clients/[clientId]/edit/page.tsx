'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function EditClientPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    client_name: '',
    client_business_name: '',
    client_address: '',
    gstin_number: '',
    business_email: '',
    business_phone: '',
    storage_container_name: '',
    business_logo: '',
    account_status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: clientData, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const response = await clientApi.getById(clientId);
      if (response.success && response.data) {
        const data = response.data as any;
        return data.client || data;
      }
      throw new Error(response.message || 'Failed to fetch client');
    },
  });

  const client = (clientData as any)?.client || clientData;

  // Don't auto-populate form - keep it empty by default
  // User can manually enter values or use a "Load Current Values" button if needed

  const mutation = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      const response = await clientApi.update(clientId, data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to update client');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.push(`/dashboard/clients/${clientId}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Remove empty strings to send only changed fields
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '')
      );
      await mutation.mutateAsync(cleanedData);
    } catch (err: any) {
      setError(err.message || 'Failed to update client');
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show form even if client data is loading - form will be empty
  // Only show error if there's an actual error (not just loading)

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/clients/${clientId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Client
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Client</h1>
        <p className="text-gray-600 mt-2">Update client information</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Update the client details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                type="text"
                placeholder={client?.client_name || "Enter client name"}
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_business_name">Business Name</Label>
              <Input
                id="client_business_name"
                type="text"
                placeholder={client?.client_business_name || "Enter business name"}
                value={formData.client_business_name}
                onChange={(e) => setFormData({ ...formData, client_business_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_email">Business Email</Label>
              <Input
                id="business_email"
                type="email"
                placeholder={client?.business_email || "Enter business email"}
                value={formData.business_email}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_phone">Business Phone</Label>
              <Input
                id="business_phone"
                type="tel"
                placeholder={client?.business_phone || "Enter business phone"}
                value={formData.business_phone}
                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_address">Address</Label>
              <Input
                id="client_address"
                type="text"
                placeholder={client?.client_address || "Enter client address"}
                value={formData.client_address}
                onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin_number">GSTIN Number</Label>
              <Input
                id="gstin_number"
                type="text"
                placeholder={client?.gstin_number || "Enter GSTIN number"}
                value={formData.gstin_number}
                onChange={(e) => setFormData({ ...formData, gstin_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage_container_name">Storage Container Name</Label>
              <Input
                id="storage_container_name"
                type="text"
                placeholder={client?.storage_container_name || "Enter storage container name"}
                value={formData.storage_container_name}
                onChange={(e) => setFormData({ ...formData, storage_container_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_logo">Business Logo URL</Label>
              <Input
                id="business_logo"
                type="url"
                placeholder={client?.business_logo || "Enter business logo URL"}
                value={formData.business_logo}
                onChange={(e) => setFormData({ ...formData, business_logo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_status">Account Status</Label>
              <select
                id="account_status"
                value={formData.account_status}
                onChange={(e) => setFormData({ ...formData, account_status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Client'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/clients/${clientId}`)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


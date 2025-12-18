'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function NewClientPage() {
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
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await clientApi.create(data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to create client');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      // Redirect to client detail page to add ads config and marketplace config
      router.push(`/dashboard/clients/${data.client_id}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Remove empty strings to send only filled fields
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value.trim() !== '')
      );
      await mutation.mutateAsync(cleanedData as typeof formData);
    } catch (err: any) {
      setError(err.message || 'Failed to create client');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/clients')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Client</h1>
        <p className="text-gray-600 mt-2">Add a new client to the system</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Enter the details for the new client</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="client_name">
                Client Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="client_name"
                type="text"
                placeholder="Enter client name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_business_name">Business Name</Label>
              <Input
                id="client_business_name"
                type="text"
                placeholder="Enter business name"
                value={formData.client_business_name}
                onChange={(e) => setFormData({ ...formData, client_business_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_email">Business Email</Label>
              <Input
                id="business_email"
                type="email"
                placeholder="Enter business email"
                value={formData.business_email}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_phone">Business Phone</Label>
              <Input
                id="business_phone"
                type="tel"
                placeholder="Enter business phone"
                value={formData.business_phone}
                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_address">Address</Label>
              <Input
                id="client_address"
                type="text"
                placeholder="Enter client address"
                value={formData.client_address}
                onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin_number">GSTIN Number</Label>
              <Input
                id="gstin_number"
                type="text"
                placeholder="Enter GSTIN number"
                value={formData.gstin_number}
                onChange={(e) => setFormData({ ...formData, gstin_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage_container_name">Storage Container Name</Label>
              <Input
                id="storage_container_name"
                type="text"
                placeholder="Enter storage container name"
                value={formData.storage_container_name}
                onChange={(e) => setFormData({ ...formData, storage_container_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_logo">Business Logo URL</Label>
              <Input
                id="business_logo"
                type="url"
                placeholder="Enter business logo URL"
                value={formData.business_logo}
                onChange={(e) => setFormData({ ...formData, business_logo: e.target.value })}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading || !formData.client_name.trim()}>
                {loading ? 'Creating...' : 'Create Client'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/clients')}
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


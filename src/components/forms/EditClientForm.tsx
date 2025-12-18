'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { clientApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Client } from '@/types';
import { AxiosError } from 'axios';

interface EditClientFormProps {
  clientId: string;
  initialClientData: Client;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditClientForm({ clientId, initialClientData, onSuccess, onCancel }: EditClientFormProps) {
  const [formData, setFormData] = useState({
    client_name: initialClientData.client_name || '',
    client_business_name: initialClientData.client_business_name || '',
    client_address: initialClientData.client_address || '',
    gstin_number: initialClientData.gstin_number || '',
    business_email: initialClientData.business_email || '',
    business_phone: initialClientData.business_phone || '',
    storage_container_name: initialClientData.storage_container_name || '',
    business_logo: initialClientData.business_logo || '',
    account_status: (initialClientData.account_status || 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Update form when initialClientData changes
  useEffect(() => {
    setFormData({
      client_name: initialClientData.client_name || '',
      client_business_name: initialClientData.client_business_name || '',
      client_address: initialClientData.client_address || '',
      gstin_number: initialClientData.gstin_number || '',
      business_email: initialClientData.business_email || '',
      business_phone: initialClientData.business_phone || '',
      storage_container_name: initialClientData.storage_container_name || '',
      business_logo: initialClientData.business_logo || '',
      account_status: (initialClientData.account_status || 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
    });
  }, [initialClientData]);

  const mutation = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      const response = await clientApi.update(clientId, data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to update client');
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: AxiosError<any>) => {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'Failed to update client');
      }
      setLoading(false);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client_name">Client Name</Label>
          <Input
            id="client_name"
            type="text"
            placeholder="Enter client name"
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
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

        <div className="space-y-2 col-span-2">
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

        <div className="space-y-2 col-span-2">
          <Label htmlFor="business_logo">Business Logo URL</Label>
          <Input
            id="business_logo"
            type="url"
            placeholder="Enter business logo URL"
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
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Updating...' : 'Update Client'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}





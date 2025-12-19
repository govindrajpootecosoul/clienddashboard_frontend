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
    onError: (err: any) => {
      // Extract error message from various possible locations
      let errorMessage = 'Failed to create client. Please try again.';
      
      // Check for validation errors
      if (err.response?.data?.error) {
        const errorData = err.response.data.error;
        
        // Handle Zod validation errors (array format)
        if (Array.isArray(errorData)) {
          const validationErrors = errorData.map((e: any) => {
            const field = e.path?.join('.')?.replace('body.', '') || 'field';
            return `${field}: ${e.message}`;
          }).join(', ');
          errorMessage = `Validation failed: ${validationErrors}`;
        }
        // Handle flattened validation errors
        else if (errorData?.fieldErrors) {
          const fieldErrors = Object.entries(errorData.fieldErrors)
            .map(([field, messages]: [string, any]) => {
              const msg = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${field}: ${msg}`;
            })
            .join(', ');
          errorMessage = `Validation failed: ${fieldErrors}`;
        }
        // Handle simple error string
        else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      // Check for API error message
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      // Check for error message in error object
      if (err.message && errorMessage === 'Failed to create client. Please try again.') {
        errorMessage = err.message;
      }
      
      // In development, show more detailed error
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev && err.response?.data?.error) {
        const errorDetails = err.response.data.error;
        if (errorDetails.message || errorDetails.code) {
          errorMessage = `${errorMessage} (${errorDetails.message || errorDetails.code})`;
        }
      }
      
      console.error('Client creation error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        errorDetails: err.response?.data?.error,
        fullError: err
      });
      
      setError(errorMessage);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Clean data: remove empty strings, but keep client_name even if empty (will be validated by backend)
      const cleanedData: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        const trimmedValue = typeof value === 'string' ? value.trim() : value;
        // Only include non-empty values, except client_name which is required
        if (key === 'client_name' || trimmedValue !== '') {
          cleanedData[key] = trimmedValue;
        }
      });
      
      await mutation.mutateAsync(cleanedData as typeof formData);
    } catch (err: any) {
      // Error is handled by onError callback
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
              <Button type="submit" disabled={mutation.isPending || !formData.client_name.trim()}>
                {mutation.isPending ? 'Creating...' : 'Create Client'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/clients')}
                disabled={mutation.isPending}
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


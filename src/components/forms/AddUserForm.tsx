'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi, clientApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Client } from '@/types';

interface AddUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  preSelectedClientId?: string; // Optional: if provided, client selection is hidden and this client is used
}

export function AddUserForm({ onSuccess, onCancel, preSelectedClientId }: AddUserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: (preSelectedClientId ? 'admin' : 'admin') as 'super_admin' | 'admin' | 'manager' | 'analyst',
    clientId: preSelectedClientId || '',
    databaseName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch all clients (only if client is not pre-selected)
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: async () => {
      const response = await clientApi.list({ page: 1, limit: 1000 }); // Get all clients
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    },
    enabled: !preSelectedClientId, // Only fetch if client is not pre-selected
  });

  const clients = clientsData?.data || [];

  // Fetch selected client details if preSelectedClientId is provided
  const { data: selectedClientData } = useQuery({
    queryKey: ['client', preSelectedClientId],
    queryFn: async () => {
      if (!preSelectedClientId) return null;
      const response = await clientApi.getById(preSelectedClientId);
      if (response.success && response.data) {
        const data = response.data as any;
        return data.client || data;
      }
      return null;
    },
    enabled: !!preSelectedClientId,
  });

  const selectedClient = preSelectedClientId ? (selectedClientData as any) : null;

  // When client is selected or pre-selected, set databaseName from storage_container_name
  useEffect(() => {
    if (preSelectedClientId && selectedClient) {
      const dbName = selectedClient.storage_container_name;
      setFormData(prev => ({
        ...prev,
        clientId: preSelectedClientId,
        databaseName: dbName || selectedClient.client_id || selectedClient.uid || '',
      }));
    } else if (formData.clientId && !preSelectedClientId) {
      const foundClient = clients.find((c: Client) => c.client_id === formData.clientId);
      if (foundClient) {
        const dbName = foundClient.storage_container_name;
        setFormData(prev => ({
          ...prev,
          databaseName: dbName || foundClient.client_id || foundClient.uid || '',
        }));
      }
    } else if (!formData.clientId && !preSelectedClientId) {
      setFormData(prev => ({ ...prev, databaseName: '' }));
    }
  }, [formData.clientId, clients, preSelectedClientId, selectedClient]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      try {
        // Prepare payload - only include clientId and databaseName if role is not super_admin
        const payload: any = {
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone || undefined,
          role: data.role,
        };

        // Only add clientId and databaseName for non-super_admin users
        if (data.role !== 'super_admin') {
          if (!data.clientId) {
            throw new Error('Client is required for non-super_admin users');
          }
          payload.clientId = data.clientId;
          if (data.databaseName) {
            payload.databaseName = data.databaseName;
          }
        }

        const response = await authApi.signup(payload);
        if (response.success && response.data) {
          return response.data;
        }
        // If response has error details, throw with that message
        const error = new Error(response.message || response.error || 'Failed to create user');
        (error as any).response = { data: response };
        throw error;
      } catch (err: any) {
        // Re-throw axios errors so they can be caught in handleSubmit
        throw err;
      }
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
        throw new Error('Name, email, and password are required');
      }

      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      if (formData.role !== 'super_admin' && !formData.clientId) {
        throw new Error('Please select a client');
      }

      if (formData.role !== 'super_admin' && !formData.databaseName) {
        throw new Error('Database name is required. Please select a client with Storage Container Name.');
      }

      await mutation.mutateAsync(formData);
    } catch (err: any) {
      // Extract error message from axios error response
      let errorMessage = 'Failed to create user';
      
      // Check if it's an axios error
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Handle validation errors (array format from validateRequest)
        if (Array.isArray(errorData.error)) {
          const validationErrors = errorData.error.map((e: any) => {
            const field = e.path?.replace('body.', '') || 'field';
            return `${field}: ${e.message}`;
          }).join(', ');
          errorMessage = `Validation failed: ${validationErrors}`;
        }
        // Handle flattened validation errors (from errorHandler)
        else if (errorData.error?.fieldErrors) {
          const fieldErrors = Object.entries(errorData.error.fieldErrors)
            .map(([field, messages]: [string, any]) => {
              const msg = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${field}: ${msg}`;
            })
            .join(', ');
          errorMessage = `Validation failed: ${fieldErrors}`;
        }
        // Handle simple error message
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Handle error string
        else if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        }
      } 
      // Check if error has response property (from mutation)
      else if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        }
      }
      // Fallback to error message
      else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('User creation error:', err);
      setError(errorMessage);
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

      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter user name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Password <span className="text-red-500">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter password (min 8 characters)"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={8}
        />
        <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="Enter phone number"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">
          Role <span className="text-red-500">*</span>
        </Label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as typeof formData.role })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        >
          {!preSelectedClientId && <option value="super_admin">Super Admin</option>}
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="analyst">Analyst</option>
        </select>
        {preSelectedClientId && (
          <p className="text-xs text-gray-500">
            Super Admin role is not available for client-specific users
          </p>
        )}
      </div>

      {!preSelectedClientId && (
        <div className="space-y-2">
          <Label htmlFor="clientId">
            Client {formData.role !== 'super_admin' && <span className="text-red-500">*</span>}
          </Label>
          <select
            id="clientId"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            disabled={formData.role === 'super_admin' || clientsLoading}
            required={formData.role !== 'super_admin'}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select a client</option>
            {clients.map((client: Client) => (
              <option key={client._id} value={client.client_id}>
                {client.client_name}
              </option>
            ))}
          </select>
          {clientsLoading && (
            <p className="text-xs text-gray-500">Loading clients...</p>
          )}
          {formData.clientId && (
            <p className="text-xs text-blue-600">
              Selected: {clients.find((c: Client) => c.client_id === formData.clientId)?.client_name}
            </p>
          )}
        </div>
      )}

      {preSelectedClientId && selectedClient && (
        <div className="space-y-2">
          <Label>Client</Label>
          <Input
            type="text"
            value={selectedClient.client_name || 'Loading...'}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">
            Client is automatically set for this user
          </p>
        </div>
      )}

      {formData.clientId && (
        <div className="space-y-2">
          <Label htmlFor="databaseName">
            Database Name (from Storage Container Name) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="databaseName"
            type="text"
            placeholder="Database name from Storage Container Name"
            value={formData.databaseName}
            onChange={(e) => setFormData({ ...formData, databaseName: e.target.value })}
            required
            className={formData.databaseName ? '' : 'border-yellow-300'}
          />
          <p className="text-xs text-gray-500">
            {formData.databaseName 
              ? `Database name set from Storage Container Name: ${formData.databaseName}`
              : 'Warning: Selected client does not have a Storage Container Name. Please enter manually or select another client.'}
          </p>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <Button 
          type="submit" 
          disabled={
            loading || 
            !formData.name.trim() || 
            !formData.email.trim() || 
            !formData.password.trim() ||
            (formData.role !== 'super_admin' && !formData.clientId)
          } 
          className="flex-1"
        >
          {loading ? 'Creating...' : 'Create User'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}


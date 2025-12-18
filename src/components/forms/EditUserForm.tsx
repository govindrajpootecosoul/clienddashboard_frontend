'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { userApi, clientApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Client } from '@/types';

import type { User } from '@/types';

interface EditUserFormProps {
  userId: string;
  initialUserData?: User; // Optional: pass user data directly to avoid fetching
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditUserForm({ userId, initialUserData, onSuccess, onCancel }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'admin' as 'super_admin' | 'admin' | 'manager' | 'analyst',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    clientId: '',
    databaseName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch user data only if not provided
  const { data: fetchedUser, isLoading: userLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await userApi.getById(userId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'User not found');
    },
    enabled: !initialUserData, // Only fetch if initialUserData is not provided
  });

  const user = initialUserData || fetchedUser;

  // Fetch all clients
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: async () => {
      const response = await clientApi.list({ page: 1, limit: 1000 });
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    },
  });

  const clients = clientsData?.data || [];

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'admin',
        status: user.status || 'ACTIVE',
        clientId: user.clientId || '',
        databaseName: user.databaseName || '',
      });
    }
  }, [user]);

  // When client is selected, set databaseName from storage_container_name
  useEffect(() => {
    if (formData.clientId) {
      const selectedClient = clients.find((c: Client) => c.client_id === formData.clientId);
      if (selectedClient) {
        const dbName = selectedClient.storage_container_name;
        if (dbName) {
          setFormData(prev => ({
            ...prev,
            databaseName: dbName,
          }));
        }
      }
    }
  }, [formData.clientId, clients]);

  const mutation = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      const payload: any = {};
      
      if (data.name) payload.name = data.name;
      if (data.phone !== undefined) payload.phone = data.phone;
      if (data.role) payload.role = data.role;
      if (data.status) payload.status = data.status;
      if (data.clientId !== undefined) payload.clientId = data.clientId;
      if (data.databaseName !== undefined) payload.databaseName = data.databaseName;

      const response = await userApi.update(userId, payload);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to update user');
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
      // Only send changed fields
      const changedData: Partial<typeof formData> = {};
      if (formData.name !== (user?.name || '')) changedData.name = formData.name;
      if (formData.phone !== (user?.phone || '')) changedData.phone = formData.phone;
      if (formData.role !== (user?.role || 'admin')) changedData.role = formData.role;
      if (formData.status !== (user?.status || 'ACTIVE')) changedData.status = formData.status;
      if (formData.clientId !== (user?.clientId || '')) changedData.clientId = formData.clientId;
      if (formData.databaseName !== (user?.databaseName || '')) changedData.databaseName = formData.databaseName;

      if (Object.keys(changedData).length === 0) {
        throw new Error('No changes made');
      }

      await mutation.mutateAsync(changedData);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">User not found</p>
        <Button onClick={onCancel} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter user name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter email"
          value={formData.email}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500">Email cannot be changed</p>
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
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as typeof formData.role })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
          <option value="manager">Manager</option>
          <option value="analyst">Analyst</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

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
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Updating...' : 'Update User'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function NewUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'admin' as 'super_admin' | 'admin' | 'manager' | 'analyst',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await authApi.signup(data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to create user');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      router.push('/dashboard/users');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await mutation.mutateAsync(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/users')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
        <p className="text-gray-600 mt-2">Add a new user to the system</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Enter the details for the new user</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
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

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading || !formData.name.trim() || !formData.email.trim() || !formData.password.trim()}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/users')}
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





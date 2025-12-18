'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Edit, Plus, Filter, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AddUserForm } from '@/components/forms/AddUserForm';
import { EditUserForm } from '@/components/forms/EditUserForm';
import { clientApi } from '@/services/api';
import { Label } from '@/components/ui/label';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const limit = 10;

  // Fetch clients for the filter dropdown
  const { data: clientsData } = useQuery({
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

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, selectedClientId, selectedStatus],
    queryFn: async () => {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (selectedClientId) params.clientId = selectedClientId;
      if (selectedStatus) params.status = selectedStatus;
      
      const response = await userApi.list(params);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch users');
    },
  });

  const clearFilters = () => {
    setSearch('');
    setSelectedClientId('');
    setSelectedStatus('');
    setPage(1);
  };

  const hasActiveFilters = search || selectedClientId || selectedStatus;

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-2">Manage system users</p>
        </div>
        <Button onClick={() => setShowAddUserModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="mb-2 block">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-[200px]">
              <Label htmlFor="clientFilter" className="mb-2 block">Filter by Client</Label>
              <select
                id="clientFilter"
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  setPage(1);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Clients</option>
                {clients.map((client: any) => (
                  <option key={client._id} value={client.client_id}>
                    {client.client_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[180px]">
              <Label htmlFor="statusFilter" className="mb-2 block">Filter by Status</Label>
              <select
                id="statusFilter"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2 h-10"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data?.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {user.role?.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUserId(user._id);
                              setShowEditUserModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={page === data.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Enter the details for the new user. Select a client to automatically set the database name from Storage Container Name.
            </DialogDescription>
          </DialogHeader>
          <AddUserForm
            onSuccess={() => {
              setShowAddUserModal(false);
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }}
            onCancel={() => setShowAddUserModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      {selectedUserId && (
        <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information. Select a client to automatically set the database name from Storage Container Name.
              </DialogDescription>
            </DialogHeader>
            <EditUserForm
              userId={selectedUserId}
              initialUserData={data?.data?.find((u) => u._id === selectedUserId)}
              onSuccess={() => {
                setShowEditUserModal(false);
                setSelectedUserId(null);
                queryClient.invalidateQueries({ queryKey: ['users'] });
                queryClient.invalidateQueries({ queryKey: ['user', selectedUserId] });
              }}
              onCancel={() => {
                setShowEditUserModal(false);
                setSelectedUserId(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


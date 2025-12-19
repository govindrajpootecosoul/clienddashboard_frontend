'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '@/services/api';
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
import { Plus, Search, Edit, Eye, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EditClientForm } from '@/components/forms/EditClientForm';
import type { Client } from '@/types';

export default function ClientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const limit = 10;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['clients', page, search],
    queryFn: async () => {
      const response = await clientApi.list({ page, limit, search });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch clients');
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await clientApi.delete(clientId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete client');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowDeleteModal(false);
      setSelectedClient(null);
    },
  });

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-2">Manage your clients</p>
        </div>
        <Button onClick={() => router.push('/dashboard/clients/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(isLoading || isFetching) ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Business Email</TableHead>
                    <TableHead>Client ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No clients found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data?.map((client) => (
                      <TableRow 
                        key={client._id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/dashboard/clients/${client.client_id}`)}
                      >
                        <TableCell className="font-medium">{client.client_name}</TableCell>
                        <TableCell>{client.business_email || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{client.client_id}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              client.account_status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {client.account_status}
                          </span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/clients/${client.client_id}`);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Edit Client Modal */}
      {selectedClient && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>
                Update the client information. Leave fields empty to keep current values.
              </DialogDescription>
            </DialogHeader>
            <EditClientForm
              clientId={selectedClient.client_id}
              initialClientData={selectedClient}
              onSuccess={() => {
                setShowEditModal(false);
                setSelectedClient(null);
                queryClient.invalidateQueries({ queryKey: ['clients'] });
              }}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedClient(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {selectedClient && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Client</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedClient.client_name}</strong>? 
                This action will permanently delete the client and all associated data including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All users associated with this client</li>
                  <li>All ads configurations</li>
                  <li>All marketplace configurations</li>
                </ul>
                <span className="text-red-600 font-semibold mt-2 block">This action cannot be undone.</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedClient(null);
                }}
                disabled={deleteClientMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteClientMutation.mutate(selectedClient.client_id);
                }}
                disabled={deleteClientMutation.isPending}
              >
                {deleteClientMutation.isPending ? 'Deleting...' : 'Delete Client'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { clientApi, adsConfigApi, marketPlaceApi, userApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ArrowLeft, Edit, Copy, Eye, EyeOff, Trash2, Plus } from 'lucide-react';
import { AddAdsConfigForm } from '@/components/forms/AddAdsConfigForm';
import { EditAdsConfigForm } from '@/components/forms/EditAdsConfigForm';
import { AddMarketplaceForm } from '@/components/forms/AddMarketplaceForm';
import { AddUserForm } from '@/components/forms/AddUserForm';
import { EditUserForm } from '@/components/forms/EditUserForm';
import type { AdsConfig, User } from '@/types';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdsConfigModal, setShowAdsConfigModal] = useState(false);
  const [showEditAdsConfigModal, setShowEditAdsConfigModal] = useState(false);
  const [selectedAdsConfig, setSelectedAdsConfig] = useState<AdsConfig | null>(null);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [revealedTokens, setRevealedTokens] = useState<Set<string>>(new Set());

  const { data: clientData, isLoading: clientLoading, error: clientError } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const response = await clientApi.getById(clientId);
      if (response.success && response.data) {
        // Backend returns { client, stats, marketplaceConfig, adsConfigs }
        // Extract the client object
        const data = response.data as any;
        return data.client || data; // Fallback to data if client property doesn't exist
      }
      throw new Error(response.message || 'Failed to fetch client');
    },
  });

  const client = (clientData as any)?.client || clientData;

  const { data: adsConfigsData, isLoading: adsConfigsLoading } = useQuery({
    queryKey: ['adsConfigs', clientId],
    queryFn: async () => {
      const response = await adsConfigApi.list(clientId);
      if (response.success && response.data) {
        // Backend returns { success: true, data: [array] }
        // response.data is the array directly
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    },
  });

  const { data: marketPlace, isLoading: marketPlaceLoading } = useQuery({
    queryKey: ['marketPlace', clientId],
    queryFn: async () => {
      const response = await marketPlaceApi.get(clientId);
      if (response.success && response.data) {
        // Ensure regionConfigs is an array (backend should parse it, but add safety check)
        const data = response.data;
        if (data.regionConfigs && typeof data.regionConfigs === 'string') {
          try {
            data.regionConfigs = JSON.parse(data.regionConfigs);
          } catch {
            data.regionConfigs = [];
          }
        }
        if (!Array.isArray(data.regionConfigs)) {
          data.regionConfigs = [];
        }
        return data;
      }
      return null;
    },
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'client', clientId],
    queryFn: async () => {
      const response = await userApi.list({ clientId, page: 1, limit: 100 });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch users');
    },
  });

  // Note: Delete endpoint not available in backend yet
  // const deleteAdsConfigMutation = useMutation({
  //   mutationFn: async (id: string) => {
  //     const response = await api.delete(`/ads-config/${id}`);
  //     if (!response.ok) throw new Error('Failed to delete');
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['adsConfigs', clientId] });
  //   },
  // });

  const toggleAdsConfigMutation = useMutation({
    mutationFn: async ({ id, enable }: { id: string; enable: boolean }) => {
      const response = await adsConfigApi.update(id, { enable });
      if (response.success) return response.data;
      throw new Error(response.message || 'Failed to update');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adsConfigs', clientId] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('🗑️ Frontend: Attempting to delete user with ID:', userId);
      try {
        const response = await userApi.delete(userId);
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete user');
        }
        console.log('✅ Frontend: User deleted successfully');
        return response;
      } catch (error: any) {
        console.error('❌ Frontend: Error deleting user:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('✅ Frontend: Delete mutation succeeded, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['users', 'client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowDeleteUserModal(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      console.error('❌ Frontend: Delete mutation error:', error);
      // Error will be shown by the UI if needed
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleTokenVisibility = (id: string) => {
    setRevealedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const maskToken = (token: string) => {
    if (token.length <= 8) return '••••••••';
    return token.substring(0, 4) + '...' + token.substring(token.length - 4);
  };

  // Calculate refresh token expiration (85 days from last update)
  const getTokenExpirationInfo = (config: AdsConfig) => {
    const TOKEN_VALIDITY_DAYS = 85;
    // Use refresh_token_updated_at if available, otherwise use updatedAt or createdAt
    const lastUpdated = config.refresh_token_updated_at 
      ? new Date(config.refresh_token_updated_at)
      : (config.updatedAt ? new Date(config.updatedAt) : new Date(config.createdAt));
    
    const expirationDate = new Date(lastUpdated);
    expirationDate.setDate(expirationDate.getDate() + TOKEN_VALIDITY_DAYS);
    
    const now = new Date();
    const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      expirationDate,
      daysRemaining,
      isExpired: daysRemaining < 0,
      isExpiringSoon: daysRemaining >= 0 && daysRemaining <= 7,
    };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2">
          {clientError ? 'Error loading client' : 'Client not found'}
        </p>
        {clientError && (
          <p className="text-sm text-red-500 mb-4">
            {clientError instanceof Error ? clientError.message : 'Unknown error'}
          </p>
        )}
        <Button onClick={() => router.push('/dashboard/clients')} className="mt-4">
          Back to Clients
        </Button>
      </div>
    );
  }


  // adsConfigsData is already the array from the API response
  const adsConfigs = Array.isArray(adsConfigsData) ? adsConfigsData : [];

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/clients')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
      </div>

      {/* Client Info Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center text-blue-600 text-xl font-bold">
                {(client.client_name || 'C').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-2xl font-bold text-gray-900">{client.client_name || 'Unnamed Client'}</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => router.push(`/dashboard/clients/${clientId}/edit`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      client.account_status === 'ACTIVE'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {client.account_status}
                  </span>
                  <span className="text-sm text-gray-700 font-mono font-medium">{client.client_id}</span>
                </div>
                {client.business_email && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Business Email:</span> {client.business_email}
                  </p>
                )}
                {client.business_phone && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Business Phone:</span> {client.business_phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ads-config">Ads Config</TabsTrigger>
          <TabsTrigger value="marketplace">SP-API Marketplace</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Client Name</label>
                  <p className="text-gray-900">{client.client_name || 'Unnamed Client'}</p>
                </div>
                {client.client_business_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business Name</label>
                    <p className="text-gray-900">{client.client_business_name}</p>
                  </div>
                )}
                {client.business_email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business Email</label>
                    <p className="text-gray-900">{client.business_email}</p>
                  </div>
                )}
                {client.business_phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business Phone</label>
                    <p className="text-gray-900">{client.business_phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Client ID</label>
                  <p className="text-gray-900 font-mono text-sm">{client.client_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">UID</label>
                  <p className="text-gray-900 font-mono text-sm">{client.uid}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Ads Configurations</label>
                  <p className="text-2xl font-bold text-gray-900">{adsConfigs.length}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Marketplace Config</label>
                  <p className="text-2xl font-bold text-gray-900">
                    {marketPlace ? 'Configured' : 'Not Configured'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ads-config">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Ads Configurations</CardTitle>
                <Button onClick={() => setShowAdsConfigModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Ads Config
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {adsConfigsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : adsConfigs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No ads configurations found. Click &quot;Add Ads Config&quot; to create one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead>Marketplace ID</TableHead>
                      <TableHead>Account ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>API Endpoint</TableHead>
                      <TableHead>Refresh Token</TableHead>
                      <TableHead>Token Expires</TableHead>
                      <TableHead>Enabled</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adsConfigs.map((config: AdsConfig) => (
                      <TableRow key={config._id}>
                        <TableCell>{config.region}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{config.market_place_id}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(config.market_place_id)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{config.account_id}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(config.account_id)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{config.type}</TableCell>
                        <TableCell className="font-mono text-xs">{config.api_end_point}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {revealedTokens.has(config._id)
                                ? config.refresh_token
                                : maskToken(config.refresh_token)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleTokenVisibility(config._id)}
                            >
                              {revealedTokens.has(config._id) ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const expInfo = getTokenExpirationInfo(config);
                            return (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs font-medium ${
                                      expInfo.isExpired
                                        ? 'text-red-600'
                                        : expInfo.isExpiringSoon
                                        ? 'text-orange-600'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {expInfo.isExpired
                                      ? `Expired ${Math.abs(expInfo.daysRemaining)}d ago`
                                      : `${expInfo.daysRemaining} days left`}
                                  </span>
                                  {expInfo.isExpired && (
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                      EXPIRED
                                    </span>
                                  )}
                                  {expInfo.isExpiringSoon && !expInfo.isExpired && (
                                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                                      SOON
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {formatDate(expInfo.expirationDate)}
                                </span>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() =>
                              toggleAdsConfigMutation.mutate({
                                id: config._id,
                                enable: !config.enable,
                              })
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              config.enable ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                config.enable ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedAdsConfig(config);
                              setShowEditAdsConfigModal(true);
                            }}
                            title="Edit Ads Config"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>SP-API Marketplace Configuration</CardTitle>
                <Button onClick={() => setShowMarketplaceModal(true)}>
                  {marketPlace ? (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Config
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Config
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {marketPlaceLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : marketPlace ? (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Marketplace Name</label>
                    <p className="text-gray-900">{marketPlace.market_place_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Market App ID</label>
                    <p className="text-gray-900 font-mono text-sm">{marketPlace.market_app_id}</p>
                  </div>
                  {marketPlace.regionConfigs && Array.isArray(marketPlace.regionConfigs) && marketPlace.regionConfigs.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">
                        Region Configurations
                      </label>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Country</TableHead>
                            <TableHead>Marketplace</TableHead>
                            <TableHead>API Endpoint</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {marketPlace.regionConfigs.map((region, index) => (
                            <TableRow key={index}>
                              <TableCell>{region.country_name}</TableCell>
                              <TableCell>{region.market_place}</TableCell>
                              <TableCell className="font-mono text-sm">{region.api_endpoint}</TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    region.enable
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {region.enable ? 'Enabled' : 'Disabled'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No marketplace configuration found. Click &quot;Create Config&quot; to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Users</CardTitle>
                <Button onClick={() => setShowAddUserModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : usersData?.data?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No users found for this client. Click &quot;Add User&quot; to create one.
                </div>
              ) : (
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
                    {usersData?.data?.map((user: User) => (
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
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setShowEditUserModal(true);
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
                                setSelectedUser(user);
                                setShowDeleteUserModal(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Ads Config Modal */}
      <Dialog open={showAdsConfigModal} onOpenChange={setShowAdsConfigModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Ads Configuration</DialogTitle>
            <DialogDescription>
              Enter the details for the new Amazon Ads configuration
            </DialogDescription>
          </DialogHeader>
          <AddAdsConfigForm
            clientId={clientId}
            onSuccess={() => {
              setShowAdsConfigModal(false);
              queryClient.invalidateQueries({ queryKey: ['adsConfigs', clientId] });
            }}
            onCancel={() => setShowAdsConfigModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Ads Config Modal */}
      {selectedAdsConfig && (
        <Dialog open={showEditAdsConfigModal} onOpenChange={setShowEditAdsConfigModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Ads Configuration</DialogTitle>
              <DialogDescription>
                Update the Amazon Ads configuration details
              </DialogDescription>
            </DialogHeader>
            <EditAdsConfigForm
              clientId={clientId}
              configId={selectedAdsConfig._id}
              initialData={selectedAdsConfig}
              onSuccess={() => {
                setShowEditAdsConfigModal(false);
                setSelectedAdsConfig(null);
                queryClient.invalidateQueries({ queryKey: ['adsConfigs', clientId] });
              }}
              onCancel={() => {
                setShowEditAdsConfigModal(false);
                setSelectedAdsConfig(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Add User Modal */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user for this client. The client is automatically selected.
            </DialogDescription>
          </DialogHeader>
          <AddUserForm
            preSelectedClientId={clientId}
            onSuccess={() => {
              setShowAddUserModal(false);
              queryClient.invalidateQueries({ queryKey: ['users', 'client', clientId] });
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }}
            onCancel={() => setShowAddUserModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      {selectedUser && (
        <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update the user details.</DialogDescription>
            </DialogHeader>
            <EditUserForm
              userId={selectedUser._id}
              initialUserData={selectedUser}
              onSuccess={() => {
                setShowEditUserModal(false);
                setSelectedUser(null);
                queryClient.invalidateQueries({ queryKey: ['users', 'client', clientId] });
                queryClient.invalidateQueries({ queryKey: ['users'] });
              }}
              onCancel={() => {
                setShowEditUserModal(false);
                setSelectedUser(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Confirmation Modal */}
      {selectedUser && (
        <Dialog open={showDeleteUserModal} onOpenChange={setShowDeleteUserModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedUser.name}</strong> ({selectedUser.email})? 
                <br />
                <span className="text-red-600 font-semibold mt-2 block">This action cannot be undone.</span>
              </DialogDescription>
            </DialogHeader>
            {deleteUserMutation.isError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  {deleteUserMutation.error?.message || 'Failed to delete user. Please try again.'}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteUserModal(false);
                  setSelectedUser(null);
                  deleteUserMutation.reset();
                }}
                disabled={deleteUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  console.log('🗑️ Delete button clicked, user ID:', selectedUser._id, 'Type:', typeof selectedUser._id);
                  deleteUserMutation.mutate(selectedUser._id);
                }}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Marketplace Modal */}
      <Dialog open={showMarketplaceModal} onOpenChange={setShowMarketplaceModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {marketPlace ? 'Edit' : 'Create'} Marketplace Configuration
            </DialogTitle>
            <DialogDescription>
              Configure SP-API marketplace settings
            </DialogDescription>
          </DialogHeader>
          <AddMarketplaceForm
            clientId={clientId}
            existingData={marketPlace || undefined}
            onSuccess={() => {
              setShowMarketplaceModal(false);
              queryClient.invalidateQueries({ queryKey: ['marketPlace', clientId] });
            }}
            onCancel={() => setShowMarketplaceModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

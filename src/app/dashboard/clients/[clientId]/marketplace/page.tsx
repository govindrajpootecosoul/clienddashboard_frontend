'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { marketPlaceApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Edit, Plus } from 'lucide-react';

export default function MarketplacePage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['marketPlace', clientId],
    queryFn: async () => {
      const response = await marketPlaceApi.get(clientId);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    },
  });

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketplace Configuration</h1>
            <p className="text-gray-600 mt-2">Manage SP-API marketplace configuration</p>
          </div>
          <Button onClick={() => router.push(`/dashboard/clients/${clientId}/marketplace/edit`)}>
            {data ? (
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
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : data ? (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Marketplace Name</label>
                <p className="text-gray-900">{data.market_place_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Market App ID</label>
                <p className="text-gray-900 font-mono text-sm">{data.market_app_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Market Client Secret</label>
                <p className="text-gray-900 font-mono text-sm">••••••••</p>
              </div>
              {data.regionConfigs && data.regionConfigs.length > 0 && (
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
                      {data.regionConfigs.map((region, index) => (
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
    </div>
  );
}


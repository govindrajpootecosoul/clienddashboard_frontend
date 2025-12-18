'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { adsConfigApi } from '@/services/api';
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
import { ArrowLeft, Plus, Eye } from 'lucide-react';

export default function AdsConfigPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['adsConfigs', clientId],
    queryFn: async () => {
      const response = await adsConfigApi.list(clientId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch ads configs');
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
            <h1 className="text-3xl font-bold text-gray-900">Ads Configurations</h1>
            <p className="text-gray-600 mt-2">Manage Amazon Ads configurations</p>
          </div>
          <Button onClick={() => router.push(`/dashboard/clients/${clientId}/ads-config/new`)}>
            <Plus className="w-4 h-4 mr-2" />
            New Config
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account ID</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Marketplace ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No ads configurations found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((config) => (
                    <TableRow key={config._id}>
                      <TableCell className="font-medium">{config.account_id}</TableCell>
                      <TableCell>{config.region}</TableCell>
                      <TableCell className="font-mono text-sm">{config.market_place_id}</TableCell>
                      <TableCell className="capitalize">{config.type}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            config.enable
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {config.enable ? 'Enabled' : 'Disabled'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/clients/${clientId}/ads-config/${config._id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


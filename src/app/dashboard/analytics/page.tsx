'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Settings, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const response = await analyticsApi.getOverview();
      if (response.success && response.data) {
        // Map backend response structure to frontend expected structure
        const backendData = response.data as any;
        return {
          totalClients: backendData.clients?.total || 0,
          activeClients: backendData.clients?.active || 0,
          totalUsers: backendData.users?.total || 0,
          activeUsers: backendData.users?.active || 0,
          totalAdsConfigs: backendData.adsConfigs || 0,
          totalMarketPlaces: backendData.marketplaceConfigs || 0,
        };
      }
      throw new Error(response.message || 'Failed to fetch analytics');
    },
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading analytics</p>
          <p className="text-sm text-gray-500">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Clients',
      value: data?.totalClients || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Clients',
      value: data?.activeClients || 0,
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Users',
      value: data?.totalUsers || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Active Users',
      value: data?.activeUsers || 0,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Ads Configs',
      value: data?.totalAdsConfigs || 0,
      icon: Settings,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Marketplaces',
      value: data?.totalMarketPlaces || 0,
      icon: BarChart3,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Overview of your system statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


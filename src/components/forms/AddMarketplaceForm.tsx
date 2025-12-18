'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { marketPlaceApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import type { MarketPlace, RegionConfig } from '@/types';

interface AddMarketplaceFormProps {
  clientId: string;
  existingData?: MarketPlace;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddMarketplaceForm({
  clientId,
  existingData,
  onSuccess,
  onCancel,
}: AddMarketplaceFormProps) {
  const [formData, setFormData] = useState({
    market_place_name: 'amazon',
    market_app_id: '',
    market_client_secret: '',
    regionConfigs: [] as RegionConfig[],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingData) {
      setFormData({
        market_place_name: existingData.market_place_name || 'amazon',
        market_app_id: existingData.market_app_id || '',
        market_client_secret: existingData.market_client_secret || '',
        regionConfigs: existingData.regionConfigs || [],
      });
    }
  }, [existingData]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await marketPlaceApi.upsert(clientId, data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to save marketplace config');
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const addRegion = () => {
    setFormData({
      ...formData,
      regionConfigs: [
        ...formData.regionConfigs,
        {
          api_endpoint: '',
          market_place: '',
          enable: true,
          country_code: '',
          country_name: '',
          refresh_token: '',
        },
      ],
    });
  };

  const removeRegion = (index: number) => {
    setFormData({
      ...formData,
      regionConfigs: formData.regionConfigs.filter((_, i) => i !== index),
    });
  };

  const updateRegion = (index: number, field: keyof RegionConfig, value: string | boolean) => {
    const updated = [...formData.regionConfigs];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, regionConfigs: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.regionConfigs.length === 0) {
        throw new Error('At least one region configuration is required');
      }
      await mutation.mutateAsync(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save marketplace config');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="market_place_name">Marketplace Name</Label>
          <Input
            id="market_place_name"
            type="text"
            placeholder="amazon"
            value={formData.market_place_name}
            onChange={(e) => setFormData({ ...formData, market_place_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="market_app_id">
            Market App ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="market_app_id"
            type="text"
            placeholder="Enter market app ID"
            value={formData.market_app_id}
            onChange={(e) => setFormData({ ...formData, market_app_id: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="market_client_secret">
          Market Client Secret <span className="text-red-500">*</span>
        </Label>
        <Input
          id="market_client_secret"
          type="password"
          placeholder="Enter market client secret"
          value={formData.market_client_secret}
          onChange={(e) => setFormData({ ...formData, market_client_secret: e.target.value })}
          required
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>
            Region Configurations <span className="text-red-500">*</span>
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={addRegion}>
            <Plus className="w-4 h-4 mr-2" />
            Add Region
          </Button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {formData.regionConfigs.map((region, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Region {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRegion(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country Code</Label>
                  <Input
                    value={region.country_code}
                    onChange={(e) => updateRegion(index, 'country_code', e.target.value)}
                    placeholder="US"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country Name</Label>
                  <Input
                    value={region.country_name}
                    onChange={(e) => updateRegion(index, 'country_name', e.target.value)}
                    placeholder="United States"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Marketplace</Label>
                  <Input
                    value={region.market_place}
                    onChange={(e) => updateRegion(index, 'market_place', e.target.value)}
                    placeholder="ATVPDKIKX0DER"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Endpoint</Label>
                  <Input
                    type="url"
                    value={region.api_endpoint}
                    onChange={(e) => updateRegion(index, 'api_endpoint', e.target.value)}
                    placeholder="https://sellingpartnerapi-na.amazon.com"
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Refresh Token</Label>
                  <Input
                    type="password"
                    value={region.refresh_token}
                    onChange={(e) => updateRegion(index, 'refresh_token', e.target.value)}
                    placeholder="Enter refresh token"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={region.enable}
                    onChange={(e) => updateRegion(index, 'enable', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label className="cursor-pointer">Enable</Label>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {formData.regionConfigs.length === 0 && (
          <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
            No regions added. Click &quot;Add Region&quot; to get started.
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading || formData.regionConfigs.length === 0} className="flex-1">
          {loading
            ? 'Saving...'
            : existingData
            ? 'Update Configuration'
            : 'Create Configuration'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}





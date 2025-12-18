'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adsConfigApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddAdsConfigFormProps {
  clientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddAdsConfigForm({ clientId, onSuccess, onCancel }: AddAdsConfigFormProps) {
  const [formData, setFormData] = useState({
    account_id: '',
    api_end_point: '',
    client_id: '',
    client_secret_id: '',
    refresh_token: '',
    return_url: '',
    market_place_id: '',
    region: '',
    type: 'seller' as 'seller' | 'vendor',
    enable: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await adsConfigApi.upsert(clientId, data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to create ads config');
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
      await mutation.mutateAsync(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to create ads config');
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="account_id">
            Account ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="account_id"
            type="text"
            placeholder="Enter account ID"
            value={formData.account_id}
            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">
            Region <span className="text-red-500">*</span>
          </Label>
          <Input
            id="region"
            type="text"
            placeholder="e.g., US, EU, AP"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="market_place_id">
            Marketplace ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="market_place_id"
            type="text"
            placeholder="Enter marketplace ID"
            value={formData.market_place_id}
            onChange={(e) => setFormData({ ...formData, market_place_id: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">
            Type <span className="text-red-500">*</span>
          </Label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'seller' | 'vendor' })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="seller">Seller</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_id">
            Client ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="client_id"
            type="text"
            placeholder="Enter client ID"
            value={formData.client_id}
            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_secret_id">
            Client Secret ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="client_secret_id"
            type="password"
            placeholder="Enter client secret ID"
            value={formData.client_secret_id}
            onChange={(e) => setFormData({ ...formData, client_secret_id: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api_end_point">
          API Endpoint <span className="text-red-500">*</span>
        </Label>
        <Input
          id="api_end_point"
          type="url"
          placeholder="https://advertising-api.amazon.com"
          value={formData.api_end_point}
          onChange={(e) => setFormData({ ...formData, api_end_point: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="return_url">
          Return URL <span className="text-red-500">*</span>
        </Label>
        <Input
          id="return_url"
          type="url"
          placeholder="https://example.com/callback"
          value={formData.return_url}
          onChange={(e) => setFormData({ ...formData, return_url: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="refresh_token">
          Refresh Token <span className="text-red-500">*</span>
        </Label>
        <Input
          id="refresh_token"
          type="password"
          placeholder="Enter refresh token"
          value={formData.refresh_token}
          onChange={(e) => setFormData({ ...formData, refresh_token: e.target.value })}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="enable"
          checked={formData.enable}
          onChange={(e) => setFormData({ ...formData, enable: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="enable" className="cursor-pointer">
          Enable this configuration
        </Label>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Creating...' : 'Create Configuration'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}





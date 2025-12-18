'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search as SearchIcon } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['search', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return null;
      const response = await searchApi.global(searchTerm);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Search failed');
    },
    enabled: !!searchTerm,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Global Search</h1>
        <p className="text-gray-600 mt-2">Search across clients, users, and configurations</p>
      </div>

      <Card>
        <CardHeader>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search for clients, users, configs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : searchTerm && data ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Found results for &quot;{searchTerm}&quot;
              </p>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          ) : searchTerm ? (
            <div className="text-center py-8 text-gray-500">
              No results found for &quot;{searchTerm}&quot;
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Enter a search term to get started
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





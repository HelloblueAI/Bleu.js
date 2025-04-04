import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import config from '../config';
import { ApiToken } from '../types';

export const ApiKeys: React.FC = () => {
  const [newKeyName, setNewKeyName] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery<ApiToken[]>({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await axios.get(config.endpoints.tokens.list);
      return response.data;
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await axios.post(config.endpoints.tokens.create, { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setNewKeyName('');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create API key');
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(config.endpoints.tokens.revoke(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to revoke API key');
    },
  });

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      setError('Please enter a key name');
      return;
    }
    setError('');
    createKeyMutation.mutate(newKeyName);
  };

  const handleRevokeKey = async (id: string) => {
    if (window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      revokeKeyMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New API Key</h3>
        <form onSubmit={handleCreateKey} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div>
            <label htmlFor="key-name" className="block text-sm font-medium text-gray-700">
              Key Name
            </label>
            <input
              type="text"
              id="key-name"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., Production API Key"
            />
          </div>
          <button
            type="submit"
            disabled={createKeyMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {createKeyMutation.isPending ? 'Creating...' : 'Create API Key'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your API Keys</h3>
        {apiKeys && apiKeys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {key.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No API keys found. Create one to get started.</p>
        )}
      </div>
    </div>
  );
};

export default ApiKeys; 
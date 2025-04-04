import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import config from '../config';

interface UsageStats {
  rate_limit_remaining: number;
  rate_limit: number;
  rate_limit_reset: number;
  current_period_start: number;
  current_period_end: number;
  last_reset: number;
  total_calls: number;
  calls_remaining: number;
  calls_today: number;
  calls_this_month: number;
}

export const Usage: React.FC = () => {
  const { data: usageStats, isLoading } = useQuery<UsageStats>({
    queryKey: ['usage-stats'],
    queryFn: async () => {
      const response = await axios.get(config.endpoints.usage.stats);
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monthly Usage */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Usage</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-blue-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Total API Calls</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {usageStats?.total_calls || 0}
            </dd>
            <p className="mt-2 text-sm text-blue-600">
              {usageStats?.calls_remaining || 0} calls remaining
            </p>
          </div>
          <div className="bg-green-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Today's Usage</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {usageStats?.calls_today || 0}
            </dd>
            <p className="mt-2 text-sm text-green-600">
              {((usageStats?.calls_today || 0) / (usageStats?.total_calls || 1) * 100).toFixed(1)}% of total usage
            </p>
          </div>
          <div className="bg-yellow-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">This Month</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {usageStats?.calls_this_month || 0}
            </dd>
            <p className="mt-2 text-sm text-yellow-600">
              {((usageStats?.calls_this_month || 0) / (usageStats?.total_calls || 1) * 100).toFixed(1)}% of total usage
            </p>
          </div>
        </div>
      </div>

      {/* Rate Limit Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rate Limit Status</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="bg-purple-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Current Rate</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {usageStats?.rate_limit_remaining || 0}/{usageStats?.rate_limit || 0}
            </dd>
            <p className="mt-2 text-sm text-purple-600">
              Resets in {Math.ceil((new Date(usageStats?.rate_limit_reset || 0).getTime() - Date.now()) / 1000)}s
            </p>
          </div>
          <div className="bg-indigo-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Usage Trend</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {((usageStats?.calls_today || 0) / (usageStats?.calls_this_month || 1) * 100).toFixed(1)}%
            </dd>
            <p className="mt-2 text-sm text-indigo-600">
              Of monthly usage today
            </p>
          </div>
        </div>
      </div>

      {/* Usage History */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage History</h3>
        <div className="relative">
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                <dt className="text-sm font-medium text-gray-500">Current Period Start</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {new Date(usageStats?.current_period_start || 0).toLocaleDateString()}
                </dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                <dt className="text-sm font-medium text-gray-500">Current Period End</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {new Date(usageStats?.current_period_end || 0).toLocaleDateString()}
                </dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                <dt className="text-sm font-medium text-gray-500">Last Reset</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {new Date(usageStats?.last_reset || 0).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Usage; 
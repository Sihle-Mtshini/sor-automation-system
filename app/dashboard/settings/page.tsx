'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    loadConfig();
    checkApiHealth();
  }, []);

  const loadConfig = async () => {
    try {
      const result = await api.getConfig();
      if (result.success) {
        setConfig(result.data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkApiHealth = async () => {
    try {
      setApiStatus('checking');
      await api.healthCheck();
      setApiStatus('online');
    } catch (error) {
      setApiStatus('offline');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            {apiStatus === 'online' ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : apiStatus === 'offline' ? (
              <XCircle className="text-red-500" size={24} />
            ) : (
              <RefreshCw className="text-gray-400 animate-spin" size={24} />
            )}
            <div>
              <p className="font-medium text-gray-900">API Server</p>
              <p className="text-sm text-gray-500">
                {apiStatus === 'online' ? 'Connected' :
                 apiStatus === 'offline' ? 'Disconnected' : 'Checking...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <p className="font-medium text-gray-900">Database</p>
              <p className="text-sm text-gray-500">Connected</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <p className="font-medium text-gray-900">Dropbox Sign</p>
              <p className="text-sm text-gray-500">Test Mode</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <RefreshCw className="animate-spin" size={16} />
            Loading configuration...
          </div>
        ) : config ? (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <dt className="text-sm text-gray-500">Moodle URL</dt>
              <dd className="text-gray-900 font-medium truncate">{config.moodle_url}</dd>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <dt className="text-sm text-gray-500">Assignment ID</dt>
              <dd className="text-gray-900 font-medium">{config.assignment_id}</dd>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg col-span-2">
              <dt className="text-sm text-gray-500">Course</dt>
              <dd className="text-gray-900 font-medium">{config.course_name}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-gray-500">Failed to load configuration</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration File</h2>
        <p className="text-gray-600 mb-4">
          System settings are configured through the <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file
          in the project root directory.
        </p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`# Moodle Configuration
MOODLE_URL=https://your-moodle-url.com
MOODLE_TOKEN=your_api_token

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=moodle

# Dropbox Sign
DROPBOX_SIGN_API_KEY=your_api_key`}</pre>
        </div>
      </div>
    </div>
  );
}

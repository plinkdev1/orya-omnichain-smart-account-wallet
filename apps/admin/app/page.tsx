'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">ORŸA Admin Dashboard</h1>
          <p className="text-slate-400">Manage users, transactions, and platform settings</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">0</div>
              <p className="text-xs text-slate-500 mt-1">Placeholder</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">0</div>
              <p className="text-xs text-slate-500 mt-1">Placeholder</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">0</div>
              <p className="text-xs text-slate-500 mt-1">Placeholder</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400">Platform Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">Healthy</div>
              <p className="text-xs text-slate-500 mt-1">Placeholder</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest user and system activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-slate-400 text-center py-8">
                <p>Activity log will be displayed here</p>
                <p className="text-sm text-slate-500 mt-2">Scaffold in progress...</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-slate-400 text-sm">
                <p>• User Management</p>
                <p>• Transaction Monitoring</p>
                <p>• Security Settings</p>
                <p>• System Configuration</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
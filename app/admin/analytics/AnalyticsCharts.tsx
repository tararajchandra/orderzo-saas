'use client';

import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function AnalyticsCharts({ analytics }: { analytics: any }) {
    return (
        <>
            {/* Revenue Trend Chart */}
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Revenue Trend</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analytics.revenueByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="date" stroke="var(--text-muted)" />
                        <YAxis yAxisId="left" stroke="var(--text-muted)" />
                        <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                            }}
                        />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue (₹)" />
                        <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} name="Orders" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
                {/* Top Selling Items */}
                <div className="glass-card">
                    <h2 style={{ marginBottom: '1.5rem' }}>Top Selling Items</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.topSellingItems.slice(0, 5)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend />
                            <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue (₹)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Revenue */}
                <div className="glass-card">
                    <h2 style={{ marginBottom: '1.5rem' }}>Revenue by Category</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analytics.categoryRevenue}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry: any) => `${entry.category}: ₹${entry.revenue.toFixed(0)}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="revenue"
                            >
                                {analytics.categoryRevenue.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Order Status */}
                <div className="glass-card">
                    <h2 style={{ marginBottom: '1.5rem' }}>Orders by Status</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analytics.ordersByStatus}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry: any) => `${entry.status}: ${entry.count}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {analytics.ordersByStatus.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Payment Methods */}
                <div className="glass-card">
                    <h2 style={{ marginBottom: '1.5rem' }}>Payment Methods</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.paymentMethods}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="method" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend />
                            <Bar dataKey="amount" fill="#10b981" name="Amount (₹)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
}

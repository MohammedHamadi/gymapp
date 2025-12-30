import { FileText, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';

export function ReportsPage() {
  // Mock data for reports
  const stats = [
    { label: 'Total Members', value: '247', icon: Users, color: 'bg-blue-600' },
    { label: 'Active Subscriptions', value: '189', icon: TrendingUp, color: 'bg-green-600' },
    { label: 'Monthly Revenue', value: '567,000 DZD', icon: DollarSign, color: 'bg-purple-600' },
    { label: 'New Members (This Month)', value: '23', icon: Users, color: 'bg-orange-600' },
  ];

  const recentTransactions = [
    { date: '2024-12-28', member: 'Ahmed BENALI', type: 'Monthly Subscription', amount: '3,000 DZD' },
    { date: '2024-12-27', member: 'Yasmine DJAMEL', type: 'Quarterly Subscription', amount: '8,000 DZD' },
    { date: '2024-12-27', member: 'Karim LARBI', type: 'Single Session', amount: '300 DZD' },
    { date: '2024-12-26', member: 'Fatima OMAR', type: 'Annual Subscription', amount: '28,000 DZD' },
    { date: '2024-12-26', member: 'Mohamed SALAH', type: 'Monthly Subscription', amount: '3,000 DZD' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl text-blue-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-600" />
            Reports & Analytics
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="dateFrom" className="text-blue-900">From:</Label>
              <Input 
                id="dateFrom" 
                type="date" 
                defaultValue="2024-12-01"
                className="border-blue-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="dateTo" className="text-blue-900">To:</Label>
              <Input 
                id="dateTo" 
                type="date" 
                defaultValue="2024-12-29"
                className="border-blue-300"
              />
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-3xl text-blue-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-4 rounded-lg`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-lg">
          <h3 className="text-white text-xl flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Recent Transactions
          </h3>
        </div>
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-blue-200">
                <th className="text-left py-3 px-4 text-blue-900">Date</th>
                <th className="text-left py-3 px-4 text-blue-900">Member</th>
                <th className="text-left py-3 px-4 text-blue-900">Type</th>
                <th className="text-right py-3 px-4 text-blue-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction, index) => (
                <tr key={index} className="border-b border-blue-100 hover:bg-blue-50">
                  <td className="py-3 px-4 text-blue-900">{transaction.date}</td>
                  <td className="py-3 px-4 text-blue-900">{transaction.member}</td>
                  <td className="py-3 px-4 text-blue-900">{transaction.type}</td>
                  <td className="py-3 px-4 text-blue-900 text-right">{transaction.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6">
        <h3 className="text-xl text-blue-900 mb-4">Export Reports</h3>
        <div className="flex gap-4">
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            Export to Excel
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            Export to PDF
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Print Report
          </Button>
        </div>
      </div>
    </div>
  );
}

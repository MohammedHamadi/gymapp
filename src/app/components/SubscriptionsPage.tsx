import { CreditCard, TrendingUp, AlertCircle, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export function SubscriptionsPage() {
  const stats = [
    { label: 'Active Subscriptions', value: '189', icon: CheckCircle, color: 'bg-green-600' },
    { label: 'Expiring This Week', value: '12', icon: AlertCircle, color: 'bg-orange-600' },
    { label: 'Expired', value: '8', icon: AlertCircle, color: 'bg-red-600' },
    { label: 'Monthly Revenue', value: '567,000 DZD', icon: DollarSign, color: 'bg-blue-600' },
  ];

  const subscriptions = [
    {
      member: 'Ahmed BENALI',
      memberId: 'GYM00001234',
      type: 'Monthly',
      startDate: '2024-12-01',
      endDate: '2024-12-31',
      price: '3,000 DZD',
      status: 'Active',
      daysLeft: 2,
      autoRenew: true
    },
    {
      member: 'Yasmine DJAMEL',
      memberId: 'GYM00002345',
      type: 'Quarterly',
      startDate: '2024-10-01',
      endDate: '2024-12-31',
      price: '8,000 DZD',
      status: 'Active',
      daysLeft: 2,
      autoRenew: false
    },
    {
      member: 'Karim LARBI',
      memberId: 'GYM00003456',
      type: 'Annual',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      price: '28,000 DZD',
      status: 'Active',
      daysLeft: 17,
      autoRenew: true
    },
    {
      member: 'Mohamed SALAH',
      memberId: 'GYM00004567',
      type: 'Monthly',
      startDate: '2024-11-20',
      endDate: '2024-12-20',
      price: '3,000 DZD',
      status: 'Expired',
      daysLeft: -9,
      autoRenew: false
    },
    {
      member: 'Fatima OMAR',
      memberId: 'GYM00005678',
      type: 'Sessions Package',
      startDate: '2024-11-01',
      endDate: '2025-01-31',
      price: '4,500 DZD',
      status: 'Active',
      daysLeft: 33,
      autoRenew: false
    },
    {
      member: 'Ali HASSAN',
      memberId: 'GYM00006789',
      type: 'Monthly',
      startDate: '2024-12-15',
      endDate: '2025-01-15',
      price: '3,000 DZD',
      status: 'Active',
      daysLeft: 17,
      autoRenew: true
    },
    {
      member: 'Sara MAHMOUD',
      memberId: 'GYM00007890',
      type: 'Quarterly',
      startDate: '2024-11-01',
      endDate: '2025-01-31',
      price: '8,000 DZD',
      status: 'Active',
      daysLeft: 33,
      autoRenew: true
    },
    {
      member: 'Omar YOUSSEF',
      memberId: 'GYM00008901',
      type: 'Monthly',
      startDate: '2024-11-28',
      endDate: '2024-12-28',
      price: '3,000 DZD',
      status: 'Expiring Soon',
      daysLeft: 1,
      autoRenew: false
    },
  ];

  const subscriptionPlans = [
    { name: 'Monthly', price: '3,000 DZD', duration: '30 days', color: 'bg-blue-600' },
    { name: 'Quarterly', price: '8,000 DZD', duration: '90 days', color: 'bg-green-600', savings: '1,000 DZD' },
    { name: 'Annual', price: '28,000 DZD', duration: '365 days', color: 'bg-purple-600', savings: '8,000 DZD' },
    { name: '10 Sessions', price: '2,500 DZD', duration: 'Valid for 60 days', color: 'bg-orange-600' },
    { name: '20 Sessions', price: '4,500 DZD', duration: 'Valid for 90 days', color: 'bg-cyan-600', savings: '500 DZD' },
  ];

  return (
    <div className="p-6 space-y-6">
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

      {/* Subscription Plans */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
          <h2 className="text-white text-2xl flex items-center gap-3">
            <CreditCard className="w-8 h-8" />
            Subscription Plans
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {subscriptionPlans.map((plan, index) => (
              <div key={index} className="border-2 border-blue-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`${plan.color} px-4 py-3`}>
                  <h3 className="text-white text-lg text-center">{plan.name}</h3>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-2xl text-center text-blue-900">{plan.price}</p>
                  <p className="text-sm text-center text-gray-600">{plan.duration}</p>
                  {plan.savings && (
                    <Badge className="bg-green-600 w-full justify-center">
                      Save {plan.savings}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Subscriptions Table */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 rounded-t-lg flex items-center justify-between">
          <h3 className="text-white text-xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            All Subscriptions
          </h3>
          <div className="flex gap-2">
            <Button className="bg-white text-blue-700 hover:bg-blue-50 text-sm">
              Filter
            </Button>
            <Button className="bg-white text-blue-700 hover:bg-blue-50 text-sm">
              Export
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-blue-200">
                  <th className="text-left py-3 px-4 text-blue-900">Member</th>
                  <th className="text-left py-3 px-4 text-blue-900">Member ID</th>
                  <th className="text-left py-3 px-4 text-blue-900">Type</th>
                  <th className="text-left py-3 px-4 text-blue-900">Start Date</th>
                  <th className="text-left py-3 px-4 text-blue-900">End Date</th>
                  <th className="text-right py-3 px-4 text-blue-900">Price</th>
                  <th className="text-center py-3 px-4 text-blue-900">Days Left</th>
                  <th className="text-center py-3 px-4 text-blue-900">Auto-Renew</th>
                  <th className="text-center py-3 px-4 text-blue-900">Status</th>
                  <th className="text-center py-3 px-4 text-blue-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub, index) => (
                  <tr key={index} className="border-b border-blue-100 hover:bg-blue-50">
                    <td className="py-3 px-4 text-blue-900">{sub.member}</td>
                    <td className="py-3 px-4 text-blue-900">{sub.memberId}</td>
                    <td className="py-3 px-4 text-blue-900">{sub.type}</td>
                    <td className="py-3 px-4 text-blue-900">{sub.startDate}</td>
                    <td className="py-3 px-4 text-blue-900">{sub.endDate}</td>
                    <td className="py-3 px-4 text-blue-900 text-right">{sub.price}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`${
                        sub.daysLeft < 0 ? 'text-red-600' :
                        sub.daysLeft <= 7 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {sub.daysLeft < 0 ? `${Math.abs(sub.daysLeft)} days ago` : `${sub.daysLeft} days`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={sub.autoRenew ? 'bg-green-600' : 'bg-gray-400'}>
                        {sub.autoRenew ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={
                        sub.status === 'Active' ? 'bg-green-600' :
                        sub.status === 'Expiring Soon' ? 'bg-orange-600' :
                        'bg-red-600'
                      }>
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 justify-center">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-auto">
                          Renew
                        </Button>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 h-auto">
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Renewal Reminders */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-orange-200">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-3 rounded-t-lg">
          <h3 className="text-white text-xl flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Renewal Reminders
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.filter(s => s.status === 'Expiring Soon' || s.daysLeft <= 7 && s.daysLeft > 0).map((sub, index) => (
              <div key={index} className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-blue-900">{sub.member}</h4>
                    <p className="text-sm text-gray-600">{sub.memberId}</p>
                  </div>
                  <Badge className="bg-orange-600">
                    {sub.daysLeft} {sub.daysLeft === 1 ? 'day' : 'days'}
                  </Badge>
                </div>
                <div className="space-y-1 mb-3">
                  <p className="text-sm text-gray-700">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Expires: {sub.endDate}
                  </p>
                  <p className="text-sm text-gray-700">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    {sub.type} - {sub.price}
                  </p>
                </div>
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm">
                  Send Reminder
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

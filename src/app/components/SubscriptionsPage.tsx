import {
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { RenewSubscriptionModal } from "./RenewSubscriptionModal";
import { EditSubscriptionModal } from "./EditSubscriptionModal";

import { useEffect, useState } from "react";

export function SubscriptionsPage() {
  const [stats, setStats] = useState({
    activeCount: 0,
    expiringCount: 0,
    expiredCount: 0,
    monthlyRevenue: 0,
  });
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState<any[]>([]);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const statsData = await window.api.subscriptions.getStats();
      setStats(statsData);

      const subsData = await window.api.subscriptions.getAll();
      setSubscriptions(subsData);

      const expiringData = await window.api.subscriptions.getExpiring();
      setExpiringSubscriptions(expiringData);
    } catch (error) {
      console.error("Failed to fetch subscription data", error);
    }
  };

  const handleRenewClick = (sub: any) => {
    setSelectedSub(sub);
    setShowRenewModal(true);
  };

  const handleRenewSubmit = async (data: any) => {
    try {
      // We need memberId. sub object has member_id
      await window.api.subscriptions.renew(selectedSub.member_id, data);
      await fetchData();
      alert("Subscription renewed successfully!");
    } catch (error) {
      console.error("Renewal failed", error);
      alert("Failed to renew subscription");
    }
  };

  const handleEditClick = (sub: any) => {
    setSelectedSub(sub);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (id: number, data: any) => {
    try {
      await window.api.subscriptions.update(id, data);
      await fetchData();
      // alert("Subscription updated successfully!"); // Optional: Feedback is good
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update subscription");
    }
  };

  const statCards = [
    {
      label: "Active Subscriptions",
      value: stats.activeCount.toString(),
      icon: CheckCircle,
      color: "bg-green-600",
    },
    {
      label: "Expiring This Week",
      value: stats.expiringCount.toString(),
      icon: AlertCircle,
      color: "bg-orange-600",
    },
    {
      label: "Expired",
      value: stats.expiredCount.toString(),
      icon: AlertCircle,
      color: "bg-red-600",
    },
    {
      label: "Monthly Revenue",
      value: `${stats.monthlyRevenue.toLocaleString()} DZD`,
      icon: DollarSign,
      color: "bg-blue-600",
    },
  ];

  const getDaysLeft = (endDate: string) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6"
          >
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
                  <th className="text-left py-3 px-4 text-blue-900">
                    Member ID
                  </th>
                  <th className="text-left py-3 px-4 text-blue-900">Type</th>
                  <th className="text-left py-3 px-4 text-blue-900">
                    Start Date
                  </th>
                  <th className="text-left py-3 px-4 text-blue-900">
                    End Date
                  </th>
                  <th className="text-right py-3 px-4 text-blue-900">Price</th>
                  <th className="text-center py-3 px-4 text-blue-900">
                    Days Left
                  </th>
                  <th className="text-center py-3 px-4 text-blue-900">
                    Auto-Renew
                  </th>
                  <th className="text-center py-3 px-4 text-blue-900">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 text-blue-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub, index) => {
                  const daysLeft = getDaysLeft(sub.end_date);
                  return (
                    <tr
                      key={index}
                      className="border-b border-blue-100 hover:bg-blue-50"
                    >
                      <td className="py-3 px-4 text-blue-900">
                        {sub.first_name} {sub.last_name}
                      </td>
                      <td className="py-3 px-4 text-blue-900">
                        {sub.member_id}
                      </td>
                      <td className="py-3 px-4 text-blue-900">
                        {sub.plan_name}
                      </td>
                      <td className="py-3 px-4 text-blue-900">
                        {sub.start_date}
                      </td>
                      <td className="py-3 px-4 text-blue-900">
                        {sub.end_date || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-blue-900 text-right">
                        {sub.price_paid} DZD
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`${
                            daysLeft < 0
                              ? "text-red-600"
                              : daysLeft <= 7
                                ? "text-orange-600"
                                : "text-green-600"
                          }`}
                        >
                          {daysLeft < 0
                            ? `${Math.abs(daysLeft)} days ago`
                            : `${daysLeft} days`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={
                            sub.auto_renew ? "bg-green-600" : "bg-gray-400"
                          }
                        >
                          {sub.auto_renew ? "Yes" : "No"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={
                            sub.status === "ACTIVE"
                              ? "bg-green-600"
                              : sub.status === "EXPIRED"
                                ? "bg-red-600"
                                : "bg-gray-600"
                          }
                        >
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 justify-center">
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-auto"
                            onClick={() => handleRenewClick(sub)}
                          >
                            Renew
                          </Button>
                          <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 h-auto"
                            onClick={() => handleEditClick(sub)}
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
            {expiringSubscriptions.map((sub, index) => {
              const daysLeft = getDaysLeft(sub.end_date);
              return (
                <div
                  key={index}
                  className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-blue-900">
                        {sub.first_name} {sub.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {sub.member_display_id}
                      </p>
                    </div>
                    <Badge className="bg-orange-600">
                      {daysLeft} {daysLeft === 1 ? "day" : "days"}
                    </Badge>
                  </div>
                  <div className="space-y-1 mb-3">
                    <p className="text-sm text-gray-700">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Expires: {sub.end_date}
                    </p>
                    <p className="text-sm text-gray-700">
                      <CreditCard className="w-4 h-4 inline mr-1" />
                      {sub.plan_name}
                    </p>
                  </div>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm">
                    Send Reminder
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <RenewSubscriptionModal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        onRenew={handleRenewSubmit}
        member={
          selectedSub
            ? {
                id: selectedSub.member_id,
                firstName: selectedSub.first_name,
                lastName: selectedSub.last_name,
              }
            : null
        }
        currentPlanId={selectedSub?.plan_id?.toString()}
      />

      <EditSubscriptionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSubmit}
        subscription={selectedSub}
      />
    </div>
  );
}

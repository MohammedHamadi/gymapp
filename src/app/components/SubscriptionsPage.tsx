import {
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RenewSubscriptionModal } from "./RenewSubscriptionModal";
import { EditSubscriptionModal } from "./EditSubscriptionModal";

import { useEffect, useState, useMemo } from "react";

type SortConfig = {
  key: string;
  direction: "asc" | "desc" | null;
};

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

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "end_date",
    direction: "asc",
  });

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
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update subscription");
    }
  };

  const getDaysLeft = (endDate: string) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Sorting Handler
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown className="ml-1 w-3 h-3 text-blue-300 inline" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 w-3 h-3 text-white inline" />
    ) : (
      <ArrowDown className="ml-1 w-3 h-3 text-white inline" />
    );
  };

  // Filter and Sort Logic
  const filteredAndSortedSubs = useMemo(() => {
    let result = subscriptions.filter((sub) => {
      // Name/ID Search
      const searchLower = searchTerm.toLowerCase();
      const fullName =
        `${sub.first_name || ""} ${sub.last_name || ""}`.toLowerCase();
      const memberId = (sub.member_id || "").toLowerCase();
      const matchesSearch =
        fullName.includes(searchLower) || memberId.includes(searchLower);

      // Status Filter
      const status = sub.status || "UNKNOWN";
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    if (sortConfig.direction !== null) {
      result.sort((a, b) => {
        let aValue: any = "";
        let bValue: any = "";

        switch (sortConfig.key) {
          case "name":
            aValue = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
            bValue = `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
            break;
          case "plan":
            aValue = a.plan_name || "";
            bValue = b.plan_name || "";
            break;
          case "start_date":
            aValue = a.start_date || "";
            bValue = b.start_date || "";
            break;
          case "end_date":
            aValue = a.end_date || "";
            bValue = b.end_date || "";
            break;
          case "price":
            aValue = a.price_paid || 0;
            bValue = b.price_paid || 0;
            break;
          case "days_left":
            aValue = getDaysLeft(a.end_date);
            bValue = getDaysLeft(b.end_date);
            break;
          case "sessions":
            aValue = a.remaining_sessions ?? -1;
            bValue = b.remaining_sessions ?? -1;
            break;
          case "status":
            aValue = a.status || "";
            bValue = b.status || "";
            break;
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [subscriptions, searchTerm, statusFilter, sortConfig]);

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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-t-lg">
          <h3 className="text-white text-xl flex items-center gap-2 whitespace-nowrap">
            <TrendingUp className="w-6 h-6" />
            All Subscriptions
          </h3>

          {/* Filter Controls */}
          <div className="flex w-full md:w-auto gap-3 items-center text-sm">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search Member Name or ID..."
                className="pl-9 h-9 bg-white text-blue-900 border-none rounded-md w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-32">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 bg-white text-blue-900 border-none">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="bg-white text-blue-700 hover:bg-blue-50 text-sm h-9">
              Export
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-blue-200">
                  <th
                    className="text-left py-3 px-4 text-blue-900 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    Member {getSortIcon("name")}
                  </th>
                  <th className="text-left py-3 px-4 text-blue-900">
                    Member ID
                  </th>
                  <th
                    className="text-left py-3 px-4 text-blue-900 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleSort("plan")}
                  >
                    Type {getSortIcon("plan")}
                  </th>
                  <th
                    className="text-left py-3 px-4 text-blue-900 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleSort("start_date")}
                  >
                    Start Date {getSortIcon("start_date")}
                  </th>
                  <th
                    className="text-left py-3 px-4 text-blue-900 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleSort("end_date")}
                  >
                    End Date {getSortIcon("end_date")}
                  </th>
                  <th
                    className="text-right py-3 px-4 text-blue-900 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleSort("price")}
                  >
                    Price {getSortIcon("price")}
                  </th>
                  <th
                    className="text-center py-3 px-4 text-blue-900 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleSort("days_left")}
                  >
                    Days Left {getSortIcon("days_left")}
                  </th>
                  <th
                    className="text-center py-3 px-4 text-blue-900 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleSort("sessions")}
                  >
                    Sessions Left {getSortIcon("sessions")}
                  </th>
                  <th
                    className="text-center py-3 px-4 text-blue-900 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    Status {getSortIcon("status")}
                  </th>
                  <th className="text-center py-3 px-4 text-blue-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedSubs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-8 text-center text-gray-500 italic"
                    >
                      No subscriptions found matching your search and filters.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedSubs.map((sub, index) => {
                    const daysLeft = getDaysLeft(sub.end_date);
                    return (
                      <tr
                        key={index}
                        className="border-b border-blue-100 hover:bg-blue-50"
                      >
                        <td className="py-3 px-4 text-blue-900 font-medium">
                          {sub.first_name} {sub.last_name}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
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
                        <td className="py-3 px-4 text-blue-900 text-right font-medium">
                          {sub.price_paid} DZD
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-bold ${
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
                        <td className="py-3 px-4 text-center text-blue-900 font-bold">
                          {sub.remaining_sessions !== null
                            ? sub.remaining_sessions
                            : "—"}
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
                  })
                )}
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

import {
  DoorOpen,
  UserCheck,
  UserX,
  Clock,
  QrCode,
  CheckCircle,
  XCircle,
  CreditCard,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export function AccessControlPage() {
  const [checkInMode, setCheckInMode] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [todayAccessLog, setTodayAccessLog] = useState<any[]>([]);
  const [currentlyInside, setCurrentlyInside] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCheckIns: 0,
    totalDenied: 0,
  });
  const [lastScanResult, setLastScanResult] = useState<any>(null);
  const [pendingSelection, setPendingSelection] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lastScanResult) {
      const timer = setTimeout(() => {
        setLastScanResult(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastScanResult]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
    const interval = setInterval(() => {
      fetchLogs();
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const logs = await window.api.accessLogs.getRecent(10);
      setTodayAccessLog(logs);
      const inside = await window.api.accessLogs.getCurrentlyInside();
      setCurrentlyInside(inside);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  const fetchStats = async () => {
    try {
      const todayStats = await window.api.accessLogs.getTodayStats();
      setStats(todayStats);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const handleAccessRequest = async (id: string, subscriptionId?: number) => {
    if (!id.trim()) return;

    try {
      const result = await window.api.accessLogs.validate({
        id,
        type: checkInMode ? "CHECK_IN" : "CHECK_OUT",
        subscriptionId,
      });

      // Handle PENDING_SELECTION — member has multiple active subscriptions
      if (result.status === "PENDING_SELECTION") {
        setPendingSelection({
          memberId: id,
          member: result.member,
          subscriptions: result.subscriptions,
        });
        setInputValue("");
        return;
      }

      setLastScanResult(result);
      setInputValue("");
      fetchLogs();
      fetchStats();

      if (result.status === "GRANTED") {
        toast.success(result.message || "Access Granted", {
          description: `Member: ${result.member.firstName} ${result.member.lastName}`,
          duration: 3000,
        });
      } else {
        toast.error("Access Denied", {
          description: `Reason: ${result.reason}`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Access request failed", error);
      toast.error("Error processing request");
    }
  };

  const handleSubscriptionSelect = (subscriptionId: number) => {
    if (!pendingSelection) return;
    setPendingSelection(null);
    handleAccessRequest(pendingSelection.memberId, subscriptionId);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleAccessRequest(inputValue);
  };

  const dashboardStats = [
    {
      label: "Currently Inside",
      value: currentlyInside.length,
      icon: UserCheck,
      color: "bg-green-600",
    },
    {
      label: "Total Check-ins Today",
      value: stats.totalCheckIns,
      icon: DoorOpen,
      color: "bg-blue-600",
    },
    {
      label: "Average Duration",
      value: "1.5h",
      icon: Clock,
      color: "bg-purple-600",
    },
    {
      label: "Access Denied Today",
      value: stats.totalDenied,
      icon: UserX,
      color: "bg-red-600",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Subscription Selection Modal */}
      {pendingSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-300 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                Select Subscription
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                {pendingSelection.member.firstName}{" "}
                {pendingSelection.member.lastName} has multiple active
                subscriptions
              </p>
            </div>
            <div className="p-6 space-y-3">
              {pendingSelection.subscriptions.map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubscriptionSelect(sub.id)}
                  className="w-full text-left border-2 border-blue-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-blue-900 font-bold text-lg group-hover:text-blue-700">
                        {sub.planName}
                      </h4>
                      <div className="flex gap-4 mt-1 text-sm text-gray-600">
                        {sub.endDate && (
                          <span>
                            Expires:{" "}
                            {new Date(sub.endDate).toLocaleDateString()}
                          </span>
                        )}
                        {sub.planType === "SESSION_BASED" && (
                          <span className="font-bold text-blue-700">
                            {sub.remainingSessions} sessions left
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={
                        sub.planType === "SESSION_BASED"
                          ? "bg-purple-600"
                          : "bg-teal-600"
                      }
                    >
                      {sub.planType === "SESSION_BASED"
                        ? "Session"
                        : "Time-Based"}
                    </Badge>
                  </div>
                </button>
              ))}
              <Button
                variant="ghost"
                className="w-full mt-2 text-gray-500"
                onClick={() => setPendingSelection(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Last Scan Result Overlay (Quick Feedback) */}
      {lastScanResult && (
        <div
          className={`fixed top-4 right-4 z-50 p-6 rounded-lg shadow-2xl border-2 animate-in fade-in slide-in-from-top-4 duration-300 ${
            lastScanResult.status === "GRANTED"
              ? "bg-green-50 border-green-500"
              : "bg-red-50 border-red-500"
          }`}
        >
          <div className="flex items-center gap-4">
            {lastScanResult.status === "GRANTED" ? (
              <CheckCircle className="w-12 h-12 text-green-600" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
            <div>
              <h3
                className={`text-xl font-bold ${lastScanResult.status === "GRANTED" ? "text-green-900" : "text-red-900"}`}
              >
                {lastScanResult.status === "GRANTED"
                  ? "ACCESS GRANTED"
                  : "ACCESS DENIED"}
              </h3>
              {lastScanResult.member && (
                <p className="text-gray-700 font-medium">
                  {lastScanResult.member.firstName}{" "}
                  {lastScanResult.member.lastName}
                </p>
              )}
              {lastScanResult.subscription && (
                <p className="text-blue-600 text-sm font-medium">
                  Plan: {lastScanResult.subscription.planName}
                </p>
              )}
              {lastScanResult.reason && (
                <p className="text-red-600 font-bold">
                  {lastScanResult.reason}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              className="ml-4"
              onClick={() => setLastScanResult(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-In/Out Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 sticky top-6">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 rounded-t-lg">
              <h3 className="text-white text-xl flex items-center gap-2">
                <DoorOpen className="w-6 h-6" />
                Access Control
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Mode Selection */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setCheckInMode(true)}
                  className={`flex-1 ${checkInMode ? "bg-green-600 hover:bg-green-700 font-bold" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
                >
                  <UserCheck className="w-5 h-5 mr-2" />
                  Check-In
                </Button>
                <Button
                  onClick={() => setCheckInMode(false)}
                  className={`flex-1 ${!checkInMode ? "bg-orange-600 hover:bg-orange-700 font-bold" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
                >
                  <UserX className="w-5 h-5 mr-2" />
                  Check-Out
                </Button>
              </div>

              {/* QR Scanner Simulation / Input */}
              <div
                className={`border-4 border-dashed rounded-lg p-8 transition-colors ${checkInMode ? "border-green-300 bg-green-50" : "border-orange-300 bg-orange-50"}`}
              >
                <div className="flex flex-col items-center justify-center gap-4">
                  <QrCode
                    className={`w-24 h-24 ${checkInMode ? "text-green-600" : "text-orange-600"}`}
                  />
                  <div className="text-center">
                    <p className="text-blue-900 font-bold text-lg">
                      Ready to Scan
                    </p>
                    <p className="text-gray-600 text-sm">
                      Scanner will input ID directly
                    </p>
                  </div>
                  <form
                    onSubmit={handleManualSearch}
                    className="w-full space-y-3"
                  >
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Enter Member ID..."
                      className="border-blue-300 text-center text-lg h-12"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      className="bg-teal-600 hover:bg-teal-700 text-white w-full h-12 text-lg font-bold"
                    >
                      Process Access
                    </Button>
                  </form>
                </div>
              </div>

              {/* Current Status Display */}
              <div
                className={`rounded-lg p-4 text-white text-center shadow-inner ${checkInMode ? "bg-gradient-to-r from-green-600 to-green-700" : "bg-gradient-to-r from-orange-600 to-orange-700"}`}
              >
                <p className="text-xs opacity-80 uppercase tracking-widest font-bold">
                  Portal Status
                </p>
                <p className="text-2xl mt-1 font-black">
                  {checkInMode ? "CHECK-IN MODE" : "CHECK-OUT MODE"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Access Logs & Currently Inside */}
        <div className="lg:col-span-2 space-y-6">
          {/* Currently Inside */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 rounded-t-lg">
              <h3 className="text-white text-xl flex items-center gap-2">
                <UserCheck className="w-6 h-6" />
                Currently Inside ({currentlyInside.length})
              </h3>
            </div>
            <div className="p-6">
              {currentlyInside.length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic">
                  No members currently inside.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentlyInside.map((member, index) => (
                    <div
                      key={index}
                      className="border-2 border-green-200 rounded-lg p-4 bg-green-50 flex items-center gap-4"
                    >
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                          {member.first_name[0]}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-blue-900 font-bold">
                            {member.first_name} {member.last_name}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-600">ID: {member.id}</p>
                        <p className="text-xs text-gray-600">
                          <Clock className="w-3 h-3 inline mr-1" />
                          In at:{" "}
                          {new Date(member.check_in_time).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Today's Access Log */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 rounded-t-lg flex items-center justify-between">
              <h3 className="text-white text-xl">Recent Access Activity</h3>
              <Button className="bg-white text-blue-700 hover:bg-blue-50 text-sm">
                View All
              </Button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-blue-200">
                      <th className="text-left py-2 text-blue-900 font-bold">
                        Time
                      </th>
                      <th className="text-left py-2 text-blue-900 font-bold">
                        Member
                      </th>
                      <th className="text-left py-2 text-blue-900 font-bold">
                        Plan
                      </th>
                      <th className="text-center py-2 text-blue-900 font-bold">
                        Type
                      </th>
                      <th className="text-center py-2 text-blue-900 font-bold">
                        Status
                      </th>
                      <th className="text-left py-2 text-blue-900 font-bold">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAccessLog.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-gray-500 italic"
                        >
                          No access logs recorded for today.
                        </td>
                      </tr>
                    ) : (
                      todayAccessLog.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-blue-100 hover:bg-blue-50"
                        >
                          <td className="py-3 text-blue-900 text-sm">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3 text-blue-900 font-medium">
                            {log.first_name} {log.last_name}
                            <div className="text-[10px] text-gray-500">
                              {log.member_id}
                            </div>
                          </td>
                          <td className="py-3 text-blue-900 text-sm">
                            {log.plan_name || "—"}
                          </td>
                          <td className="py-3 text-center">
                            <Badge
                              className={
                                log.type === "CHECK_IN"
                                  ? "bg-green-600"
                                  : "bg-orange-600"
                              }
                            >
                              {log.type.replace("_", "-")}
                            </Badge>
                          </td>
                          <td className="py-3 text-center">
                            <Badge
                              className={
                                log.status === "GRANTED"
                                  ? "bg-blue-600"
                                  : "bg-red-600"
                              }
                            >
                              {log.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-blue-700 text-xs italic">
                            {log.denial_reason ||
                              (log.status === "GRANTED" ? "Success" : "")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

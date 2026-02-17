import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Save } from "lucide-react";

interface MemberFormProps {
  selectedMember?: any;
  isEditing?: boolean;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export function MemberForm({
  selectedMember,
  isEditing = false,
  onSave,
  onCancel,
}: MemberFormProps) {
  // Member State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Subscription State
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [remainingSessions, setRemainingSessions] = useState("");
  const [pricePaid, setPricePaid] = useState("");

  // Fetch plans on mount
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await window.api.plans.getAll();
        setPlans(data.filter((p: any) => p.is_active));
      } catch (error) {
        console.error("Failed to load plans", error);
      }
    };
    loadPlans();
  }, []);

  // Update form when selecting a member (Edit Mode)
  useEffect(() => {
    if (selectedMember) {
      setFirstName(selectedMember.firstName || "");
      setLastName(selectedMember.lastName || "");
      setPhone(selectedMember.phone || "");
      setEmail(selectedMember.email || "");

      // Populate subscription details if available
      if (selectedMember.subscription) {
        // We need to find the plan ID based on planName or if we have planId in the subscription object
        // The current fetch returns planName and planType but not planId directly in the subscription object of findAll
        // We might need to match by name or update findAll to include planId
        // Let's check findAll in memberRepository.js - it DOES select plan_id in the subquery but might not explicitly map it in the result

        // Wait, looking at memberRepository.js:
        // s.plan_id is selected in the subquery but NOT in the main SELECT list of stmt/stmt2?
        // Ah, checked repository:
        // SELECT ... s.id as subscription_id, ... p.name as plan_name ...
        // It does NOT select s.plan_id or p.id as a top level column to map to subscription.planId

        // Use checks to see if we can match plan name for now, or default to empty
        // ideally we should update repository to return planId.
        // Let's try to match by name from the 'plans' state if possible.
        const foundPlan = plans.find(
          (p) => p.name === selectedMember.subscription.planName,
        );
        if (foundPlan) {
          setSelectedPlanId(foundPlan.id.toString());
          setPricePaid(
            selectedMember.subscription.pricePaid?.toString() ||
              foundPlan.price.toString(),
          );
        }

        setStartDate(selectedMember.subscription.startDate || "");
        setEndDate(selectedMember.subscription.endDate || "");
        setRemainingSessions(
          selectedMember.subscription.remainingSessions?.toString() || "",
        );
      }
    } else {
      // Clear form
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setSelectedPlanId("");
      setStartDate(getTodayDate());
      setEndDate("");
      setDurationDays("");
      setRemainingSessions("");
      setPricePaid("");
    }
  }, [selectedMember]);

  // Handle Plan Selection
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find((p) => p.id.toString() === planId);

    if (plan) {
      setPricePaid(plan.price.toString());

      // Auto-set duration if available
      if (plan.duration_days) {
        setDurationDays(plan.duration_days.toString());
        setEndDate(calculateEndDate(startDate, plan.duration_days));
      } else {
        setDurationDays("");
        setEndDate("");
      }

      // Auto-set sessions if available
      if (plan.session_count) {
        setRemainingSessions(plan.session_count.toString());
      } else {
        setRemainingSessions("");
      }
    }
  };

  // Helper: Get today's date YYYY-MM-DD
  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  // Helper: Calculate End Date
  function calculateEndDate(start: string, days: number) {
    if (!start || !days) return "";
    const date = new Date(start);
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  }

  // Handle Duration Change (Manual Override)
  const handleDurationChange = (val: string) => {
    setDurationDays(val);
    if (val && parseInt(val) > 0) {
      setEndDate(calculateEndDate(startDate, parseInt(val)));
    } else {
      setEndDate("");
    }
  };

  // Handle Start Date Change
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (durationDays && parseInt(durationDays) > 0) {
      setEndDate(calculateEndDate(val, parseInt(durationDays)));
    }
  };

  const handleSave = () => {
    if (!firstName || !lastName || !phone) {
      alert("Please fill in all required fields (Name, Phone)");
      return;
    }

    // If adding new member, require plan selection
    if (!selectedMember && !selectedPlanId) {
      alert("Please select a subscription plan for the new member");
      return;
    }

    const data = {
      member: {
        id: selectedMember?.id, // undefined for new
        firstName,
        lastName,
        phone,
        email,
      },
      subscription: selectedPlanId
        ? {
            planId: parseInt(selectedPlanId),
            startDate,
            endDate: endDate || null,
            remainingSessions: remainingSessions
              ? parseInt(remainingSessions)
              : 0,
            pricePaid: pricePaid ? parseFloat(pricePaid) : 0,
          }
        : null,
    };

    if (onSave) {
      onSave(data);
    }
  };

  const isViewMode = selectedMember && !isEditing;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-blue-800 font-semibold">
          {selectedMember
            ? isEditing
              ? "Edit Member"
              : "Member Details"
            : "New Member Registration"}
        </h2>
        {!isViewMode && selectedMember && onCancel && (
          <Button
            onClick={onCancel}
            variant="ghost"
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Member Details */}
        {/* Member Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Personal Details
          </h3>

          <div>
            <Label htmlFor="firstName" className="text-blue-900 mb-2">
              First Name *
            </Label>
            {isViewMode ? (
              <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-800">
                {firstName}
              </div>
            ) : (
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="border-blue-300 focus:border-blue-500"
              />
            )}
          </div>

          <div>
            <Label htmlFor="lastName" className="text-blue-900 mb-2">
              Last Name *
            </Label>
            {isViewMode ? (
              <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-800">
                {lastName}
              </div>
            ) : (
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="border-blue-300 focus:border-blue-500"
              />
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-blue-900 mb-2">
              Phone Number *
            </Label>
            {isViewMode ? (
              <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-800">
                {phone}
              </div>
            ) : (
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="border-blue-300 focus:border-blue-500"
              />
            )}
          </div>

          <div>
            <Label htmlFor="email" className="text-blue-900 mb-2">
              Email (Optional)
            </Label>
            {isViewMode ? (
              <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-800">
                {email || "-"}
              </div>
            ) : (
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="border-blue-300 focus:border-blue-500"
              />
            )}
          </div>
        </div>

        {/* Subscription Details (Only for New Members or if integrated edit is desired) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            {selectedMember ? "Edit Subscription" : "Subscription Details"}
          </h3>

          <div>
            <Label htmlFor="plan" className="text-blue-900 mb-2">
              Select Plan *
            </Label>
            {isViewMode ? (
              <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-800">
                {plans.find((p) => p.id.toString() === selectedPlanId)?.name ||
                  selectedMember?.subscription?.planName ||
                  "-"}
              </div>
            ) : (
              <Select value={selectedPlanId} onValueChange={handlePlanChange}>
                <SelectTrigger className="border-blue-300">
                  <SelectValue placeholder="Select a plan..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name} - {plan.price} DZD
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-blue-900 mb-2">
                Start Date
              </Label>
              {isViewMode ? (
                <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-800">
                  {startDate}
                </div>
              ) : (
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="border-blue-300"
                />
              )}
            </div>
            <div>
              <Label htmlFor="duration" className="text-blue-900 mb-2">
                Duration (Days)
              </Label>
              {isViewMode ? (
                <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-800">
                  {durationDays || "-"}
                </div>
              ) : (
                <Input
                  type="number"
                  value={durationDays}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  placeholder="Auto"
                  className="border-blue-300"
                />
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="endDate" className="text-blue-900 mb-2">
              End Date (Auto)
            </Label>
            {isViewMode ? (
              <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-800">
                {endDate || "-"}
              </div>
            ) : (
              <Input
                type="date"
                value={endDate}
                readOnly
                className="bg-gray-100 border-blue-300"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessions" className="text-blue-900 mb-2">
                Sessions
              </Label>
              {isViewMode ? (
                <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-800">
                  {remainingSessions || "0"}
                </div>
              ) : (
                <Input
                  type="number"
                  value={remainingSessions}
                  onChange={(e) => setRemainingSessions(e.target.value)}
                  placeholder="Auto"
                  className="border-blue-300"
                />
              )}
            </div>
            <div>
              <Label htmlFor="price" className="text-blue-900 mb-2">
                Price Paid
              </Label>
              {isViewMode ? (
                <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-800">
                  {pricePaid} DZD
                </div>
              ) : (
                <Input
                  type="number"
                  value={pricePaid}
                  onChange={(e) => setPricePaid(e.target.value)}
                  className="border-blue-300"
                />
              )}
            </div>
          </div>

          {!isViewMode && (
            <div className="pt-4">
              <Button
                onClick={handleSave}
                className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Member & Subscription
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface RenewSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRenew: (data: any) => void;
  member: any;
  currentPlanId?: string; // Optional: prepopulate with current plan
}

export function RenewSubscriptionModal({
  isOpen,
  onClose,
  onRenew,
  member,
  currentPlanId,
}: RenewSubscriptionModalProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [remainingSessions, setRemainingSessions] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadPlans();
      if (currentPlanId) {
        setSelectedPlanId(currentPlanId);
      }
    }
  }, [isOpen, currentPlanId]);

  // Effect to handle plan change logic (populate price/duration)
  useEffect(() => {
    if (selectedPlanId && plans.length > 0) {
      const plan = plans.find((p) => p.id.toString() === selectedPlanId);
      if (plan) {
        setPrice(plan.price.toString());
        if (plan.duration_days) {
          setDuration(plan.duration_days.toString());
          setEndDate(calculateEndDate(startDate, plan.duration_days));
        } else {
          setDuration("");
          setEndDate("");
        }
        setRemainingSessions(
          plan.session_count ? plan.session_count.toString() : "",
        );
      }
    }
  }, [selectedPlanId, plans, startDate]);

  const loadPlans = async () => {
    try {
      const data = await window.api.plans.getAll();
      setPlans(data.filter((p: any) => p.is_active));
    } catch (error) {
      console.error("Failed to load plans", error);
    }
  };

  const calculateEndDate = (start: string, days: number) => {
    if (!start || !days) return "";
    const date = new Date(start);
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  };

  const handleRenew = () => {
    if (!selectedPlanId) {
      alert("Please select a plan.");
      return;
    }

    onRenew({
      planId: parseInt(selectedPlanId),
      startDate,
      endDate: endDate || null,
      remainingSessions: remainingSessions ? parseInt(remainingSessions) : 0,
      pricePaid: price ? parseFloat(price) : 0,
      status: "ACTIVE",
      autoRenew: 0,
    });
    onClose();
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Renew Subscription for {member.firstName} {member.lastName}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="plan" className="text-right">
              Plan
            </Label>
            <div className="col-span-3">
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name} - {plan.price} DZD
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              End Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              readOnly
              className="col-span-3 bg-gray-100"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleRenew}
            className="bg-green-600 hover:bg-green-700"
          >
            Renew
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useRef } from "react";
import { localDate, renewalValues } from "../../../shared/subscriptionRules.js";
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
  onRenew: (data: any) => void | Promise<void>;
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
  const [startDate, setStartDate] = useState(localDate);
  const [price, setPrice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const selectedPlan = plans.find((plan) => String(plan.id) === selectedPlanId);
  const values = selectedPlan ? renewalValues(selectedPlan, startDate) : null;
  const endDate = values?.endDate || "";

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setStartDate(localDate());
    setSelectedPlanId("");
    setPrice("");
    window.api.plans.getAll().then((data) => {
      if (cancelled) return;
      const active = data.filter((plan: any) => plan.is_active);
      setPlans(active);
      setSelectedPlanId(active.some((plan: any) => String(plan.id) === currentPlanId) ? currentPlanId! : "");
    }).catch((error) => {
      if (!cancelled) {
        setPlans([]);
        alert("Failed to load plans. Close and reopen the renewal form.");
      }
      console.error("Failed to load plans", error);
    });
    return () => { cancelled = true; };
  }, [isOpen, currentPlanId, member?.id]);

  useEffect(() => {
    setPrice(selectedPlan ? String(selectedPlan.price) : "");
  }, [selectedPlan]);

  const handleRenew = async () => {
    if (savingRef.current) return;
    if (!selectedPlan || !values) {
      alert("Please select an active plan.");
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    try {
      await onRenew({
        planId: selectedPlan.id, ...values,
        pricePaid: price === "" ? null : Number(price),
        status: "ACTIVE", autoRenew: 0,
      });
      onClose();
    } catch {
      // Keep the form open when the parent reports a failure.
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => { if (!savingRef.current) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Renew Subscription for {member.firstName} {member.lastName}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500">Renewing immediately replaces the current subscription. Unused days and sessions do not carry over.</p>
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
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleRenew}
            disabled={isSaving || !selectedPlan}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? "Renewing..." : "Renew"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

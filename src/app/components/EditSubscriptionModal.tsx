import { useState, useEffect, useRef } from "react";
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

interface EditSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: any) => void | Promise<void>;
  subscription: any;
  plans?: any[]; // Optional if we want to allow changing plans, but for now let's focus on dates/status
}

export function EditSubscriptionModal({
  isOpen,
  onClose,
  onSave,
  subscription,
}: EditSubscriptionModalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [remainingSessions, setRemainingSessions] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    if (isOpen && subscription) {
      setStartDate(subscription.start_date || "");
      setEndDate(subscription.end_date || "");
      setPrice(
        subscription.price_paid?.toString() ?? "",
      );
      setStatus(subscription.status || "ACTIVE");
      setRemainingSessions(
        subscription.remaining_sessions?.toString() ?? "",
      );
    }
  }, [isOpen, subscription]);

  const handleSave = async () => {
    if (!subscription || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      await onSave(subscription.id, {
        memberId: subscription.member_id, planId: subscription.plan_id,
        startDate, endDate: endDate || null,
        pricePaid: price === "" ? null : Number(price), status,
        remainingSessions: remainingSessions === "" ? null : Number(remainingSessions),
        autoRenew: subscription.auto_renew,
      });
      onClose();
    } catch {
      // The parent displays the error; preserve the entered values for correction.
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  if (!subscription) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => { if (!savingRef.current) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="planName" className="text-right">
              Plan
            </Label>
            <Input
              id="planName"
              value={subscription.plan_name || ""}
              readOnly
              className="col-span-3 bg-gray-100"
            />
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
            <Label htmlFor="endDate" className="text-right">
              End Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
            <Label htmlFor="sessions" className="text-right">
              Sessions
            </Label>
            <Input
              id="sessions"
              type="number"
              min="0"
              step="1"
              placeholder="Unlimited"
              value={remainingSessions}
              onChange={(e) => setRemainingSessions(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <div className="col-span-3">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

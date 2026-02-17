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

interface EditSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: any) => void;
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

  useEffect(() => {
    if (isOpen && subscription) {
      setStartDate(subscription.start_date || "");
      setEndDate(subscription.end_date || "");
      setPrice(
        subscription.price_paid ? subscription.price_paid.toString() : "",
      );
      setStatus(subscription.status || "ACTIVE");
      setRemainingSessions(
        subscription.remaining_sessions
          ? subscription.remaining_sessions.toString()
          : "0",
      );
    }
  }, [isOpen, subscription]);

  const handleSave = () => {
    if (!subscription) return;

    onSave(subscription.id, {
      ...subscription, // Keep other fields like member_id, plan_id
      memberId: subscription.member_id, // Ensure these map correctly (DB expects camelCase params in repo update often, or repo handles mapping)
      planId: subscription.plan_id, // Repo update method uses @memberId, @planId from the object passed.
      startDate,
      endDate: endDate || null,
      pricePaid: price ? parseFloat(price) : 0,
      status,
      remainingSessions: remainingSessions ? parseInt(remainingSessions) : 0,
      autoRenew: subscription.auto_renew, // Keep existing auto-renew setting or add toggle if needed
    });
    onClose();
  };

  if (!subscription) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

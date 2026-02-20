import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Save } from "lucide-react";

interface Plan {
  id?: number;
  name: string;
  type: "TIME_BASED" | "SESSION_BASED";
  duration_days: number | null;
  session_count: number | null;
  price: number;
  is_active: number;
}

interface PlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Plan) => void;
  initialData?: Plan | null;
}

export function PlanForm({
  isOpen,
  onClose,
  onSave,
  initialData,
}: PlanFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"TIME_BASED" | "SESSION_BASED">(
    "TIME_BASED",
  );
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [sessionCount, setSessionCount] = useState("");
  const [isActive, setIsActive] = useState("1");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setPrice(initialData.price.toString());
      setDurationDays(
        initialData.duration_days ? initialData.duration_days.toString() : "",
      );
      setSessionCount(
        initialData.session_count ? initialData.session_count.toString() : "",
      );
      setIsActive(initialData.is_active.toString());
    } else {
      // Reset form for new plan
      setName("");
      setType("TIME_BASED");
      setPrice("");
      setDurationDays("");
      setSessionCount("");
      setIsActive("1");
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (!name || !price) {
      alert("Please fill in all required fields");
      return;
    }

    const days = parseInt(durationDays) || 0;
    const sessions = parseInt(sessionCount) || 0;

    if (days === 0 && sessions === 0) {
      alert("Please specify at least Duration OR Session count");
      return;
    }

    // Determine type for DB constraint (fallback to TIME_BASED if both or time only, SESSION_BASED if only sessions)
    // This allows the DB to accept the row, while we save both values.
    const calculatedType = days > 0 ? "TIME_BASED" : "SESSION_BASED";

    const planData: Plan = {
      id: initialData?.id,
      name,
      type: calculatedType,
      price: parseFloat(price),
      duration_days: days > 0 ? days : null,
      session_count: sessions > 0 ? sessions : null,
      is_active: parseInt(isActive),
    };

    onSave(planData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Plan" : "Add New Plan"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g. Monthly Gold"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price (DZD)
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Duration (Days)
            </Label>
            <Input
              id="duration"
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="col-span-3"
              placeholder="Optional if sessions are set"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sessions" className="text-right">
              Sessions
            </Label>
            <Input
              id="sessions"
              type="number"
              value={sessionCount}
              onChange={(e) => setSessionCount(e.target.value)}
              className="col-span-3"
              placeholder="Optional if duration is set"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={isActive} onValueChange={setIsActive}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

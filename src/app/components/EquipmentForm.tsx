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
import { Save, ImagePlus, X } from "lucide-react";

interface Equipment {
  id?: number;
  name: string;
  category: string;
  status: string;
  condition: string;
  quantity: number;
  purchase_date: string | null;
  notes: string | null;
  image_path: string | null;
}

interface EquipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipment: Equipment) => void;
  initialData?: Equipment | null;
}

export function EquipmentForm({
  isOpen,
  onClose,
  onSave,
  initialData,
}: EquipmentFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("CARDIO");
  const [status, setStatus] = useState("AVAILABLE");
  const [condition, setCondition] = useState("NEW");
  const [quantity, setQuantity] = useState("1");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [imagePath, setImagePath] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCategory(initialData.category);
      setStatus(initialData.status);
      setCondition(initialData.condition);
      setQuantity(initialData.quantity.toString());
      setPurchaseDate(initialData.purchase_date || "");
      setNotes(initialData.notes || "");
      setImagePath(initialData.image_path || null);
    } else {
      setName("");
      setCategory("CARDIO");
      setStatus("AVAILABLE");
      setCondition("NEW");
      setQuantity("1");
      setPurchaseDate("");
      setNotes("");
      setImagePath(null);
    }
  }, [initialData, isOpen]);

  const handlePickImage = async () => {
    try {
      const path = await (window as any).api.equipment.pickImage();
      if (path) {
        setImagePath(path);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const handleSave = () => {
    if (!name) {
      alert("Please enter an equipment name");
      return;
    }

    const equipmentData: Equipment = {
      id: initialData?.id,
      name,
      category,
      status,
      condition,
      quantity: parseInt(quantity) || 1,
      purchase_date: purchaseDate || null,
      notes: notes || null,
      image_path: imagePath,
    };

    onSave(equipmentData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Equipment" : "Add New Equipment"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Equipment Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="equip-name" className="text-right">
              Name
            </Label>
            <Input
              id="equip-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g. Treadmill Pro 5000"
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="equip-category" className="text-right">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CARDIO">Cardio</SelectItem>
                <SelectItem value="STRENGTH">Strength</SelectItem>
                <SelectItem value="FLEXIBILITY">Flexibility</SelectItem>
                <SelectItem value="FREE_WEIGHTS">Free Weights</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="equip-status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="IN_USE">In Use</SelectItem>
                <SelectItem value="MAINTENANCE">Under Maintenance</SelectItem>
                <SelectItem value="OUT_OF_ORDER">Out of Order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Condition */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="equip-condition" className="text-right">
              Condition
            </Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="GOOD">Good</SelectItem>
                <SelectItem value="FAIR">Fair</SelectItem>
                <SelectItem value="POOR">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="equip-quantity" className="text-right">
              Quantity
            </Label>
            <Input
              id="equip-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="col-span-3"
              placeholder="1"
            />
          </div>

          {/* Purchase Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="equip-date" className="text-right">
              Purchase Date
            </Label>
            <Input
              id="equip-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Notes */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="equip-notes" className="text-right">
              Notes
            </Label>
            <textarea
              id="equip-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3 flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Image */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right mt-2">Image</Label>
            <div className="col-span-3 space-y-2">
              {imagePath ? (
                <div className="relative inline-block">
                  <img
                    src={`file://${imagePath}`}
                    alt="Equipment"
                    className="w-full max-h-[150px] object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => setImagePath(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={handlePickImage}
                className="w-full"
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                {imagePath ? "Change Image" : "Choose Image (Optional)"}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Equipment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

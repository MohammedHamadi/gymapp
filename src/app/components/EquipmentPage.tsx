import { useState, useEffect } from "react";
import {
  Dumbbell,
  Edit,
  Trash2,
  Plus,
  Package,
  Wrench,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ImageOff,
  Search,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { EquipmentForm } from "./EquipmentForm";
import { ConfirmDialog } from "./ConfirmDialog";

const categoryLabels: Record<string, string> = {
  CARDIO: "Cardio",
  STRENGTH: "Strength",
  FLEXIBILITY: "Flexibility",
  FREE_WEIGHTS: "Free Weights",
  OTHER: "Other",
};

const categoryColors: Record<string, string> = {
  CARDIO: "bg-red-500",
  STRENGTH: "bg-blue-600",
  FLEXIBILITY: "bg-purple-500",
  FREE_WEIGHTS: "bg-amber-600",
  OTHER: "bg-gray-500",
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  AVAILABLE: { label: "Available", color: "bg-green-500", icon: CheckCircle },
  IN_USE: { label: "In Use", color: "bg-blue-500", icon: Package },
  MAINTENANCE: { label: "Maintenance", color: "bg-yellow-500", icon: Wrench },
  OUT_OF_ORDER: { label: "Out of Order", color: "bg-red-600", icon: XCircle },
};

const conditionConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: "New", color: "bg-emerald-500" },
  GOOD: { label: "Good", color: "bg-blue-500" },
  FAIR: { label: "Fair", color: "bg-yellow-500" },
  POOR: { label: "Poor", color: "bg-red-500" },
};

export function EquipmentPage() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "default";
  } | null>(null);

  const filteredEquipment = equipment.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchEquipment = async () => {
    try {
      const data = await (window as any).api.equipment.getAll();
      setEquipment(data);
    } catch (error) {
      console.error("Error fetching equipment:", error);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleAddClick = () => {
    setSelectedEquipment(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (item: any) => {
    setSelectedEquipment(item);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (id: number) => {
    setConfirmConfig({
      title: "Delete Equipment",
      message: "Are you sure you want to delete this equipment?",
      variant: "danger",
      onConfirm: async () => {
        try {
          await (window as any).api.equipment.delete(id);
          fetchEquipment();
        } catch (error) {
          console.error("Error deleting equipment:", error);
          alert("Failed to delete equipment");
        }
        setConfirmConfig(null);
      },
    });
  };

  const handleSaveEquipment = async (equipmentData: any) => {
    try {
      if (equipmentData.id) {
        await (window as any).api.equipment.update(equipmentData.id, equipmentData);
      } else {
        await (window as any).api.equipment.create(equipmentData);
      }
      fetchEquipment();
    } catch (error) {
      console.error("Error saving equipment:", error);
      alert("Failed to save equipment");
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-white text-2xl flex items-center gap-3">
            <Dumbbell className="w-8 h-8" />
            Equipment Management
          </h2>
          <Button
            onClick={handleAddClick}
            className="bg-white text-orange-700 hover:bg-orange-50"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Equipment
          </Button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search equipment by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-orange-400 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.map((item) => {
              const statusInfo = statusConfig[item.status] || statusConfig.AVAILABLE;
              const conditionInfo = conditionConfig[item.condition] || conditionConfig.NEW;
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={item.id}
                  className="border-2 border-blue-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
                >
                  {/* Equipment Image or Placeholder */}
                  {item.image_path ? (
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      <img
                        src={`file://${item.image_path}`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <ImageOff className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  {/* Equipment Header */}
                  <div
                    className={`${categoryColors[item.category] || "bg-gray-600"} px-4 py-3 flex justify-between items-center`}
                  >
                    <h3 className="text-white text-lg font-semibold truncate mr-2">
                      {item.name}
                    </h3>
                    <Badge className="bg-white/20 text-white border-0 whitespace-nowrap">
                      {categoryLabels[item.category] || item.category}
                    </Badge>
                  </div>

                  {/* Equipment Details */}
                  <div className="p-4 space-y-3 flex-1">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className={`${statusInfo.color} text-white text-xs`}>
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Condition */}
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Condition:</span>
                      <Badge className={`${conditionInfo.color} text-white text-xs`}>
                        {conditionInfo.label}
                      </Badge>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Quantity:</span>
                      <span className="text-sm font-semibold text-blue-900">
                        {item.quantity}
                      </span>
                    </div>

                    {/* Purchase Date */}
                    {item.purchase_date && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Purchased:</span>
                        <span className="text-sm text-blue-900">
                          {item.purchase_date}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600 italic">
                        {item.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                    <Button
                      onClick={() => handleEditClick(item)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(item.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}

            {filteredEquipment.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500">
                <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">
                  {searchQuery ? "No equipment matches your search." : "No equipment found."}
                </p>
                <p className="text-sm mt-1">
                  {searchQuery
                    ? "Try a different search term."
                    : 'Click "Add Equipment" to start managing your gym equipment!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <EquipmentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveEquipment}
        initialData={selectedEquipment}
      />
      <ConfirmDialog
        open={!!confirmConfig}
        title={confirmConfig?.title || ""}
        message={confirmConfig?.message || ""}
        onConfirm={confirmConfig?.onConfirm || (() => {})}
        onCancel={() => setConfirmConfig(null)}
        variant={confirmConfig?.variant}
      />
    </div>
  );
}

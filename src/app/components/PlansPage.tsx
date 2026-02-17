import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  Dumbbell,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { PlanForm } from "./PlanForm";

export function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const fetchPlans = async () => {
    try {
      const data = await window.api.plans.getAll();
      setPlans(data);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleAddClick = () => {
    setSelectedPlan(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (plan: any) => {
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (confirm("Are you sure you want to delete this plan?")) {
      try {
        await window.api.plans.delete(id);
        fetchPlans(); // Refresh list
      } catch (error) {
        console.error("Error deleting plan:", error);
        alert("Failed to delete plan");
      }
    }
  };

  const handleSavePlan = async (planData: any) => {
    try {
      if (planData.id) {
        await window.api.plans.update(planData.id, planData);
      } else {
        await window.api.plans.create(planData);
      }
      fetchPlans(); // Refresh list
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("Failed to save plan");
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-white text-2xl flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            Plans Management
          </h2>
          <Button
            onClick={handleAddClick}
            className="bg-white text-cyan-700 hover:bg-cyan-50"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Plan
          </Button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="border-2 border-blue-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
              >
                {/* Plan Header */}
                <div
                  className={`${plan.is_active ? "bg-blue-600" : "bg-gray-500"} px-4 py-3 flex justify-between items-center`}
                >
                  <h3 className="text-white text-lg font-semibold">
                    {plan.name}
                  </h3>
                  <Badge
                    className={plan.is_active ? "bg-green-500" : "bg-gray-400"}
                  >
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {/* Plan Details */}
                <div className="p-4 space-y-4 flex-1">
                  <div className="flex items-center gap-2 text-blue-900">
                    <Dumbbell className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">
                      {plan.duration_days && plan.session_count
                        ? "Hybrid (Time & Sessions)"
                        : plan.duration_days
                          ? "Time Based"
                          : "Session Based"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-blue-900">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div className="flex flex-col">
                      {plan.duration_days && (
                        <span>{plan.duration_days} Days</span>
                      )}
                      {plan.session_count && (
                        <span>{plan.session_count} Sessions</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-blue-900">
                    <span className="text-2xl font-bold text-blue-700">
                      {plan.price.toLocaleString()} DZD
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                  <Button
                    onClick={() => handleEditClick(plan)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(plan.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            {plans.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500">
                <p>No plans found. Create your first plan to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PlanForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSavePlan}
        initialData={selectedPlan}
      />
    </div>
  );
}

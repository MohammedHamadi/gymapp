import {
  UserPlus,
  Edit,
  Trash2,
  Printer,
  History,
  ToggleLeft,
  RefreshCw,
  RotateCw,
} from "lucide-react";
import { Button } from "./ui/button";

interface ActionButtonsProps {
  onNewMember: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPrintTicket: () => void;
  onViewHistory: () => void;
  onToggleStatus: () => void;
  onRenew: () => void;
  onRefresh: () => void;
}

const actionButtons = [
  {
    icon: UserPlus,
    label: "New Member",
    color: "bg-green-600 hover:bg-green-700",
    action: "newMember",
  },
  {
    icon: Edit,
    label: "Edit",
    color: "bg-blue-600 hover:bg-blue-700",
    action: "edit",
  },
  {
    icon: Trash2,
    label: "Delete",
    color: "bg-red-600 hover:bg-red-700",
    action: "delete",
  },
  {
    icon: Printer,
    label: "Print Ticket",
    color: "bg-purple-600 hover:bg-purple-700",
    action: "printTicket",
  },
  {
    icon: History,
    label: "Subscription History",
    color: "bg-orange-600 hover:bg-orange-700",
    action: "viewHistory",
  },
  {
    icon: ToggleLeft,
    label: "Activate/Deactivate",
    color: "bg-yellow-600 hover:bg-yellow-700",
    action: "toggleStatus",
  },
  {
    icon: RefreshCw,
    label: "Refresh",
    color: "bg-gray-600 hover:bg-gray-700",
    action: "refresh",
  },
  {
    icon: RotateCw,
    label: "Renew",
    color: "bg-teal-600 hover:bg-teal-700",
    action: "renew",
  },
];

export function ActionButtons({
  onNewMember,
  onEdit,
  onDelete,
  onPrintTicket,
  onViewHistory,
  onToggleStatus,
  onRenew,
  onRefresh,
}: ActionButtonsProps) {
  const handleClick = (action: string) => {
    switch (action) {
      case "newMember":
        onNewMember();
        break;
      case "edit":
        onEdit();
        break;
      case "delete":
        onDelete();
        break;
      case "printTicket":
        onPrintTicket();
        break;
      case "viewHistory":
        onViewHistory();
        break;
      case "toggleStatus":
        onToggleStatus();
        break;
      case "refresh":
        onRefresh();
        break;
      case "renew":
        onRenew();
        break;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6 border-2 border-blue-200">
      <div className="flex flex-wrap gap-3 justify-center">
        {actionButtons.map((action, index) => (
          <Button
            key={index}
            onClick={() => handleClick(action.action)}
            className={`${action.color} text-white flex items-center gap-2 px-6 py-5 shadow-md`}
          >
            <action.icon className="w-5 h-5" />
            <span>{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

import {
  Users,
  CreditCard,
  DoorOpen,
  DollarSign,
  Settings,
  FileText,
  BookOpen,
  Calendar,
  RefreshCw,
  X,
} from "lucide-react";

interface TopNavigationProps {
  onNavigate: (page: string) => void;
}

const navigationItems = [
  {
    icon: Users,
    label: "Subscribers",
    color: "bg-green-600",
    action: "subscribers",
  },
  {
    icon: CreditCard,
    label: "Subscriptions",
    color: "bg-blue-600",
    action: "subscriptions",
  },
  {
    icon: DoorOpen,
    label: "Access Control",
    color: "bg-teal-600",
    action: "access",
  },
  { icon: DollarSign, label: "Sales", color: "bg-gray-600", action: "sales" },
  {
    icon: Settings,
    label: "Settings",
    color: "bg-orange-600",
    action: "settings",
  },
  {
    icon: FileText,
    label: "Reports",
    color: "bg-purple-600",
    action: "reports",
  },
  { icon: BookOpen, label: "Journal", color: "bg-blue-500", action: "journal" },
  { icon: Calendar, label: "Plans", color: "bg-cyan-600", action: "plans" },
  {
    icon: RefreshCw,
    label: "Refresh",
    color: "bg-indigo-600",
    action: "refresh",
  },
  { icon: X, label: "Exit", color: "bg-red-600", action: "exit" },
];

export function TopNavigation({ onNavigate }: TopNavigationProps) {
  return (
    <div className="bg-gradient-to-r from-blue-700 to-blue-900 shadow-lg">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          {navigationItems.map((item, index) => (
            <button
              key={index}
              onClick={() => onNavigate(item.action)}
              className="flex flex-col items-center justify-center gap-1.5 px-4 py-2 rounded-lg hover:bg-blue-600/50 transition-all duration-200 group"
            >
              <div
                className={`${item.color} p-2.5 rounded-lg shadow-md group-hover:scale-110 transition-transform`}
              >
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

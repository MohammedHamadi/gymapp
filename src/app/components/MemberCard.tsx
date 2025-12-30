import { X } from "lucide-react";
import { Button } from "./ui/button";
const profileImage =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop";

interface MemberCardProps {
  memberData: {
    id: string;
    qrCode: string;
    firstName: string;
    lastName: string;
    phone: string;
    startDate: string;
    endDate: string;
  };
  onClose: () => void;
}

export function MemberCard({ memberData, onClose }: MemberCardProps) {
  const gymLogoUrl =
    "https://images.unsplash.com/photo-1711623350090-4f98efcb5acc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBsb2dvJTIwZml0bmVzc3xlbnwxfHx8fDE3NjY4NjA4MjF8MA&ixlib=rb-4.1.0&q=80&w=1080";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-900">
            Member Card Generated
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Member Card */}
        <div
          id="memberCard"
          className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 shadow-xl text-white mb-6"
        >
          {/* Header with Logo */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-white/30">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white rounded-full overflow-hidden">
                <img
                  src={gymLogoUrl}
                  alt="Gym Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">FITNESS GYM</h3>
                <p className="text-sm text-blue-100">Member Card</p>
              </div>
            </div>
          </div>

          {/* Member Info */}
          <div className="grid grid-cols-3 gap-6">
            {/* Photo */}
            <div className="col-span-1">
              <div className="w-32 h-32 bg-white rounded-lg overflow-hidden border-4 border-white/50">
                <img
                  src={profileImage}
                  alt="Member"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Details */}
            <div className="col-span-2 space-y-3">
              <div>
                <p className="text-xs text-blue-100 uppercase">Full Name</p>
                <p className="text-xl font-bold">
                  {memberData.firstName} {memberData.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-100 uppercase">Phone Number</p>
                <p className="font-semibold">{memberData.phone}</p>
              </div>
              <div>
                <p className="text-xs text-blue-100 uppercase">Valid From</p>
                <p className="font-semibold">{memberData.startDate}</p>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="mt-6 pt-4 border-t-2 border-white/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-100 uppercase mb-1">QR Code</p>
              <p className="font-mono text-sm">{memberData.qrCode}</p>
            </div>
            <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            Close
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Print Card
          </Button>
        </div>
      </div>
    </div>
  );
}

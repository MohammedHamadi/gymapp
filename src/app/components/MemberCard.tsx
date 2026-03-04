import Barcode from "react-barcode";
import { X } from "lucide-react";
import { Button } from "./ui/button";

// Placeholder if no photo is available
const defaultProfileImage =
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
    photo?: any;
  };
  onClose: () => void;
}

export function MemberCard({ memberData, onClose }: MemberCardProps) {
  const gymLogoUrl =
    "https://images.unsplash.com/photo-1711623350090-4f98efcb5acc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBsb2dvJTIwZml0bmVzc3xlbnwxfHx8fDE3NjY4NjA4MjF8MA&ixlib=rb-4.1.0&q=80&w=1080";

  const handlePrint = () => {
    window.print();
  };

  const getProfileImage = () => {
    if (memberData.photo) {
      if (typeof memberData.photo === "string") {
        return memberData.photo; // already base64 or url
      }
      // If it's a Buffer/Uint8Array from SQLite
      const base64 = btoa(
        new Uint8Array(memberData.photo).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );
      return `data:image/jpeg;base64,${base64}`;
    }
    return defaultProfileImage;
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

        {/* --- MODIFIED MEMBER CARD --- */}
        <div
          id="memberCard"
          className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-200 text-gray-900 mb-6"
        >
          {/* Header with Logo */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <img
                  src={gymLogoUrl}
                  alt="Gym Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-900">CROSSTENIX</h3>
                <p className="text-sm text-gray-500 font-medium">Member Card</p>
              </div>
            </div>
          </div>

          {/* Member Info */}
          <div className="grid grid-cols-3 gap-6">
            {/* Photo */}
            <div className="col-span-1">
              <div className="w-32 h-32 bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                <img
                  src={getProfileImage()}
                  alt="Member"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Details */}
            <div className="col-span-2 space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Full Name</p>
                <p className="text-xl font-bold text-blue-900">
                  {memberData.firstName} {memberData.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Phone Number</p>
                <p className="font-semibold text-gray-800">{memberData.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Valid From</p>
                <p className="font-semibold text-gray-800">{memberData.startDate}</p>
              </div>
            </div>
          </div>

          {/* QR Code Section (Dark Box Removed) */}
          <div className="mt-6 pt-4 border-t-2 border-gray-100 flex items-center justify-between">
            <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
              <Barcode
                value={memberData.id}
                format="CODE128"
                width={1.5}
                height={60}
                fontSize={14}
                displayValue={false}
              />
            </div>
            
            {/* The dark square code that used to be right here is completely gone! */}

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
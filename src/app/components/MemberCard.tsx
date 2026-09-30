import Barcode from "react-barcode";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import gymLogoUrl from "../../assets/photo_2026-04-30_12-33-00.jpg";

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
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-blue-900">
            Member Card Generated
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* --- STANDARD CR80 / ID-1 CARD (85.6mm x 54mm) --- */}
        <div className="flex justify-center mb-6">
          <div
            id="memberCard"
            style={{
              width: "85.6mm",
              height: "54mm",
              borderRadius: "3.18mm",
              padding: "3mm 3.5mm",
              boxSizing: "border-box",
            }}
            className="bg-white shadow-xl border border-gray-300 text-gray-900 flex flex-col justify-between overflow-hidden"
          >
            {/* Header with Logo */}
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shrink-0">
                  <img
                    src={gymLogoUrl}
                    alt="Gym Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="leading-none">
                  <h3 className="text-xs font-extrabold text-blue-900 tracking-wide">
                    CROSSTENIX
                  </h3>
                  <p className="text-[9px] text-gray-500 font-medium">
                    Member Card
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono font-semibold text-gray-500">
                {memberData.id}
              </span>
            </div>

            {/* Member Info */}
            <div className="flex items-center gap-3 my-1">
              {/* Photo */}
              <div className="w-16 h-16 bg-gray-50 rounded-md overflow-hidden border border-gray-200 shadow-xs shrink-0">
                <img
                  src={getProfileImage()}
                  alt="Member"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div>
                  <p className="text-[7px] text-gray-500 font-bold uppercase tracking-wider leading-none">
                    Full Name
                  </p>
                  <p className="text-xs font-bold text-blue-900 truncate leading-tight">
                    {memberData.firstName} {memberData.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-[7px] text-gray-500 font-bold uppercase tracking-wider leading-none">
                    Phone Number
                  </p>
                  <p className="text-[10px] font-semibold text-gray-800 truncate leading-tight">
                    {memberData.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Barcode Section */}
            <div className="pt-1 border-t border-gray-200 flex items-center justify-center">
              <div className="bg-white px-2 py-0.5 rounded border border-gray-200 flex items-center justify-center">
                <Barcode
                  value={memberData.id}
                  format="CODE128"
                  width={1.2}
                  height={24}
                  margin={0}
                  displayValue={false}
                />
              </div>
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
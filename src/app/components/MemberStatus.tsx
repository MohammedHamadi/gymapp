import { CheckCircle2 } from "lucide-react";
const profileImage =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop";

interface MemberStatusProps {
  selectedMember?: any;
}

export function MemberStatus({ selectedMember }: MemberStatusProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200 h-full flex flex-col items-center justify-center">
      {/* Profile Photo */}
      <div className="mb-6">
        <div className="w-48 h-48 bg-gray-200 rounded-lg overflow-hidden border-4 border-blue-300 shadow-md">
          <img
            src={profileImage}
            alt="Member profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Access Badge */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-xl mb-6 w-full">
        <div className="flex items-center justify-center gap-3">
          <CheckCircle2 className="w-10 h-10 text-white" />
          <div className="text-center">
            <div className="text-white text-2xl font-bold">ACCESS</div>
            <div className="text-white text-2xl font-bold">AUTHORIZED</div>
          </div>
        </div>
      </div>

      {/* Session Counter */}
      <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300 w-full">
        <div className="text-center">
          <div className="text-blue-900 mb-1">Sessions</div>
          <div className="flex items-center justify-center gap-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg">
              -
            </button>
            <span className="text-2xl font-bold text-blue-900 min-w-[60px]">
              5
            </span>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg">
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

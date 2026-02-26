"use client";
import { CheckCircle2, Upload } from 'lucide-react';
import { useState } from 'react';
const profileImage =
   "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop";

interface MemberStatusProps {
  selectedMember?: any;
}

export function MemberStatus({ selectedMember }: MemberStatusProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  <img 
  src={selectedImage || profileImage} 
  alt="Profile" 
  className="w-32 h-32 rounded-full"
/>

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200 h-full flex flex-col items-center justify-center">
      {/* Profile Photo */}
      <div className="mb-6 relative group">
        <div className="w-48 h-48 bg-gray-200 rounded-lg overflow-hidden border-4 border-blue-300 shadow-md relative">
          <img 
            src={selectedImage || profileImage} 
            alt="Member profile" 
            className="w-full h-full object-cover"
          />
          {/* Upload overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <label htmlFor="profile-image-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-white" />
              <span className="text-white text-sm font-medium">Upload Photo</span>
            </label>
          </div>
          <input
            id="profile-image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
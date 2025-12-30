import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Save } from 'lucide-react';

const weekdays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface MemberFormProps {
  selectedMember?: any;
  onSave?: (data: any) => void;
}

export function MemberForm({ selectedMember, onSave }: MemberFormProps) {
  const [startDate, setStartDate] = useState(getTodayDate());
  const [durationDays, setDurationDays] = useState('');
  const [endDate, setEndDate] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Auto-generate member ID and QR code
  const generateMemberID = () => {
    return `GYM${Date.now().toString().slice(-8)}`;
  };

  const generateQRCode = () => {
    return `QR${Date.now().toString().slice(-10)}`;
  };

  // Get today's date in YYYY-MM-DD format
  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Calculate end date based on start date and duration
  const calculateEndDate = (start: string, days: number) => {
    if (!start || !days) return '';
    const startDateObj = new Date(start);
    startDateObj.setDate(startDateObj.getDate() + days);
    const year = startDateObj.getFullYear();
    const month = String(startDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(startDateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle duration change
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = e.target.value;
    setDurationDays(days);
    if (days && parseInt(days) > 0) {
      const calculatedEndDate = calculateEndDate(startDate, parseInt(days));
      setEndDate(calculatedEndDate);
    } else {
      setEndDate('');
    }
  };

  // Handle start date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (durationDays && parseInt(durationDays) > 0) {
      const calculatedEndDate = calculateEndDate(newStartDate, parseInt(durationDays));
      setEndDate(calculatedEndDate);
    }
  };

  // Handle save
  const handleSave = () => {
    if (!firstName || !lastName || !phone) {
      alert('Please fill in all required fields');
      return;
    }

    const memberData = {
      id: generateMemberID(),
      qrCode: generateQRCode(),
      firstName,
      lastName,
      phone,
      startDate,
      endDate,
    };

    if (onSave) {
      onSave(memberData);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
      <h2 className="mb-6 text-blue-800 font-semibold">Member Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="subscriptionId" className="text-blue-900 mb-2">Subscription ID (Auto-generated)</Label>
            <Input 
              id="subscriptionId" 
              placeholder="Auto-generated on save" 
              className="border-blue-300 bg-gray-50"
              readOnly
              value={selectedMember?.id || ''}
            />
          </div>
          
          <div>
            <Label htmlFor="firstName" className="text-blue-900 mb-2">First Name *</Label>
            <Input 
              id="firstName" 
              placeholder="Enter first name" 
              className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="lastName" className="text-blue-900 mb-2">Last Name *</Label>
            <Input 
              id="lastName" 
              placeholder="Enter last name" 
              className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="phone" className="text-blue-900 mb-2">Phone Number *</Label>
            <Input 
              id="phone" 
              placeholder="Enter phone number" 
              className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="barcode" className="text-blue-900 mb-2">QR Code (Auto-generated)</Label>
            <Input 
              id="barcode" 
              placeholder="Auto-generated on save" 
              className="border-blue-300 bg-gray-50"
              readOnly
              value={selectedMember?.qrCode || ''}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="startDate" className="text-blue-900 mb-2">Subscription Start Date</Label>
            <Input 
              id="startDate" 
              type="date" 
              className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              value={startDate}
              onChange={handleStartDateChange}
            />
          </div>
          
          <div>
            <Label htmlFor="durationDays" className="text-blue-900 mb-2">Duration (Days)</Label>
            <Input 
              id="durationDays" 
              type="number" 
              placeholder="Enter number of days (e.g., 30, 90, 365)"
              className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              value={durationDays}
              onChange={handleDurationChange}
              min="1"
            />
          </div>
          
          <div>
            <Label htmlFor="endDate" className="text-blue-900 mb-2">Subscription Expiration Date (Auto-calculated)</Label>
            <Input 
              id="endDate" 
              type="date" 
              className="border-blue-300 bg-gray-50"
              value={endDate}
              readOnly
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="remainingSessions" className="text-blue-900 mb-2">Remaining Sessions</Label>
              <Input 
                id="remainingSessions" 
                type="number" 
                placeholder="0"
                className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="totalSessions" className="text-blue-900 mb-2">Total Sessions</Label>
              <Input 
                id="totalSessions" 
                type="number" 
                placeholder="0"
                className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button 
              onClick={handleSave}
              className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save & Generate Card
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
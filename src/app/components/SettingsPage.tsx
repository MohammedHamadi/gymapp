import { Building2, DollarSign, Clock, Users } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

export function SettingsPage() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 -m-6 mb-6 px-6 py-4 rounded-t-lg">
          <h2 className="text-white text-2xl flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            Gym Settings
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gym Information */}
          <div className="space-y-4">
            <h3 className="text-xl text-blue-900 border-b-2 border-blue-200 pb-2 mb-4">Gym Information</h3>
            
            <div>
              <Label htmlFor="gymName">Gym Name</Label>
              <Input 
                id="gymName" 
                defaultValue="FITNESS GYM" 
                className="border-blue-300 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="gymAddress">Address</Label>
              <Input 
                id="gymAddress" 
                defaultValue="123 Main Street, Algiers" 
                className="border-blue-300 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="gymPhone">Phone Number</Label>
              <Input 
                id="gymPhone" 
                defaultValue="+213 555 000 000" 
                className="border-blue-300 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="gymEmail">Email</Label>
              <Input 
                id="gymEmail" 
                type="email"
                defaultValue="info@fitnessgym.dz" 
                className="border-blue-300 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Subscription Settings */}
          <div className="space-y-4">
            <h3 className="text-xl text-blue-900 border-b-2 border-blue-200 pb-2 mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Subscription Plans
            </h3>

            <div>
              <Label htmlFor="monthlyPrice">Monthly Subscription (DZD)</Label>
              <Input 
                id="monthlyPrice" 
                type="number"
                defaultValue="3000" 
                className="border-blue-300 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="quarterlyPrice">Quarterly Subscription (DZD)</Label>
              <Input 
                id="quarterlyPrice" 
                type="number"
                defaultValue="8000" 
                className="border-blue-300 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="annualPrice">Annual Subscription (DZD)</Label>
              <Input 
                id="annualPrice" 
                type="number"
                defaultValue="28000" 
                className="border-blue-300 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="sessionPrice">Single Session (DZD)</Label>
              <Input 
                id="sessionPrice" 
                type="number"
                defaultValue="300" 
                className="border-blue-300 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h3 className="text-xl text-blue-900 border-b-2 border-blue-200 pb-2 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Operating Hours
            </h3>

            <div>
              <Label htmlFor="openTime">Opening Time</Label>
              <Input 
                id="openTime" 
                type="time"
                defaultValue="06:00" 
                className="border-blue-300 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="closeTime">Closing Time</Label>
              <Input 
                id="closeTime" 
                type="time"
                defaultValue="22:00" 
                className="border-blue-300 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="maxCapacity">Maximum Capacity</Label>
              <Input 
                id="maxCapacity" 
                type="number"
                defaultValue="50" 
                className="border-blue-300 focus:border-blue-500"
              />
            </div>
          </div>

          {/* System Settings */}
          <div className="space-y-4">
            <h3 className="text-xl text-blue-900 border-b-2 border-blue-200 pb-2 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              System Settings
            </h3>

            <div>
              <Label htmlFor="idPrefix">Member ID Prefix</Label>
              <Input 
                id="idPrefix" 
                defaultValue="GYM" 
                className="border-blue-300 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="warningDays">Expiry Warning (Days)</Label>
              <Input 
                id="warningDays" 
                type="number"
                defaultValue="7" 
                className="border-blue-300 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input 
                id="currency" 
                defaultValue="DZD" 
                disabled
                className="border-blue-300 bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end gap-4">
          <Button className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3">
            Reset
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

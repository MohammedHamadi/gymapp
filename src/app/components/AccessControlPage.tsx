import { DoorOpen, UserCheck, UserX, Clock, QrCode, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useState } from 'react';

export function AccessControlPage() {
  const [checkInMode, setCheckInMode] = useState(true);

  const todayAccessLog = [
    { 
      id: 1, 
      time: '06:15 AM', 
      member: 'Ahmed BENALI', 
      memberId: 'GYM00001234', 
      type: 'Check-In', 
      status: 'Active',
      sessionsRemaining: 45 
    },
    { 
      id: 2, 
      time: '06:30 AM', 
      member: 'Yasmine DJAMEL', 
      memberId: 'GYM00002345', 
      type: 'Check-Out', 
      status: 'Active',
      sessionsRemaining: 32 
    },
    { 
      id: 3, 
      time: '07:00 AM', 
      member: 'Karim LARBI', 
      memberId: 'GYM00003456', 
      type: 'Check-In', 
      status: 'Active',
      sessionsRemaining: 18 
    },
    { 
      id: 4, 
      time: '07:45 AM', 
      member: 'Mohamed SALAH', 
      memberId: 'GYM00004567', 
      type: 'Check-In', 
      status: 'Expired',
      sessionsRemaining: 0 
    },
    { 
      id: 5, 
      time: '08:00 AM', 
      member: 'Fatima OMAR', 
      memberId: 'GYM00005678', 
      type: 'Check-In', 
      status: 'Active',
      sessionsRemaining: 25 
    },
  ];

  const currentlyInside = [
    { name: 'Ahmed BENALI', memberId: 'GYM00001234', checkInTime: '06:15 AM', duration: '2h 15m' },
    { name: 'Karim LARBI', memberId: 'GYM00003456', checkInTime: '07:00 AM', duration: '1h 30m' },
    { name: 'Fatima OMAR', memberId: 'GYM00005678', checkInTime: '08:00 AM', duration: '30m' },
    { name: 'Ali HASSAN', memberId: 'GYM00006789', checkInTime: '07:30 AM', duration: '1h' },
  ];

  const stats = [
    { label: 'Currently Inside', value: currentlyInside.length, icon: UserCheck, color: 'bg-green-600' },
    { label: 'Total Check-ins Today', value: '47', icon: DoorOpen, color: 'bg-blue-600' },
    { label: 'Average Duration', value: '1.5h', icon: Clock, color: 'bg-purple-600' },
    { label: 'Access Denied Today', value: '3', icon: UserX, color: 'bg-red-600' },
  ];

  const handleScan = () => {
    // Simulate QR code scan
    const randomMember = todayAccessLog[Math.floor(Math.random() * todayAccessLog.length)];
    if (randomMember.status === 'Active') {
      alert(`✅ Access Granted!\n\nMember: ${randomMember.member}\nID: ${randomMember.memberId}\nSessions Remaining: ${randomMember.sessionsRemaining}\n\n${checkInMode ? 'Checked In' : 'Checked Out'} successfully!`);
    } else {
      alert(`❌ Access Denied!\n\nMember: ${randomMember.member}\nID: ${randomMember.memberId}\nReason: Subscription Expired\n\nPlease renew subscription.`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-3xl text-blue-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-4 rounded-lg`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-In/Out Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 sticky top-6">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 rounded-t-lg">
              <h3 className="text-white text-xl flex items-center gap-2">
                <DoorOpen className="w-6 h-6" />
                Access Control
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Mode Selection */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => setCheckInMode(true)}
                  className={`flex-1 ${checkInMode ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'} text-white`}
                >
                  <UserCheck className="w-5 h-5 mr-2" />
                  Check-In
                </Button>
                <Button 
                  onClick={() => setCheckInMode(false)}
                  className={`flex-1 ${!checkInMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-400 hover:bg-gray-500'} text-white`}
                >
                  <UserX className="w-5 h-5 mr-2" />
                  Check-Out
                </Button>
              </div>

              {/* QR Scanner */}
              <div className="border-4 border-dashed border-blue-300 rounded-lg p-8 bg-blue-50">
                <div className="flex flex-col items-center justify-center gap-4">
                  <QrCode className="w-24 h-24 text-blue-600" />
                  <p className="text-blue-900 text-center">
                    Scan Member QR Code
                  </p>
                  <Button 
                    onClick={handleScan}
                    className="bg-teal-600 hover:bg-teal-700 text-white w-full"
                  >
                    Simulate Scan
                  </Button>
                </div>
              </div>

              {/* Manual Entry */}
              <div className="space-y-3">
                <p className="text-blue-900 text-center">Or enter manually:</p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Member ID or Phone" 
                    className="border-blue-300"
                  />
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Search className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Current Status Display */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
                <div className="text-center">
                  <p className="text-sm text-blue-100">Current Mode</p>
                  <p className="text-2xl mt-1">
                    {checkInMode ? 'CHECK-IN' : 'CHECK-OUT'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Access Logs & Currently Inside */}
        <div className="lg:col-span-2 space-y-6">
          {/* Currently Inside */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 rounded-t-lg">
              <h3 className="text-white text-xl flex items-center gap-2">
                <UserCheck className="w-6 h-6" />
                Currently Inside ({currentlyInside.length})
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentlyInside.map((member, index) => (
                  <div key={index} className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-blue-900">{member.name}</h4>
                      <Badge className="bg-green-600">{member.duration}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">ID: {member.memberId}</p>
                    <p className="text-sm text-gray-600">In at: {member.checkInTime}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Access Log */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 rounded-t-lg flex items-center justify-between">
              <h3 className="text-white text-xl">Today's Access Log</h3>
              <Button className="bg-white text-blue-700 hover:bg-blue-50 text-sm">
                Export Log
              </Button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-blue-200">
                      <th className="text-left py-2 text-blue-900">Time</th>
                      <th className="text-left py-2 text-blue-900">Member</th>
                      <th className="text-left py-2 text-blue-900">Member ID</th>
                      <th className="text-center py-2 text-blue-900">Type</th>
                      <th className="text-center py-2 text-blue-900">Status</th>
                      <th className="text-right py-2 text-blue-900">Sessions Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAccessLog.map((log) => (
                      <tr key={log.id} className="border-b border-blue-100 hover:bg-blue-50">
                        <td className="py-3 text-blue-900">{log.time}</td>
                        <td className="py-3 text-blue-900">{log.member}</td>
                        <td className="py-3 text-blue-900">{log.memberId}</td>
                        <td className="py-3 text-center">
                          <Badge className={log.type === 'Check-In' ? 'bg-green-600' : 'bg-orange-600'}>
                            {log.type}
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          <Badge className={log.status === 'Active' ? 'bg-blue-600' : 'bg-red-600'}>
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-blue-900 text-right">{log.sessionsRemaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

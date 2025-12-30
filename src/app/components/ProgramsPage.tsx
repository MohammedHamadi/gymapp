import { Calendar, Clock, Users, Dumbbell } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function ProgramsPage() {
  const programs = [
    {
      name: 'Morning Strength Training',
      instructor: 'Coach Ahmed',
      time: '06:00 - 07:30',
      days: ['Monday', 'Wednesday', 'Friday'],
      capacity: 15,
      enrolled: 12,
      level: 'Intermediate',
      color: 'bg-blue-600'
    },
    {
      name: 'Cardio Blast',
      instructor: 'Coach Yasmine',
      time: '08:00 - 09:00',
      days: ['Tuesday', 'Thursday', 'Saturday'],
      capacity: 20,
      enrolled: 18,
      level: 'All Levels',
      color: 'bg-green-600'
    },
    {
      name: 'CrossFit Challenge',
      instructor: 'Coach Karim',
      time: '17:00 - 18:30',
      days: ['Monday', 'Tuesday', 'Thursday'],
      capacity: 12,
      enrolled: 12,
      level: 'Advanced',
      color: 'bg-red-600'
    },
    {
      name: 'Yoga & Flexibility',
      instructor: 'Coach Fatima',
      time: '09:00 - 10:00',
      days: ['Monday', 'Wednesday', 'Friday'],
      capacity: 15,
      enrolled: 10,
      level: 'Beginner',
      color: 'bg-purple-600'
    },
    {
      name: 'Evening HIIT',
      instructor: 'Coach Mohamed',
      time: '18:30 - 19:30',
      days: ['Tuesday', 'Thursday', 'Saturday'],
      capacity: 18,
      enrolled: 15,
      level: 'Intermediate',
      color: 'bg-orange-600'
    },
    {
      name: 'Weekend Warriors',
      instructor: 'Coach Ahmed',
      time: '10:00 - 12:00',
      days: ['Saturday', 'Sunday'],
      capacity: 20,
      enrolled: 16,
      level: 'All Levels',
      color: 'bg-cyan-600'
    },
  ];

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200">
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-white text-2xl flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            Training Programs
          </h2>
          <Button className="bg-white text-cyan-700 hover:bg-cyan-50">
            <Dumbbell className="w-5 h-5 mr-2" />
            Add New Program
          </Button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program, index) => (
              <div 
                key={index} 
                className="border-2 border-blue-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Program Header */}
                <div className={`${program.color} px-4 py-3`}>
                  <h3 className="text-white text-lg">{program.name}</h3>
                  <p className="text-white/90 text-sm">{program.instructor}</p>
                </div>

                {/* Program Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span>{program.time}</span>
                  </div>

                  <div className="flex items-center gap-2 text-blue-900">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">{program.days.join(', ')}</span>
                  </div>

                  <div className="flex items-center gap-2 text-blue-900">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>
                      {program.enrolled}/{program.capacity} enrolled
                    </span>
                  </div>

                  <div className="pt-2">
                    <Badge 
                      className={
                        program.level === 'Beginner' ? 'bg-green-600' :
                        program.level === 'Intermediate' ? 'bg-yellow-600' :
                        program.level === 'Advanced' ? 'bg-red-600' :
                        'bg-blue-600'
                      }
                    >
                      {program.level}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="pt-2">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`${program.color} h-2.5 rounded-full`}
                        style={{ width: `${(program.enrolled / program.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3">
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      disabled={program.enrolled >= program.capacity}
                    >
                      {program.enrolled >= program.capacity ? 'Full' : 'Enroll'}
                    </Button>
                    <Button className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="mt-6 bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6">
        <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Weekly Schedule
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-blue-200">
                <th className="text-left py-3 px-4 text-blue-900">Time</th>
                <th className="text-center py-3 px-4 text-blue-900">Monday</th>
                <th className="text-center py-3 px-4 text-blue-900">Tuesday</th>
                <th className="text-center py-3 px-4 text-blue-900">Wednesday</th>
                <th className="text-center py-3 px-4 text-blue-900">Thursday</th>
                <th className="text-center py-3 px-4 text-blue-900">Friday</th>
                <th className="text-center py-3 px-4 text-blue-900">Saturday</th>
                <th className="text-center py-3 px-4 text-blue-900">Sunday</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-blue-100">
                <td className="py-3 px-4 text-blue-900">06:00 - 07:30</td>
                <td className="py-3 px-4 text-center"><span className="bg-blue-100 text-blue-900 px-2 py-1 rounded text-sm">Strength</span></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-center"><span className="bg-blue-100 text-blue-900 px-2 py-1 rounded text-sm">Strength</span></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-center"><span className="bg-blue-100 text-blue-900 px-2 py-1 rounded text-sm">Strength</span></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="py-3 px-4 text-blue-900">08:00 - 09:00</td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-center"><span className="bg-green-100 text-green-900 px-2 py-1 rounded text-sm">Cardio</span></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-center"><span className="bg-green-100 text-green-900 px-2 py-1 rounded text-sm">Cardio</span></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-center"><span className="bg-green-100 text-green-900 px-2 py-1 rounded text-sm">Cardio</span></td>
                <td className="py-3 px-4"></td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="py-3 px-4 text-blue-900">09:00 - 10:00</td>
                <td className="py-3 px-4 text-center"><span className="bg-purple-100 text-purple-900 px-2 py-1 rounded text-sm">Yoga</span></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-center"><span className="bg-purple-100 text-purple-900 px-2 py-1 rounded text-sm">Yoga</span></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-center"><span className="bg-purple-100 text-purple-900 px-2 py-1 rounded text-sm">Yoga</span></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="py-3 px-4 text-blue-900">10:00 - 12:00</td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-center"><span className="bg-cyan-100 text-cyan-900 px-2 py-1 rounded text-sm">Warriors</span></td>
                <td className="py-3 px-4 text-center"><span className="bg-cyan-100 text-cyan-900 px-2 py-1 rounded text-sm">Warriors</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

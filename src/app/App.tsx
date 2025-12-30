import { useState } from 'react';
import { TopNavigation } from './components/TopNavigation';
import { MemberForm } from './components/MemberForm';
import { MemberStatus } from './components/MemberStatus';
import { ActionButtons } from './components/ActionButtons';
import { MembersTable } from './components/MembersTable';
import { MemberCard } from './components/MemberCard';
import { SettingsPage } from './components/SettingsPage';
import { ReportsPage } from './components/ReportsPage';
import { ProgramsPage } from './components/ProgramsPage';
import { SalesPage } from './components/SalesPage';
import { AccessControlPage } from './components/AccessControlPage';
import { SubscriptionsPage } from './components/SubscriptionsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('subscribers');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberCard, setShowMemberCard] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([
    {
      id: 'GYM00001234',
      qrCode: 'QR1234567890',
      firstName: 'Ahmed',
      lastName: 'BEN AKTUL',
      phone: '+213 555 123 456',
      gender: 'M',
      startDate: '2023-12-06',
      endDate: '2025-12-06',
      subscriptionType: 'Sessions',
      price: '45,000',
      sessionsRemaining: 104,
      totalSessions: 120,
      status: 'Active'
    },
    {
      id: 'GYM00005678',
      qrCode: 'QR5678901234',
      firstName: 'Ayoub',
      lastName: 'HADDAD',
      phone: '+213 555 234 567',
      gender: 'M',
      startDate: '2023-04-02',
      endDate: '2024-04-02',
      subscriptionType: 'Sessions',
      price: '28,000',
      sessionsRemaining: 16,
      totalSessions: 60,
      status: 'Active'
    },
  ]);

  const handleNavigate = (page: string) => {
    switch (page) {
      case 'subscribers':
        setCurrentPage('subscribers');
        break;
      case 'settings':
        setCurrentPage('settings');
        break;
      case 'reports':
        setCurrentPage('reports');
        break;
      case 'programs':
        setCurrentPage('programs');
        break;
      case 'sales':
        setCurrentPage('sales');
        break;
      case 'access':
        setCurrentPage('access');
        break;
      case 'subscriptions':
        setCurrentPage('subscriptions');
        break;
      case 'logout':
        if (confirm('Are you sure you want to logout?')) {
          alert('Logging out...');
          // In a real app, this would clear session and redirect to login
        }
        break;
      case 'exit':
        if (confirm('Are you sure you want to exit the application?')) {
          alert('Closing application...');
          // In a real app, this would close the application window
        }
        break;
      default:
        alert(`${page.charAt(0).toUpperCase() + page.slice(1)} page - Coming soon!`);
    }
  };

  const handleSaveMember = (data: any) => {
    // Add new member to the list
    const newMember = {
      ...data,
      gender: 'M',
      subscriptionType: 'Sessions',
      price: '0',
      sessionsRemaining: 0,
      totalSessions: 0,
      status: 'Active'
    };
    setMembers([...members, newMember]);
    setCardData(data);
    setShowMemberCard(true);
  };

  const handleNewMember = () => {
    setSelectedMember(null);
    // Clear form by resetting selected member
    alert('Form cleared. Ready to add a new member!');
  };

  const handleEdit = () => {
    if (selectedMember) {
      alert(`Editing member: ${selectedMember.firstName} ${selectedMember.lastName}`);
    } else {
      alert('Please select a member from the table first');
    }
  };

  const handleDelete = () => {
    if (selectedMember) {
      if (confirm(`Are you sure you want to delete ${selectedMember.firstName} ${selectedMember.lastName}?`)) {
        setMembers(members.filter(m => m.id !== selectedMember.id));
        setSelectedMember(null);
        alert('Member deleted successfully!');
      }
    } else {
      alert('Please select a member from the table first');
    }
  };

  const handlePrintTicket = () => {
    if (selectedMember) {
      setCardData(selectedMember);
      setShowMemberCard(true);
    } else {
      alert('Please select a member from the table first');
    }
  };

  const handleViewHistory = () => {
    if (selectedMember) {
      alert(`Viewing subscription history for: ${selectedMember.firstName} ${selectedMember.lastName}\n\nHistory:\n- Start: ${selectedMember.startDate}\n- End: ${selectedMember.endDate}\n- Sessions Used: ${selectedMember.totalSessions - selectedMember.sessionsRemaining}/${selectedMember.totalSessions}`);
    } else {
      alert('Please select a member from the table first');
    }
  };

  const handleToggleStatus = () => {
    if (selectedMember) {
      const newStatus = selectedMember.status === 'Active' ? 'Inactive' : 'Active';
      const updatedMembers = members.map(m => 
        m.id === selectedMember.id ? { ...m, status: newStatus } : m
      );
      setMembers(updatedMembers);
      setSelectedMember({ ...selectedMember, status: newStatus });
      alert(`Member status changed to: ${newStatus}`);
    } else {
      alert('Please select a member from the table first');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Top Navigation */}
      <TopNavigation onNavigate={handleNavigate} />
      
      {/* Main Content */}
      {currentPage === 'subscribers' && (
        <div className="p-6">
          {/* Member Information & Status Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left Panel - Member Form (2/3 width) */}
            <div className="lg:col-span-2">
              <MemberForm selectedMember={selectedMember} onSave={handleSaveMember} />
            </div>
            
            {/* Right Panel - Member Status (1/3 width) */}
            <div className="lg:col-span-1">
              <MemberStatus selectedMember={selectedMember} />
            </div>
          </div>

          {/* Action Buttons */}
          <ActionButtons 
            onNewMember={handleNewMember}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPrintTicket={handlePrintTicket}
            onViewHistory={handleViewHistory}
            onToggleStatus={handleToggleStatus}
          />

          {/* Members Table */}
          <MembersTable members={members} onSelectMember={setSelectedMember} />
        </div>
      )}

      {/* Settings Page */}
      {currentPage === 'settings' && <SettingsPage />}

      {/* Reports Page */}
      {currentPage === 'reports' && <ReportsPage />}

      {/* Programs Page */}
      {currentPage === 'programs' && <ProgramsPage />}

      {/* Sales Page */}
      {currentPage === 'sales' && <SalesPage />}

      {/* Access Control Page */}
      {currentPage === 'access' && <AccessControlPage />}

      {/* Subscriptions Page */}
      {currentPage === 'subscriptions' && <SubscriptionsPage />}

      {/* Member Card Modal */}
      {showMemberCard && cardData && (
        <MemberCard 
          memberData={cardData} 
          onClose={() => setShowMemberCard(false)} 
        />
      )}
    </div>
  );
}
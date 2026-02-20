import { useEffect, useState } from "react";
import { TopNavigation } from "./components/TopNavigation";
import { MemberForm } from "./components/MemberForm";
import { MemberStatus } from "./components/MemberStatus";
import { ActionButtons } from "./components/ActionButtons";
import { MembersTable } from "./components/MembersTable";
import { MemberCard } from "./components/MemberCard";
import { SettingsPage } from "./components/SettingsPage";
import { ReportsPage } from "./components/ReportsPage";
import { PlansPage } from "./components/PlansPage";
import { SalesPage } from "./components/SalesPage";
import { AccessControlPage } from "./components/AccessControlPage";
import { SubscriptionsPage } from "./components/SubscriptionsPage";
import { RenewSubscriptionModal } from "./components/RenewSubscriptionModal";

export default function App() {
  const [currentPage, setCurrentPage] = useState("subscribers");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showMemberCard, setShowMemberCard] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showRenewModal, setShowRenewModal] = useState(false);
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const members = await window.api.members.getAll();
        setMembers(members);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };
    fetchMembers();
  }, []);
  /*const [members, setMembers] = useState<any[]>([
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
  ]);*/

  const handleNavigate = (page: string) => {
    switch (page) {
      case "subscribers":
        setCurrentPage("subscribers");
        break;
      case "settings":
        setCurrentPage("settings");
        break;
      case "reports":
        setCurrentPage("reports");
        break;
      case "plans":
        setCurrentPage("plans");
        break;
      case "sales":
        setCurrentPage("sales");
        break;
      case "access":
        setCurrentPage("access");
        break;
      case "subscriptions":
        setCurrentPage("subscriptions");
        break;
      case "refresh":
        if (confirm("Reload the application? Unsaved changes will be lost.")) {
          window.location.reload();
        }
        break;
      case "exit":
        if (confirm("Are you sure you want to exit the application?")) {
          alert("Closing application...");
          // In a real app, this would close the application window
        }
        break;
      default:
        alert(
          `${page.charAt(0).toUpperCase() + page.slice(1)} page - Coming soon!`,
        );
    }
  };

  const handleSaveMember = async (data: any) => {
    try {
      if (data.member.id) {
        // Update existing member (currently only member details supported)
        await window.api.members.update(data.member.id, {
          ...data.member,
          photoUrl: null, // Ensure parameter exists for SQL
        });
      } else {
        // Create new member
        // 1. Generate IDs client-side or let backend handle it.
        // The form currently does not generate IDs, so we rely on backend or generate here.
        // Let's generate a simple ID here or modify repository to auto-id.
        // Looking at Schema, ID is TEXT.
        // Looking at MemberForm, it was generating ID locally before my change?
        // Ah, I removed the local ID generation in MemberForm.
        // Ideally, backend should handle ID generation or we do it here.
        // Let's generate one here to valid schema.
        const memberId = `GYM${Date.now().toString().slice(-8)}`;
        const qrCode = memberId; // QR Code same as ID

        const newMember = {
          ...data.member,
          id: memberId,
          qrCode: qrCode,
          photoUrl: null,
        };

        await window.api.members.create(newMember);

        // 2. Create Subscription if provided
        if (data.subscription) {
          const newSubscription = {
            memberId: memberId,
            planId: data.subscription.planId,
            startDate: data.subscription.startDate,
            endDate: data.subscription.endDate, // CAN BE NULL
            remainingSessions: data.subscription.remainingSessions,
            status: "ACTIVE" as const,
            pricePaid: data.subscription.pricePaid,
            autoRenew: 0,
          };
          await window.api.subscriptions.create(newSubscription);
        }
      }

      // Refresh list
      const members = await window.api.members.getAll();
      setMembers(members);

      alert(
        data.member.id ? "Member updated!" : "Member and Subscription created!",
      );

      // Close/Clear
      setSelectedMember(null);
      setIsEditing(false);
      // setCardData(newMember) // If we want to show card immediately
    } catch (error) {
      console.error("Error saving member:", error);
      alert("Failed to save member.");
    }
  };

  const handleNewMember = () => {
    setSelectedMember(null);
    setIsEditing(true);
  };

  const handleEdit = () => {
    if (selectedMember) {
      setIsEditing(true);
    } else {
      alert("Please select a member from the table first");
    }
  };

  const handleDelete = async () => {
    if (selectedMember) {
      if (
        confirm(
          `Are you sure you want to delete ${selectedMember.firstName} ${selectedMember.lastName}?`,
        )
      ) {
        try {
          await window.api.members.delete(selectedMember.id);
          const members = await window.api.members.getAll();
          setMembers(members);
          setSelectedMember(null);
          alert("Member deleted successfully!");
        } catch (e) {
          console.error(e);
          alert("Failed to delete member");
        }
      }
    } else {
      alert("Please select a member from the table first");
    }
  };

  const handlePrintTicket = () => {
    if (selectedMember) {
      setCardData(selectedMember);
      setShowMemberCard(true);
    } else {
      alert("Please select a member from the table first");
    }
  };

  const handleViewHistory = () => {
    if (selectedMember && selectedMember.subscription) {
      alert(
        `Viewing subscription history for: ${selectedMember.firstName} ${selectedMember.lastName}\n\nLatest Subscription:\n- Plan: ${selectedMember.subscription.planName}\n- Status: ${selectedMember.subscription.status}\n- Start: ${selectedMember.subscription.startDate}\n- End: ${selectedMember.subscription.endDate || "N/A"}\n- Sessions Remaining: ${selectedMember.subscription.remainingSessions ?? "N/A"}`,
      );
    } else {
      alert(
        selectedMember
          ? "No subscription found for this member."
          : "Please select a member from the table first",
      );
    }
  };

  const handleToggleStatus = async () => {
    if (selectedMember && selectedMember.subscription) {
      const currentStatus = selectedMember.subscription.status;
      const newStatus = currentStatus === "ACTIVE" ? "CANCELLED" : "ACTIVE";

      if (confirm(`Change subscription status to ${newStatus}?`)) {
        try {
          await window.api.subscriptions.updateStatus(
            selectedMember.subscription.id,
            newStatus,
          );

          // Refresh
          const members = await window.api.members.getAll();
          setMembers(members);

          // Update selected member view if needed
          const updatedMember = members.find(
            (m: any) => m.id === selectedMember.id,
          );
          setSelectedMember(updatedMember);

          alert(`Subscription status updated to: ${newStatus}`);
        } catch (error) {
          console.error("Failed to update status", error);
          alert("Error updating status");
        }
      }
    } else {
      alert("Selected member has no active subscription to toggle.");
    }
  };

  const handleRenew = () => {
    if (selectedMember) {
      setShowRenewModal(true);
    } else {
      alert("Please select a member first.");
    }
  };

  const handleRenewSubmit = async (data: any) => {
    try {
      await window.api.subscriptions.renew(selectedMember.id, data);

      // Refresh
      const members = await window.api.members.getAll();
      setMembers(members);

      const updatedMember = members.find(
        (m: any) => m.id === selectedMember.id,
      );
      setSelectedMember(updatedMember);

      alert("Subscription renewed successfully!");
    } catch (error) {
      console.error("Renewal failed", error);
      alert("Failed to renew subscription");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Top Navigation */}
      <TopNavigation onNavigate={handleNavigate} />

      {/* Main Content */}
      {currentPage === "subscribers" && (
        <div className="p-6">
          {/* Member Information & Status Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left Panel - Member Form (2/3 width) */}
            <div className="lg:col-span-2">
              <MemberForm
                key={selectedMember ? selectedMember.id : "new-member"} // Force reset components
                selectedMember={selectedMember}
                isEditing={isEditing}
                onSave={handleSaveMember}
                onCancel={() => setIsEditing(false)}
              />
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
            onRenew={handleRenew}
            onRefresh={async () => {
              try {
                const members = await window.api.members.getAll();
                setMembers(members);
                alert("Refreshed member list!");
              } catch (error) {
                console.error("Refresh failed:", error);
                alert("Failed to refresh");
              }
            }}
          />

          {/* Members Table */}
          <MembersTable
            members={members}
            onSelectMember={(member) => {
              setSelectedMember(member);
              setIsEditing(false);
            }}
            selectedMemberId={selectedMember?.id}
          />
        </div>
      )}

      {/* Settings Page */}
      {currentPage === "settings" && <SettingsPage />}

      {/* Reports Page */}
      {currentPage === "reports" && <ReportsPage />}

      {/* Plans Page */}
      {currentPage === "plans" && <PlansPage />}

      {/* Sales Page */}
      {currentPage === "sales" && <SalesPage />}

      {/* Access Control Page */}
      {currentPage === "access" && <AccessControlPage />}

      {/* Subscriptions Page */}
      {currentPage === "subscriptions" && <SubscriptionsPage />}

      {/* Member Card Modal */}
      {showMemberCard && cardData && (
        <MemberCard
          memberData={{
            ...cardData,
            firstName: cardData.firstName,
            lastName: cardData.lastName,
            qrCode: cardData.qrCode,
          }}
          onClose={() => setShowMemberCard(false)}
        />
      )}

      <RenewSubscriptionModal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        onRenew={handleRenewSubmit}
        member={selectedMember}
        currentPlanId={
          selectedMember?.subscription?.planName
            ? undefined // We don't have the ID directly easily available from selectedMember.subscription currently effectively.
            : // Actually we can try to pass it if we had it.
              // For now let user select.
              undefined
        }
      />
    </div>
  );
}

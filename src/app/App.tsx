import { useEffect, useState } from "react";
import { TopNavigation } from "./components/TopNavigation";
import { MemberForm } from "./components/MemberForm";
import { MemberStatus } from "./components/MemberStatus";
import { ActionButtons } from "./components/ActionButtons";
import { MembersTable } from "./components/MembersTable";
import { MemberCard } from "./components/MemberCard";
// import { SettingsPage } from "./components/SettingsPage";
// import { ReportsPage } from "./components/ReportsPage";
import { PlansPage } from "./components/PlansPage";
import { SalesPage } from "./components/SalesPage";
import { AccessControlPage } from "./components/AccessControlPage";
import { SubscriptionsPage } from "./components/SubscriptionsPage";
import { EquipmentPage } from "./components/EquipmentPage";
import { ScannerPage } from "./components/ScannerPage";
import { RenewSubscriptionModal } from "./components/RenewSubscriptionModal";
import { ConfirmDialog } from "./components/ConfirmDialog";

// --- SECURITY CHANGE 1: IMPORT THE LOCK SCREEN ---
import { LockScreen } from "./components/lockScreen";
// -------------------------------------------------

export default function App() {
  const [currentPage, setCurrentPage] = useState("subscribers");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showMemberCard, setShowMemberCard] = useState(false);
  const [cardData, setCardData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "default";
  } | null>(null);

  // --- SECURITY CHANGE 2: ADD ACTIVATION STATE ---
  const [isActivated, setIsActivated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkActivation = async () => {
      try {
        const id = await window.api.system.getMachineId();
        const savedKey = localStorage.getItem("gym_activation_key");

        // The Secret Formula
        const secretString = id + "BAKI-GYM-SECRET";
        const msgUint8 = new TextEncoder().encode(secretString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const expectedKey = hashHex.substring(0, 12).toUpperCase();

        if (savedKey === expectedKey) {
          setIsActivated(true); // Let them in
        } else {
          setIsActivated(false); // Lock them out
        }
      } catch (err) {
        setIsActivated(false);
      }
    };
    checkActivation();
  }, []);
  // -----------------------------------------------

  // --- CUSTOM ALERT OVERRIDE ---
  // Replaces the broken native Electron alert with a smooth, non-blocking popup
  useEffect(() => {
    window.alert = (msg) => {
      const toast = document.createElement('div');
      toast.className = "fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-2xl z-[9999] transition-all font-medium";
      toast.innerText = msg;
      document.body.appendChild(toast);

      // Remove it automatically after 3 seconds
      setTimeout(() => {
        toast.remove();
      }, 3000);
    };
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const members = await window.api.members.getAll();
        setMembers(members);
        setSelectedMember((previous: any) => previous
          ? members.find((member: any) => member.id === previous.id) || null
          : null);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };
    fetchMembers();
  }, [currentPage]);

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
      case "scanner":
        setCurrentPage("scanner");
        break;
      case "subscriptions":
        setCurrentPage("subscriptions");
        break;
      case "equipment":
        setCurrentPage("equipment");
        break;
      case "refresh":
        setConfirmConfig({
          title: "Reload Application",
          message: "Reload the application? Unsaved changes will be lost.",
          onConfirm: () => {
            window.location.reload();
          },
        });
        break;
      default:
        alert(
          `${page.charAt(0).toUpperCase() + page.slice(1)} page - Coming soon!`,
        );
    }
  };

  const handleSaveMember = async (data: any) => {
      await window.api.members.save({
        ...data,
        subscriptionId: selectedMember?.subscription?.id,
      });
      setMembers(await window.api.members.getAll());
      setSelectedMember(null);
      setIsEditing(false);
      alert(data.member.id ? "Member updated!" : "Member and subscription created!");
    } catch (error) {
      console.error("Error saving member:", error);
      alert(error instanceof Error ? error.message : "Failed to save member.");
      throw error;
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
      setConfirmConfig({
        title: "Delete Member",
        message: `Are you sure you want to delete ${selectedMember.firstName} ${selectedMember.lastName}?`,
        variant: "danger",
        onConfirm: async () => {
          try {
            await window.api.members.delete(selectedMember.id);
            const members = await window.api.members.getAll();
            setMembers(members);
            setSelectedMember(null);

            // Delayed Alert
            setTimeout(() => alert("Member deleted successfully!"), 100);
          } catch (e) {
            console.error(e);
            setTimeout(() => alert("Failed to delete member"), 100);
          }
          setConfirmConfig(null);
        },
      });
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

      setConfirmConfig({
        title: "Update Subscription Status",
        message: `Change subscription status to ${newStatus}?`,
        variant: newStatus === "CANCELLED" ? "danger" : "default",
        onConfirm: async () => {
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
            alert(error instanceof Error ? error.message : "Error updating status");
          }
          setConfirmConfig(null);
        },
      });
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
      alert(error instanceof Error ? error.message : "Failed to renew subscription");
      throw error;
    }
  };

  // --- SECURITY CHANGE 3: THE GATEKEEPER INTERCEPTS THE RENDER ---
  if (isActivated === null) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Security Module...</div>;

  if (isActivated === false) {
    return <LockScreen onUnlock={() => setIsActivated(true)} />;
  }
  // ---------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Full-screen Scanner Page — no navigation bar */}
      {currentPage === "scanner" && (
        <ScannerPage onBack={() => setCurrentPage("subscribers")} />
      )}

      {/* Top Navigation (hidden when on scanner page) */}
      {currentPage !== "scanner" && <TopNavigation onNavigate={handleNavigate} />}

      {/* Main Content */}
      {currentPage === "subscribers" && (
        <div className="p-6">
          {/* Member Information & Status Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left Panel - Member Form (2/3 width) */}
            <div className="lg:col-span-3">
              <MemberForm
                selectedMember={selectedMember}
                isEditing={isEditing}
                onSave={handleSaveMember}
                onCancel={() => setIsEditing(false)}
              />
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
                // Delayed Alert
                setTimeout(() => alert("Refreshed member list!"), 100);
              } catch (error) {
                console.error("Refresh failed:", error);
                setTimeout(() => alert("Failed to refresh"), 100);
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
      {/* 
      {/* Plans Page */}
      {currentPage === "plans" && <PlansPage />}

      {/* Sales Page */}
      {currentPage === "sales" && <SalesPage />}

      {/* Access Control Page */}
      {currentPage === "access" && <AccessControlPage />}

      {/* Subscriptions Page */}
      {currentPage === "subscriptions" && <SubscriptionsPage />}

      {/* Equipment Page */}
      {currentPage === "equipment" && <EquipmentPage />}

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
        currentPlanId={selectedMember?.subscription?.planId?.toString()}
      />
      <ConfirmDialog
        open={!!confirmConfig}
        title={confirmConfig?.title || ""}
        message={confirmConfig?.message || ""}
        onConfirm={confirmConfig?.onConfirm || (() => {})}
        onCancel={() => setConfirmConfig(null)}
        variant={confirmConfig?.variant}
      />
    </div>
  );
}
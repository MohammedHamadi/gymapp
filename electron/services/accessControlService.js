import { memberRepository } from "../repositories/memberRepository.js";
import { subscriptionRepository } from "../repositories/subscriptionRepository.js";
import { accessLogRepository } from "../repositories/accessLogRepository.js";

export const accessControlService = {
  /**
   * Validates and processes an access request (Check-In or Check-Out)
   * @param {string} id - Member ID
   * @param {'CHECK_IN' | 'CHECK_OUT'} type - Access type
   * @param {number|null} subscriptionId - Optional subscription ID (required when member has multiple active subs)
   */
  handleAccessRequest: (id, type, subscriptionId = null) => {
    // 1. Fetch Member (basic info)
    const member = memberRepository.findById(id);
    if (!member) {
      return {
        status: "DENIED",
        reason: "Member does not exist",
      };
    }

    let photoData = member.photo_url || null;
    if (member.photo) {
      if (typeof member.photo === "string") {
        photoData = member.photo.startsWith("data:")
          ? member.photo
          : `data:image/jpeg;base64,${member.photo}`;
      } else if (Buffer.isBuffer(member.photo)) {
        photoData = `data:image/jpeg;base64,${member.photo.toString("base64")}`;
      }
    }

    const memberInfo = {
      id: member.id,
      firstName: member.first_name,
      lastName: member.last_name,
      phone: member.phone,
      photoUrl: photoData,
      photo: photoData,
    };

    // 2. Handle Check-Out (Always granted if member exists)
    if (type === "CHECK_OUT") {
      accessLogRepository.create({
        memberId: id,
        type: "CHECK_OUT",
        status: "GRANTED",
      });
      return {
        status: "GRANTED",
        member: memberInfo,
        message: "Check-out successful",
      };
    }

    // 3. Fetch all active subscriptions for this member
    const activeSubs = subscriptionRepository.findActiveByMemberId(id);

    // A. No Active Subscription
    if (!activeSubs || activeSubs.length === 0) {
      const reason = "No active subscription";
      accessLogRepository.create({
        memberId: id,
        type: "CHECK_IN",
        status: "DENIED",
        denialReason: reason,
      });
      return { status: "DENIED", member: memberInfo, reason };
    }

    // B. Multiple active subscriptions — prompt user to choose
    if (activeSubs.length > 1 && !subscriptionId) {
      return {
        status: "PENDING_SELECTION",
        member: memberInfo,
        subscriptions: activeSubs.map((s) => ({
          id: s.id,
          planName: s.plan_name,
          planType: s.plan_type || null,
          startDate: s.start_date,
          endDate: s.end_date,
          remainingSessions: s.remaining_sessions,
          status: s.status,
        })),
      };
    }

    // C. Resolve which subscription to use
    let sub;
    if (subscriptionId) {
      sub = activeSubs.find((s) => s.id === subscriptionId);
      if (!sub) {
        return {
          status: "DENIED",
          member: memberInfo,
          reason: "Selected subscription not found or inactive",
        };
      }
    } else {
      // Only one active sub — auto-select
      sub = activeSubs[0];
    }

    // D. Deny if end_date passed (after 24:00 / 23:59:59.999 of end_date) OR remaining_sessions is 0
    let isExpired = false;
    if (sub.end_date) {
      const datePart = String(sub.end_date).split("T")[0];
      const [year, month, day] = datePart.split("-").map(Number);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      isExpired = new Date() > endOfDay;
    }
    const noSessions =
      sub.remaining_sessions !== null && sub.remaining_sessions <= 0;

    if (isExpired || noSessions) {
      const reason = isExpired
        ? "Subscription expired"
        : "No sessions remaining";
      accessLogRepository.create({
        memberId: id,
        subscriptionId: sub.id,
        type: "CHECK_IN",
        status: "DENIED",
        denialReason: reason,
      });
      if (isExpired) {
        subscriptionRepository.updateStatus(sub.id, "EXPIRED");
      }
      return { status: "DENIED", member: memberInfo, reason };
    }

    // E. Grant Access — always deduct one session
    subscriptionRepository.decrementSession(sub.id);

    accessLogRepository.create({
      memberId: id,
      subscriptionId: sub.id,
      type: "CHECK_IN",
      status: "GRANTED",
    });

    return {
      status: "GRANTED",
      member: memberInfo,
      message: "Access granted",
      subscription: {
        id: sub.id,
        planName: sub.plan_name,
        remainingSessions: sub.remaining_sessions - 1,
      },
    };
  },
};

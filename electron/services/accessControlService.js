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

    // Helper: check if a subscription is expired by date or exhausted
    const checkSubscriptionExpired = (s) => {
      let isExpired = false;
      if (s.end_date) {
        const datePart = String(s.end_date).split("T")[0];
        const [year, month, day] = datePart.split("-").map(Number);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
        isExpired = new Date() > endOfDay;
      }
      const noSessions =
        s.remaining_sessions !== null && s.remaining_sessions <= 0;
      return { isExpired, noSessions, isInvalid: isExpired || noSessions };
    };

    // Auto-update expired or exhausted active subscriptions in the database
    const validSubs = [];
    for (const s of activeSubs || []) {
      const { isExpired, noSessions, isInvalid } = checkSubscriptionExpired(s);
      if (isInvalid) {
        subscriptionRepository.updateStatus(s.id, "EXPIRED");
      } else {
        validSubs.push(s);
      }
    }

    // A. No Valid Active Subscription
    if (!validSubs || validSubs.length === 0) {
      let reason = "No active subscription";
      let expiredSubId = null;
      if (activeSubs && activeSubs.length > 0) {
        const first = activeSubs[0];
        expiredSubId = first.id;
        const { noSessions, isExpired } = checkSubscriptionExpired(first);
        reason = noSessions ? "No sessions remaining" : isExpired ? "Subscription expired" : "No active subscription";
      }
      accessLogRepository.create({
        memberId: id,
        subscriptionId: expiredSubId,
        type: "CHECK_IN",
        status: "DENIED",
        denialReason: reason,
      });
      return { status: "DENIED", member: memberInfo, reason };
    }

    // B. Multiple valid active subscriptions — prompt user to choose
    if (validSubs.length > 1 && !subscriptionId) {
      return {
        status: "PENDING_SELECTION",
        member: memberInfo,
        subscriptions: validSubs.map((s) => ({
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
      sub = validSubs.find((s) => s.id === subscriptionId);
      if (!sub) {
        return {
          status: "DENIED",
          member: memberInfo,
          reason: "Selected subscription not found or inactive",
        };
      }
    } else {
      // Only one active sub — auto-select
      sub = validSubs[0];
    }

    // E. Grant Access — always deduct one session
    subscriptionRepository.decrementSession(sub.id);

    accessLogRepository.create({
      memberId: id,
      subscriptionId: sub.id,
      type: "CHECK_IN",
      status: "GRANTED",
    });

    const remainingSessions =
      sub.remaining_sessions !== null ? sub.remaining_sessions - 1 : null;
    const isAboutToEnd =
      remainingSessions !== null && remainingSessions <= 1;

    // If this was their last session, mark it EXPIRED in the database
    if (remainingSessions === 0) {
      subscriptionRepository.updateStatus(sub.id, "EXPIRED");
    }

    return {
      status: "GRANTED",
      member: memberInfo,
      message: isAboutToEnd ? "Sessions about to end" : "Access granted",
      warning: isAboutToEnd ? "Sessions about to end" : null,
      subscription: {
        id: sub.id,
        planName: sub.plan_name,
        remainingSessions,
        isAboutToEnd,
      },
    };
  },
};

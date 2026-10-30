import db from "../db/client.js";
import { memberRepository } from "../repositories/memberRepository.js";
import { subscriptionRepository } from "../repositories/subscriptionRepository.js";
import { accessLogRepository } from "../repositories/accessLogRepository.js";
import { localDate } from "../../shared/subscriptionRules.js";
import { barcodeCandidates } from "../../shared/barcode.js";

export const accessControlService = {
  handleAccessRequest: (barcode, type, subscriptionId = null) => db.transaction(() => {
    if (!["CHECK_IN", "CHECK_OUT"].includes(type)) throw new Error("Invalid access type.");
    const matches = barcodeCandidates(barcode).map((value) => memberRepository.findByBarcode(value)).filter(Boolean);
    const unique = [...new Map(matches.map((member) => [member.id, member])).values()];
    if (unique.length !== 1) {
      return { status: "DENIED", reason: unique.length ? "Ambiguous barcode. Enter the printed member ID manually." : "Member does not exist" };
    }
    const member = unique[0];
    const id = member.id;
    let photoData = member.photo_url || null;
    if (member.photo) {
      if (typeof member.photo === "string") {
        photoData = member.photo.startsWith("data:") ? member.photo : `data:image/jpeg;base64,${member.photo}`;
      } else if (Buffer.isBuffer(member.photo)) {
        photoData = `data:image/jpeg;base64,${member.photo.toString("base64")}`;
      }
    }
    const memberInfo = {
      id, firstName: member.first_name, lastName: member.last_name,
      phone: member.phone, photoUrl: photoData, photo: photoData,
    };
    const log = (status, reason = null, subId = null) => accessLogRepository.create({
      memberId: id, subscriptionId: subId, type, status, denialReason: reason,
    });
    const deny = (reason, subId = null) => {
      log("DENIED", reason, subId);
      return { status: "DENIED", member: memberInfo, reason };
    };
    if (type === "CHECK_OUT") {
      log("GRANTED");
      return { status: "GRANTED", member: memberInfo, message: "Check-out successful" };
    }
    const subscriptions = subscriptionRepository.findActiveByMemberId(id);
    if (!subscriptions || subscriptions.length === 0) return deny("No active subscription");
    const sub = (subscriptionId != null)
      ? subscriptions.find((s) => s.id === Number(subscriptionId)) || subscriptions[0]
      : subscriptions[0];
    if (subscriptionId != null && Number(subscriptionId) !== sub.id) {
      return deny("Selected subscription is no longer active");
    }
    const startDatePart = String(sub.start_date).slice(0, 10);
    if (startDatePart > localDate()) return deny("Subscription has not started yet", sub.id);
    // NULL is unlimited; only subscriptions with a visit limit are decremented.
    if (sub.remaining_sessions !== null) {
      const result = subscriptionRepository.decrementSession(sub.id);
      if (!result.changes) return deny("No sessions remaining", sub.id);
    }
    const remainingSessions = sub.remaining_sessions === null ? null : sub.remaining_sessions - 1;
    const isAboutToEnd = remainingSessions !== null && remainingSessions <= 1;
    log("GRANTED", null, sub.id);
    return {
      status: "GRANTED", member: memberInfo,
      message: isAboutToEnd ? "Sessions about to end" : "Access granted",
      warning: isAboutToEnd ? "Sessions about to end" : null,
      subscription: { id: sub.id, planName: sub.plan_name, remainingSessions, isAboutToEnd },
    };
  })(),
};

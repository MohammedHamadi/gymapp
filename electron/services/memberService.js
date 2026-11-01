import { randomInt } from "node:crypto";
import db from "../db/client.js";
import { memberRepository } from "../repositories/memberRepository.js";
import { subscriptionRepository } from "../repositories/subscriptionRepository.js";

export function saveMember({ member, subscription, subscriptionId }) {
  return db.transaction(() => {
    if (!member.firstName?.trim() || !member.lastName?.trim() || !member.phone?.trim()) {
      throw new Error("First name, last name and phone are required.");
    }
    const details = {
      ...member,
      firstName: member.firstName.trim(), lastName: member.lastName.trim(),
      phone: member.phone.trim(), email: member.email || null,
      photoUrl: member.photoUrl || null, photo: member.photo || null,
    };
    let id = member.id;
    if (id) {
      const existing = memberRepository.findById(id);
      if (!existing) throw new Error("Member does not exist.");
      if (existing.is_archived) throw new Error("This member has been archived.");
      details.photoUrl = member.photoUrl === undefined ? existing.photo_url : details.photoUrl;
      memberRepository.update(id, details);
    } else {
      // Keep the printed GYM + eight digits format, without the timestamp wraparound.
      do { id = `GYM${String(randomInt(100000000)).padStart(8, "0")}`; }
      while (memberRepository.findByBarcode(id));
      memberRepository.create({ ...details, id, qrCode: id });
    }
    if (subscription) {
      if (subscriptionId) {
        const old = subscriptionRepository.findById(subscriptionId);
        if (!old || old.member_id !== id) throw new Error("Subscription does not belong to this member.");
        const current = memberRepository.findByIdWithSubscription(id).subscription;
        if (current?.id !== subscriptionId) throw new Error("Subscription changed. Refresh the member before editing.");
        subscriptionRepository.update(subscriptionId, {
          ...subscription, memberId: id, status: old.status, autoRenew: old.auto_renew,
        });
      } else {
        subscriptionRepository.create({ ...subscription, memberId: id, status: "ACTIVE", autoRenew: 0 });
      }
    }
    return memberRepository.findByIdWithSubscription(id);
  })();
}

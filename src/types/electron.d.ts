import { Member, Plan, Subscription, AccessLog, Transaction } from "./types";

export interface ElectronApi {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  members: {
    getAll: () => Promise<Member[]>;
    getById: (id: string) => Promise<Member>;
    create: (member: Partial<Member>) => Promise<any>;
    update: (id: string, member: Partial<Member>) => Promise<any>;
    delete: (id: string) => Promise<any>;
  };
  plans: {
    getAll: () => Promise<Plan[]>;
    getById: (id: number) => Promise<Plan>;
    create: (plan: Partial<Plan>) => Promise<any>;
    update: (id: number, plan: Partial<Plan>) => Promise<any>;
    delete: (id: number) => Promise<any>;
  };
  subscriptions: {
    getAll: () => Promise<Subscription[]>;
    getById: (id: number) => Promise<Subscription>;
    getByMember: (memberId: string) => Promise<Subscription[]>;
    getActiveByMember: (memberId: string) => Promise<Subscription[]>;
    create: (subscription: Partial<Subscription>) => Promise<any>;
    update: (id: number, subscription: Partial<Subscription>) => Promise<any>;
    updateStatus: (id: number, status: string) => Promise<any>;
    decrementSession: (id: number) => Promise<any>;
    delete: (id: number) => Promise<any>;
  };
  accessLogs: {
    create: (log: Partial<AccessLog>) => Promise<any>;
    getByMember: (memberId: string) => Promise<AccessLog[]>;
    getRecent: (limit?: number) => Promise<AccessLog[]>;
  };
  transactions: {
    create: (transaction: Partial<Transaction>) => Promise<any>;
    getByMember: (memberId: string) => Promise<Transaction[]>;
    getDailyTotal: (date: string) => Promise<{ total: number; count: number }>;
    getAll: () => Promise<Transaction[]>;
  };
}

declare global {
  interface Window {
    api: ElectronApi;
  }
}

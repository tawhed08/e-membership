const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

interface ApiOptions extends RequestInit {
  body?: BodyInit | null;
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong"
    );
  }

  return data as T;
}

// ==============================
// User
// ==============================

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUser
  extends Omit<User, "id"> {
  _id: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  return apiFetch<AuthResponse>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function loginUser(data: {
  email: string;
  password: string;
}) {
  return apiFetch<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function getCurrentUser() {
  return apiFetch<{
    success: boolean;
    user: User;
  }>("/auth/me");
}

export async function logoutUser() {
  return apiFetch<{
    success: boolean;
    message: string;
  }>("/auth/logout", {
    method: "POST",
  });
}

// ==============================
// Membership Plans
// ==============================

export interface MembershipPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getActiveMembershipPlans() {
  return apiFetch<{
    success: boolean;
    plans: MembershipPlan[];
  }>("/membership-plans/active");
}

export async function getAllMembershipPlans() {
  return apiFetch<{
    success: boolean;
    plans: MembershipPlan[];
  }>("/membership-plans");
}

export async function createMembershipPlan(
  data: {
    name: string;
    description: string;
    price: number;
    durationDays: number;
  }
) {
  return apiFetch<{
    success: boolean;
    message: string;
    plan: MembershipPlan;
  }>("/membership-plans", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMembershipPlan(
  id: string,
  data: Partial<
    Pick<
      MembershipPlan,
      | "name"
      | "description"
      | "price"
      | "durationDays"
      | "isActive"
    >
  >
) {
  return apiFetch<{
    success: boolean;
    message: string;
    plan: MembershipPlan;
  }>(
    `/membership-plans/${encodeURIComponent(
      id
    )}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export async function deactivateMembershipPlan(
  id: string
) {
  return apiFetch<{
    success: boolean;
    message: string;
    plan: MembershipPlan;
  }>(
    `/membership-plans/${encodeURIComponent(
      id
    )}/deactivate`,
    {
      method: "PATCH",
    }
  );
}

// ==============================
// Membership
// ==============================

export interface Membership {
  _id: string;
  user: string;
  plan:
    | string
    | {
        _id: string;
        name: string;
        description: string;
        price: number;
        durationDays: number;
      };
  startDate?: string;
  expiryDate?: string;
  status:
    | "pending"
    | "active"
    | "expired"
    | "cancelled";
  paymentStatus:
    | "pending"
    | "paid"
    | "failed"
    | "refunded";
  createdAt: string;
  updatedAt: string;
}

export interface AdminMembership
  extends Omit<Membership, "user"> {
  user:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        phone?: string;
      };
  certificateIssued?: boolean;
}

export async function createMembership(
  planId: string
) {
  return apiFetch<{
    success: boolean;
    message: string;
    membership: Membership;
  }>("/memberships", {
    method: "POST",
    body: JSON.stringify({
      planId,
    }),
  });
}

// Admin manually creates membership
export async function createAdminMembership(
  data: {
    userId: string;
    planId: string;
    startDate?: string;
    status: "active" | "pending";
    paymentStatus: "paid" | "pending";
  }
) {
  return apiFetch<{
    success: boolean;
    message: string;
    membership: AdminMembership;
  }>("/memberships/admin", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyMembership() {
  return apiFetch<{
    success: boolean;
    membership: Membership;
  }>("/memberships/my");
}

export async function getMyMembershipHistory() {
  return apiFetch<{
    success: boolean;
    memberships: Membership[];
  }>("/memberships/history");
}

export async function getAdminMemberships(
  params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
  }
) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search) {
    query.set(
      "search",
      params.search
    );
  }

  if (params.status) {
    query.set(
      "status",
      params.status
    );
  }

  if (params.paymentStatus) {
    query.set(
      "paymentStatus",
      params.paymentStatus
    );
  }

  return apiFetch<{
    success: boolean;
    memberships: AdminMembership[];
    pagination: Pagination;
  }>(
    `/memberships?${query.toString()}`
  );
}

// ==============================
// Payment
// ==============================

export type PaymentMethod =
  | "bkash"
  | "nagad"
  | "bank"
  | "card";

export interface ManualPaymentMethodSettings {
  enabled: boolean;
  accountName: string;
  accountNumber: string;
  instructions: string;
}

export interface BankPaymentMethodSettings
  extends ManualPaymentMethodSettings {
  bankName: string;
  branch: string;
}

export interface PaymentSettings {
  bkash: ManualPaymentMethodSettings;
  nagad: ManualPaymentMethodSettings;
  bank: BankPaymentMethodSettings;
  card: {
    enabled: boolean;
    provider: "aamarPay";
    gatewayConfigured?: boolean;
  };
}

export async function getPaymentSettings() {
  return apiFetch<{
    success: boolean;
    settings: PaymentSettings;
  }>("/payments/settings");
}

export async function updatePaymentSettings(
  settings: {
    bkash: ManualPaymentMethodSettings;
    nagad: ManualPaymentMethodSettings;
    bank: BankPaymentMethodSettings;
    cardEnabled: boolean;
  }
) {
  return apiFetch<{
    success: boolean;
    message: string;
    settings: PaymentSettings;
  }>("/payments/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export type PaymentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "refunded";

export interface Payment {
  _id: string;
  user: string;
  membership: string;
  amount: number;
  method: PaymentMethod;
  transactionId: string;
  status: PaymentStatus;
  note?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPayment
  extends Omit<
    Payment,
    "user" | "membership"
  > {
  user?: {
    _id?: string;
    name: string;
    email: string;
    phone?: string;
  };

  membership?: {
    _id?: string;
    status: string;
    paymentStatus: string;
    startDate?: string;
    expiryDate?: string;
  };
}

export async function createPayment(
  data: {
    membershipId: string;
    method: PaymentMethod;
    transactionId: string;
    note?: string;
  }
) {
  return apiFetch<{
    success: boolean;
    message: string;
    payment: Payment;
  }>("/payments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function startCardCheckout(
  membershipId: string
) {
  return apiFetch<{
    success: boolean;
    message: string;
    transactionId: string;
    checkoutUrl: string;
  }>("/payments/card/checkout", {
    method: "POST",
    body: JSON.stringify({
      membershipId,
    }),
  });
}

export async function getMyPayments() {
  return apiFetch<{
    success: boolean;
    payments: Payment[];
  }>("/payments/my");
}

export async function getAllPayments(
  params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }
) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search) {
    query.set(
      "search",
      params.search
    );
  }

  if (params.status) {
    query.set(
      "status",
      params.status
    );
  }

  return apiFetch<{
    success: boolean;
    payments: AdminPayment[];
    pagination: Pagination;
  }>(
    `/payments?${query.toString()}`
  );
}

export async function updatePaymentStatus(
  paymentId: string,
  action: "approve" | "reject"
) {
  return apiFetch<{
    success: boolean;
    message: string;
    payment: Payment;
    membership?: Membership;
  }>(
    `/payments/${encodeURIComponent(
      paymentId
    )}/${action}`,
    {
      method: "PATCH",
    }
  );
}

// ==============================
// Admin Dashboard
// ==============================

export async function getAdminDashboardStats() {
  return apiFetch<{
    success: boolean;
    stats: {
      members: number;
      activeUsers: number;
      inactiveUsers: number;
      totalMemberships: number;
      activeMemberships: number;
      expiredMemberships: number;
      totalPayments: number;
      approvedPayments: number;
      pendingPayments: number;
      certificates: number;
      activeCertificates: number;
      expiredCertificates: number;
      revenue: number;
      months: Array<{
        label: string;
        users: number;
        revenue: number;
      }>;
      paymentStatuses: Array<{
        status: string;
        count: number;
      }>;
    };
  }>("/admin/dashboard");
}

// ==============================
// Certificates
// ==============================

export interface Certificate {
  _id: string;
  certificateId: string;
  user:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      };
  membership:
    | string
    | {
        _id: string;
        status: string;
        paymentStatus: string;
        startDate?: string;
        expiryDate?: string;
      };
  issueDate: string;
  expiryDate: string;
  status:
    | "active"
    | "expired"
    | "revoked";
  createdAt: string;
}

export async function getMyCertificate() {
  return apiFetch<{
    success: boolean;
    certificate: Certificate;
  }>("/certificates/my");
}

export async function getAllCertificates(
  params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }
) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search) {
    query.set(
      "search",
      params.search
    );
  }

  if (params.status) {
    query.set(
      "status",
      params.status
    );
  }

  return apiFetch<{
    success: boolean;
    certificates: Certificate[];
    pagination: Pagination;
  }>(
    `/certificates?${query.toString()}`
  );
}

export async function issueCertificate(
  membershipId: string
) {
  return apiFetch<{
    success: boolean;
    message: string;
    certificate: Certificate;
  }>("/certificates", {
    method: "POST",
    body: JSON.stringify({
      membershipId,
    }),
  });
}

export async function revokeCertificate(
  certificateId: string
) {
  return apiFetch<{
    success: boolean;
    message: string;
    certificate: Certificate;
  }>(
    `/certificates/${encodeURIComponent(
      certificateId
    )}/revoke`,
    {
      method: "PATCH",
    }
  );
}

// ==============================
// Notifications
// ==============================

export interface Notification {
  _id: string;
  type: "expiry_warning";
  daysBefore: 30 | 7 | 1;
  title: string;
  message: string;
  readAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export async function getMyNotifications(
  params: {
    page?: number;
    limit?: number;
  } = {}
) {
  const query = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.limit || 20),
  });

  return apiFetch<{
    success: boolean;
    notifications: Notification[];
    unread: number;
    pagination: Pagination;
  }>(
    `/notifications/my?${query.toString()}`
  );
}

export async function markNotificationRead(
  id: string
) {
  return apiFetch<{
    success: boolean;
    notification: Notification;
  }>(
    `/notifications/${encodeURIComponent(
      id
    )}/read`,
    {
      method: "PATCH",
    }
  );
}

export async function markAllNotificationsRead() {
  return apiFetch<{
    success: boolean;
    updated: number;
  }>("/notifications/read-all", {
    method: "PATCH",
  });
}

// ==============================
// Profile
// ==============================

export async function updateMyProfile(
  data: {
    name: string;
    phone?: string;
  }
) {
  return apiFetch<{
    success: boolean;
    user: User;
  }>("/users/me/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function changeMyPassword(
  data: {
    currentPassword: string;
    newPassword: string;
  }
) {
  return apiFetch<{
    success: boolean;
    message: string;
  }>("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ==============================
// Admin Users
// ==============================

export async function getAdminUsers(
  params: {
    page: number;
    limit: number;
    search?: string;
    status?:
      | "active"
      | "inactive"
      | "all";
  }
) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search) {
    query.set(
      "search",
      params.search
    );
  }

  if (
    params.status &&
    params.status !== "all"
  ) {
    query.set(
      "status",
      params.status
    );
  }

  return apiFetch<{
    success: boolean;
    users: AdminUser[];
    pagination: Pagination;
  }>(
    `/users/admin?${query.toString()}`
  );
}

export async function updateUserStatus(
  id: string,
  isActive: boolean
) {
  return apiFetch<{
    success: boolean;
    user: AdminUser;
  }>(
    `/users/admin/${encodeURIComponent(
      id
    )}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        isActive,
      }),
    }
  );
}

// ==============================
// Admin Notifications
// ==============================

export async function getAdminNotifications(
  params: {
    page: number;
    limit: number;
    search?: string;
  }
) {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.search) {
    query.set(
      "search",
      params.search
    );
  }

  return apiFetch<{
    success: boolean;
    notifications: Array<
      Notification & {
        user?: {
          _id: string;
          name: string;
          email: string;
        };
      }
    >;
    pagination: Pagination;
  }>(
    `/notifications?${query.toString()}`
  );
}
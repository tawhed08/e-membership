import { Request, Response } from "express";
import Certificate from "../models/Certificate";
import Membership from "../models/Membership";
import Payment from "../models/Payment";
import User from "../models/User";

export async function getDashboardStats(
  _req: Request,
  res: Response
) {
  try {
    const [
      members,
      activeUsers,
      inactiveUsers,
      totalMemberships,
      activeMemberships,
      expiredMemberships,
      totalPayments,
      approvedPayments,
      pendingPayments,
      certificates,
      activeCertificates,
      expiredCertificates,
      revenue,
      monthlyUsers,
      monthlyRevenue,
      paymentStatuses,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", isActive: true }),
      User.countDocuments({ role: "user", isActive: false }),
      Membership.countDocuments(),
      Membership.countDocuments({ status: "active" }),
      Membership.countDocuments({ status: "expired" }),
      Payment.countDocuments(),
      Payment.countDocuments({ status: "approved" }),
      Payment.countDocuments({ status: "pending" }),
      Certificate.countDocuments(),
      Certificate.countDocuments({ status: "active" }),
      Certificate.countDocuments({ status: "expired" }),
      Payment.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.aggregate([
        {
          $match: {
            role: "user",
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: "approved",
            paidAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$paidAt" },
              month: { $month: "$paidAt" },
            },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Payment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const monthlyPeriodStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 5,
      1
    );
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        monthlyPeriodStart.getFullYear(),
        monthlyPeriodStart.getMonth() + index,
        1
      );
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const userEntry = monthlyUsers.find(
        (item: { _id: { year: number; month: number } }) =>
          item._id.year === year && item._id.month === month
      );
      const revenueEntry = monthlyRevenue.find(
        (item: { _id: { year: number; month: number } }) =>
          item._id.year === year && item._id.month === month
      );
      return {
        label: date.toLocaleDateString("en", { month: "short" }),
        users: userEntry?.count || 0,
        revenue: revenueEntry?.total || 0,
      };
    });

    return res.status(200).json({
      success: true,
      stats: {
        members,
        activeUsers,
        inactiveUsers,
        totalMemberships,
        activeMemberships,
        expiredMemberships,
        totalPayments,
        approvedPayments,
        pendingPayments,
        certificates,
        activeCertificates,
        expiredCertificates,
        revenue: revenue[0]?.total || 0,
        months,
        paymentStatuses: paymentStatuses.map(
          (item: { _id: string; count: number }) => ({
            status: item._id,
            count: item.count,
          })
        ),
      },
    });
  } catch (error) {
    console.error("Get admin dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting dashboard statistics",
    });
  }
}
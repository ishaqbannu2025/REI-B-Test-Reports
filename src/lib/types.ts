import type { LucideIcon } from "lucide-react";

export type TestReportCategory = "Domestic" | "Commercial" | "Industrial";

export type TestReport = {
  id: string;
  uin: string;
  applicantName: string;
  shortAddress: string;
  district: string;
  category: TestReportCategory;
  sanctionedLoad: string;
  proposedTransformer: string;
  governmentFee: number;
  challan: string;
  electricalContractorName: string;
  remarks: string;
  entryDate: Date;
  enteredBy: string;
};

export type UserRole = "Admin" | "Data Entry User";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
};

export type NavItem = {
  href: string;
  title: string;
  icon: LucideIcon;
  label?: string;
  adminOnly?: boolean;
};

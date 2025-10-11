import type { LucideIcon } from "lucide-react";
import { Timestamp } from "firebase/firestore";

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
  entryDate: Date | Timestamp;
  enteredBy: string;
};

export type UserRole = "Admin" | "Data Entry User";

export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  photoURL: string;
};

export type NavItem = {
  href: string;
  title: string;
  icon: LucideIcon;
  label?: string;
  adminOnly?: boolean;
};

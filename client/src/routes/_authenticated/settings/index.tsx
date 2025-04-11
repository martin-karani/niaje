import { Card } from "@/components/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Banknote,
  Bell,
  Building,
  CreditCard,
  FileText,
  Globe,
  Lock,
  Megaphone,
  MessageSquare,
  PaintBucket,
  Percent,
  Settings,
  User,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings/")({
  loader: () => {
    return {
      crumb: [
        {
          label: "Dashboard",
          path: "/dashboard",
          hideOnMobile: true,
        },
        {
          label: "Settings",
          path: "/settings",
          hideOnMobile: false,
        },
      ],
    };
  },
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center">
          <Settings className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Account settings */}
        <SettingsCard
          title="Account settings"
          description="Lets you control and update account information and enable other products."
        >
          <SettingsLink
            icon={<User className="h-5 w-5 text-blue-500" />}
            label="Profile"
            href="/settings/profile"
          />
          <SettingsLink
            icon={<Lock className="h-5 w-5 text-blue-500" />}
            label="Security"
            href="/settings/security"
          />
          <SettingsLink
            icon={<Zap className="h-5 w-5 text-blue-500" />}
            label="Integrations"
            href="/settings/integrations"
          />
          <SettingsLink
            icon={<Bell className="h-5 w-5 text-blue-500" />}
            label="Notifications"
            href="/settings/notifications"
          />
        </SettingsCard>

        {/* Online payments */}
        <SettingsCard
          title="Online payments"
          description="Set up how you accepts payments, manage the bank accounts and other settings."
        >
          <SettingsLink
            icon={<Banknote className="h-5 w-5 text-blue-500" />}
            label="Bank account"
            href="/settings/bank-account"
          />
          <SettingsLink
            icon={<Building className="h-5 w-5 text-blue-500" />}
            label="Properties"
            href="/settings/properties"
          />
          <SettingsLink
            icon={<Users className="h-5 w-5 text-blue-500" />}
            label="Entities"
            href="/settings/entities"
          />
          <SettingsLink
            icon={<Settings className="h-5 w-5 text-blue-500" />}
            label="Payment settings"
            href="/settings/payment-settings"
          />
          <SettingsLink
            icon={<Percent className="h-5 w-5 text-blue-500" />}
            label="Tax"
            href="/settings/tax"
          />
        </SettingsCard>

        {/* Accounting settings */}
        <SettingsCard
          title="Accounting settings"
          description="Control the invoice schedule, late fee and NSF settings."
        >
          <SettingsLink
            icon={<FileText className="h-5 w-5 text-blue-500" />}
            label="Invoice & Late fee"
            href="/settings/invoice-late-fee"
          />
          <SettingsLink
            icon={<CreditCard className="h-5 w-5 text-blue-500" />}
            label="QuickBooks Sync"
            href="/settings/quickbooks-sync"
          />
        </SettingsCard>

        {/* Rental applications */}
        <SettingsCard
          title="Rental applications"
          description="Manage your rental application template and other settings."
        >
          <SettingsLink
            icon={<FileText className="h-5 w-5 text-blue-500" />}
            label="Application fee"
            href="/settings/application-fee"
          />
          <SettingsLink
            icon={<Settings className="h-5 w-5 text-blue-500" />}
            label="Form configuration"
            href="/settings/form-configuration"
          />
          <SettingsLink
            icon={<FileText className="h-5 w-5 text-blue-500" />}
            label="Terms and signature"
            href="/settings/terms-signature"
          />
        </SettingsCard>

        {/* Listing website */}
        <SettingsCard
          title="Listing website"
          description="Manage your listing website, customise the theme and additional option."
        >
          <SettingsLink
            icon={<Globe className="h-5 w-5 text-blue-500" />}
            label="Domain settings"
            href="/settings/domain-settings"
          />
          <SettingsLink
            icon={<PaintBucket className="h-5 w-5 text-blue-500" />}
            label="Website layouts"
            href="/settings/website-layouts"
          />
          <SettingsLink
            icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
            label="Team & contact info"
            href="/settings/team-contact-info"
          />
        </SettingsCard>

        {/* Request settings */}
        <SettingsCard
          title="Request settings"
          description="Automate the request you receive, specify the schedule and other request settings."
        >
          <SettingsLink
            icon={<User className="h-5 w-5 text-blue-500" />}
            label="Request settings"
            href="/settings/request-settings"
          />
          <SettingsLink
            icon={<Settings className="h-5 w-5 text-blue-500" />}
            label="Automation settings"
            href="/settings/automation-settings"
          />
        </SettingsCard>

        {/* Team management */}
        <SettingsCard
          title="Team management"
          description="Control what settings, features and properties are available to your team members."
        >
          <SettingsLink
            icon={<Users className="h-5 w-5 text-blue-500" />}
            label="Roles & permissions"
            href="/settings/roles-permissions"
          />
          <SettingsLink
            icon={<Users className="h-5 w-5 text-blue-500" />}
            label="Tasks Assignee"
            href="/settings/tasks-assignee"
          />
        </SettingsCard>

        {/* Affiliate program */}
        <SettingsCard
          title="Affiliate program"
          description="Earn the commission for recommending our product and driving leads."
        >
          <SettingsLink
            icon={<Megaphone className="h-5 w-5 text-blue-500" />}
            label="Promotions & Balance"
            href="/settings/promotions-balance"
          />
          <SettingsLink
            icon={<Percent className="h-5 w-5 text-blue-500" />}
            label="Referrals"
            href="/settings/referrals"
          />
          <SettingsLink
            icon={<Wallet className="h-5 w-5 text-blue-500" />}
            label="Payout history"
            href="/settings/payout-history"
          />
        </SettingsCard>
      </div>
    </div>
  );
}

// Component for a settings card with title, description, and links
const SettingsCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-medium mb-1">{title}</h2>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        <div className="space-y-3 mt-6">{children}</div>
      </div>
    </Card>
  );
};

// Component for a settings link with icon
const SettingsLink = ({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) => {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 text-sm text-primary hover:underline group"
    >
      {icon}
      <span>{label}</span>
      <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
};

export default SettingsPage;

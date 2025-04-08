// client/src/routes/settings/index.tsx
import { useUpdateProfile } from "@/api/trpc-hooks";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  AlignLeft,
  Bell,
  Check,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  MapPin,
  Moon,
  Phone,
  Shield,
  Sun,
  Upload,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); // profile, security, notifications, appearance, integrations
  const [showChangePassword, setShowChangePassword] = useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-medium">Settings</h2>
            </div>
            <div className="p-2">
              <nav className="space-y-1">
                <SettingsNavItem
                  icon={<User className="h-5 w-5" />}
                  title="Profile"
                  description="Manage your personal information"
                  isActive={activeTab === "profile"}
                  onClick={() => setActiveTab("profile")}
                />
                <SettingsNavItem
                  icon={<Lock className="h-5 w-5" />}
                  title="Security"
                  description="Update password and security settings"
                  isActive={activeTab === "security"}
                  onClick={() => setActiveTab("security")}
                />
                <SettingsNavItem
                  icon={<Bell className="h-5 w-5" />}
                  title="Notifications"
                  description="Configure notification preferences"
                  isActive={activeTab === "notifications"}
                  onClick={() => setActiveTab("notifications")}
                />
                <SettingsNavItem
                  icon={<Globe className="h-5 w-5" />}
                  title="Appearance"
                  description="Customize the look and feel"
                  isActive={activeTab === "appearance"}
                  onClick={() => setActiveTab("appearance")}
                />
                <SettingsNavItem
                  icon={<Shield className="h-5 w-5" />}
                  title="Privacy"
                  description="Manage data sharing and privacy"
                  isActive={activeTab === "privacy"}
                  onClick={() => setActiveTab("privacy")}
                />
                <SettingsNavItem
                  icon={<AlignLeft className="h-5 w-5" />}
                  title="Integrations"
                  description="Connect with third-party services"
                  isActive={activeTab === "integrations"}
                  onClick={() => setActiveTab("integrations")}
                />
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === "profile" && <ProfileSettings user={user} />}

          {/* Security Tab */}
          {activeTab === "security" && (
            <SecuritySettings
              showChangePassword={showChangePassword}
              setShowChangePassword={setShowChangePassword}
            />
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && <NotificationSettings />}

          {/* Appearance Tab */}
          {activeTab === "appearance" && <AppearanceSettings />}

          {/* Privacy Tab */}
          {activeTab === "privacy" && <PrivacySettings />}

          {/* Integrations Tab */}
          {activeTab === "integrations" && <IntegrationsSettings />}
        </div>
      </div>
    </div>
  );
}

// Navigation Item Component
const SettingsNavItem = ({ icon, title, description, isActive, onClick }) => (
  <button
    className={`w-full flex items-start p-3 rounded-lg text-left transition-colors ${
      isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/80"
    }`}
    onClick={onClick}
  >
    <div
      className={`mt-0.5 mr-3 ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
    </div>
    <div>
      <div className="font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  </button>
);

// Profile Settings Component
const ProfileSettings = ({ user }) => {
  // In a real app, we'd fetch this from the backend
  const mockUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: "+1 (555) 123-4567",
    address: "123 Main St",
    city: "Anytown",
    state: "CA",
    zipCode: "12345",
    country: "United States",
    bio: "Property management professional with 5+ years of experience.",
    profileImage: null,
  };

  const [formData, setFormData] = useState(mockUser);
  const [isEditing, setIsEditing] = useState(false);
  const { updateProfile, isLoading, error, successMessage } =
    useUpdateProfile();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real app, this would call the updateProfile mutation
      console.log("Update profile with:", formData);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const handleCancel = () => {
    setFormData(mockUser);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-medium">Personal Information</h2>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>

        <div className="p-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-md mb-4 flex items-center">
              <Check className="h-5 w-5 mr-2" />
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt={formData.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
              </div>

              {isEditing && (
                <div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, GIF or PNG. Max size 800KB.
                  </p>
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                ) : (
                  <p className="py-2">{formData.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled // Usually email changes require verification
                  />
                ) : (
                  <p className="py-2">{formData.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                ) : (
                  <p className="py-2">{formData.phone}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">Role</label>
                <p className="py-2 capitalize">{formData.role}</p>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-sm font-medium mb-3">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium">
                    Street Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p className="py-2">{formData.address}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p className="py-2">{formData.city}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">
                    State/Province
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p className="py-2">{formData.state}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">
                    ZIP/Postal Code
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p className="py-2">{formData.zipCode}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Country</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p className="py-2">{formData.country}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label className="block text-sm font-medium">Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                />
              ) : (
                <p className="py-2">{formData.bio}</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Security Settings Component
const SecuritySettings = ({ showChangePassword, setShowChangePassword }) => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setError("All fields are required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      // In a real app, this would call an API
      console.log("Changing password:", passwordForm);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call

      setSuccess("Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
        setShowChangePassword(false);
      }, 3000);
    } catch (err) {
      setError("Failed to change password");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-medium">Account Security</h2>
        </div>

        <div className="p-4">
          {/* Password Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Password</h3>
                <p className="text-sm text-muted-foreground">
                  Change your password or set up two-factor authentication
                </p>
              </div>
              {!showChangePassword && (
                <Button onClick={() => setShowChangePassword(true)}>
                  Change Password
                </Button>
              )}
            </div>

            {showChangePassword && (
              <div className="border rounded-md p-4">
                <h4 className="text-sm font-medium mb-3">Change Password</h4>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-md mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-md mb-4 flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    {success}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border rounded-md pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border rounded-md pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters and include a mix
                      of letters, numbers, and symbols.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setShowChangePassword(false);
                        setError(null);
                        setSuccess(null);
                        setPasswordForm({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Update Password</Button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Two-Factor Authentication */}
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline">Set Up 2FA</Button>
            </div>
          </div>

          {/* Login Sessions */}
          <div className="mt-6 pt-6 border-t space-y-4">
            <div>
              <h3 className="font-medium">Active Sessions</h3>
              <p className="text-sm text-muted-foreground">
                Manage your active login sessions
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 border rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">
                      Chrome on Windows • New York, USA
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Started 2 hours ago
                    </p>
                  </div>
                  <div className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                    Current
                  </div>
                </div>
              </div>

              <div className="p-3 border rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Safari on iPhone</p>
                    <p className="text-sm text-muted-foreground">
                      iOS • Los Angeles, USA
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last active 3 days ago
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8">
                    <X className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Settings Component
const NotificationSettings = () => {
  // Sample notification settings
  const [emailNotifications, setEmailNotifications] = useState({
    newTenant: true,
    paymentReceived: true,
    maintenanceRequest: true,
    leaseEnding: true,
    systemUpdates: false,
  });

  const [appNotifications, setAppNotifications] = useState({
    newTenant: true,
    paymentReceived: true,
    maintenanceRequest: true,
    leaseEnding: true,
    systemUpdates: true,
  });

  const [smsNotifications, setSmsNotifications] = useState({
    newTenant: false,
    paymentReceived: false,
    maintenanceRequest: true,
    leaseEnding: false,
    systemUpdates: false,
  });

  const handleEmailChange = (setting: string) => {
    setEmailNotifications((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleAppChange = (setting: string) => {
    setAppNotifications((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleSmsChange = (setting: string) => {
    setSmsNotifications((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-medium">Notification Preferences</h2>
          <Button>Save Changes</Button>
        </div>

        <div className="p-4">
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Manage how you receive notifications about activities and updates.
            </p>

            {/* Notification Types Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium">
                      Notification Type
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium">
                      Email
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium">
                      In-App
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium">
                      SMS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <NotificationRow
                    title="New Tenant Registration"
                    description="When a new tenant signs up or is added"
                    email={emailNotifications.newTenant}
                    app={appNotifications.newTenant}
                    sms={smsNotifications.newTenant}
                    onEmailChange={() => handleEmailChange("newTenant")}
                    onAppChange={() => handleAppChange("newTenant")}
                    onSmsChange={() => handleSmsChange("newTenant")}
                  />
                  <NotificationRow
                    title="Payment Received"
                    description="When a payment is made or recorded"
                    email={emailNotifications.paymentReceived}
                    app={appNotifications.paymentReceived}
                    sms={smsNotifications.paymentReceived}
                    onEmailChange={() => handleEmailChange("paymentReceived")}
                    onAppChange={() => handleAppChange("paymentReceived")}
                    onSmsChange={() => handleSmsChange("paymentReceived")}
                  />
                  <NotificationRow
                    title="Maintenance Requests"
                    description="Updates on maintenance and repair requests"
                    email={emailNotifications.maintenanceRequest}
                    app={appNotifications.maintenanceRequest}
                    sms={smsNotifications.maintenanceRequest}
                    onEmailChange={() =>
                      handleEmailChange("maintenanceRequest")
                    }
                    onAppChange={() => handleAppChange("maintenanceRequest")}
                    onSmsChange={() => handleSmsChange("maintenanceRequest")}
                  />
                  <NotificationRow
                    title="Lease Ending Reminder"
                    description="Notifications about upcoming lease expirations"
                    email={emailNotifications.leaseEnding}
                    app={appNotifications.leaseEnding}
                    sms={smsNotifications.leaseEnding}
                    onEmailChange={() => handleEmailChange("leaseEnding")}
                    onAppChange={() => handleAppChange("leaseEnding")}
                    onSmsChange={() => handleSmsChange("leaseEnding")}
                  />
                  <NotificationRow
                    title="System Updates"
                    description="Information about new features and improvements"
                    email={emailNotifications.systemUpdates}
                    app={appNotifications.systemUpdates}
                    sms={smsNotifications.systemUpdates}
                    onEmailChange={() => handleEmailChange("systemUpdates")}
                    onAppChange={() => handleAppChange("systemUpdates")}
                    onSmsChange={() => handleSmsChange("systemUpdates")}
                  />
                </tbody>
              </table>
            </div>

            {/* Email Settings */}
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Email Notification Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Frequency</p>
                    <p className="text-sm text-muted-foreground">
                      How often you want to receive email notifications
                    </p>
                  </div>
                  <select className="px-3 py-2 border rounded-md">
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Summary</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Format</p>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred email format
                    </p>
                  </div>
                  <select className="px-3 py-2 border rounded-md">
                    <option value="html">HTML</option>
                    <option value="text">Plain Text</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Other Notification Settings */}
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Other Notification Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable push notifications in the browser
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="pushNotifications"
                      className="mr-2 h-4 w-4"
                      defaultChecked
                    />
                    <label htmlFor="pushNotifications" className="text-sm">
                      Enable
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Do Not Disturb</p>
                    <p className="text-sm text-muted-foreground">
                      Set times when you don't want to receive notifications
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="doNotDisturb"
                      className="mr-2 h-4 w-4"
                    />
                    <label htmlFor="doNotDisturb" className="text-sm">
                      Enable
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Row Component
const NotificationRow = ({
  title,
  description,
  email,
  app,
  sms,
  onEmailChange,
  onAppChange,
  onSmsChange,
}) => (
  <tr className="hover:bg-muted/50 transition-colors">
    <td className="py-3 px-4">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </td>
    <td className="py-3 px-4 text-center">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={email}
        onChange={onEmailChange}
      />
    </td>
    <td className="py-3 px-4 text-center">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={app}
        onChange={onAppChange}
      />
    </td>
    <td className="py-3 px-4 text-center">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={sms}
        onChange={onSmsChange}
      />
    </td>
  </tr>
);

// Appearance Settings Component
const AppearanceSettings = () => {
  const [theme, setTheme] = useState("light"); // "light", "dark", "system"
  const [fontSize, setFontSize] = useState("medium"); // "small", "medium", "large"
  const [compactMode, setCompactMode] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-medium">Appearance Settings</h2>
        </div>

        <div className="p-4">
          <div className="space-y-6">
            {/* Theme */}
            <div className="space-y-4">
              <h3 className="font-medium">Theme</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  className={`p-4 border rounded-lg flex flex-col items-center transition-colors ${
                    theme === "light" ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setTheme("light")}
                >
                  <div className="w-16 h-16 bg-white border rounded-full mb-3 flex items-center justify-center">
                    <Sun className="h-8 w-8 text-amber-500" />
                  </div>
                  <span className="font-medium">Light Mode</span>
                </button>

                <button
                  className={`p-4 border rounded-lg flex flex-col items-center transition-colors ${
                    theme === "dark" ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setTheme("dark")}
                >
                  <div className="w-16 h-16 bg-gray-900 border rounded-full mb-3 flex items-center justify-center">
                    <Moon className="h-8 w-8 text-indigo-400" />
                  </div>
                  <span className="font-medium">Dark Mode</span>
                </button>

                <button
                  className={`p-4 border rounded-lg flex flex-col items-center transition-colors ${
                    theme === "system" ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setTheme("system")}
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-white to-gray-900 border rounded-full mb-3 flex items-center justify-center">
                    <div className="bg-white w-8 h-16 rounded-l-full"></div>
                  </div>
                  <span className="font-medium">System Default</span>
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-medium">Text Size</h3>
              <div className="flex justify-between items-center">
                <button
                  className={`px-4 py-2 border rounded-md ${
                    fontSize === "small" ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setFontSize("small")}
                >
                  <span className="text-sm">Small</span>
                </button>

                <button
                  className={`px-4 py-2 border rounded-md ${
                    fontSize === "medium" ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setFontSize("medium")}
                >
                  <span className="text-base">Medium</span>
                </button>

                <button
                  className={`px-4 py-2 border rounded-md ${
                    fontSize === "large" ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setFontSize("large")}
                >
                  <span className="text-lg">Large</span>
                </button>
              </div>
            </div>

            {/* Layout Options */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-medium">Layout Options</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compact Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Reduces spacing in the interface for more content
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="compactMode"
                      className="mr-2 h-4 w-4"
                      checked={compactMode}
                      onChange={(e) => setCompactMode(e.target.checked)}
                    />
                    <label htmlFor="compactMode" className="text-sm">
                      Enable
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button>Save Preferences</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Privacy Settings Component
const PrivacySettings = () => {
  // Sample privacy settings
  const [dataSharing, setDataSharing] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [contactInfo, setContactInfo] = useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-medium">Privacy Settings</h2>
        </div>

        <div className="p-4">
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Manage how your information is used and shared.
            </p>

            {/* Data Sharing */}
            <div className="space-y-4">
              <h3 className="font-medium">Data Sharing</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Share usage data</p>
                    <p className="text-sm text-muted-foreground">
                      Allow us to collect anonymous usage data to improve our
                      services
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="dataSharing"
                      className="mr-2 h-4 w-4"
                      checked={dataSharing}
                      onChange={(e) => setDataSharing(e.target.checked)}
                    />
                    <label htmlFor="dataSharing" className="text-sm">
                      Enable
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analytics cookies</p>
                    <p className="text-sm text-muted-foreground">
                      Allow analytics cookies to track your usage patterns
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="analytics"
                      className="mr-2 h-4 w-4"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                    />
                    <label htmlFor="analytics" className="text-sm">
                      Enable
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Display contact information</p>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your contact information
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="contactInfo"
                      className="mr-2 h-4 w-4"
                      checked={contactInfo}
                      onChange={(e) => setContactInfo(e.target.checked)}
                    />
                    <label htmlFor="contactInfo" className="text-sm">
                      Enable
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Export and Deletion */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="font-medium">Data Management</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Export your data</p>
                    <p className="text-sm text-muted-foreground">
                      Download a copy of your personal data
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Export Data
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button>Save Privacy Settings</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Integrations Settings Component
const IntegrationsSettings = () => {
  // Sample integrations
  const integrations = [
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Sync events and appointments with Google Calendar",
      icon: <Calendar className="h-8 w-8" />,
      connected: true,
      lastSync: "2023-06-10T10:30:00Z",
    },
    {
      id: "stripe",
      name: "Stripe Payments",
      description: "Process payments and manage transactions",
      icon: <CreditCard className="h-8 w-8" />,
      connected: true,
      lastSync: "2023-06-12T15:45:00Z",
    },
    {
      id: "mailchimp",
      name: "Mailchimp",
      description: "Email marketing and tenant communications",
      icon: <Mail className="h-8 w-8" />,
      connected: false,
      lastSync: null,
    },
    {
      id: "twilio",
      name: "Twilio",
      description: "SMS notifications and tenant communications",
      icon: <Phone className="h-8 w-8" />,
      connected: false,
      lastSync: null,
    },
    {
      id: "google-maps",
      name: "Google Maps",
      description: "Integrate property locations and directions",
      icon: <MapPin className="h-8 w-8" />,
      connected: true,
      lastSync: "2023-06-08T09:15:00Z",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-medium">Connected Services</h2>
        </div>

        <div className="p-4">
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Manage third-party integrations and connected services. Connect
              your favorite tools to streamline your workflow.
            </p>

            {/* Integrations List */}
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                        {integration.icon}
                      </div>
                      <div>
                        <h3 className="font-medium">{integration.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {integration.description}
                        </p>
                        {integration.connected && integration.lastSync && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last synced:{" "}
                            {new Date(integration.lastSync).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      {integration.connected ? (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Configure
                          </Button>
                          <Button variant="outline" size="sm">
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm">Connect</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Developer APIs */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="font-medium">Developer APIs</h3>
              <p className="text-sm text-muted-foreground">
                Access API keys and developer tools to build custom
                integrations.
              </p>

              <div className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">API Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Generate API keys for custom integrations
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage API Keys
                  </Button>
                </div>
              </div>
            </div>

            {/* Add New Integration */}
            <div className="border-t pt-6">
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Browse More Integrations
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

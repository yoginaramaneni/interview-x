import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Dialog } from '../components/ui/Modal';
import { Toast, ToastContainer } from '../components/ui/Notification';
import {
  User,
  Settings,
  Bell,
  Lock,
  CreditCard,
  Trash2,
  Globe,
  Sun,
  Moon,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, updateUserProfile } = useAuth();
  
  const queryParams = new URLSearchParams(window.location.search);
  const defaultTab = queryParams.get('tab') || 'profile';

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);
  
  const [profileName, setProfileName] = useState(user?.full_name || 'John Doe');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'johndoe@example.com');
  const [profileRole, setProfileRole] = useState(user?.role || 'Senior Frontend Developer');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.full_name || '');
      setProfileEmail(user.email || '');
      setProfileRole(user.role || '');
    }
  }, [user]);

  const addToast = (message: string, type: 'success' | 'info' | 'error') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateUserProfile({
        full_name: profileName,
      });
      addToast('Profile changes saved successfully!', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to save profile changes.';
      addToast(errMsg, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Security credentials updated!', 'success');
  };

  const handleDeleteAccount = () => {
    setDeleteOpen(false);
    addToast('Mock request for account deletion has been logged.', 'info');
  };

  const mockInvoices = [
    { id: 'INV-0824', date: 'Jul 01, 2026', amount: '$29.00', status: 'Paid' },
    { id: 'INV-0713', date: 'Jun 01, 2026', amount: '$29.00', status: 'Paid' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Warning dialog modal */}
      <Dialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Confirm Account Deletion"
        description="Are you absolutely sure you want to delete your account? This action is irreversible. All your mock interview logs, scores, and ATS roadmap files will be deleted forever."
        footer={
          <div className="flex gap-3">
            <Button onClick={() => setDeleteOpen(false)} variant="outline" size="sm">
              Cancel
            </Button>
            <Button onClick={handleDeleteAccount} variant="danger" size="sm">
              Delete Forever
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-3 p-4.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Deleting your account will also cancel any active premium pro subscriptions.</span>
        </div>
      </Dialog>

      {/* Header title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure profile details, application appearance, security settings, and billing tiers.</p>
      </div>

      <Card className="flex flex-col">
        <Tabs defaultValue={defaultTab} className="w-full">
          <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-800/80">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="p-6">
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xl font-bold font-sans select-none">
                    {(() => {
                      if (!profileName) return 'JD';
                      const parts = profileName.split(' ');
                      if (parts.length >= 2) {
                        return (parts[0][0] + parts[1][0]).toUpperCase();
                      }
                      return parts[0].slice(0, 2).toUpperCase();
                    })()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">Avatar Image</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">JPG or PNG. Max 2MB.</p>
                    <button type="button" className="mt-2 text-xs font-bold text-blue-650 dark:text-blue-450 hover:underline">
                      Upload Avatar
                    </button>
                  </div>
                </div>

                <Input
                  id="name"
                  label="Display Name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  disabled
                />
                <Input
                  id="role"
                  label="Target Job Role"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  disabled
                />

                <Button type="submit" size="sm" className="mt-2" isLoading={isUpdating} disabled={isUpdating}>
                  Save Settings
                </Button>
              </form>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <div className="space-y-4 max-w-lg">
                <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Application Theme</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed -mt-2">
                  Select your interface color theme preference.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => theme === 'dark' && toggleTheme()}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-colors
                      ${theme === 'light'
                        ? 'border-blue-600 bg-blue-50/10 text-blue-600'
                        : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                      }
                    `}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="text-xs font-bold">Light Theme</span>
                  </button>
                  <button
                    onClick={() => theme === 'light' && toggleTheme()}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-colors
                      ${theme === 'dark'
                        ? 'border-blue-500 bg-blue-900/10 text-blue-400'
                        : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-500 hover:border-slate-350 dark:hover:border-slate-700'
                      }
                    `}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="text-xs font-bold">Dark Theme</span>
                  </button>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800/85">
                  <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Language Settings</h3>
                  <select className="w-full max-w-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="en">English (US)</option>
                    <option value="es">Spanish</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="space-y-4 max-w-lg">
                <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Email Preferences</h3>
                
                <div className="space-y-3.5">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Weekly Progress Digests</span>
                      <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">Receive a weekly summary email detailing mock scores, completed sandboxes, and learning trends.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Interview Reminders</span>
                      <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">Receive alerts 15 minutes before any scheduled technical mock rounds.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Product Announcements</span>
                      <p className="text-[10px] text-slate-455 mt-0.5 leading-relaxed">Receive emails about new features, system updates, and pricing plans.</p>
                    </div>
                  </label>
                </div>
                <Button onClick={() => addToast('Notification rules updated!', 'success')} size="sm" className="mt-4">
                  Save Preferences
                </Button>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <form onSubmit={handleSaveSecurity} className="space-y-5 max-w-lg">
                <Input
                  id="currPass"
                  type="password"
                  label="Current Password"
                  placeholder="••••••••••••"
                />
                <Input
                  id="newPass"
                  type="password"
                  label="New Password"
                  placeholder="••••••••••••"
                />
                <Input
                  id="confNewPass"
                  type="password"
                  label="Confirm New Password"
                  placeholder="••••••••••••"
                />

                <div className="pt-2">
                  <Button type="submit" size="sm">
                    Update Password
                  </Button>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-red-650 dark:text-red-405 uppercase tracking-wider">Danger Zone</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Permanently delete your profile data. This is completely irreversible.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete Account
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              <div className="space-y-6 max-w-2xl">
                {/* Active Plan details */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-blue-650 dark:text-blue-450 uppercase font-bold tracking-wider">ACTIVE SUBSCRIPTION</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">Premium Pro Plan</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Next renewal date: August 25, 2026 ($29.00/month)</p>
                  </div>
                  <Button variant="outline" size="sm" className="self-start sm:self-auto">
                    Manage Subscription
                  </Button>
                </div>

                {/* Invoices List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Invoice History</h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-[14px] overflow-hidden bg-white dark:bg-slate-900/60">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-500 font-bold">
                          <th className="p-4">Invoice ID</th>
                          <th className="p-4">Billing Date</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                        {mockInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/20">
                            <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">{inv.id}</td>
                            <td className="p-4">{inv.date}</td>
                            <td className="p-4 font-bold">{inv.amount}</td>
                            <td className="p-4"><span className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">{inv.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

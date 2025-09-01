import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Globe, 
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import FormField from '../components/FormField';

interface SystemSettings {
  notifications: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    pushNotifications: boolean;
    alertThresholds: {
      highVolume: number;
      delayedFlights: number;
      failedPayments: number;
    };
  };
  security: {
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
    };
    twoFactorAuth: boolean;
  };
  system: {
    maintenanceMode: boolean;
    debugMode: boolean;
    cacheTimeout: number;
    maxBookingsPerUser: number;
  };
  integrations: {
    paymentGateway: string;
    emailProvider: string;
    smsProvider: string;
  };
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      pushNotifications: true,
      alertThresholds: {
        highVolume: 100,
        delayedFlights: 30,
        failedPayments: 5
      }
    },
    security: {
      sessionTimeout: 24,
      passwordPolicy: {
        minLength: 8,
        requireSpecialChars: true,
        requireNumbers: true
      },
      twoFactorAuth: false
    },
    system: {
      maintenanceMode: false,
      debugMode: false,
      cacheTimeout: 3600,
      maxBookingsPerUser: 50
    },
    integrations: {
      paymentGateway: 'stripe',
      emailProvider: 'sendgrid',
      smsProvider: 'twilio'
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate saving
    setTimeout(() => {
      setIsSaving(false);
      // Show success message
    }, 1000);
  };

  const updateSetting = (path: string[], value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newSettings;
    });
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-600">Configure your RadiantGo air cargo system</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Email Alerts</p>
                    <p className="text-sm text-gray-600">Receive email notifications for important events</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailAlerts}
                    onChange={(e) => updateSetting(['notifications', 'emailAlerts'], e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">SMS Alerts</p>
                    <p className="text-sm text-gray-600">Receive SMS notifications for critical alerts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.smsAlerts}
                    onChange={(e) => updateSetting(['notifications', 'smsAlerts'], e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-600">Browser push notifications for real-time updates</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.pushNotifications}
                    onChange={(e) => updateSetting(['notifications', 'pushNotifications'], e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Alert Thresholds</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="High Volume Threshold">
                    <input
                      type="number"
                      value={settings.notifications.alertThresholds.highVolume}
                      onChange={(e) => updateSetting(['notifications', 'alertThresholds', 'highVolume'], parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>
                  <FormField label="Delayed Flights (minutes)">
                    <input
                      type="number"
                      value={settings.notifications.alertThresholds.delayedFlights}
                      onChange={(e) => updateSetting(['notifications', 'alertThresholds', 'delayedFlights'], parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>
                  <FormField label="Failed Payments">
                    <input
                      type="number"
                      value={settings.notifications.alertThresholds.failedPayments}
                      onChange={(e) => updateSetting(['notifications', 'alertThresholds', 'failedPayments'], parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormField>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Session Timeout (hours)">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting(['security', 'sessionTimeout'], parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>
                
                <FormField label="Minimum Password Length">
                  <input
                    type="number"
                    min="6"
                    max="32"
                    value={settings.security.passwordPolicy.minLength}
                    onChange={(e) => updateSetting(['security', 'passwordPolicy', 'minLength'], parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Require Special Characters</p>
                    <p className="text-sm text-gray-600">Passwords must contain special characters</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.security.passwordPolicy.requireSpecialChars}
                    onChange={(e) => updateSetting(['security', 'passwordPolicy', 'requireSpecialChars'], e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Require Numbers</p>
                    <p className="text-sm text-gray-600">Passwords must contain at least one number</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.security.passwordPolicy.requireNumbers}
                    onChange={(e) => updateSetting(['security', 'passwordPolicy', 'requireNumbers'], e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600">Enable 2FA for enhanced security</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactorAuth}
                    onChange={(e) => updateSetting(['security', 'twoFactorAuth'], e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-gray-900">System Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Cache Timeout (seconds)">
                  <input
                    type="number"
                    min="60"
                    value={settings.system.cacheTimeout}
                    onChange={(e) => updateSetting(['system', 'cacheTimeout'], parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>
                
                <FormField label="Max Bookings Per User">
                  <input
                    type="number"
                    min="1"
                    value={settings.system.maxBookingsPerUser}
                    onChange={(e) => updateSetting(['system', 'maxBookingsPerUser'], parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Maintenance Mode</p>
                    <p className="text-sm text-gray-600">Enable maintenance mode to restrict access</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.system.maintenanceMode}
                    onChange={(e) => updateSetting(['system', 'maintenanceMode'], e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Debug Mode</p>
                    <p className="text-sm text-gray-600">Enable detailed logging for troubleshooting</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.system.debugMode}
                    onChange={(e) => updateSetting(['system', 'debugMode'], e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>

              {settings.system.maintenanceMode && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-medium text-amber-800">
                      Maintenance mode is enabled. Only administrators can access the system.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-gray-900">Third-Party Integrations</h3>
              
              <div className="space-y-6">
                <FormField label="Payment Gateway">
                  <select
                    value={settings.integrations.paymentGateway}
                    onChange={(e) => updateSetting(['integrations', 'paymentGateway'], e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="razorpay">Razorpay</option>
                  </select>
                </FormField>

                <FormField label="Email Provider">
                  <select
                    value={settings.integrations.emailProvider}
                    onChange={(e) => updateSetting(['integrations', 'emailProvider'], e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="ses">Amazon SES</option>
                  </select>
                </FormField>

                <FormField label="SMS Provider">
                  <select
                    value={settings.integrations.smsProvider}
                    onChange={(e) => updateSetting(['integrations', 'smsProvider'], e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="twilio">Twilio</option>
                    <option value="nexmo">Vonage (Nexmo)</option>
                    <option value="textlocal">TextLocal</option>
                  </select>
                </FormField>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">
                    All integrations are properly configured and active.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Changes will be applied immediately after saving.
            </p>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
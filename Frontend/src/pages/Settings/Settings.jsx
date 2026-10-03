import React, { useState } from 'react';
import Breadcrumb from '../../components/Cards/Breadcrumb';
import Button from '../../components/Buttons/Button';
import InputField from '../../components/Forms/InputField';
import SelectField from '../../components/Forms/SelectField';
import TextareaField from '../../components/Forms/TextareaField';
import { INITIAL_ORG_INFO } from '../../constants/mockData';
import { showSuccessToast, showConfirmDialog } from '../../components/Modal/confirmDialog';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('organization'); // 'organization' | 'notifications' | 'payments' | 'roles'

  const [orgData, setOrgData] = useState({
    name: INITIAL_ORG_INFO.name,
    shortName: INITIAL_ORG_INFO.shortName,
    tagline: INITIAL_ORG_INFO.tagline,
    activeSemester: INITIAL_ORG_INFO.activeSemester,
    email: INITIAL_ORG_INFO.email,
    phone: INITIAL_ORG_INFO.phone,
    location: INITIAL_ORG_INFO.location,
    currency: 'USD ($)',
  });

  const [paymentConfig, setPaymentConfig] = useState({
    provider: 'Stripe',
    testMode: true,
    stripePublishableKey: 'pk_test_51MzSkylineCampusFlowDemoKey9412',
    razorpayKeyId: 'rzp_test_98319401284',
    allowCashOnPickup: true,
  });

  const handleSaveOrg = (e) => {
    e.preventDefault();
    showSuccessToast('Organization configuration updated successfully!');
  };

  const handleSavePayments = (e) => {
    e.preventDefault();
    showSuccessToast('Payment gateway credentials verified & saved in test mode.');
  };

  return (
    <div className="settings-page">
      <Breadcrumb
        items={[{ label: 'Account' }, { label: 'Settings' }]}
        title="Organization & System Settings"
      />

      <div className="row g-4">
        {/* Settings Navigation Sidebar */}
        <div className="col-12 col-md-3">
          <div className="cf-card p-2 bg-white">
            <nav className="nav flex-column gap-1">
              <button
                type="button"
                className={`nav-link text-start py-2.5 px-3 rounded-2 text-sm fw-medium border-0 ${
                  activeTab === 'organization' ? 'bg-primary text-white' : 'text-secondary bg-transparent hover-bg-light'
                }`}
                onClick={() => setActiveTab('organization')}
              >
                <i className="bi bi-building me-2" /> Organization Profile
              </button>

              <button
                type="button"
                className={`nav-link text-start py-2.5 px-3 rounded-2 text-sm fw-medium border-0 ${
                  activeTab === 'notifications' ? 'bg-primary text-white' : 'text-secondary bg-transparent hover-bg-light'
                }`}
                onClick={() => setActiveTab('notifications')}
              >
                <i className="bi bi-bell me-2" /> Notification Channels
              </button>

              <button
                type="button"
                className={`nav-link text-start py-2.5 px-3 rounded-2 text-sm fw-medium border-0 ${
                  activeTab === 'payments' ? 'bg-primary text-white' : 'text-secondary bg-transparent hover-bg-light'
                }`}
                onClick={() => setActiveTab('payments')}
              >
                <i className="bi bi-credit-card me-2" /> Payment Gateways
              </button>

              <button
                type="button"
                className={`nav-link text-start py-2.5 px-3 rounded-2 text-sm fw-medium border-0 ${
                  activeTab === 'roles' ? 'bg-primary text-white' : 'text-secondary bg-transparent hover-bg-light'
                }`}
                onClick={() => setActiveTab('roles')}
              >
                <i className="bi bi-shield-lock me-2" /> Roles & Permissions
              </button>
            </nav>
          </div>
        </div>

        {/* Settings Content Pane */}
        <div className="col-12 col-md-9">
          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <div className="cf-card p-4 p-md-5 bg-white">
              <h5 className="fw-bold text-dark mb-1 fs-6">Student Association Profile</h5>
              <p className="text-muted small mb-4">
                Club charter details displayed on student membership cards and official invoices
              </p>

              <form onSubmit={handleSaveOrg}>
                <div className="row g-3">
                  <div className="col-12 col-md-8">
                    <InputField
                      label="Full Student Organization Name"
                      value={orgData.name}
                      onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <InputField
                      label="Acronym / Short Name"
                      value={orgData.shortName}
                      onChange={(e) => setOrgData({ ...orgData, shortName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <InputField
                      label="Club Tagline / Mission"
                      value={orgData.tagline}
                      onChange={(e) => setOrgData({ ...orgData, tagline: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <InputField
                      label="Official Contact Email"
                      type="email"
                      value={orgData.email}
                      onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <InputField
                      label="Office Phone"
                      value={orgData.phone}
                      onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <InputField
                      label="Campus Office / Suite"
                      value={orgData.location}
                      onChange={(e) => setOrgData({ ...orgData, location: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <SelectField
                      label="Active Academic Semester"
                      value={orgData.activeSemester}
                      onChange={(e) => setOrgData({ ...orgData, activeSemester: e.target.value })}
                      options={['Spring 2026', 'Summer 2026', 'Fall 2026', 'Spring 2027']}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <Button type="submit" variant="primary" icon="bi-check-lg">
                    Update Organization Settings
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="cf-card p-4 p-md-5 bg-white">
              <h5 className="fw-bold text-dark mb-1 fs-6">Notification & Webhook Preferences</h5>
              <p className="text-muted small mb-4">
                Control alert automation for ticket purchases, member dues, and volunteer sign-ups
              </p>

              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center justify-content-between p-3 border rounded-3">
                  <div>
                    <strong className="text-dark d-block text-sm">Instant Ticket Purchase Alerts</strong>
                    <span className="text-muted text-xs">Notify executive board immediately when gala or workshop seats sell</span>
                  </div>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" defaultChecked />
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between p-3 border rounded-3">
                  <div>
                    <strong className="text-dark d-block text-sm">Automated WhatsApp Reminders</strong>
                    <span className="text-muted text-xs">Send 24h event reminders to ticket holders via WhatsApp Business API</span>
                  </div>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" defaultChecked />
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between p-3 border rounded-3">
                  <div>
                    <strong className="text-dark d-block text-sm">Weekly Financial Ledger Digest</strong>
                    <span className="text-muted text-xs">Email Sunday cashflow report directly to Treasurer and Faculty Advisor</span>
                  </div>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <Button
                  variant="primary"
                  onClick={() => showSuccessToast('Notification preferences updated')}
                >
                  Save Notification Settings
                </Button>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="cf-card p-4 p-md-5 bg-white">
              <h5 className="fw-bold text-dark mb-1 fs-6">Payment Gateway Integration (Mock UI)</h5>
              <p className="text-muted small mb-4">
                Configure credit card and online checkout for dues, galas, and hoodies
              </p>

              <div className="alert alert-info py-2 px-3 text-xs mb-4 d-flex align-items-center gap-2">
                <i className="bi bi-info-circle-fill fs-6" />
                <span>
                  Test mode is currently active. Simulated checkout will process without real credit cards.
                </span>
              </div>

              <form onSubmit={handleSavePayments}>
                <div className="mb-3">
                  <SelectField
                    label="Primary Payment Gateway"
                    value={paymentConfig.provider}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, provider: e.target.value })}
                    options={['Stripe (Global / US)', 'Razorpay (India / UPI)', 'Campus Cash Card']}
                  />
                </div>

                <InputField
                  label="Publishable API Key"
                  value={paymentConfig.stripePublishableKey}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, stripePublishableKey: e.target.value })}
                  icon="bi-key"
                />

                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="cashPickup"
                    checked={paymentConfig.allowCashOnPickup}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, allowCashOnPickup: e.target.checked })}
                  />
                  <label htmlFor="cashPickup" className="form-check-label text-sm text-secondary">
                    Allow Cash-on-Pickup at Student Union Room 304 for Merchandise Orders
                  </label>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <Button type="submit" variant="primary">
                    Save Payment Configuration
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="cf-card p-4 p-md-5 bg-white">
              <h5 className="fw-bold text-dark mb-1 fs-6">Role Privileges & Access Matrix</h5>
              <p className="text-muted small mb-4">
                Define what officers and general members can access within CampusFlow
              </p>

              <div className="table-responsive">
                <table className="cf-table">
                  <thead>
                    <tr>
                      <th>Module Privilege</th>
                      <th>President</th>
                      <th>Treasurer</th>
                      <th>Committee Lead</th>
                      <th>Member</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>View & Manage Treasury Ledger</td>
                      <td><i className="bi bi-check-circle-fill text-success" /> Full</td>
                      <td><i className="bi bi-check-circle-fill text-success" /> Full</td>
                      <td><i className="bi bi-dash text-muted" /> None</td>
                      <td><i className="bi bi-dash text-muted" /> None</td>
                    </tr>
                    <tr>
                      <td>Create & Schedule Events</td>
                      <td><i className="bi bi-check-circle-fill text-success" /> Full</td>
                      <td><i className="bi bi-eye text-primary" /> View</td>
                      <td><i className="bi bi-check-circle-fill text-success" /> Full</td>
                      <td><i className="bi bi-eye text-primary" /> View</td>
                    </tr>
                    <tr>
                      <td>Scan Door QR Tickets</td>
                      <td><i className="bi bi-check-circle-fill text-success" /> Yes</td>
                      <td><i className="bi bi-check-circle-fill text-success" /> Yes</td>
                      <td><i className="bi bi-check-circle-fill text-success" /> Yes</td>
                      <td><i className="bi bi-dash text-muted" /> No</td>
                    </tr>
                    <tr>
                      <td>Broadcast Club Announcements</td>
                      <td><i className="bi bi-check-circle-fill text-success" /> Yes</td>
                      <td><i className="bi bi-check-circle-fill text-success" /> Yes</td>
                      <td><i className="bi bi-check-circle-fill text-success" /> Yes</td>
                      <td><i className="bi bi-dash text-muted" /> Read only</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <Button
                  variant="primary"
                  onClick={() => showSuccessToast('Permissions matrix verified')}
                >
                  Confirm Permissions
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { parseApiError } from '../../lib/api-errors';
import { formatDate } from '../../lib/formatters';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { User, ShieldCheck, Mail, Calendar, Check, Save } from 'lucide-react';

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateProfile(name.trim());
      setSuccessMessage('Profile name updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-headline font-bold text-dark-text light:text-light-text">
          User Profile
        </h1>
        <p className="text-xs text-dark-muted light:text-light-muted mt-1">
          Manage your account details and view role authorizations
        </p>
      </div>

      {successMessage && (
        <div className="p-3 rounded bg-status-success-bg border border-status-success-border text-status-success-text text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded bg-status-error-bg border border-status-error-border text-status-error-text text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account summary card */}
        <Card className="md:col-span-1 h-fit">
          <CardContent className="flex flex-col items-center text-center p-6 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-[#0047FF]/15 border border-[#0047FF]/30 text-[#0047FF] flex items-center justify-center font-bold text-3xl shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-headline font-bold text-dark-text light:text-light-text">
                {user.name}
              </h2>
              <div className="mt-1">
                <Badge variant="info">{user.roleDisplayName || user.role}</Badge>
              </div>
            </div>

            <div className="w-full pt-4 border-t border-dark-border/60 space-y-3 text-xs text-left light:border-light-border">
              <div className="flex items-center gap-2 text-dark-muted light:text-light-muted">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-dark-muted light:text-light-muted">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Member since {formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-dark-muted light:text-light-muted">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>Account status: <strong className="text-dark-text light:text-light-text uppercase">{user.status}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Edit Profile and Permissions */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Display Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  label="Campus Email"
                  value={user.email}
                  disabled
                  helperText="Email address is governed by campus authentication and cannot be changed here."
                />

                <Input
                  label="Assigned System Role"
                  value={`${user.role} (${user.roleDisplayName})`}
                  disabled
                  helperText="Role changes must be administered by an authorized organization administrator."
                />

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
                    <Save className="w-4 h-4 mr-1.5" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Granular Permissions Matrix Display */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Role Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-dark-muted light:text-light-muted mb-4 leading-relaxed">
                The permissions below are granted by your assigned role ({user.role}) and validated strictly by the backend RBAC middleware.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {user.permissions && user.permissions.length > 0 ? (
                  user.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-1 rounded bg-dark-canvas border border-dark-border/80 font-mono text-[11px] text-cyan-400 light:bg-light-elevated light:border-light-border light:text-blue-600"
                    >
                      {perm}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-dark-muted">No custom permissions granted.</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

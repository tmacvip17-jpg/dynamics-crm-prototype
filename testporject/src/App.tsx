import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { authApi, type UserProfile } from "./lib/auth";
import AuthView from "./components/AuthView";
import Layout from "./components/Layout";
import OpportunityList from "./components/OpportunityList";
import OpportunityDetail from "./components/OpportunityDetail";
import AccountList from "./components/AccountList";
import AccountDetail from "./components/AccountDetail";
import ContactList from "./components/ContactList";
import ContactDetail from "./components/ContactDetail";
import LeadList from "./components/LeadList";
import LeadDetail from "./components/LeadDetail";
import CompetitorList from "./components/CompetitorList";
import CompetitorDetail from "./components/CompetitorDetail";
import ActivityList from "./components/ActivityList";
import ActivityDetail from "./components/ActivityDetail";
import ProjectApplicationList from "./components/ProjectApplicationList";
import ProjectApplicationDetail from "./components/ProjectApplicationDetail";
import OEMList from "./components/OEMList";
import OEMDetail from "./components/OEMDetail";
import OESList from "./components/OESList";
import OESDetail from "./components/OESDetail";
import ProjectVehicleModelList from "./components/ProjectVehicleModelList";
import ProjectVehicleModelDetail from "./components/ProjectVehicleModelDetail";
import Dashboards from "./components/Dashboards";
import AITopicParser from "./components/AITopicParser";
import ProjectPlanList from "./components/ProjectPlanList";
import ProjectPlanDetail from "./components/ProjectPlanDetail";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("dashboards");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targetPhase, setTargetPhase] = useState<string | null>(null);
  const [targetTaskId, setTargetTaskId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const prof = await authApi.getProfile(userId);
    setProfile(prof);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#0072c6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <AuthView onAuthSuccess={() => {}} />;
  }

  const navigateToDetail = (view: string, id?: string, phase?: string, taskId?: string) => {
    setSelectedId(id || null);
    setTargetPhase(phase || null);
    setTargetTaskId(taskId || null);
    setCurrentView(view);
  };

  const navigateToList = (view: string) => {
    if (view.includes('|')) {
      const parts = view.split('|');
      const [v, id, phase, encodedTaskId] = parts;
      navigateToDetail(
        v, id, phase,
        encodedTaskId ? decodeURIComponent(encodedTaskId) : undefined
      );
    } else {
      setSelectedId(null);
      setTargetPhase(null);
      setTargetTaskId(null);
      setCurrentView(view);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case "dashboards":
        return <Dashboards onNavigate={navigateToList} />;

      case "ai-topic-parser":
        return <AITopicParser />;

      case "activities":
        return (
          <ActivityList
            onSelect={(id) => navigateToDetail("activity-detail", id)}
            onNew={() => navigateToDetail("activity-detail")}
          />
        );
      case "activity-detail":
        return (
          <ActivityDetail
            id={selectedId}
            onSave={() => navigateToList("activities")}
            onBack={() => navigateToList("activities")}
          />
        );
      case "project-plans":
        return (
          <ProjectPlanList
            onSelect={(id) => navigateToDetail("project-plan-detail", id)}
            onNew={() => navigateToDetail("project-plan-detail")}
          />
        );
      case "project-plan-detail":
        return (
          <ProjectPlanDetail
            id={selectedId || "new"}
            initialPhase={targetPhase}
            initialTaskId={targetTaskId}
            onBack={() => navigateToList("project-plans")}
          />
        );
      case "project-applications":
        return (
          <ProjectApplicationList
            onSelect={(id) => navigateToDetail("project-application-detail", id)}
            onNew={() => navigateToDetail("project-application-detail")}
          />
        );
      case "project-application-detail":
        return (
          <ProjectApplicationDetail
            id={selectedId}
            onSave={() => navigateToList("project-applications")}
            onBack={() => navigateToList("project-applications")}
          />
        );
      case "oems":
        return (
          <OEMList
            onSelect={(id) => navigateToDetail("oem-detail", id)}
            onNew={() => navigateToDetail("oem-detail")}
          />
        );
      case "oem-detail":
        return (
          <OEMDetail
            id={selectedId}
            onSave={() => navigateToList("oems")}
            onBack={() => navigateToList("oems")}
          />
        );
      case "oes":
        return (
          <OESList
            onSelect={(id) => navigateToDetail("oes-detail", id)}
            onNew={() => navigateToDetail("oes-detail")}
          />
        );
      case "oes-detail":
        return (
          <OESDetail
            id={selectedId}
            onSave={() => navigateToList("oes")}
            onBack={() => navigateToList("oes")}
          />
        );
      case "vehicle-models":
        return (
          <ProjectVehicleModelList
            onSelect={(id) => navigateToDetail("vehicle-model-detail", id)}
            onNew={() => navigateToDetail("vehicle-model-detail")}
          />
        );
      case "vehicle-model-detail":
        return (
          <ProjectVehicleModelDetail
            id={selectedId}
            onSave={() => navigateToList("vehicle-models")}
            onBack={() => navigateToList("vehicle-models")}
          />
        );

      case "opportunities":
        return (
          <OpportunityList
            onSelect={(id) => navigateToDetail("opportunity-detail", id)}
            onNew={() => navigateToDetail("opportunity-detail")}
          />
        );
      case "opportunity-detail":
        return (
          <OpportunityDetail
            id={selectedId}
            profile={profile}
            onSave={() => navigateToList("opportunities")}
            onBack={() => navigateToList("opportunities")}
          />
        );

      case "accounts":
        return (
          <AccountList
            onSelect={(id) => navigateToDetail("account-detail", id)}
            onNew={() => navigateToDetail("account-detail")}
          />
        );
      case "account-detail":
        return (
          <AccountDetail
            id={selectedId}
            profile={profile}
            onSave={() => navigateToList("accounts")}
            onBack={() => navigateToList("accounts")}
          />
        );

      case "contacts":
        return (
          <ContactList
            onSelect={(id) => navigateToDetail("contact-detail", id)}
            onNew={() => navigateToDetail("contact-detail")}
          />
        );
      case "contact-detail":
        return (
          <ContactDetail
            id={selectedId}
            onSave={() => navigateToList("contacts")}
            onBack={() => navigateToList("contacts")}
          />
        );

      case "leads":
        return (
          <LeadList
            onSelect={(id) => navigateToDetail("lead-detail", id)}
            onNew={() => navigateToDetail("lead-detail")}
          />
        );
      case "lead-detail":
        return (
          <LeadDetail
            id={selectedId}
            onSave={() => navigateToList("leads")}
            onBack={() => navigateToList("leads")}
          />
        );

      case "competitors":
        return (
          <CompetitorList
            onSelect={(id) => navigateToDetail("competitor-detail", id)}
            onNew={() => navigateToDetail("competitor-detail")}
          />
        );
      case "competitor-detail":
        return (
          <CompetitorDetail
            id={selectedId}
            onSave={() => navigateToList("competitors")}
            onBack={() => navigateToList("competitors")}
          />
        );

      case "settings":
        return <Settings profile={profile} onNavigate={navigateToList} onRefreshProfile={() => session && fetchProfile(session.user.id)} />;

      default:
        return <Dashboards onNavigate={navigateToList} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={navigateToList} 
      profile={profile}
      onLogout={() => authApi.signOut()}
    >
      {renderContent()}
    </Layout>
  );
}

function Settings({ profile, onNavigate, onRefreshProfile }: { profile: UserProfile | null, onNavigate: (v: string) => void, onRefreshProfile: () => void }) {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'profile'>('profile');
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [r, u] = await Promise.all([
        authApi.listRoles(),
        authApi.listProfiles()
      ]);
      setRoles(r);
      setUsers(u);
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: `Database error: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      await authApi.updateProfile(profile.id, { full_name: profileForm.full_name, avatar_url: profileForm.avatar_url });
      setStatus({ type: 'success', message: 'Profile updated successfully' });
      onRefreshProfile();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsLoading(true);
    try {
      const url = await authApi.uploadAvatar(profile.id, file);
      setProfileForm(prev => ({ ...prev, avatar_url: url }));
      setStatus({ type: 'success', message: 'Avatar updated successfully' });
      onRefreshProfile();
    } catch (err: any) {
      setStatus({ type: 'error', message: `Upload failed: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name) return;
    setIsLoading(true);
    try {
      await authApi.createRole(newRole.name, newRole.description);
      setStatus({ type: 'success', message: 'New role created successfully' });
      setNewRole({ name: '', description: '' });
      setIsCreatingRole(false);
      fetchData();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (roleName === 'Administrator') {
      setStatus({ type: 'error', message: 'Cannot delete the Administrator role' });
      return;
    }
    if (!confirm(`Are you sure you want to delete the "${roleName}" role? This will affect all users assigned to it.`)) return;
    
    setIsLoading(true);
    try {
      await authApi.deleteRole(roleId);
      setStatus({ type: 'success', message: 'Role deleted successfully' });
      fetchData();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, roleId: string) => {
    try {
      await authApi.updateProfileRole(userId, roleId);
      setStatus({ type: 'success', message: 'User role updated successfully' });
      fetchData();
      onRefreshProfile(); // Trigger global UI sync
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;
    try {
      await authApi.updateRolePermissions(editingRole.id, editingRole.permissions);
      setStatus({ type: 'success', message: 'Role permissions updated' });
      setEditingRole(null);
      fetchData();
      onRefreshProfile(); // Trigger global UI sync
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  const menuOptions = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'activities', label: 'Activities' },
    { key: 'project_plans', label: 'Project Plans' },
    { key: 'ai-topic-parser', label: 'AI Topic Parsing' },
    { key: 'project-applications', label: 'Project Applications' },
    { key: 'oems', label: 'OEMs' },
    { key: 'oes', label: 'OES' },
    { key: 'vehicle-models', label: 'Vehicle Models' },
    { key: 'accounts', label: 'Accounts' },
    { key: 'contacts', label: 'Contacts' },
    { key: 'leads', label: 'Leads' },
    { key: 'opportunities', label: 'Opportunities' },
    { key: 'competitors', label: 'Competitors' },
    { key: 'settings', label: 'Admin Settings' }
  ];

  return (
    <div className="absolute inset-0 overflow-y-auto bg-slate-50 custom-scrollbar">
      <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32">
      {/* Header - Responsive Flex */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your personal profile and system configurations.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm font-bold text-slate-700 text-sm"
        >
          <span className={`material-symbols-outlined text-[20px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
          Sync Data
        </button>
      </div>

      {status && (
        <div className={`mb-8 p-4 rounded-xl border-2 ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} animate-in fade-in slide-in-from-top-4 duration-300`}>
          <div className="flex justify-between items-center text-sm font-bold">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">{status.type === 'success' ? 'check_circle' : 'error'}</span>
              {status.message}
            </div>
            <button onClick={() => setStatus(null)} className="material-symbols-outlined text-[18px]">close</button>
          </div>
        </div>
      )}

      {/* Tabs Control - Responsive Scroll */}
      <div className="flex gap-1 mb-6 bg-slate-200/50 p-1 rounded-xl w-full md:w-fit overflow-x-auto no-scrollbar">
        <button 
          onClick={() => { setActiveTab('profile'); setEditingRole(null); }}
          className={`whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          My Profile
        </button>
        {profile?.role?.permissions?.menus?.includes('settings') && (
          <>
            <button 
              onClick={() => { setActiveTab('users'); setEditingRole(null); }}
              className={`whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Account Mapping
            </button>
            <button 
              onClick={() => { setActiveTab('roles'); setEditingRole(null); }}
              className={`whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'roles' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Role Permissions & Menus
            </button>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'profile' && (
          <div className="p-6 md:p-10 max-w-4xl">
            <div className="flex flex-col md:flex-row gap-12">
              {/* Left Side: Avatar Display */}
              <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <div className="w-40 h-40 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-xl bg-slate-100 flex items-center justify-center">
                    {profileForm.avatar_url ? (
                      <img src={profileForm.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-4xl font-light text-slate-400">
                        {profile?.full_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-3xl">
                    <span className="material-symbols-outlined text-[32px]">photo_camera</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Upload New Avatar</p>
                  <p className="text-[10px] text-slate-400">Square images recommended.</p>
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="flex-1 space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
                  <p className="text-sm text-slate-500">Update your identity and display name.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Assigned Role</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                      {profile?.role?.name}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={isLoading}
                      className="w-full md:w-auto bg-blue-600 text-white px-10 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                      {isLoading ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-8 py-4">Identity</th>
                  <th className="px-8 py-4">Role Assigned</th>
                  <th className="px-8 py-4">Data Policy</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                          {u.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{u.full_name || 'New User'}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <select 
                        className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium cursor-pointer"
                        value={u.role_id || ''}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      >
                        <option value="" disabled>Select Role</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${u.role?.permissions?.data_access === 'all' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {u.role?.permissions?.data_access || 'OWN ONLY'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => {
                          const admin = roles.find(r => r.name === 'Administrator');
                          if (admin) handleUpdateRole(u.id, admin.id);
                        }}
                        className="text-[12px] font-bold text-blue-600 hover:underline"
                      >
                        Elevate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="p-6 md:p-10">
            {!editingRole ? (
              <div className="space-y-8">
                {/* Create Role Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Defined Roles</h2>
                    <p className="text-sm text-slate-500">Configure menu access and data visibility for each group.</p>
                  </div>
                  <button 
                    onClick={() => setIsCreatingRole(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-bold text-sm shadow-lg shadow-blue-500/20"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Create New Role
                  </button>
                </div>

                {/* Inline Creation Form */}
                {isCreatingRole && (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="max-w-2xl mx-auto space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">New Role Definition</h3>
                        <button onClick={() => setIsCreatingRole(false)} className="material-symbols-outlined text-slate-400 hover:text-slate-600">close</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Role Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Regional Manager" 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            value={newRole.name}
                            onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Description</label>
                          <input 
                            type="text" 
                            placeholder="Brief purpose of this role..." 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            value={newRole.description}
                            onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => setIsCreatingRole(false)}
                          className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleCreateRole}
                          disabled={!newRole.name || isLoading}
                          className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                          {isLoading ? 'Creating...' : 'Create Role'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Roles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roles.map(role => (
                    <div 
                      key={role.id} 
                      className="p-8 border border-slate-200 rounded-[2rem] hover:border-blue-500 hover:shadow-xl transition-all bg-white group flex flex-col h-full relative"
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id, role.name); }}
                        className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>

                      <div onClick={() => setEditingRole(role)} className="cursor-pointer flex-grow">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
                          </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">{role.name}</h3>
                        <p className="text-sm text-slate-500 mb-8 line-clamp-2">{role.description}</p>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-100">{role.permissions?.menus?.length || 0} MENUS</span>
                          <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-100 uppercase">{role.permissions?.data_access}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
                  <button onClick={() => setEditingRole(null)} className="w-12 h-12 flex items-center justify-center bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all shrink-0">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Editing: {editingRole.name}</h2>
                    <p className="text-slate-500 text-sm">{editingRole.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                  <div className="lg:col-span-3">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Menu Visibility Control
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {menuOptions.map(m => (
                        <label key={m.key} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${editingRole.permissions?.menus?.includes(m.key) ? 'border-blue-500 bg-blue-50/50' : 'border-slate-50 hover:border-slate-200'}`}>
                          <span className="text-[13px] font-bold text-slate-700">{m.label}</span>
                          <input 
                            type="checkbox" 
                            checked={editingRole.permissions?.menus?.includes(m.key)}
                            onChange={() => {
                              const menus = [...(editingRole.permissions?.menus || [])];
                              const i = menus.indexOf(m.key);
                              if (i > -1) menus.splice(i, 1); else menus.push(m.key);
                              setEditingRole({...editingRole, permissions: {...editingRole.permissions, menus}});
                            }}
                            className="w-5 h-5 rounded-lg text-blue-600 border-slate-200 focus:ring-blue-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-12">
                    <div>
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Data Access Policy
                      </h3>
                      <div className="space-y-3">
                        {['all', 'own'].map(policy => (
                          <button 
                            key={policy}
                            onClick={() => setEditingRole({...editingRole, permissions: {...editingRole.permissions, data_access: policy}})}
                            className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all ${editingRole.permissions?.data_access === policy ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-500/5' : 'border-slate-100 hover:border-slate-200'}`}
                          >
                            <div className="font-black text-slate-900 text-sm uppercase tracking-wide mb-1">
                              {policy === 'all' ? 'Full Visibility' : 'Owner Only'}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              {policy === 'all' ? 'Users can see all records in the system.' : 'Users can only see their own assigned records.'}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={handleSavePermissions} 
                      className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { authApi, type UserProfile } from "../lib/auth";

export default function Layout({
  children,
  currentView,
  onNavigate,
  profile,
  onLogout,
}: {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  profile: UserProfile | null;
  onLogout: () => void;
}) {
  const handleCommand = (action: string) => {
    alert(`\${action} successful!`);
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false);
  const [currentArea, setCurrentArea] = useState("Sales");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const hasPermission = (menuKey: string) => {
    if (!profile) return true; 
    if (profile.role?.name === 'Administrator') return true; // Administrator always has all permissions
    const menus = profile.role?.permissions?.menus;
    if (!Array.isArray(menus)) return true; // Default to show if schema is unexpected
    return menus.includes(menuKey);
  };

  useEffect(() => {
    const fetchAllReminders = async () => {
      console.log("Notif Center: Starting scan...");
      try {
        const plans = await (await import("../lib/api")).projectPlansApi.list();
        console.log("Notif Center: Fetched plans count:", plans?.length);
        if (!plans || !Array.isArray(plans)) return;

        const allReminders: any[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const soon = new Date(today);
        soon.setDate(today.getDate() + 7);
        
        console.log("Notif Center: Today is", today.toISOString(), "Soon is", soon.toISOString());

        plans.forEach((plan: any) => {
          // Identify if the current user is the overall project owner
          const isProjectOwner = plan.owner === profile.full_name;

          ['m0','m1','m2','m3','m4'].forEach(m => {
            // 1. Phase Deadline Notification
            // Only notify if the user IS the project owner
            const endDateStr = plan[`${m}_end`];
            if (endDateStr && isProjectOwner) {
              const endDate = new Date(endDateStr);
              if (endDate <= soon && plan.status !== 'Completed') {
                allReminders.push({
                  id: plan.id,
                  projectName: plan.name,
                  taskName: `Phase ${m.toUpperCase()} Deadline`,
                  dueDate: endDateStr,
                  phase: m.toUpperCase(),
                  isOverdue: endDate < today,
                  type: 'phase'
                });
              }
            }

            // 2. Individual Task Notifications
            let tasks = plan[`${m}_tasks`];
            if (typeof tasks === 'string' && tasks.trim()) {
              try { tasks = JSON.parse(tasks); } catch (e) { tasks = []; }
            }

            if (Array.isArray(tasks)) {
              tasks.forEach(t => {
                // Determine if this specific task is assigned to the current user
                const isTaskAssignee = t.owner === profile.full_name;
                
                // Show notification if:
                // - It's assigned to the user
                // - OR it's unassigned but the user owns the project (managerial responsibility)
                if (t.due_date && t.status !== 'Completed') {
                  const dueDate = new Date(t.due_date);
                  if (dueDate <= soon && (isTaskAssignee || (isProjectOwner && (!t.owner || t.owner === 'Unassigned')))) {
                    allReminders.push({
                      id: plan.id,
                      projectName: plan.name,
                      taskName: t.task || "Unnamed Task",
                      taskId: t.id || null,
                      itemDesc: t.item_description || "",
                      dueDate: t.due_date,
                      phase: m.toUpperCase(),
                      isOverdue: dueDate < today,
                      type: 'task'
                    });
                  }
                }
              });
            }
          });
        });
        
        console.log("Notif Center: Final reminders count:", allReminders.length);
        setNotifications(allReminders.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
      } catch (err) {
        console.error("Notif Center: Scan failed:", err);
      }
    };

    fetchAllReminders();
    window.addEventListener('tasksUpdated', fetchAllReminders);
    const interval = setInterval(fetchAllReminders, 1000 * 60 * 5);
    return () => {
      clearInterval(interval);
      window.removeEventListener('tasksUpdated', fetchAllReminders);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="bg-[#fdf8f6] text-slate-900 h-screen flex flex-col overflow-hidden font-sans antialiased">
      {/* Top Navbar */}
      <header className="bg-[#0072c6] text-white h-12 flex justify-between items-center px-4 shrink-0 z-50 relative">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="md:hidden p-1.5 hover:bg-[#005a9e] rounded transition-colors flex items-center justify-center outline-none shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
          <button className="hidden md:flex p-1.5 hover:bg-[#005a9e] rounded transition-colors items-center justify-center outline-none shrink-0">
            <span className="material-symbols-outlined text-[20px]">apps</span>
          </button>
          <div className="flex items-center items-center">
            <div className="font-semibold text-[15px] whitespace-nowrap">
              Dynamics 365
            </div>
            <div className="h-4 w-px bg-white/30 mx-2 hidden sm:block"></div>
            <div className="font-semibold text-[15px] hidden sm:block whitespace-nowrap">
              Sales Hub
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-xl mx-4 hidden md:block relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/70 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search Dataverse"
            className="w-full bg-black/10 border border-transparent hover:border-white/20 focus:bg-white focus:text-slate-900 focus:placeholder-slate-500 rounded py-1.5 pl-10 pr-4 text-[13px] transition-colors outline-none"
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasPermission('settings') && (
            <button 
              className="p-2 w-10 h-10 hidden md:flex items-center justify-center hover:bg-[#005a9e] rounded-full transition-colors"
              onClick={() => onNavigate('settings')}
            >
              <span className="material-symbols-outlined text-[20px]">
                settings
              </span>
            </button>
          )}
          <button className="p-2 w-10 h-10 hidden md:flex items-center justify-center hover:bg-[#005a9e] rounded-full transition-colors">
            <span className="material-symbols-outlined text-[20px]">help</span>
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`p-2 w-10 h-10 flex items-center justify-center hover:bg-[#005a9e] rounded-full transition-colors relative ${isNotifOpen ? 'bg-[#005a9e]' : ''}`}
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-[#0072c6] font-bold">
                  {notifications.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setIsNotifOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-slate-200 z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-slate-800">
                    <span className="text-[13px] font-bold uppercase tracking-wider">Notifications</span>
                    <span className="text-[11px] text-slate-500">{notifications.length} Active</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="px-6 py-12 text-center text-slate-400">
                        <span className="material-symbols-outlined text-[48px] block mb-2 opacity-20">notifications_off</span>
                        <p className="text-[13px]">No pending task reminders</p>
                      </div>
                    ) : (
                      notifications.map((n, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => {
                            const phaseSeg = n.phase.toLowerCase();
                            const taskIdSeg = encodeURIComponent(n.taskId || '');
                            onNavigate(`project-plan-detail|${n.id}|${phaseSeg}|${taskIdSeg}`); 
                            setIsNotifOpen(false);
                          }}
                          className="px-4 py-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer transition-colors group"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-[12px] font-bold ${n.isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                              {n.isOverdue ? 'Overdue' : 'Due Soon'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{n.dueDate}</span>
                          </div>
                          <h4 className="text-[13px] text-slate-900 font-medium group-hover:text-[#0072c6] transition-colors line-clamp-1">{n.taskName}</h4>
                          {n.itemDesc && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic">{n.itemDesc}</p>
                          )}
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{n.projectName} • {n.phase}</p>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-slate-100 text-center">
                      <button className="text-[12px] text-[#0072c6] font-medium hover:underline">View All Tasks</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="ml-1 md:ml-2 w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0 hover:ring-2 hover:ring-white/50 transition-all"
            >
              <img
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=random`}
                alt="User"
                className="w-full h-full object-cover bg-white"
              />
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setIsUserMenuOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-2xl border border-slate-200 z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xl font-bold text-[#0072c6]">
                          {profile?.full_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[14px] font-semibold text-slate-900 truncate">{profile?.full_name}</div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-tighter font-bold">{profile?.role?.name}</div>
                    </div>
                  </div>
                  <div className="py-1">
                    {hasPermission('settings') && (
                      <button 
                        onClick={() => { onNavigate('settings'); setIsUserMenuOpen(false); }}
                        className="w-full px-4 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">settings</span>
                        Personal Settings
                      </button>
                    )}
                    <button 
                      onClick={() => { onLogout(); setIsUserMenuOpen(false); }}
                      className="w-full px-4 py-2 text-left text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Overlay */}
        {isMobile && !isSidebarCollapsed && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-30 transition-opacity"
            onClick={() => setIsSidebarCollapsed(true)}
          ></div>
        )}

        {/* Sidebar */}
        <nav
          className={`bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-200 z-40 ${isMobile ? "absolute h-full shadow-2xl" : "relative transition-[width]"}`}
          style={{
            width: isMobile ? "220px" : isSidebarCollapsed ? "48px" : "220px",
            transform:
              isMobile && isSidebarCollapsed
                ? "translateX(-100%)"
                : "translateX(0)",
          }}
        >
          <div
            className={`p-4 flex items-center ${isSidebarCollapsed && !isMobile ? "justify-center" : "gap-3"}`}
          >
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex text-slate-500 hover:text-slate-700 outline-none shrink-0 items-center justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">
                menu
              </span>
            </button>
            {(!isSidebarCollapsed || isMobile) && (
              <div className="overflow-hidden whitespace-nowrap">
                <div className="font-semibold text-sm text-slate-800">
                  Sales Hub
                </div>
                <div className="text-[11px] text-slate-500">Dynamics 365</div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar py-2 overflow-x-hidden">
            {/* Nav Items */}
            <SidebarItem
              icon="home"
              label="Home"
              isCollapsed={isSidebarCollapsed && !isMobile}
            />
            <SidebarItem
              icon="schedule"
              label="Recent"
              isCollapsed={isSidebarCollapsed && !isMobile}
            />
            <SidebarItem
              icon="push_pin"
              label="Pinned"
              isCollapsed={isSidebarCollapsed && !isMobile}
            />

            {!isSidebarCollapsed || isMobile ? (
              <div className="mt-6 mb-2 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                My Work
              </div>
            ) : (
              <div className="my-2 border-t border-slate-200 mx-2" />
            )}
            {hasPermission('dashboard') && (
              <SidebarItem
                icon="dashboard"
                label="Dashboards"
                isCollapsed={isSidebarCollapsed && !isMobile}
                isActive={currentView === "dashboards"}
                onClick={() => {
                  onNavigate("dashboards");
                  if (isMobile) setIsSidebarCollapsed(true);
                }}
              />
            )}
            {hasPermission('activities') && (
              <SidebarItem
                icon="event_note"
                label="Activities"
                isCollapsed={isSidebarCollapsed && !isMobile}
                isActive={
                  currentView === "activities" ||
                  currentView === "activity-detail"
                }
                onClick={() => {
                  onNavigate("activities");
                  if (isMobile) setIsSidebarCollapsed(true);
                }}
              />
            )}
            {hasPermission('project_plans') && (
              <SidebarItem
                icon="assignment"
                label="Software Project Plans"
                isCollapsed={isSidebarCollapsed && !isMobile}
                isActive={
                  currentView === "project-plans" ||
                  currentView === "project-plan-detail"
                }
                onClick={() => {
                  onNavigate("project-plans");
                  if (isMobile) setIsSidebarCollapsed(true);
                }}
              />
            )}
            {hasPermission('ai-topic-parser') && (
              <SidebarItem
                icon="smart_toy"
                label="AI Topic Parsing"
                isCollapsed={isSidebarCollapsed && !isMobile}
                isActive={currentView === "ai-topic-parser"}
                onClick={() => {
                  onNavigate("ai-topic-parser");
                  if (isMobile) setIsSidebarCollapsed(true);
                }}
              />
            )}
            {hasPermission('project-applications') && (
              <SidebarItem
                icon="settings_applications"
                label="Project Applications"
                isCollapsed={isSidebarCollapsed && !isMobile}
                isActive={
                  currentView === "project-applications" ||
                  currentView === "project-application-detail"
                }
                onClick={() => {
                  onNavigate("project-applications");
                  if (isMobile) setIsSidebarCollapsed(true);
                }}
              />
            )}
            {hasPermission('oems') && (
              <SidebarItem
                icon="factory"
                label="OEMs"
                isCollapsed={isSidebarCollapsed && !isMobile}
                isActive={currentView === "oems" || currentView === "oem-detail"}
                onClick={() => {
                  onNavigate("oems");
                  if (isMobile) setIsSidebarCollapsed(true);
                }}
              />
            )}
            {hasPermission('oes') && (
              <SidebarItem
                icon="settings_input_component"
                label="OES"
                isCollapsed={isSidebarCollapsed && !isMobile}
                isActive={currentView === "oes" || currentView === "oes-detail"}
                onClick={() => {
                  onNavigate("oes");
                  if (isMobile) setIsSidebarCollapsed(true);
                }}
              />
            )}
            {hasPermission('vehicle-models') && (
              <SidebarItem
                icon="directions_car"
                label="Vehicle Models"
                isCollapsed={isSidebarCollapsed && !isMobile}
                isActive={currentView === "vehicle-models" || currentView === "vehicle-model-detail"}
                onClick={() => {
                  onNavigate("vehicle-models");
                  if (isMobile) setIsSidebarCollapsed(true);
                }}
              />
            )}

            {!isSidebarCollapsed || isMobile ? (
              <div className="mt-6 mb-2 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Customers
              </div>
            ) : (
              <div className="my-2 border-t border-slate-200 mx-2" />
            )}
            {hasPermission('accounts') && (
              <SidebarItem
                icon="group"
                label="Accounts"
                isCollapsed={isSidebarCollapsed && !isMobile}
                isActive={
                  currentView === "accounts" || currentView === "account-detail"
                }
                onClick={() => {
                  onNavigate("accounts");
                  if (isMobile) setIsSidebarCollapsed(true);
                }}
              />
            )}
            {hasPermission('contacts') && (
              <SidebarItem
                icon="person"
                label="Contacts"
                isCollapsed={isSidebarCollapsed && !isMobile}
                isActive={
                  currentView === "contacts" || currentView === "contact-detail"
                }
                onClick={() => {
                  onNavigate("contacts");
                  if (isMobile) setIsSidebarCollapsed(true);
                }}
              />
            )}

            {!isSidebarCollapsed || isMobile ? (
              <div className="mt-6 mb-2 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Sales
              </div>
            ) : (
              <div className="my-2 border-t border-slate-200 mx-2" />
            )}
            {hasPermission('leads') && (
              <SidebarItem
                icon="call"
                label="Leads"
                isCollapsed={isSidebarCollapsed && !isMobile}
                isActive={
                  currentView === "leads" || currentView === "lead-detail"
                }
                onClick={() => {
                  onNavigate("leads");
                  if (isMobile) setIsSidebarCollapsed(true);
                }}
              />
            )}
            {hasPermission('opportunities') && (
              <button
                onClick={() => {
                  onNavigate("opportunities");
                  if (isMobile) setIsSidebarCollapsed(true);
                }}
                title={
                  isSidebarCollapsed && !isMobile ? "Opportunities" : undefined
                }
                className={`w-full flex items-center ${isSidebarCollapsed && !isMobile ? "justify-center px-0" : "gap-3 px-4"} py-2 ${currentView === "opportunities" || currentView === "opportunity-detail" ? "bg-white text-[#0072c6] font-semibold border-l-4 border-[#0072c6]" : "text-slate-700 hover:bg-slate-200 bg-transparent border-l-4 border-transparent"} transition-colors text-[13px] text-left overflow-hidden`}
              >
                <span className="material-symbols-outlined text-[18px] shrink-0">
                  business_center
                </span>
                {(!isSidebarCollapsed || isMobile) && (
                  <span className="whitespace-nowrap flex-1 text-ellipsis overflow-hidden">
                    Opportunities
                  </span>
                )}
              </button>
            )}
            {hasPermission('competitors') && (
              <SidebarItem
                icon="analytics"
                label="Competitors"
                isCollapsed={isSidebarCollapsed && !isMobile}
                isActive={
                  currentView === "competitors" ||
                  currentView === "competitor-detail"
                }
                onClick={() => {
                  onNavigate("competitors");
                  if (isMobile) setIsSidebarCollapsed(true);
                }}
              />
            )}
          </div>
          <div
            className={`relative p-2 border-t border-slate-200 ${isSidebarCollapsed && !isMobile ? "flex justify-center" : ""}`}
          >
            {isAreaMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsAreaMenuOpen(false)}
                ></div>
                <div
                  className={`absolute bottom-full left-2 mb-2 bg-white border border-slate-200 rounded shadow-lg z-50 py-1 ${isSidebarCollapsed && !isMobile ? "w-48 ml-auto" : "w-[calc(100%-1rem)]"}`}
                >
                  {[
                    "Sales",
                    "Service",
                    "Marketing",
                    "Training",
                    "Settings",
                  ].map((area) => (
                    <button
                      key={area}
                      onClick={() => {
                        setCurrentArea(area);
                        setIsAreaMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-100 text-[13px] ${currentArea === area ? "font-semibold text-[#0072c6] bg-blue-50/50" : "text-slate-700"}`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div
              onClick={() => setIsAreaMenuOpen(!isAreaMenuOpen)}
              className={`flex items-center ${isSidebarCollapsed && !isMobile ? "justify-center w-8 h-8 rounded-full hover:bg-white" : "justify-between px-3 rounded hover:bg-white"} py-2 bg-slate-200 text-[13px] font-semibold text-slate-700 cursor-pointer transition-colors`}
            >
              {(!isSidebarCollapsed || isMobile) && (
                <span className="whitespace-nowrap">{currentArea}</span>
              )}
              <span
                className={`material-symbols-outlined text-[16px] shrink-0 transition-transform`}
              >
                unfold_more
              </span>
            </div>
          </div>
        </nav>
        <main className="flex-1 flex flex-col min-w-0 bg-white shadow-sm m-0 md:m-0 border-l border-slate-200 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  isCollapsed = false,
  isActive = false,
  onClick,
}: {
  icon: string;
  label: string;
  isCollapsed?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-3 px-4"} py-2 transition-colors text-[13px] text-left overflow-hidden border-l-4 ${isActive ? "bg-white text-[#0072c6] font-semibold border-[#0072c6]" : "text-slate-700 hover:bg-slate-200 bg-transparent border-transparent"}`}
    >
      <span
        className="material-symbols-outlined text-[18px] shrink-0"
        style={{ color: isActive ? "#0072c6" : "inherit" }}
      >
        {icon}
      </span>
      {!isCollapsed && (
        <span className="whitespace-nowrap flex-1 text-ellipsis overflow-hidden">
          {label}
        </span>
      )}
    </button>
  );
}

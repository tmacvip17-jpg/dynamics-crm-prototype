import React, { useState, useEffect } from "react";

export default function Layout({
  children,
  currentView,
  onNavigate,
}: {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}) {
  const handleCommand = (action: string) => {
    alert(`\${action} successful!`);
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false);
  const [currentArea, setCurrentArea] = useState("Sales");

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
          <button className="p-2 w-10 h-10 hidden md:flex items-center justify-center hover:bg-[#005a9e] rounded-full transition-colors">
            <span className="material-symbols-outlined text-[20px]">
              settings
            </span>
          </button>
          <button className="p-2 w-10 h-10 hidden md:flex items-center justify-center hover:bg-[#005a9e] rounded-full transition-colors">
            <span className="material-symbols-outlined text-[20px]">help</span>
          </button>
          <button className="p-2 w-10 h-10 flex items-center justify-center hover:bg-[#005a9e] rounded-full transition-colors">
            <span className="material-symbols-outlined text-[20px]">
              notifications
            </span>
          </button>
          <button className="ml-1 md:ml-2 w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0">
            <img
              src="https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/illustrations-3d/avatars/male-avatars/male-avatar-3-t50j2u7tys8t3k6l5h2r3i.png?_a=DAJFJtWIZAAC"
              alt="User"
              className="w-full h-full object-cover bg-white"
            />
          </button>
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

            {!isSidebarCollapsed || isMobile ? (
              <div className="mt-6 mb-2 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Customers
              </div>
            ) : (
              <div className="my-2 border-t border-slate-200 mx-2" />
            )}
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

            {!isSidebarCollapsed || isMobile ? (
              <div className="mt-6 mb-2 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Sales
              </div>
            ) : (
              <div className="my-2 border-t border-slate-200 mx-2" />
            )}
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
            <SidebarItem
              icon="group"
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

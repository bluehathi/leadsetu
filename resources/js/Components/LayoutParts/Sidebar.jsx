import React, { useState, useEffect } from "react";
import { Link, usePage, router as InertiaRouter } from "@inertiajs/react";
import Logo, { LogoLS } from "@/Components/Logo";
import { usePermissions } from "@/Hooks/usePermissions";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import {
  Home,
  Users,
  Building,
  Settings,
  Shield,
  Key,
  User as UserIcon,
  UserCog,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  User2,
  BriefcaseBusiness,
  Users2 as UsersIcon,
  Mail,
  Phone,
  Globe,
  Contact2,
  X,
  LogOut,
  Settings2,
} from "lucide-react";

const Sidebar = ({ user, sidebarOpen = false, setSidebarOpen }) => {
  const { can } = usePermissions();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebar-collapsed");
      return stored === "true";
    }
    return false;
  });

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const isActive = (routeName) => {
    try {
      const currentRoute = route().current(routeName);
      return currentRoute;
    } catch (e) {
      return false;
    }
  };

  const getUserInitials = (name) => {
    if (!name) return "?";
    const names = name.split(" ");
    if (names.length === 1 && names[0].length > 0)
      return names[0].charAt(0).toUpperCase();
    if (
      names.length > 1 &&
      names[0].length > 0 &&
      names[names.length - 1].length > 0
    ) {
      return (
        names[0].charAt(0) + names[names.length - 1].charAt(0)
      ).toUpperCase();
    }
    return name.length > 0 ? name.charAt(0).toUpperCase() : "?";
  };

  const showAccessControlSection =
    can("view_users") || can("view_roles") || can("view_permissions");

   
  const NavLink = ({ href, routeName, icon: Icon, children }) => {
    const active = isActive(routeName);
    return (
      <Tippy
        content={children}
        placement="right"
        disabled={!collapsed || sidebarOpen}
      >
        <Link
          href={href}
          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg group transition-all duration-200 ease-in-out
                                ${
                                  active
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md scale-[1.02]"
                                    : `text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                                    hover:text-gray-900 dark:hover:text-white ${
                                      collapsed && !sidebarOpen
                                        ? "justify-center"
                                        : "hover:translate-x-0.5"
                                    }`
                                }`}
        >
          <Icon
            className={`flex-shrink-0 h-5 w-5 transition-colors duration-200 
                                    ${
                                      active
                                        ? "text-white"
                                        : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                                    }
                                    ${
                                      collapsed && !sidebarOpen
                                        ? "mx-auto"
                                        : "mr-3"
                                    }`}
          />
          {(sidebarOpen || !collapsed) && (
            <span className="truncate">{children}</span>
          )}
        </Link>
      </Tippy>
    );
  };

  const SectionTitle = ({ children }) => {
    if (collapsed && !sidebarOpen)
      return (
        <div className="px-3 mt-6 mb-2 flex justify-center">
          <div className="w-6 h-0.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
      );
    return (
      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-3 mt-6 mb-2 uppercase tracking-wider">
        {children}
      </div>
    );
  };

  const handleLogout = (e) => {
    e.preventDefault();
    InertiaRouter.post(route("logout"));
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen && setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />
      <aside
        className={`
                fixed z-40 inset-y-0 left-0
                bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700/60 h-full
                flex flex-col transition-all duration-300 ease-in-out shadow-xl
                ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
                md:translate-x-0 md:static 
                ${collapsed && !sidebarOpen ? "md:w-20" : "md:w-64"}
            `}
      >
        <div className="flex flex-col h-full w-full">
          <div
            className={`flex items-center pt-5 pb-4 mb-2 border-b border-gray-200 dark:border-gray-700/60 
                                ${
                                  collapsed && !sidebarOpen
                                    ? "justify-center px-2"
                                    : "justify-between px-4"
                                }`}
          >
            <Link
              href={route("dashboard")}
              className="flex items-center min-w-0"
            >
              {sidebarOpen || !collapsed ? (
                <Logo className="h-9 w-auto" />
              ) : (
                <LogoLS className="h-8 w-auto" />
              )}
            </Link>

            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen && setSidebarOpen(false)}
                className="md:hidden ml-auto p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Close sidebar"
              >
                <X size={22} />
              </button>
            )}

            <button
              onClick={() =>
                setCollapsed((c) => {
                  localStorage.setItem("sidebar-collapsed", !c);
                  return !c;
                })
              }
              className={`hidden md:inline-flex p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors 
                                    ${
                                      collapsed && !sidebarOpen
                                        ? "ml-1"
                                        : "ml-2"
                                    } 
                                    ${sidebarOpen ? "hidden" : ""}`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
            </button>
          </div>

          <nav className="flex-grow px-3 py-2 space-y-1.5 overflow-y-auto">
            <SectionTitle>Main</SectionTitle>
            <NavLink
              href={route("dashboard")}
              routeName="dashboard"
              icon={Home}
            >
              Dashboard
            </NavLink>
            {can("view_campaigns") && (
              <NavLink
                href={route("email-campaigns.index")}
                routeName="email-campaigns.index"
                icon={Mail}
              >
                Campaigns
              </NavLink>
            )}
            {can("view_leads") && (
              <NavLink
                href={route("leads.index")}
                routeName="leads.index"
                icon={User2}
              >
                Leads
              </NavLink>
            )}
            {/* Assuming contacts are viewed with 'view_leads' permission as per routes/web.php */}
            {/* If you have a specific 'view_contacts' permission, use can("view_contacts") instead */}
            {can("view_contacts") && (
              <NavLink
                href={route("contacts.index")}
                routeName="contacts.index"
                icon={Contact2}
              >
                Contacts
              </NavLink>
            )}
            {can("view_companies") && (
              <NavLink
                href={route("companies.index")}
                routeName="companies.index"
                icon={BriefcaseBusiness}
              >
                Companies
              </NavLink>
            )}
            {can("view_prospect_lists") && (
              <NavLink
                href={route("prospect-lists.index")}
                routeName="prospect-lists.index"
                icon={ScrollText}
              >
                Prospect Lists
              </NavLink>
            )}
            {can("view_workspaces") && (
              <NavLink
                href={route("workspaces.index")}
                routeName="workspaces.index"
                icon={Globe}
              >
                Workspaces
              </NavLink>
            )}
            {can("manage_settings") && (
              <NavLink
                href={route("settings.index")}
                routeName="settings.index"
                icon={Settings2}
              >
                Settings
              </NavLink>
            )}

            {showAccessControlSection && (
              <>
                <SectionTitle>Access Control</SectionTitle>
                {can("view_users") && (
                  <NavLink
                    href={route("users.index")}
                    routeName="users.index"
                    icon={UsersIcon}
                  >
                    Users
                  </NavLink>
                )}
                {can("view_roles") && (
                  <NavLink
                    href={route("roles.index")}
                    routeName="roles.index"
                    icon={Shield}
                  >
                    Roles
                  </NavLink>
                )}
                {can("view_permissions") && (
                  <NavLink
                    href={route("permissions.index")}
                    routeName="permissions.index"
                    icon={Key}
                  >
                    Permissions
                  </NavLink>
                )}
              </>
            )}

            {can("view_activity_logs") && (
              <>
                <SectionTitle>Logs</SectionTitle>
                <NavLink
                  href={route("activity.logs")}
                  routeName="activity.logs"
                  icon={ScrollText}
                >
                  Activity Logs
                </NavLink>
              </>
            )}
          </nav>

          <div
            className={`flex-shrink-0 border-t border-gray-200 dark:border-gray-700/60 p-4 bg-gray-50 dark:bg-gray-800/50 ${
              collapsed && !sidebarOpen ? "justify-center" : ""
            }`}
          >
            <div
              className={`flex items-center w-full gap-3 ${
                collapsed && !sidebarOpen
                  ? "flex-col space-y-2 text-center"
                  : ""
              }`}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 dark:border-blue-600 shadow-sm"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white text-md font-semibold border-2 border-white dark:border-gray-700 shadow-sm ${
                    collapsed && !sidebarOpen ? "mx-auto" : ""
                  }`}
                >
                  {getUserInitials(user?.name)}
                </div>
              )}
              {(sidebarOpen || !collapsed) && (
                <div
                  className={`flex flex-col flex-1 min-w-0 ${
                    collapsed && !sidebarOpen ? "items-center" : ""
                  }`}
                >
                  <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {user?.name ?? "User Name"}
                  </span>
                  <Link
                    href={route("profile")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-0.5 transition-colors"
                  >
                    View profile
                  </Link>
                </div>
              )}
              {(sidebarOpen || !collapsed) && (
                <Tippy content="Logout">
                  <button
                    onClick={handleLogout}
                    type="button"
                    className={`p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-700/50 hover:text-red-600 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                      collapsed && !sidebarOpen ? "mt-2" : "ml-auto"
                    }`}
                    aria-label="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </Tippy>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

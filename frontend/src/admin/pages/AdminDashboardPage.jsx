import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  BookOpen,
  MessageSquare,
  BarChart2,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Search,
  MoreVertical,
  Plus,
  Star,
  Flag,
  RefreshCw,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  UserPlus,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Tractor,
  Eye,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  X,
  Menu,
  Sparkles,
  PackageCheck,
  ShoppingBag,
  UsersRound,
  CircleDollarSign,
} from 'lucide-react';

export default function AdminDashboard() {
  /* =========================================================
     STATE
  ========================================================= */

  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('30d');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [apiConnected, setApiConnected] = useState(false);

  /* =========================================================
     PERIOD OPTIONS
  ========================================================= */

  const periodOptions = [
    { value: 'today', label: 'Today', short: 'Today' },
    { value: '7d', label: 'Last 7 Days', short: '7 Days' },
    { value: '15d', label: 'Last 15 Days', short: '15 Days' },
    { value: '30d', label: 'Last 30 Days', short: '30 Days' },
    { value: '3m', label: 'Last 3 Months', short: '3 Months' },
    { value: '6m', label: 'Last 6 Months', short: '6 Months' },
    { value: '1y', label: 'Last 1 Year', short: '1 Year' },
    { value: 'custom', label: 'Custom Range', short: 'Custom' },
  ];

  const selectedPeriod = periodOptions.find(
    (item) => item.value === period
  );

  /* =========================================================
     DASHBOARD DATA
     Fallback values prevent the UI from breaking before API
     integration is available.
  ========================================================= */

  const [overview, setOverview] = useState({
    totalFarmers: 18761,
    totalAgribusinesses: 2223,
    activeUsers: 8456,
    newRegistrations: 742,
  });

  const [orderSummary, setOrderSummary] = useState({
    newOrders: 10,
    processing: 8,
    delivered: 15,
    cancelled: 2,
    totalRevenue: 120799,
  });

  const [analytics, setAnalytics] = useState({
    farmerGrowth: 14.2,
    businessGrowth: 8.5,
    orderGrowth: 11.7,
    revenueGrowth: 18.4,
  });

  /* =========================================================
     APPROVALS
  ========================================================= */

  const [approvals, setApprovals] = useState([
    {
      id: 1,
      name: 'Rahul Khan',
      role: 'Farmer',
      region: 'Buldhana, Maharashtra',
      verified: true,
      status: 'Pending',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    },
    {
      id: 2,
      name: 'Simran Gaonkar',
      role: 'Farmer',
      region: 'South Kolhapur, Maharashtra',
      verified: true,
      status: 'Pending',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    },
    {
      id: 3,
      name: 'A. Navi Khan',
      role: 'Senior Farmer',
      region: 'Baramati, Maharashtra',
      verified: true,
      status: 'Pending',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
    },
    {
      id: 4,
      name: 'Sarhan Sasnen',
      role: 'Agri Trader',
      region: 'Raichur, Karnataka',
      verified: true,
      status: 'Pending',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
    },
  ]);

  /* =========================================================
     MACHINERY
  ========================================================= */

  const [machinery, setMachinery] = useState([
    {
      id: 1,
      title: 'Tractor 45HP',
      region: 'Nashik',
      dailyRate: 1300,
      status: 'Active',
    },
    {
      id: 2,
      title: 'Rotavator 6ft',
      region: 'Pune',
      dailyRate: 750,
      status: 'Pending',
    },
    {
      id: 3,
      title: 'Harvester Unit',
      region: 'Nagpur',
      dailyRate: 2500,
      status: 'Active',
    },
  ]);

  /* =========================================================
     INVENTORY
  ========================================================= */

  const [inventory] = useState([
    {
      id: 1,
      name: 'Organic NPK Fertilizer',
      level: 'Low Stock',
      qty: '12 Bags',
    },
    {
      id: 2,
      name: 'Bt Cotton Seeds F1',
      level: 'Critical',
      qty: '4 Packets',
    },
    {
      id: 3,
      name: 'Bio Fungicide Neem',
      level: 'Adequate',
      qty: '85 Litres',
    },
  ]);

  /* =========================================================
     CHART DATA
  ========================================================= */

  const chartData = useMemo(() => {
    const data = {
      today: {
        labels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM'],
        current: [28, 42, 36, 55, 48, 72],
        previous: [22, 34, 30, 42, 39, 58],
      },

      '7d': {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        current: [42, 58, 51, 72, 66, 84, 92],
        previous: [35, 46, 44, 59, 53, 68, 76],
      },

      '15d': {
        labels: [
          '1',
          '3',
          '5',
          '7',
          '9',
          '11',
          '13',
          '15',
        ],
        current: [32, 48, 42, 65, 57, 73, 81, 94],
        previous: [26, 38, 35, 51, 48, 61, 69, 78],
      },

      '30d': {
        labels: [
          '1',
          '5',
          '10',
          '15',
          '20',
          '25',
          '30',
        ],
        current: [38, 48, 44, 63, 58, 76, 91],
        previous: [29, 37, 39, 48, 46, 61, 72],
      },

      '3m': {
        labels: ['Jul', 'Aug', 'Sep'],
        current: [61, 74, 91],
        previous: [49, 61, 73],
      },

      '6m': {
        labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        current: [45, 52, 59, 67, 78, 91],
        previous: [38, 45, 51, 57, 66, 73],
      },

      '1y': {
        labels: [
          'Oct',
          'Nov',
          'Dec',
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
        ],
        current: [32, 39, 44, 51, 55, 61, 66, 71, 76, 81, 86, 94],
        previous: [26, 31, 37, 43, 48, 52, 57, 62, 67, 72, 77, 83],
      },
    };

    return data[period] || data['30d'];
  }, [period]);

  /* =========================================================
     FETCH LIVE DATA
  ========================================================= */

  const fetchDashboardData = async () => {
    setIsRefreshing(true);

    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('campus-token') ||
        localStorage.getItem('admin-token');

      const apiBase =
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_BACKEND_URL ||
        'http://localhost:5000/api';

      let url = `${apiBase}/admin/dashboard?period=${period}`;

      if (
        period === 'custom' &&
        customStartDate &&
        customEndDate
      ) {
        url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Dashboard API unavailable');
      }

      const result = await response.json();

      if (result.overview) {
        setOverview((prev) => ({
          ...prev,
          ...result.overview,
        }));
      }

      if (result.orderSummary) {
        setOrderSummary((prev) => ({
          ...prev,
          ...result.orderSummary,
        }));
      }

      if (result.analytics) {
        setAnalytics((prev) => ({
          ...prev,
          ...result.analytics,
        }));
      }

      setApiConnected(true);
      setLastUpdated(new Date());
    } catch (error) {
      /*
        Fallback mode.
        Dashboard remains usable even when backend endpoint
        is not available yet.
      */
      setApiConnected(false);
      setLastUpdated(new Date());
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchDashboardData();
    }
  }, [period]);

  /* =========================================================
     HANDLERS
  ========================================================= */

  const handlePeriodChange = (value) => {
    setPeriod(value);

    if (value === 'custom') {
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
    }
  };

  const applyCustomRange = () => {
    if (!customStartDate || !customEndDate) {
      return;
    }

    setPeriod('custom');
    setShowCustomRange(false);
    fetchDashboardData();
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleDecision = (id) => {
    setApprovals((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  const handleFlagMachinery = (id) => {
    setMachinery((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status:
                item.status === 'Flagged'
                  ? 'Active'
                  : 'Flagged',
            }
          : item
      )
    );
  };

  /* =========================================================
     FILTERED APPROVALS
  ========================================================= */

  const filteredApprovals = approvals.filter((user) =>
    `${user.name} ${user.role} ${user.region}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  /* =========================================================
     FORMATTERS
  ========================================================= */

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString('en-IN');

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  const getPeriodText = () => {
    if (period === 'custom') {
      return customStartDate && customEndDate
        ? `${customStartDate} → ${customEndDate}`
        : 'Custom Range';
    }

    return selectedPeriod?.label || 'Last 30 Days';
  };

  /* =========================================================
     SMALL COMPONENTS
  ========================================================= */

  const StatCard = ({
    title,
    value,
    growth,
    icon: Icon,
    iconBg,
    iconColor,
    description,
  }) => {
    const positive = Number(growth) >= 0;

    return (
      <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="absolute right-0 top-0 w-28 h-28 bg-emerald-50 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition" />

        <div className="relative p-5">
          <div className="flex items-start justify-between">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>

            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                positive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {positive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(growth)}%
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500">
              {title}
            </p>

            <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              {value}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              {description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ProgressBar = ({
    value,
    label,
    amount,
  }) => (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-slate-600">
          {label}
        </span>

        <span className="text-xs font-bold text-slate-900">
          {amount}
        </span>
      </div>

      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(value, 100)}%`,
          }}
        />
      </div>
    </div>
  );

  /* =========================================================
     SVG CHART
  ========================================================= */

  const AnalyticsChart = () => {
    const width = 720;
    const height = 240;
    const paddingX = 28;
    const paddingY = 25;

    const maxValue = Math.max(
      ...chartData.current,
      ...chartData.previous,
      100
    );

    const getPoints = (values) =>
      values
        .map((value, index) => {
          const x =
            paddingX +
            (index *
              (width - paddingX * 2)) /
              Math.max(values.length - 1, 1);

          const y =
            height -
            paddingY -
            (value / maxValue) *
              (height - paddingY * 2);

          return `${x},${y}`;
        })
        .join(' ');

    const currentPoints = getPoints(chartData.current);
    const previousPoints = getPoints(chartData.previous);

    return (
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[230px]"
          preserveAspectRatio="none"
        >
          {/* Grid */}
          {[0, 1, 2, 3, 4].map((line) => {
            const y =
              paddingY +
              (line * (height - paddingY * 2)) / 4;

            return (
              <line
                key={line}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4 5"
              />
            );
          })}

          {/* Previous period */}
          <polyline
            points={previousPoints}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="3"
            strokeDasharray="7 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current period */}
          <polyline
            points={currentPoints}
            fill="none"
            stroke="#059669"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current data points */}
          {chartData.current.map((value, index) => {
            const x =
              paddingX +
              (index *
                (width - paddingX * 2)) /
                Math.max(
                  chartData.current.length - 1,
                  1
                );

            const y =
              height -
              paddingY -
              (value / maxValue) *
                (height - paddingY * 2);

            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="white"
                  stroke="#059669"
                  strokeWidth="3"
                />

                <circle
                  cx={x}
                  cy={y}
                  r="9"
                  fill="#059669"
                  opacity="0.08"
                />
              </g>
            );
          })}
        </svg>

        <div
          className="grid gap-2 px-4"
          style={{
            gridTemplateColumns: `repeat(${chartData.labels.length}, minmax(0, 1fr))`,
          }}
        >
          {chartData.labels.map((label) => (
            <span
              key={label}
              className="text-center text-[10px] text-slate-400"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <div className="min-h-screen w-full bg-[#f4f8f5] font-sans text-slate-800">

      {/* =====================================================
          TOP BRAND HEADER
      ===================================================== */}

      <div className="bg-gradient-to-r from-[#e8f3e9] via-white to-[#edf7ef] px-5 md:px-7 py-3 flex items-center justify-between border-b border-emerald-900/10">

        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/10">
            <span className="font-black text-white text-lg">
              KM
            </span>

            <span className="absolute -right-1 -top-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
          </div>

          <div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-[#163f27]">
              KisanMitra
            </h1>

            <p className="text-[9px] md:text-[10px] text-emerald-700 font-semibold tracking-wide">
              Farmer's Trust, Our Priority
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />

          <div className="text-center">
            <h2 className="text-base lg:text-lg font-black text-[#143d26]">
              Admin Command Center
            </h2>

            <p className="text-[10px] text-slate-500">
              Real-time KisanMitra platform overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ${
              apiConnected
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                apiConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500'
              }`}
            />

            {apiConnected
              ? 'LIVE DATA'
              : 'DEMO / FALLBACK'}
          </div>
        </div>
      </div>

      {/* =====================================================
          TOP NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-40 h-14 bg-[#163f27] text-white flex items-center justify-between px-4 md:px-6 shadow-lg shadow-emerald-950/10">

        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
            onClick={() =>
              setMobileSidebar(!mobileSidebar)
            }
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />

            <span className="font-bold text-sm">
              KisanMitra
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs text-slate-300">
            {[
              'Dashboard',
              'Users',
              'Inventory',
              'Orders',
              'Reports',
              'Settings',
            ].map((item) => (
              <button
                key={item}
                onClick={() => setActiveMenu(item)}
                className={`relative py-5 transition ${
                  activeMenu === item
                    ? 'text-emerald-300 font-bold'
                    : 'hover:text-white'
                }`}
              >
                {item}

                {activeMenu === item && (
                  <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">

          {/* Notification */}
          <div className="relative">
            <button
              onClick={() =>
                setShowNotifications(
                  !showNotifications
                )
              }
              className="relative p-2 rounded-xl hover:bg-white/10 transition"
            >
              <Bell className="w-4 h-4" />

              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full border border-[#163f27]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between">
                  <div>
                    <h3 className="font-bold text-sm">
                      Notifications
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Latest admin alerts
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setShowNotifications(false)
                    }
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <div className="p-2">
                  <div className="p-3 rounded-xl hover:bg-slate-50 flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold">
                        Inventory Alert
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Bt Cotton Seeds are critically low.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl hover:bg-slate-50 flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-emerald-600" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold">
                        New registrations
                      </p>
                      <p className="text-[10px] text-slate-400">
                        27 new farmers registered today.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() =>
                setShowProfile(!showProfile)
              }
              className="flex items-center gap-2 pl-2 md:pl-3 border-l border-emerald-800/80"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 border border-emerald-300 flex items-center justify-center text-xs font-black">
                AK
              </div>

              <div className="hidden md:block text-left leading-tight">
                <p className="font-bold text-xs">
                  A. Khan
                </p>

                <p className="text-[9px] text-emerald-300">
                  Super Admin
                </p>
              </div>

              <ChevronDown className="hidden md:block w-3.5 h-3.5 text-slate-300" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 text-slate-700">
                <button className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50">
                  My Profile
                </button>

                <button className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50">
                  Account Settings
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN LAYOUT
      ===================================================== */}

      <div className="flex min-h-[calc(100vh-110px)]">

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <aside
          className={`
            fixed md:sticky top-14 left-0 z-30
            w-60 bg-[#163f27] text-slate-200
            h-[calc(100vh-56px)]
            flex-shrink-0 flex flex-col
            py-4 select-none
            border-r border-emerald-950/20
            transition-transform duration-300
            ${
              mobileSidebar
                ? 'translate-x-0'
                : '-translate-x-full md:translate-x-0'
            }
          `}
        >
          <div className="px-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />

                <div>
                  <p className="text-[10px] text-slate-400">
                    SYSTEM STATUS
                  </p>

                  <p className="text-xs font-bold text-white">
                    All systems operational
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1 px-2 overflow-y-auto">

            {[
              {
                label: 'Dashboard',
                icon: LayoutDashboard,
              },
              {
                label: 'Users',
                icon: Users,
                hasSub: true,
              },
              {
                label: 'Inventory',
                icon: Package,
                hasSub: true,
              },
              {
                label: 'Orders',
                icon: ShoppingCart,
                hasSub: true,
              },
              {
                label: 'Reports',
                icon: FileText,
                hasSub: true,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isActive =
                activeMenu === item.label;

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveMenu(item.label);
                    setMobileSidebar(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                    isActive
                      ? 'bg-emerald-500/15 text-white shadow-inner'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    />

                    <span
                      className={
                        isActive
                          ? 'font-bold'
                          : ''
                      }
                    >
                      {item.label}
                    </span>
                  </div>

                  {item.hasSub && (
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  )}
                </button>
              );
            })}

            <div className="pt-5 pb-2 px-3 text-[9px] font-black tracking-widest text-emerald-300/60 uppercase">
              Product Management
            </div>

            {[
              'Order Users',
              'Order Sellers',
              'Order Listing',
            ].map((sub) => (
              <button
                key={sub}
                className="w-full text-left pl-10 pr-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition text-xs"
              >
                {sub}
              </button>
            ))}

            <div className="pt-5 pb-2 px-3 text-[9px] font-black tracking-widest text-emerald-300/60 uppercase">
              Content & Community
            </div>

            {[
              {
                label: 'Guides',
                icon: BookOpen,
              },
              {
                label: 'Forums',
                icon: MessageSquare,
              },
              {
                label: 'Analytics',
                icon: BarChart2,
              },
              {
                label: 'Settings',
                icon: Settings,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  onClick={() =>
                    setActiveMenu(item.label)
                  }
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition"
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto p-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-900 border border-emerald-700/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                </div>

                <div>
                  <p className="text-[10px] font-bold text-white">
                    KisanMitra Insights
                  </p>

                  <p className="text-[9px] text-emerald-200/70">
                    Smart agriculture analytics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileSidebar && (
          <button
            aria-label="Close sidebar"
            className="fixed inset-0 top-14 z-20 bg-black/30 md:hidden"
            onClick={() =>
              setMobileSidebar(false)
            }
          />
        )}

        {/* ===================================================
            MAIN CONTENT
        =================================================== */}

        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto">

          {/* =================================================
              PAGE HEADER + PERIOD FILTER
          ================================================= */}

          <div className="mb-6">

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                    Dashboard
                  </h2>

                  <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black">
                    ADMIN
                  </span>
                </div>

                <p className="mt-1 text-xs md:text-sm text-slate-500">
                  Monitor your KisanMitra platform performance in real time.
                </p>
              </div>

              {/* PERIOD SELECTOR */}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">

                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />

                  <select
                    value={period}
                    onChange={(e) =>
                      handlePeriodChange(
                        e.target.value
                      )
                    }
                    className="bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    {periodOptions.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold shadow-sm transition"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isRefreshing
                        ? 'animate-spin'
                        : ''
                    }`}
                  />

                  Refresh
                </button>

                <button className="hidden sm:flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 text-xs font-bold transition">
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>

            {/* PERIOD QUICK BUTTONS */}

            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
              {periodOptions
                .filter(
                  (option) =>
                    option.value !== 'custom'
                )
                .map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handlePeriodChange(
                        option.value
                      )
                    }
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[10px] font-bold border transition ${
                      period === option.value
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                    }`}
                  >
                    {option.short}
                  </button>
                ))}

              <button
                onClick={() =>
                  handlePeriodChange('custom')
                }
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-1 transition ${
                  period === 'custom'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                <Filter className="w-3 h-3" />
                Custom
              </button>
            </div>

            {/* CURRENT PERIOD INFO */}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Showing data for:
                <strong className="text-slate-700">
                  {getPeriodText()}
                </strong>
              </span>

              <span className="hidden sm:block">
                •
              </span>

              <span>
                Last updated:{' '}
                <strong className="text-slate-600">
                  {lastUpdated.toLocaleTimeString(
                    'en-IN',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }
                  )}
                </strong>
              </span>
            </div>
          </div>

          {/* =================================================
              CUSTOM DATE MODAL
          ================================================= */}

          {showCustomRange && (
            <div className="mb-5 bg-white rounded-2xl border border-emerald-100 shadow-lg p-4">

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Select Custom Date Range
                  </h3>

                  <p className="text-[10px] text-slate-400">
                    Choose the exact period you want to analyze.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowCustomRange(false)
                  }
                  className="p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) =>
                      setCustomStartDate(
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) =>
                      setCustomEndDate(
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={applyCustomRange}
                    disabled={
                      !customStartDate ||
                      !customEndDate
                    }
                    className="w-full px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-bold transition"
                  >
                    Apply Date Range
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              STAT CARDS
          ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">

            <StatCard
              title="Total Farmers"
              value={formatNumber(
                overview.totalFarmers
              )}
              growth={analytics.farmerGrowth}
              icon={UsersRound}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              description={`Compared with previous ${selectedPeriod?.short || 'period'}`}
            />

            <StatCard
              title="Agribusinesses"
              value={formatNumber(
                overview.totalAgribusinesses
              )}
              growth={analytics.businessGrowth}
              icon={ShoppingBag}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              description="Registered agricultural businesses"
            />

            <StatCard
              title="Total Orders"
              value={formatNumber(
                orderSummary.newOrders +
                  orderSummary.processing +
                  orderSummary.delivered
              )}
              growth={analytics.orderGrowth}
              icon={PackageCheck}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              description="Orders during selected period"
            />

            <StatCard
              title="Total Revenue"
              value={formatCurrency(
                orderSummary.totalRevenue
              )}
              growth={analytics.revenueGrowth}
              icon={CircleDollarSign}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              description="Revenue generated in selected period"
            />
          </div>

          {/* =================================================
              ANALYTICS + ORDER SUMMARY
          ================================================= */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">

            {/* ANALYTICS */}

            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              <div className="p-5">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>

                      <div>
                        <h3 className="font-black text-sm text-slate-900">
                          Platform Growth
                        </h3>

                        <p className="text-[10px] text-slate-400">
                          User activity for {getPeriodText()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px]">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      Current period
                    </span>

                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                      Previous period
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <AnalyticsChart />
                </div>

                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">

                  <div className="p-3 rounded-xl bg-slate-50">
                    <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Farmers
                    </p>

                    <p className="mt-1 font-black text-sm">
                      +{analytics.farmerGrowth}%
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50">
                    <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Businesses
                    </p>

                    <p className="mt-1 font-black text-sm">
                      +{analytics.businessGrowth}%
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50">
                    <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Orders
                    </p>

                    <p className="mt-1 font-black text-sm">
                      +{analytics.orderGrowth}%
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50">
                    <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Revenue
                    </p>

                    <p className="mt-1 font-black text-sm">
                      +{analytics.revenueGrowth}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ORDER SUMMARY */}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              <div className="p-5">

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      Order Summary
                    </h3>

                    <p className="text-[10px] text-slate-400">
                      {getPeriodText()}
                    </p>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>

                <div className="mt-5 space-y-4">

                  <ProgressBar
                    label="New Orders"
                    amount={
                      orderSummary.newOrders
                    }
                    value={
                      orderSummary.newOrders * 5
                    }
                  />

                  <ProgressBar
                    label="Processing"
                    amount={
                      orderSummary.processing
                    }
                    value={
                      orderSummary.processing * 5
                    }
                  />

                  <ProgressBar
                    label="Delivered"
                    amount={
                      orderSummary.delivered
                    }
                    value={
                      orderSummary.delivered * 5
                    }
                  />

                  <ProgressBar
                    label="Cancelled"
                    amount={
                      orderSummary.cancelled
                    }
                    value={
                      orderSummary.cancelled * 5
                    }
                  />
                </div>

                <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-800 text-white">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-200" />

                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-100">
                      Total Revenue
                    </p>
                  </div>

                  <p className="mt-2 text-2xl font-black">
                    {formatCurrency(
                      orderSummary.totalRevenue
                    )}
                  </p>

                  <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-100">
                    <TrendingUp className="w-3 h-3" />
                    {analytics.revenueGrowth}% increase
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              APPROVALS + EXPERT PERFORMANCE
          ================================================= */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">

            {/* APPROVALS */}

            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      User Approvals Queue
                    </h3>

                    <p className="text-[10px] text-slate-400">
                      {approvals.length} users waiting for review
                    </p>
                  </div>
                </div>

                <div className="relative w-full sm:w-52">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />

                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[9px] uppercase font-black tracking-wider text-slate-400">
                    <tr>
                      <th className="px-5 py-3">
                        Profile
                      </th>
                      <th className="px-5 py-3">
                        Role
                      </th>
                      <th className="px-5 py-3">
                        Region
                      </th>
                      <th className="px-5 py-3">
                        Status
                      </th>
                      <th className="px-5 py-3 text-center">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredApprovals.map(
                      (user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-emerald-50/30 transition"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />

                              <div>
                                <p className="font-bold text-slate-900">
                                  {user.name}
                                </p>

                                <p className="text-[9px] text-slate-400">
                                  Verified profile
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3 text-slate-500">
                            {user.role}
                          </td>

                          <td className="px-5 py-3 text-slate-500">
                            {user.region}
                          </td>

                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold">
                              <Clock3 className="w-3 h-3" />
                              Pending
                            </span>
                          </td>

                          <td className="px-5 py-3">
                            <div className="flex justify-center gap-1.5">
                              <button
                                onClick={() =>
                                  handleDecision(
                                    user.id
                                  )
                                }
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[9px] transition"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() =>
                                  handleDecision(
                                    user.id
                                  )
                                }
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-[9px] transition"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* EXPERT PERFORMANCE */}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

              <div className="p-5">

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                      <Star className="w-4 h-4 text-purple-600" />
                    </div>

                    <div>
                      <h3 className="font-black text-sm text-slate-900">
                        Expert Performance
                      </h3>

                      <p className="text-[10px] text-slate-400">
                        Community experts
                      </p>
                    </div>
                  </div>

                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </div>

                <div className="mt-6 space-y-6">

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-slate-500">
                        Response Time
                      </span>

                      <strong className="text-xs text-slate-900">
                        13 min
                      </strong>
                    </div>

                    <div className="h-2 bg-slate-100 rounded-full">
                      <div className="h-full w-4/5 bg-emerald-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-slate-500">
                        Expert Rating
                      </span>

                      <strong className="text-xs text-slate-900">
                        4.5 / 5
                      </strong>
                    </div>

                    <div className="flex gap-1">
                      {[...Array(5)].map(
                        (_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-amber-400 text-amber-400"
                          />
                        )
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Article Contributions
                      </span>

                      <span className="text-xl font-black text-slate-900">
                        34
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-purple-600" />

                      <span className="text-xs font-bold text-purple-800">
                        1,284 expert answers
                      </span>
                    </div>

                    <p className="mt-1 text-[10px] text-purple-600">
                      Helping farmers this period
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              MACHINERY + INVENTORY + KNOWLEDGE
          ================================================= */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

            {/* MACHINERY */}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

              <div className="p-5">

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                      <Tractor className="w-4 h-4 text-orange-600" />
                    </div>

                    <div>
                      <h3 className="font-black text-sm text-slate-900">
                        Machinery Marketplace
                      </h3>

                      <p className="text-[10px] text-slate-400">
                        Latest listings
                      </p>
                    </div>
                  </div>

                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </div>

                <div className="mt-4 space-y-2.5">

                  {machinery.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {item.title}
                        </p>

                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {item.region} • ₹
                          {item.dailyRate}/day
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-1 rounded-full text-[8px] font-black ${
                            item.status ===
                            'Flagged'
                              ? 'bg-rose-50 text-rose-700'
                              : item.status ===
                                'Pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {item.status}
                        </span>

                        <button
                          onClick={() =>
                            handleFlagMachinery(
                              item.id
                            )
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Flag item"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 text-xs font-bold transition flex items-center justify-center gap-2">
                  <Plus className="w-3.5 h-3.5" />
                  Add Machinery
                </button>
              </div>
            </div>

            {/* INVENTORY */}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

              <div className="p-5">

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>

                    <div>
                      <h3 className="font-black text-sm text-slate-900">
                        Inventory Status
                      </h3>

                      <p className="text-[10px] text-slate-400">
                        Stock monitoring
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-1 rounded-full bg-rose-50 text-rose-600 text-[8px] font-black">
                    1 CRITICAL
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">

                  {inventory.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs text-slate-900">
                            {inv.name}
                          </p>

                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {inv.qty} left
                          </p>
                        </div>

                        <span
                          className={`px-2 py-1 rounded-full text-[8px] font-black ${
                            inv.level ===
                            'Critical'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : inv.level ===
                                'Low Stock'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}
                        >
                          {inv.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-4 py-2.5 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm">
                  <Plus className="w-3.5 h-3.5" />
                  Add Inventory Lot
                </button>
              </div>
            </div>

            {/* KNOWLEDGE HUB */}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

              <div className="p-5">

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-cyan-600" />
                    </div>

                    <div>
                      <h3 className="font-black text-sm text-slate-900">
                        Knowledge Hub
                      </h3>

                      <p className="text-[10px] text-slate-400">
                        Content analytics
                      </p>
                    </div>
                  </div>

                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </div>

                <div className="mt-5">

                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    Most Viewed Guides
                  </p>

                  <div className="space-y-2">

                    <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />

                        <span className="text-xs text-slate-700 truncate">
                          Organic Farming Guide 2026
                        </span>
                      </div>

                      <strong className="text-xs text-slate-900">
                        76K
                      </strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />

                        <span className="text-xs text-slate-700 truncate">
                          Drip Irrigation Setup
                        </span>
                      </div>

                      <strong className="text-xs text-slate-900">
                        18K
                      </strong>
                    </div>
                  </div>

                  <div className="my-4 border-t border-slate-100" />

                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    Community Activity
                  </p>

                  <div className="space-y-2">

                    <div className="flex justify-between gap-3">
                      <span className="text-xs text-slate-700 truncate">
                        Pest control in Soybean crop
                      </span>

                      <strong className="text-xs text-emerald-700 whitespace-nowrap">
                        155 replies
                      </strong>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-xs text-slate-700 truncate">
                        Best Hybrid Onion Seeds
                      </span>

                      <strong className="text-xs text-emerald-700 whitespace-nowrap">
                        96 replies
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              BOTTOM ACTIVITY
          ================================================= */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="p-5 border-b border-slate-100 flex items-center justify-between">

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-600" />
                </div>

                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Recent Platform Activity
                  </h3>

                  <p className="text-[10px] text-slate-400">
                    Latest actions across KisanMitra
                  </p>
                </div>
              </div>

              <button className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800">
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">

              <div className="p-5 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800">
                    27 new farmers registered
                  </p>

                  <p className="text-[10px] text-slate-400 mt-1">
                    Registration activity
                  </p>

                  <p className="text-[9px] text-emerald-600 font-bold mt-2">
                    Today
                  </p>
                </div>
              </div>

              <div className="p-5 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800">
                    15 orders delivered
                  </p>

                  <p className="text-[10px] text-slate-400 mt-1">
                    Order management
                  </p>

                  <p className="text-[9px] text-blue-600 font-bold mt-2">
                    This period
                  </p>
                </div>
              </div>

              <div className="p-5 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800">
                    3 inventory alerts
                  </p>

                  <p className="text-[10px] text-slate-400 mt-1">
                    Stock monitoring
                  </p>

                  <p className="text-[9px] text-amber-600 font-bold mt-2">
                    Requires attention
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[9px] text-slate-400">
            <p>
              © 2026 KisanMitra Admin Panel. All rights reserved.
            </p>

            <p className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              System operational
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
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
  Flag
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Dashboard Stats matching the design
  const [overview] = useState({
    totalFarmers: 18761,
    totalAgribusinesses: 2223
  });

  const [orderSummary] = useState({
    newOrders: 10,
    processing: 0,
    delivered: 15,
    totalRevenue: 120799.0
  });

  // 2.1 User Approvals Queue
  const [approvals, setApprovals] = useState([
    {
      id: 1,
      name: 'Rahul Khan',
      role: 'Farmer',
      region: 'Buldhana, Maharashtra',
      verified: true,
      status: 'Pending',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces'
    },
    {
      id: 2,
      name: 'Simran Gaonkar',
      role: 'Farmer',
      region: 'South Kolhapur, Maharashtra',
      verified: true,
      status: 'Pending',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces'
    },
    {
      id: 3,
      name: 'A. Navi Khan',
      role: 'Senior Farmer',
      region: 'Baramati, Maharashtra',
      verified: true,
      status: 'Pending',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces'
    },
    {
      id: 4,
      name: 'Sarhan Sasnen',
      role: 'Agri Trader',
      region: 'Raichur, Karnataka',
      verified: true,
      status: 'Pending',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces'
    }
  ]);

  // 3.1 Machinery Marketplace
  const [machinery, setMachinery] = useState([
    { id: 1, title: 'Tractor 45HP', region: 'Nashik', dailyRate: 1300, status: 'Active' },
    { id: 2, title: 'Rotavator 6ft', region: 'Pune', dailyRate: 750, status: 'Pending' },
    { id: 3, title: 'Harvester Unit', region: 'Nagpur', dailyRate: 2500, status: 'Active' }
  ]);

  // 3.2 Inventory Alerts
  const [inventory] = useState([
    { id: 1, name: 'Organic NPK Fertilizer', level: 'Low Stock', qty: '12 Bags' },
    { id: 2, name: 'Bt Cotton Seeds F1', level: 'Critical', qty: '4 Packets' },
    { id: 3, name: 'Bio Fungicide Neem', level: 'Adequate', qty: '85 Litres' }
  ]);

  const handleDecision = (id) => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFlagMachinery = (id) => {
    setMachinery((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Flagged' } : item))
    );
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#edf4ed] font-sans text-slate-800">
      {/* 1. TOP BRAND BANNER (KisanMitra Header) */}
      <div className="bg-[#e4ede4] px-6 py-2.5 flex items-center justify-between border-b border-emerald-900/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-700/15 border border-emerald-700/30 flex items-center justify-center font-bold text-emerald-800 text-lg">
            KM
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#163f27] leading-none">KisanMitra</h1>
            <p className="text-[10px] text-emerald-800 font-semibold tracking-wide">Farmer's Trust, Our Priority</p>
          </div>
        </div>
        <div className="text-lg md:text-xl font-bold text-[#143d26] tracking-tight">
          KisanMitra Admin Panel - A Unified Overview
        </div>
        <div className="w-24"></div>
      </div>

      {/* 2. SUB-NAVBAR */}
      <header className="h-12 bg-[#163f27] text-white flex items-center justify-between px-6 shadow-sm z-20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="font-bold text-base text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              KisanMitra
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-200">
            <button className="text-emerald-300 font-semibold border-b-2 border-emerald-400 pb-0.5">Dashboard</button>
            <button className="hover:text-white transition">Users</button>
            <button className="hover:text-white transition">Inventory</button>
            <button className="hover:text-white transition">Orders</button>
            <button className="hover:text-white transition">Reports</button>
            <button className="hover:text-white transition">Settings</button>
          </nav>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <button className="relative text-slate-300 hover:text-white p-1">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>

          <div className="flex items-center gap-2 pl-3 border-l border-emerald-800/80">
            <div className="w-7 h-7 rounded-full bg-emerald-600 border border-emerald-400 flex items-center justify-center text-xs font-bold text-white">
              AK
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="font-semibold text-white">A. Khan</p>
              <p className="text-[10px] text-emerald-300">Super Admin</p>
            </div>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1 bg-emerald-900/90 hover:bg-emerald-800 text-white rounded text-xs transition border border-emerald-700/80">
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* 3. MAIN WORKSPACE WITH SIDEBAR */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Dark Forest Sidebar */}
        <aside className="w-56 bg-[#163f27] text-slate-200 flex-shrink-0 flex flex-col justify-between py-3 select-none text-xs border-r border-emerald-950/20">
          <div className="space-y-0.5">
            {[
              { label: 'Dashboard', icon: LayoutDashboard },
              { label: 'Users', icon: Users, hasSub: true },
              { label: 'Inventory', icon: Package, hasSub: true },
              { label: 'Orders', icon: ShoppingCart, hasSub: true },
              { label: 'Reports', icon: FileText, hasSub: true }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveMenu(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-2 transition ${
                    isActive ? 'bg-[#1e5233] text-white font-medium border-l-4 border-emerald-400' : 'hover:bg-[#1a492d] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-emerald-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.hasSub && <ChevronDown className="w-3 h-3 opacity-60" />}
                </button>
              );
            })}

            <div className="pt-3 pb-1 px-4 text-[10px] font-bold tracking-wider text-emerald-300/80 uppercase">
              Product Management
            </div>
            {['Order Users', 'Order Sellers', 'Order Listing'].map((sub) => (
              <button
                key={sub}
                className="w-full text-left pl-10 pr-4 py-1.5 text-slate-300 hover:text-white hover:bg-[#1a492d] transition"
              >
                {sub}
              </button>
            ))}

            <div className="pt-3 pb-1 px-4 text-[10px] font-bold tracking-wider text-emerald-300/80 uppercase">
              Content & Community
            </div>
            {[
              { label: 'Guides', icon: BookOpen },
              { label: 'Forums', icon: MessageSquare },
              { label: 'Analytics', icon: BarChart2 },
              { label: 'Settings', icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-[#1a492d] hover:text-white transition"
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Dashboard Cards Grid */}
        <main className="flex-1 p-5 overflow-y-auto space-y-5">
          {/* Row 1: Active Users Growth & Real-Time Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Card 1.1: Active Users Growth */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Active Users Growth</h3>
                    <p className="text-[11px] text-slate-500">Registrations over past quarter</p>
                  </div>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> This month
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Last quarter
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-6 items-center">
                  <div className="flex-1 w-full h-36 relative">
                    <svg viewBox="0 0 400 130" className="w-full h-full">
                      <path
                        d="M 10 100 Q 80 50, 160 85 T 320 40 T 390 30"
                        fill="none"
                        stroke="#059669"
                        strokeWidth="2.5"
                      />
                      <path
                        d="M 10 110 Q 80 75, 160 100 T 320 60 T 390 55"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                    </svg>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
                      <span>Jul</span>
                      <span>Aug</span>
                      <span>Sep</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-4 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6 w-full sm:w-44 flex-shrink-0">
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Total Registered Farmers</p>
                      <p className="text-xl font-extrabold text-slate-900 leading-tight">
                        {overview.totalFarmers.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-emerald-600 font-semibold">+14.2% verified</span>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Total Agribusinesses</p>
                      <p className="text-xl font-extrabold text-slate-900 leading-tight">
                        {overview.totalAgribusinesses.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-emerald-600 font-semibold">+8.5% new traders</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-100 text-[11px] font-medium text-slate-500 text-center">
                Card 1.1. Overview
              </div>
            </div>

            {/* Card 1.2: Real-Time Order Summary */}
            <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div className="p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-sm text-slate-800">Real-Time Order Summary</h3>
                  <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 items-center">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>New Orders</span>
                      <strong className="text-slate-900 font-bold">{orderSummary.newOrders}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Processing</span>
                      <strong className="text-slate-900 font-bold">{orderSummary.processing}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivered</span>
                      <strong className="text-slate-900 font-bold">{orderSummary.delivered}</strong>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Revenue</p>
                      <p className="text-base font-extrabold text-emerald-700">
                        ₹{Number(orderSummary.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-20 h-20">
                      <div className="w-full h-full rounded-full border-8 border-emerald-600 border-t-amber-400 border-r-emerald-300"></div>
                    </div>
                    <div className="flex gap-2 text-[9px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>Fertilizer
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>Seed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-100 text-[11px] font-medium text-slate-500 text-center">
                1.2. Real-Time Order Summary
              </div>
            </div>
          </div>

          {/* Row 2: User Approvals Queue & Expert Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Card 2.1: User Approvals Queue */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">
                      KM
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">User Approvals Queue</h3>
                  </div>
                  <div className="relative w-44">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-xs pl-8 pr-2 py-1 rounded border border-slate-200 bg-slate-50 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-2.5">Profile</th>
                        <th className="px-4 py-2.5">Role</th>
                        <th className="px-4 py-2.5">Region</th>
                        <th className="px-4 py-2.5">Verification</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {approvals
                        .filter((u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-2.5 flex items-center gap-2">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <p className="font-semibold text-slate-900 leading-tight">{user.name}</p>
                                <span className="text-[10px] text-slate-400">Sample Photo</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">{user.role}</td>
                            <td className="px-4 py-2.5 text-slate-500">{user.region}</td>
                            <td className="px-4 py-2.5">
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Verified
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                {user.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <div className="inline-flex gap-1.5">
                                <button
                                  onClick={() => handleDecision(user.id)}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded text-[10px] transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleDecision(user.id)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded text-[10px] transition"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-100 text-[11px] font-medium text-slate-500 text-center">
                2.1. User Approvals Queue
              </div>
            </div>

            {/* Card 2.2: Expert Performance */}
            <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div className="p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">
                      KM
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">Expert Performance</h3>
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                </div>

                <div className="mt-4 space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-slate-600">Expert Chat Response Time</span>
                      <strong className="text-slate-900 font-bold">13 min</strong>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full w-4/5 rounded-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-slate-600">Expert Ratings</span>
                      <span className="text-slate-900 font-bold flex items-center gap-1">4.5</span>
                    </div>
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-slate-600">Article Contributions</span>
                    <span className="font-extrabold text-sm text-slate-900">34</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-100 text-[11px] font-medium text-slate-500 text-center">
                2.2. Expert Performance
              </div>
            </div>
          </div>

          {/* Row 3: Machinery, Inventory, Knowledge Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 3.1: Machinery Marketplace Activity */}
            <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div className="p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">KM</div>
                    <h3 className="font-bold text-sm text-slate-800">Machinery Marketplace</h3>
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                </div>

                <div className="mt-3 space-y-2.5 text-xs">
                  {machinery.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <span className="text-[10px] text-slate-400">
                          {item.region} • ₹{item.dailyRate}/day
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            item.status === 'Flagged'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {item.status}
                        </span>
                        <button
                          onClick={() => handleFlagMachinery(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Flag item"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-100 text-[11px] font-medium text-slate-500 text-center">
                3.1. Machinery Marketplace Activity
              </div>
            </div>

            {/* Card 3.2: Inventory Status */}
            <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div className="p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">KM</div>
                    <h3 className="font-bold text-sm text-slate-800">Inventory Status</h3>
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                </div>

                <div className="mt-3 space-y-2.5 text-xs">
                  {inventory.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">{inv.name}</p>
                        <span className="text-[10px] text-slate-500">{inv.qty} left</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          inv.level === 'Critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : inv.level === 'Low Stock'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {inv.level}
                      </span>
                    </div>
                  ))}
                  <button className="w-full mt-2 py-1.5 flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold transition">
                    <Plus className="w-3.5 h-3.5" /> Add New Inventory Lot
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-100 text-[11px] font-medium text-slate-500 text-center">
                3.2. Product & Resource Management
              </div>
            </div>

            {/* Card 3.3: Knowledge Hub Analytics */}
            <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div className="p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">KM</div>
                    <h3 className="font-bold text-sm text-slate-800">Knowledge Hub Analytics</h3>
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                </div>

                <div className="mt-3 space-y-3 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Most Viewed Guides</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-700">
                        <span className="truncate pr-2">Organic Farming Guide 2026</span>
                        <strong className="text-slate-900">76K</strong>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span className="truncate pr-2">Drip Irrigation Setup</span>
                        <strong className="text-slate-900">18K</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Community Posts</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-700">
                        <span className="truncate pr-2">Pest control in Soybean crop</span>
                        <strong className="text-emerald-700">155 replies</strong>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span className="truncate pr-2">Best Hybrid Onion Seeds</span>
                        <strong className="text-emerald-700">96 replies</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-100 text-[11px] font-medium text-slate-500 text-center">
                3.3. Knowledge Hub Analytics
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
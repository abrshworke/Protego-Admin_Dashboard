import { useState } from "react";
import SideBar from "../components/SideBar";
import Topbar from "../components/Topbar";
import UserCard from "../components/UserCard";
import { usersData } from "../assets/data";
import Footer from "../components/Footer";

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(usersData);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()),
  );

  const openAddModal = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const saveUser = (user) => {
    if (editingUser) {
      setUsers(users.map((u) => (u.id === user.id ? user : u)));
    } else {
      setUsers([...users, { ...user, id: Date.now() }]);
    }
    setModalOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <main className="p-6 flex-1 overflow-auto space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">
                User Management
              </h2>
              <p className="text-slate-500 mt-1">
                Manage authorities, roles, and system access
              </p>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={openAddModal}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                + Add Authority
              </button>
            </div>
          </div>

          {/* Users */}
          <div className="grid gap-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={() => openEditModal(user)}
                />
              ))
            ) : (
              <p className="text-slate-500 text-sm">No users found.</p>
            )}
          </div>
        </main>
      </div>

      {modalOpen && (
        <UserModal
          user={editingUser}
          onClose={() => setModalOpen(false)}
          onSave={saveUser}
        />
      )}
    </div>
  );
}

/* ---------------- MODAL ---------------- */

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState(
    user || { name: "", email: "", role: "Operator", status: "Active" },
  );

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = () => onSave(form);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4 text-slate-800">
          {user ? "Edit Authority" : "Add Authority"}
        </h3>

        <div className="space-y-3">
          <input
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border"
          >
            <option>Admin</option>
            <option>Supervisor</option>
            <option>Operator</option>
          </select>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border"
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

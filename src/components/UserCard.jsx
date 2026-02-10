

const UserCard = ({ user, onEdit }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5
                    flex flex-col md:flex-row md:items-center md:justify-between gap-4
                    hover:shadow-md transition">
      <div>
        <h4 className="text-slate-800 font-semibold">
          {user.name}
        </h4>
        <p className="text-slate-500 text-sm">
          {user.email}
        </p>
      </div>

      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
        {user.role}
      </span>

      <span
        className={`text-sm font-semibold ${
          user.status === "Active"
            ? "text-green-600"
            : "text-red-300"
        }`}
      >
        {user.status}
      </span>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="px-4 py-1.5 rounded-xl text-sm font-medium
                     bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Edit
        </button>
        <button
          className="px-4 py-1.5 rounded-xl text-sm font-medium
                     bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
        >
          Permissions
        </button>
      </div>
    </div>
  );
};

export default UserCard;

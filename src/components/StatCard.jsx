
export default function StatCard({ title, value, change, positive }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
      <p className="text-sm text-gray-500">{title}</p>

      <h2 className="text-3xl font-bold mt-2 text-slate-800">
        {value}
      </h2>

      <p
        className={`mt-2 text-sm font-medium ${
          positive ? "text-green-600" : "text-red-600"
        }`}
      >
        {change} vs last month
      </p>
    </div>
  );
}

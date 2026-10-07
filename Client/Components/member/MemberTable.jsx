import { UserRoundCog, Trash2, ShieldCheck } from "lucide-react";

const MemberTable = ({
  members,
  currentUserId,
  canManage,
  onChangeRole,
  onRemove,
  loading,
}) => {
  if (!members.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">
        No members have been added to this project yet.
      </div>
    );
  }

  const projectManagerCount = members.filter(
  (member) => member.role === "Project Manager"
).length;

  const gridColumns = canManage
    ? "grid-cols-[2fr_2fr_1fr_1fr]"
    : "grid-cols-[2fr_2fr_1fr]";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">

      {/* Header */}
      <div
        className={`grid ${gridColumns} border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-400`}
      >
        <span>Name</span>
        <span>Email</span>
        <span>Role</span>

        {canManage && <span>Actions</span>}
      </div>

      {/* Members */}
      {members.map((member) => (
        <div
          key={member.id}
          className={`grid ${gridColumns} items-center gap-3 border-b border-slate-800 px-4 py-4 text-sm text-slate-300 last:border-b-0`}
        >
          {/* Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
              <UserRoundCog size={16} />
            </div>

            <div>
              <div className="font-medium text-white">
                {member.name}
              </div>

              <div className="text-xs text-slate-500">
                Joined{" "}
                {member.createdAt
                  ? new Date(member.createdAt).toLocaleDateString()
                  : "—"}
              </div>
            </div>
          </div>

          {/* Email */}
          <div>{member.email}</div>

          {/* Role */}
          <div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                member.role === "Project Manager"
                  ? "bg-purple-500/20 text-purple-400"
                  : member.role === "Tester"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-cyan-500/20 text-cyan-400"
              }`}
            >
              {member.role}
            </span>
          </div>

          {/* Actions */}
          {canManage && (
            <div className="flex gap-2">
              <button
                onClick={() => onChangeRole(member)}
                disabled={loading}
                title="Change role"
                className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-cyan-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldCheck size={15} />
              </button>

              {/* Don't allow removing yourself */}
  {member.userId !== currentUserId && (
  <button
    onClick={() => onRemove(member)}
    disabled={
      loading ||
      (member.role === "Project Manager" &&
        projectManagerCount <= 1)
    }
    title={
      member.role === "Project Manager" &&
      projectManagerCount <= 1
        ? "You cannot remove the only Project Manager"
        : "Remove member"
    }
                  className="rounded-lg border border-slate-700 px-3 py-2 text-red-400 transition hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MemberTable;
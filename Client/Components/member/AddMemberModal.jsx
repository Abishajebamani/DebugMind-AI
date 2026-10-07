import { useEffect, useState } from "react";
import Modal from "../Common/Modal";

const AddMemberModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Developer");

  // Reset form whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setRole("Developer");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return;
    }

    onSubmit({
      email: trimmedEmail,
      role,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title="Add Member"
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Member Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
            disabled={loading}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <p className="mt-2 text-xs text-slate-500">
            The user must already have a registered account.
          </p>
        </div>

        {/* Role */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Project Role
          </label>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="Developer">Developer</option>
            <option value="Tester">Tester</option>
            <option value="Project Manager">
              Project Manager
            </option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg bg-slate-700 px-4 py-2 font-medium text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Member"}
          </button>

        </div>
      </form>
    </Modal>
  );
};

export default AddMemberModal;
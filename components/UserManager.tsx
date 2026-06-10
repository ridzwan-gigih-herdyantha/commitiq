"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SavedUser } from "@/types";

interface Props {
  users: SavedUser[];
  onClose: () => void;
  onSave: (users: SavedUser[]) => void;
}

export function UserManager({ users, onClose, onSave }: Props) {
  const [list, setList] = useState<SavedUser[]>(users);
  const [form, setForm] = useState({ displayName: "", username: "", pat: "" });
  const [showPat, setShowPat] = useState(false);
  const [error, setError] = useState("");

  function addUser() {
    if (!form.displayName.trim() || !form.username.trim() || !form.pat.trim()) {
      setError("All fields are required.");
      return;
    }
    const newUser: SavedUser = {
      id: crypto.randomUUID(),
      displayName: form.displayName.trim(),
      username: form.username.trim(),
      pat: form.pat.trim(),
    };
    setList((prev) => [...prev, newUser]);
    setForm({ displayName: "", username: "", pat: "" });
    setError("");
  }

  function removeUser(id: string) {
    setList((prev) => prev.filter((u) => u.id !== id));
  }

  function handleSave() {
    onSave(list);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border rounded-xl shadow-lg w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Manage Users</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ✕
          </button>
        </div>

        {list.length > 0 && (
          <ul className="flex flex-col gap-2">
            {list.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{u.displayName}</span>
                  <span className="text-muted-foreground ml-2">@{u.username}</span>
                </div>
                <button
                  onClick={() => removeUser(u.id)}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 border-t pt-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Add User</p>
          <Input
            placeholder="Display name"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          />
          <Input
            placeholder="GitHub username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          />
          <div className="relative">
            <Input
              type={showPat ? "text" : "password"}
              placeholder="Personal Access Token (PAT)"
              value={form.pat}
              onChange={(e) => setForm((f) => ({ ...f, pat: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowPat((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              {showPat ? "Hide" : "Show"}
            </button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button variant="outline" onClick={addUser} className="w-full">
            + Add User
          </Button>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save
        </Button>
      </div>
    </div>
  );
}

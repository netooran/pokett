'use client';

import { useState } from 'react';

interface Member {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  totalExpenses: number;
  members: string[];
  createdAt: Date;
}

interface EditGroupModalProps {
  group: Group;
  onClose: () => void;
  onEdit: (id: string, name: string, members: string[]) => void;
  allMembers: Member[];
  setAllMembers: (members: Member[]) => void;
}

export function EditGroupModal({
  group,
  onClose,
  onEdit,
  allMembers,
  setAllMembers,
}: EditGroupModalProps) {
  const [groupName, setGroupName] = useState(group.name);
  const [members, setMembers] = useState<string[]>(group.members);
  const [newMember, setNewMember] = useState('');
  const [suggestions, setSuggestions] = useState<Member[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleMemberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value;
    setNewMember(value);

    if (value.trim()) {
      const matchedSuggestions = allMembers
        .filter(
          (member) =>
            member.name.toLowerCase().includes(value.toLowerCase()) &&
            !members.includes(member.name)
        )
        .slice(0, 5);
      setSuggestions(matchedSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleAddMember = async (
    memberName: string = newMember.trim()
  ): Promise<void> => {
    if (memberName && !members.includes(memberName)) {
      try {
        if (!allMembers.some((m) => m.name === memberName)) {
          const response = await fetch('/api/members', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: memberName }),
          });

          if (response.ok) {
            const newMember = await response.json();
            setAllMembers([...allMembers, newMember]);
          }
        }

        setMembers([...members, memberName]);
        setNewMember('');
        setSuggestions([]);
        setShowSuggestions(false);
      } catch (error) {
        console.error('Error adding member:', error);
      }
    }
  };

  const handleRemoveMember = (memberToRemove: string): void => {
    setMembers(members.filter((member) => member !== memberToRemove));
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (groupName.trim() && members.length > 0) {
      onEdit(group.id, groupName.trim(), members);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="groupName"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-600 focus:border-transparent shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Members
            </label>
            {members.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {members.map((member) => (
                  <span
                    key={member}
                    className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-sm flex items-center gap-1 font-medium"
                  >
                    {member}
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member)}
                      className="text-indigo-500 hover:text-indigo-700 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMember}
                  onChange={handleMemberInputChange}
                  onFocus={() => newMember.trim() && setShowSuggestions(true)}
                  className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-600 focus:border-transparent shadow-sm"
                  placeholder="Add new member"
                />
                <button
                  type="button"
                  onClick={() => handleAddMember()}
                  className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-200 transition-colors font-medium whitespace-nowrap"
                >
                  Add
                </button>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-48 overflow-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleAddMember(suggestion.name)}
                      className="w-full text-left px-4 py-2 text-gray-900 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
                    >
                      {suggestion.name}
                    </button>
                  ))}
                </div>
              )}

              {showSuggestions &&
                newMember.trim() &&
                suggestions.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleAddMember()}
                      className="w-full text-left px-4 py-2 text-gray-900 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
                    >
                      Create new member &quot;{newMember.trim()}&quot;
                    </button>
                  </div>
                )}
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-700 text-white px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors font-medium"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
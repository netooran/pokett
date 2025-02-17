'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DeleteConfirmationModal } from '@/app/components/DeleteConfirmationModal';

import { Member, Group } from '@/types/models';

// Add a utility function for formatting currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

interface EditGroupModalProps {
  group: Group;
  onClose: () => void;
  onEdit: (id: string, name: string, members: string[]) => void;
  allMembers: Member[];
  setAllMembers: (members: Member[]) => void;
}

function EditGroupModal({
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
          await fetch('/api/members', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: memberName }),
          });
        }

        setMembers([...members, memberName]);
        setNewMember('');
        setSuggestions([]);
        setShowSuggestions(false);
        setAllMembers([...allMembers, { id: '', name: memberName }]);
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
      onClose();
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

export default function GroupsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, membersRes] = await Promise.all([
          fetch('/api/groups'),
          fetch('/api/members'),
        ]);

        const groupsData = await groupsRes.json();
        const membersData = await membersRes.json();

        setGroups(groupsData);
        setAllMembers(membersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateGroup = async (name: string, members: string[]) => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, members }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      const newGroup = await response.json();
      setGroups((prevGroups) => [...prevGroups, newGroup]);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating group:', error);
      // Optionally show an error message to the user
      alert('Failed to create group. Please try again.');
    }
  };

  const handleEditGroup = async (
    id: string,
    name: string,
    members: string[]
  ) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, members }),
      });

      if (!response.ok) throw new Error('Failed to update group');

      const updatedGroup = await response.json();

      // Update the groups list with the updated group
      setGroups((prevGroups) =>
        prevGroups.map((group) => (group.id === id ? updatedGroup : group))
      );

      // Close the edit modal
      setEditingGroup(null);
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete group');

      // Remove the group from the state
      setGroups((prevGroups) => prevGroups.filter((group) => group.id !== id));
      setDeletingGroup(null); // Close the modal
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Groups</h1>
          {groups.length > 0 && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-700 text-white px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors"
            >
              Create Group
            </button>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 mx-auto text-gray-400 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              No groups yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create a group to start tracking shared expenses with friends
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-700 text-white px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {group.name}
                    </h3>
                    <p className="text-gray-600">
                      Total Expenses:{' '}
                      <span className="font-medium text-gray-900">
                        {formatCurrency(group.totalExpenses)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingGroup(group)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit group"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingGroup(group)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete group"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Members:</p>
                    <div className="flex flex-wrap gap-2">
                      {group.members.map((member) => (
                        <span
                          key={member}
                          className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-sm font-medium"
                        >
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/groups/${group.id}`}
                    className="block w-full bg-indigo-50 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-100 transition-colors text-center font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingGroup && (
          <EditGroupModal
            group={editingGroup}
            onClose={() => setEditingGroup(null)}
            onEdit={handleEditGroup}
            allMembers={allMembers}
            setAllMembers={setAllMembers}
          />
        )}

        {isCreateModalOpen && (
          <CreateGroupModal
            onClose={() => setIsCreateModalOpen(false)}
            onCreateGroup={handleCreateGroup}
            allMembers={allMembers}
            setAllMembers={setAllMembers}
          />
        )}

        {deletingGroup && (
          <DeleteConfirmationModal
            title="Delete Group"
            message={`Are you sure you want to delete "${deletingGroup.name}"? This action cannot be undone.`}
            onConfirm={() => handleDeleteGroup(deletingGroup.id)}
            onCancel={() => setDeletingGroup(null)}
          />
        )}
      </main>
    </div>
  );
}

interface CreateGroupModalProps {
  onClose: () => void;
  onCreateGroup: (name: string, members: string[]) => void;
  allMembers: Member[];
  setAllMembers: (members: Member[]) => void;
}

function CreateGroupModal({
  onClose,
  onCreateGroup,
  allMembers,
  setAllMembers,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [newMember, setNewMember] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Member[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleMemberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value;
    setNewMember(value);

    if (value.trim()) {
      // Only filter out members already in this group
      const matchedSuggestions = allMembers
        .filter(
          (member) =>
            member.name.toLowerCase().includes(value.toLowerCase()) &&
            !members.includes(member.name) // Only check current group's members
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
        // Only create a new member if they don't exist in allMembers
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
            // Update allMembers in the parent component
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

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (groupName.trim() && members.length > 0) {
      onCreateGroup(groupName.trim(), members);
      onClose();
    }
  };

  const handleRemoveMember = (memberToRemove: string): void => {
    setMembers(members.filter((member) => member !== memberToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Create New Group
        </h2>
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
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label
              htmlFor="members"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Add Members
            </label>
            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  id="members"
                  value={newMember}
                  onChange={handleMemberInputChange}
                  onFocus={() => newMember.trim() && setShowSuggestions(true)}
                  className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-600 focus:border-transparent shadow-sm"
                  placeholder="Enter member name"
                />
                <button
                  type="button"
                  onClick={() => handleAddMember()}
                  className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-200 transition-colors font-medium whitespace-nowrap"
                >
                  Add Member
                </button>
              </div>

              {/* Suggestions dropdown */}
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

              {/* Show "Create new member" option when no matches */}
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

          {members.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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

// In-memory data store
class Store {
  private members: Member[] = [
    { id: '1', name: 'John' },
    { id: '2', name: 'Sarah' },
    { id: '3', name: 'Mike' },
    { id: '4', name: 'Anna' },
    { id: '5', name: 'Alex' },
    { id: '6', name: 'Chris' },
  ];

  private groups: Group[] = [
    {
      id: '1',
      name: 'Weekend Trip',
      totalExpenses: 1250.5,
      members: ['John', 'Sarah', 'Mike', 'Anna'],
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'Roommates',
      totalExpenses: 3425.75,
      members: ['You', 'Alex', 'Chris'],
      createdAt: new Date('2024-02-01'),
    },
  ];

  // Add a utility function for formatting currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Member methods
  getAllMembers(): Member[] {
    return this.members;
  }

  addMember(name: string): Member {
    const newMember: Member = {
      id: Date.now().toString(),
      name,
    };
    this.members.push(newMember);
    return newMember;
  }

  // Group methods
  getAllGroups(): Group[] {
    return this.groups;
  }

  addGroup(name: string, members: string[]): Group {
    const newGroup: Group = {
      id: Date.now().toString(),
      name,
      totalExpenses: 0,
      members,
      createdAt: new Date(),
    };
    this.groups.push(newGroup);
    return newGroup;
  }

  // Add edit method
  editGroup(id: string, name: string, members: string[]): Group | null {
    const group = this.groups.find((g) => g.id === id);
    if (group) {
      group.name = name;
      group.members = members;
      return {
        ...group,
        members: [...members], // Ensure we return a new array
      };
    }
    return null;
  }

  // Add delete method
  deleteGroup(id: string): boolean {
    const index = this.groups.findIndex((g) => g.id === id);
    if (index !== -1) {
      this.groups.splice(index, 1);
      return true;
    }
    return false;
  }
}

// Create a singleton instance
export const store = new Store();

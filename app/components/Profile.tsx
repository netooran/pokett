'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStytch, useStytchUser } from '@stytch/nextjs';

const Profile = () => {
  const stytch = useStytch();
  const { user } = useStytchUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    `${user?.name.first_name} ${user?.name.last_name}` || 'User'
  )}&background=random&color=ffffff`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="avatar cursor-pointer focus:outline-none"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-expanded={isMenuOpen}
        aria-label="User menu"
      >
        <div className="w-10 h-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
          <img
            src={profileImage}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </button>
      {isMenuOpen && (
        <div
          className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg w-64 border border-gray-200 p-4 flex flex-col items-start"
          role="menu"
          aria-labelledby="user-menu"
        >
          <span className="text-md font-semibold text-primary" role="menuitem">
            {user?.name.first_name} {user?.name.last_name}
          </span>
          <span className="text-sm text-gray-500" role="menuitem">
            {user?.emails?.[0]?.email}
          </span>
          <button
            className="mt-4 w-full px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition duration-200 ease-in-out flex items-center justify-center gap-2"
            onClick={() => stytch.session.revoke()}
            role="menuitem"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-log-out"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;

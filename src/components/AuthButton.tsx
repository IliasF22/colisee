"use client";

import { useAuth } from "@/lib/AuthContext";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function AuthButton() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-sf-alt" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link 
          href="/proposer"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-fg text-bg px-3 py-1.5 text-[13px] font-medium transition-transform hover:scale-105 active:scale-95"
        >
          Proposer une adresse
        </Link>
        <div className="group relative flex items-center gap-2">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName || "Profil"}
              width={32}
              height={32}
              className="rounded-full border border-bd cursor-pointer"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sf-alt border border-bd cursor-pointer">
              <UserIcon className="h-4 w-4 text-mt" />
            </div>
          )}
          
          <div className="absolute right-0 top-full mt-2 hidden w-48 rounded-lg border border-bd bg-bg shadow-xl group-hover:block z-50">
            <div className="p-3 border-b border-bd">
              <p className="text-sm font-medium truncate">{user.displayName || "Utilisateur"}</p>
              <p className="text-xs text-mt truncate">{user.email}</p>
            </div>
            <div className="p-1">
              <Link
                href="/proposer"
                className="sm:hidden flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sf-hover text-fg"
              >
                Proposer une adresse
              </Link>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-err hover:bg-err/10"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="flex items-center gap-1.5 rounded-md border border-bd px-3 py-1.5 text-[13px] font-medium text-fg transition-colors hover:bg-sf-hover"
    >
      <LogIn className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Se connecter</span>
    </Link>
  );
}

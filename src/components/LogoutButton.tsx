"use client";

export function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Full navigation, not router.push/refresh — guarantees the homepage
    // is fetched fresh from the server with the cleared cookie.
    window.location.href = "/";
  }

  return (
    <button
      onClick={handleLogout}
      className="hover:text-brandBlue dark:hover:text-blue-400 transition-colors"
    >
      Cerrar sesión
    </button>
  );
}

import React from "react";

export default function User({ user }) {
  return (
    <div className="user-page">
      <h1>Welcome, {user?.name || "User"}!</h1>
      <p>You have successfully logged in.</p>
    </div>
  );
}
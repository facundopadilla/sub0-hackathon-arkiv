import React from "react";

type NotificationProps = {
  notification: {
    message: string;
    type: "success" | "error";
  } | null;
};

export const Notification: React.FC<NotificationProps> = ({ notification }) => {
  if (!notification) return null;

  const isSuccess = notification.type === "success";

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl border backdrop-blur-sm animate-slide-in ${
        isSuccess
          ? "bg-green-500/10 border-green-500/50 text-green-400"
          : "bg-red-500/10 border-red-500/50 text-red-400"
      }`}
    >
      {notification.message}
    </div>
  );
};

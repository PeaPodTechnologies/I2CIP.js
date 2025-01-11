import React from 'react';
import '@/app/globals.css';

export default function SocketPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <section>{children}</section>;
}

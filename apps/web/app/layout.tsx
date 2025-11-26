export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

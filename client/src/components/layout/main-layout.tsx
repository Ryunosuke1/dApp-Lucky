import { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { App, Navigation, Stack } from "@nordhealth/react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <App>
      <Navigation>
        <Header />
      </Navigation>
      <Stack gap="l" padding="l">
        <main className="flex-1 min-h-[calc(100vh-var(--n-navbar-height))]">
          {children}
        </main>
        <Footer />
      </Stack>
    </App>
  );
}

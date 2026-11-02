import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/components/shell/AppProviders";
import { ShellFrame } from "@/components/shell/ShellFrame";
import { TopBar } from "@/components/shell/TopBar";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { isSample } from "@/lib/data/source";
// BoardUI's stylesheet, with the app layer on top (see the file's header).
import "./globals.css";

// BoardUI's type family, exposed as --font-inter for its theme's --font-sans.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: `${APP_NAME} — ${APP_TAGLINE}. Personal stock research.`,
};

// Applies the saved theme before first paint, so dark mode never flashes light.
// The key is THEME_STORAGE_KEY from BoardUI's theme-toggle (a client module,
// so its constant can't be imported into this server file).
const THEME_SCRIPT = `(function(){try{if(localStorage.getItem("boardui:theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`;

/**
 * The shell (sidebar, top bar) is rendered here, once, so it stays mounted
 * while screens change below it: navigations only swap the screen, with the
 * page transition in AppShell. Screens hand the shell their active item,
 * symbol and quote through AppShell.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-US" dir="ltr" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AppProviders>
          <ShellFrame live={!isSample} topBar={<TopBar live={!isSample} />}>
            {children}
          </ShellFrame>
        </AppProviders>
      </body>
    </html>
  );
}

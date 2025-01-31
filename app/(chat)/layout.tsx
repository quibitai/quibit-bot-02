import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import Protected from '../protected';
import { createClient } from '@/utils/supabase/server';
import Script from 'next/script';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase, cookieStore] = await Promise.all([
    createClient(),
    cookies()
  ]);
  
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Protected>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={user || undefined} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </Protected>
  );
}

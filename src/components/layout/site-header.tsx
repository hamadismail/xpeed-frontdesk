import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";
import { ModeToggle } from "./mode-toggler";
import { Hotel } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) bg-white dark:bg-gray-900">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg p-2">
              <Hotel className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Eco Hotel</h1>
              <p className="text-xs text-muted-foreground">Bukit Bintang</p>
            </div>
          </div>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

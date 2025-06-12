import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Marketplace from "@/pages/marketplace";
import Auctions from "@/pages/auctions";
import RightDetail from "@/pages/right-detail";
import Admin from "@/pages/admin";
import Dashboard from "@/pages/dashboard";
import GoogleCallback from "@/pages/google-callback";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/auctions" component={Auctions} />
      <Route path="/rights/:id" component={RightDetail} />
      <Route path="/admin" component={Admin} />
      <Route path="/auth/google/callback" component={GoogleCallback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

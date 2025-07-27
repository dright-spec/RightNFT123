import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
// Removed clear-cache import
import Home from "./pages/home";
import Marketplace from "./pages/marketplace";
import ProfileSetup from "./pages/profile-setup";
import RightDetail from "./pages/right-detail";
import Admin from "./pages/admin";
import Dashboard from "./pages/dashboard";
import CreateRight from "./pages/create-right";
import Staking from "./pages/staking";
import GoogleCallback from "./pages/google-callback";
import Docs from "./pages/docs";
import About from "./pages/about";
import ApiReference from "./pages/api-reference";
import Settings from "./pages/settings";
import MintingProgress from "./pages/minting-progress";
import AdminFiles from "./pages/admin-files";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/profile-setup" component={ProfileSetup} />
      <Route path="/create-right" component={CreateRight} />
      <Route path="/staking" component={Staking} />
      <Route path="/rights/:id" component={RightDetail} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/files" component={AdminFiles} />
      <Route path="/docs" component={Docs} />
      <Route path="/api-reference" component={ApiReference} />
      <Route path="/about" component={About} />
      <Route path="/settings" component={Settings} />
      <Route path="/google-callback" component={GoogleCallback} />
      <Route path="/minting-progress" component={MintingProgress} />
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

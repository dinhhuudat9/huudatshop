import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Layout } from "@/components/layout/Layout";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import CategoryProducts from "@/pages/category-products";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";
import Account from "@/pages/account";
import AddBalance from "@/pages/account/add-balance";
import Orders from "@/pages/account/orders";
import Downloads from "@/pages/account/downloads";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminPosts from "@/pages/admin/posts";
import AdminCategories from "@/pages/admin/categories";
import AdminBalanceRequests from "@/pages/admin/balance-requests";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/san-pham" component={Products} />
        <Route path="/san-pham/:id" component={ProductDetail} />
        <Route path="/danh-muc/:slug" component={CategoryProducts} />
        <Route path="/tin-tuc" component={Blog} />
        <Route path="/tin-tuc/:id" component={BlogPost} />
        
        <Route path="/dang-nhap" component={Login} />
        <Route path="/dang-ky" component={Register} />
        <Route path="/quen-mat-khau" component={ForgotPassword} />
        <Route path="/dat-lai-mat-khau" component={ResetPassword} />
        
        <Route path="/tai-khoan" component={Account} />
        <Route path="/tai-khoan/nap-tien" component={AddBalance} />
        <Route path="/tai-khoan/don-hang" component={Orders} />
        <Route path="/tai-khoan/tai-xuong" component={Downloads} />
        
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/san-pham" component={AdminProducts} />
        <Route path="/admin/bai-viet" component={AdminPosts} />
        <Route path="/admin/danh-muc" component={AdminCategories} />
        <Route path="/admin/nap-tien" component={AdminBalanceRequests} />
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

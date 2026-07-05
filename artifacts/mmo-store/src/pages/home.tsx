import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Code2, Database, Shield, Zap, Terminal } from "lucide-react";
import { useListProducts, getListProductsQueryKey, useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";

export default function Home() {
  const { data: popularProducts, isLoading: loadingPopular } = useListProducts(
    { sortBy: "popular", limit: 4 },
    { query: { queryKey: getListProductsQueryKey({ sortBy: "popular", limit: 4 }) } }
  );

  const { data: featuredProducts, isLoading: loadingFeatured } = useListProducts(
    { featured: true, limit: 8 },
    { query: { queryKey: getListProductsQueryKey({ featured: true, limit: 8 }) } }
  );

  const { data: categories, isLoading: loadingCategories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="container px-4 md:px-8 mx-auto relative z-10 max-w-screen-xl text-center">
          <Badge variant="outline" className="mb-6 px-3 py-1 bg-primary/10 text-primary border-primary/20 backdrop-blur-sm mx-auto">
            Nền tảng MMO hàng đầu Việt Nam
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            Mã nguồn & Công cụ MMO <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 text-glow">Chất lượng cao</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-mono">
            Chợ điện tử dành cho Developer và dân MMO. Cung cấp mã nguồn website, tool auto, script và tài nguyên số chuyên nghiệp.
          </p>
          
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                className="pl-10 h-14 bg-background/50 border-border/50 text-base" 
                placeholder="Bạn đang tìm kiếm mã nguồn gì?"
              />
            </div>
            <Button size="lg" className="h-14 px-8 text-base font-bold box-glow">
              Tìm kiếm
            </Button>
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground font-mono">
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-green-500" /> Thanh toán an toàn</div>
            <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" /> Tải xuống tức thì</div>
            <div className="flex items-center gap-2"><Code2 className="h-4 w-4 text-blue-500" /> Mã nguồn sạch</div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container px-4 md:px-8 mx-auto max-w-screen-2xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" /> 
              Sản phẩm nổi bật
            </h2>
            <p className="text-muted-foreground mt-2">Các mã nguồn và công cụ được đánh giá cao nhất</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/san-pham?featured=true">Xem tất cả</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingFeatured ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[350px] rounded-lg bg-card animate-pulse" />
            ))
          ) : featuredProducts?.products?.length ? (
            featuredProducts.products.slice(0, 4).map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground">Không có sản phẩm nào</div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="container px-4 md:px-8 mx-auto max-w-screen-2xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" /> 
          Danh mục sản phẩm
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingCategories ? (
             Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[100px] rounded-lg bg-card animate-pulse" />
            ))
          ) : categories?.map(category => (
            <Link key={category.id} href={`/danh-muc/${category.slug}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-border/50 bg-card/40 backdrop-blur">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="font-bold">{category.name}</div>
                  <div className="text-sm font-mono text-muted-foreground bg-background px-2 py-1 rounded">
                    {category.productCount || 0}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Products */}
      <section className="container px-4 md:px-8 mx-auto max-w-screen-2xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Terminal className="h-6 w-6 text-primary" /> 
              Được mua nhiều nhất
            </h2>
            <p className="text-muted-foreground mt-2">Sản phẩm có lượt mua cao trên hệ thống</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingPopular ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[350px] rounded-lg bg-card animate-pulse" />
            ))
          ) : popularProducts?.products?.length ? (
            popularProducts.products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground">Không có sản phẩm nào</div>
          )}
        </div>
      </section>
      
      {/* CTA */}
      <section className="container px-4 md:px-8 mx-auto max-w-screen-xl my-8">
        <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-card">
          <div className="absolute inset-0 bg-primary/5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Bạn là Developer?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Đăng bán sản phẩm của bạn trên MMO Store và tiếp cận hàng ngàn khách hàng tiềm năng. Phí nền tảng thấp, thanh toán linh hoạt.
            </p>
            <Button size="lg" asChild className="box-glow">
              <Link href="/dang-ky">Đăng ký người bán ngay</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// Simple Badge component inline to avoid extra file write if not needed
function Badge({ className, variant, ...props }: any) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`} {...props} />;
}

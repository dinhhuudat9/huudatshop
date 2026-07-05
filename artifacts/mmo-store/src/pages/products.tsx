import { useState } from "react";
import { useLocation } from "wouter";
import { useListProducts, getListProductsQueryKey, useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, Loader2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function Products() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState<number | undefined>(
    searchParams.get("categoryId") ? parseInt(searchParams.get("categoryId")!) : undefined
  );
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "popular" | "rating">(
    (searchParams.get("sortBy") as any) || "newest"
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const queryParams = {
    search: search || undefined,
    categoryId,
    sortBy,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 10000000 ? priceRange[1] : undefined,
    page,
    limit,
    featured: searchParams.get("featured") === "true" ? true : undefined
  };

  const { data, isLoading, isFetching } = useListProducts(queryParams, {
    query: { 
      queryKey: getListProductsQueryKey(queryParams),
      placeholderData: (prev: any) => prev
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryId(undefined);
    setSortBy("newest");
    setPriceRange([0, 10000000]);
    setPage(1);
    window.history.pushState({}, '', '/san-pham');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Khám phá Mã Nguồn
          </h1>
          <p className="text-muted-foreground mt-2">
            Tìm kiếm hàng ngàn mã nguồn chất lượng cao và script tự động
          </p>
        </div>

        <div className="w-full md:w-auto">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm kiếm mã nguồn..." 
                className="pl-9 bg-background/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit">Tìm</Button>
          </form>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar - Desktop */}
        <div className="hidden lg:block w-64 flex-none space-y-6">
          <FilterSection 
            categories={categories}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            clearFilters={clearFilters}
            setPage={setPage}
          />
        </div>

        {/* Mobile Filters */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" /> Bộ lọc
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle>Bộ lọc sản phẩm</SheetTitle>
              </SheetHeader>
              <FilterSection 
                categories={categories}
                categoryId={categoryId}
                setCategoryId={setCategoryId}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                clearFilters={clearFilters}
                setPage={setPage}
              />
            </SheetContent>
          </Sheet>

          <Select value={sortBy} onValueChange={(val: any) => { setSortBy(val); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="popular">Bán chạy nhất</SelectItem>
              <SelectItem value="rating">Đánh giá cao</SelectItem>
              <SelectItem value="price_asc">Giá tăng dần</SelectItem>
              <SelectItem value="price_desc">Giá giảm dần</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="hidden lg:flex justify-between items-center mb-6 bg-card/40 p-3 rounded-lg border border-border/50">
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                "Đang tìm kiếm..."
              ) : (
                <>Tìm thấy <span className="font-bold text-foreground">{data?.total || 0}</span> sản phẩm</>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Sắp xếp:</span>
              <Select value={sortBy} onValueChange={(val: any) => { setSortBy(val); setPage(1); }}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="popular">Bán chạy nhất</SelectItem>
                  <SelectItem value="rating">Đánh giá cao</SelectItem>
                  <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                  <SelectItem value="price_desc">Giá giảm dần</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(isLoading && !data) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-[350px] rounded-lg bg-card animate-pulse" />
              ))}
            </div>
          ) : data?.products?.length ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 relative">
                {isFetching && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                {data.products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages && data.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button 
                    variant="outline" 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Trước
                  </Button>
                  <div className="flex items-center gap-1 font-mono">
                    {Array.from({ length: data.totalPages }).map((_, i) => (
                      <Button
                        key={i}
                        variant={page === i + 1 ? "default" : "ghost"}
                        size="icon"
                        className="w-9 h-9"
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    disabled={page === data.totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 bg-card/20 rounded-xl border border-dashed border-border/50">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc để xem các kết quả khác.
              </p>
              <Button variant="outline" onClick={clearFilters}>Xóa bộ lọc</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ 
  categories, 
  categoryId, 
  setCategoryId, 
  priceRange, 
  setPriceRange,
  clearFilters,
  setPage
}: any) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Bộ lọc</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8">
          Làm mới
        </Button>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Danh mục</h4>
        <div className="space-y-2">
          <button 
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              categoryId === undefined ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
            }`}
            onClick={() => { setCategoryId(undefined); setPage(1); }}
          >
            Tất cả sản phẩm
          </button>
          {categories?.map((cat: any) => (
            <button
              key={cat.id}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center transition-colors ${
                categoryId === cat.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
              }`}
              onClick={() => { setCategoryId(cat.id); setPage(1); }}
            >
              <span>{cat.name}</span>
              {cat.productCount !== undefined && (
                <Badge variant="secondary" className="text-[10px] py-0">{cat.productCount}</Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Khoảng giá (VNĐ)</h4>
        <div className="pt-4 px-2">
          <Slider
            defaultValue={[0, 10000000]}
            max={10000000}
            step={50000}
            value={priceRange}
            onValueChange={setPriceRange}
            onValueCommit={() => setPage(1)}
            className="mb-6"
          />
          <div className="flex items-center justify-between text-xs font-mono">
            <span>{(priceRange[0] / 1000).toFixed(0)}k</span>
            <span>{(priceRange[1] / 1000).toFixed(0)}k+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

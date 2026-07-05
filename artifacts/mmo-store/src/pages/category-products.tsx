import { useParams, Link } from "wouter";
import { useListProducts, getListProductsQueryKey, useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CategoryProducts() {
  const params = useParams();
  const slug = params.slug || "";

  // We need to find the category ID from the slug
  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const category = categories?.find(c => c.slug === slug);
  const categoryId = category?.id;

  const { data, isLoading } = useListProducts(
    { categoryId, limit: 20 },
    { 
      query: { 
        enabled: !!categoryId,
        queryKey: getListProductsQueryKey({ categoryId, limit: 20 }) 
      } 
    }
  );

  if (!categories && !isLoading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  if (categories && !category) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Danh mục không tồn tại</h2>
        <Button asChild>
          <Link href="/san-pham">Xem tất cả sản phẩm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
      <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground">
        <Link href="/san-pham">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Trở về tất cả sản phẩm
        </Link>
      </Button>

      <div className="mb-10 p-8 rounded-2xl bg-card border border-border/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            {category?.name}
          </h1>
          {category?.description && (
            <p className="text-muted-foreground max-w-2xl">
              {category.description}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[350px] rounded-lg bg-card animate-pulse" />
          ))}
        </div>
      ) : data?.products?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {data.products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-card/20 rounded-xl border border-dashed border-border/50">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Chưa có sản phẩm nào</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            Danh mục này hiện chưa có sản phẩm nào. Vui lòng quay lại sau.
          </p>
          <Button asChild className="box-glow">
            <Link href="/san-pham">Khám phá danh mục khác</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

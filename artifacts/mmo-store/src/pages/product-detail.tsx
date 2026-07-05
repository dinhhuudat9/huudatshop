import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetProduct, getGetProductQueryKey, useListProductReviews, getListProductReviewsQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { formatVND, formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShoppingCart, Eye, Star, Terminal, Code2, Globe, Calendar, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProductDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const id = params.id ? parseInt(params.id, 10) : 0;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("description");

  const { data: product, isLoading, error } = useGetProduct(id, {
    query: {
      enabled: !!id,
      queryKey: getGetProductQueryKey(id)
    }
  });

  const { data: reviews } = useListProductReviews(id, {
    query: {
      enabled: !!id,
      queryKey: getListProductReviewsQueryKey(id)
    }
  });

  const createOrder = useCreateOrder();

  const handleBuy = () => {
    if (!isAuthenticated) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để mua sản phẩm này.",
      });
      setLocation("/dang-nhap");
      return;
    }

    if (user && user.balance < (product?.price || 0)) {
      toast({
        variant: "destructive",
        title: "Số dư không đủ",
        description: `Bạn cần thêm ${formatVND((product?.price || 0) - user.balance)} để mua sản phẩm này.`,
      });
      setLocation("/tai-khoan/nap-tien");
      return;
    }

    createOrder.mutate({ data: { productId: id } }, {
      onSuccess: () => {
        toast({
          title: "Mua thành công!",
          description: "Sản phẩm đã được thêm vào thư viện tải xuống của bạn.",
        });
        setLocation("/tai-khoan/tai-xuong");
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: err.message || "Đã xảy ra lỗi khi thanh toán.",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-screen-xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3 space-y-6">
            <Skeleton className="w-full aspect-video rounded-xl" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="w-full lg:w-1/3">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Sản phẩm không tồn tại</h2>
        <Button asChild>
          <Link href="/san-pham">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column - Main Content */}
        <div className="w-full lg:w-2/3 space-y-8">
          {/* Main Image/Carousel placeholder */}
          <div className="w-full aspect-video md:aspect-[16/9] rounded-xl overflow-hidden border border-border/50 bg-muted/30 shadow-lg relative">
            {product.thumbnailUrl ? (
              <img 
                src={product.thumbnailUrl} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Terminal className="h-20 w-20 text-muted-foreground opacity-30" />
              </div>
            )}
            
            <div className="absolute top-4 left-4 flex gap-2">
              {product.featured && (
                <Badge className="bg-primary text-primary-foreground">Nổi bật</Badge>
              )}
              {product.categoryName && (
                <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                  {product.categoryName}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              {product.name}
            </h1>
            
            {product.shortDescription && (
              <p className="text-lg text-muted-foreground">
                {product.shortDescription}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-mono bg-muted/20 p-3 rounded-lg border border-border/30">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{product.viewCount} lượt xem</span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span>{product.soldCount} lượt mua</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{product.rating.toFixed(1)} ({product.reviewCount || 0} đánh giá)</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Đăng ngày: {formatDate(product.createdAt)}</span>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0 h-auto">
              <TabsTrigger 
                value="description" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3 font-medium"
              >
                Mô tả chi tiết
              </TabsTrigger>
              <TabsTrigger 
                value="features" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3 font-medium"
              >
                Tính năng
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3 font-medium"
              >
                Đánh giá ({product.reviewCount || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="pt-6">
              <div 
                className="prose prose-invert max-w-none prose-p:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.description || "Chưa có mô tả chi tiết cho sản phẩm này." }}
              />
            </TabsContent>
            
            <TabsContent value="features" className="pt-6">
              {product.features && product.features.length > 0 ? (
                <ul className="space-y-3">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 bg-primary/20 p-1 rounded-full">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">Chưa cập nhật danh sách tính năng.</p>
              )}
            </TabsContent>
            
            <TabsContent value="reviews" className="pt-6">
              {reviews && reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="flex gap-4 p-4 rounded-lg bg-card/30 border border-border/40">
                      <Avatar>
                        <AvatarFallback>{review.username?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{review.username || "Người dùng ẩn danh"}</h4>
                          <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                        </div>
                        <div className="flex text-yellow-500 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-current" : "text-muted opacity-30"}`} />
                          ))}
                        </div>
                        <p className="text-sm text-foreground/80">{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/10 rounded-lg border border-dashed">
                  <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-muted-foreground">Chưa có đánh giá nào cho sản phẩm này.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sticky Sidebar */}
        <div className="w-full lg:w-1/3">
          <div className="sticky top-24 space-y-6">
            
            {/* Purchase Card */}
            <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur shadow-xl overflow-hidden">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Giá sản phẩm</span>
                  {discount > 0 && (
                    <Badge variant="destructive">Giảm {discount}%</Badge>
                  )}
                </div>
                
                <div className="flex flex-col">
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatVND(product.originalPrice)}
                    </span>
                  )}
                  <span className="text-4xl font-bold text-primary font-mono text-glow">
                    {formatVND(product.price)}
                  </span>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-4">
                {!isAuthenticated && (
                  <Alert className="bg-primary/5 border-primary/20 mb-4">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertTitle>Cần đăng nhập</AlertTitle>
                    <AlertDescription className="text-xs">
                      Bạn cần đăng nhập để có thể mua sản phẩm này.
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  className="w-full h-12 text-lg font-bold box-glow" 
                  onClick={handleBuy}
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? "Đang xử lý..." : "Mua ngay"}
                </Button>
                
                {product.demoUrl && (
                  <Button variant="outline" className="w-full h-12" asChild>
                    <a href={product.demoUrl} target="_blank" rel="noopener noreferrer">
                      <Globe className="mr-2 h-4 w-4" />
                      Xem Demo Trực Tiếp
                    </a>
                  </Button>
                )}
                
                <div className="pt-4 border-t border-border/40 text-xs text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" /> <span>Thanh toán một lần, sử dụng vĩnh viễn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" /> <span>Tải xuống mã nguồn ngay lập tức</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" /> <span>Hỗ trợ kỹ thuật từ tác giả</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tech Stack Card */}
            {product.techStack && product.techStack.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card/40 p-6">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <Code2 className="h-5 w-5 text-primary" />
                  Công nghệ sử dụng
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.techStack.map((tech) => (
                    <Badge key={tech} variant="outline" className="bg-muted/50 hover:bg-muted font-mono">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card/40 p-6">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="text-xs text-muted-foreground hover:text-primary cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}

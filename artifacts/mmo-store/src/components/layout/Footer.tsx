import { Terminal, Github, Twitter, Facebook } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur mt-auto">
      <div className="container max-w-screen-2xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Terminal className="h-6 w-6 text-primary text-glow" />
              <span className="font-bold text-lg text-glow">MMO Store</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Nền tảng mua bán mã nguồn, script automation và công cụ MMO hàng đầu Việt Nam. Nơi kết nối developer và người dùng cuối.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Sản phẩm</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/danh-muc/ma-nguon-website" className="hover:text-primary transition-colors">Mã nguồn Website</Link></li>
              <li><Link href="/danh-muc/cong-cu-mmo" className="hover:text-primary transition-colors">Công cụ MMO</Link></li>
              <li><Link href="/danh-muc/script-automation" className="hover:text-primary transition-colors">Script Automation</Link></li>
              <li><Link href="/danh-muc/plugin-theme" className="hover:text-primary transition-colors">Plugin & Theme</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Trung tâm trợ giúp</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Hướng dẫn thanh toán</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Chính sách hoàn tiền</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Liên hệ</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Chính sách</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Quy định người bán</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Giải quyết khiếu nại</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border/40 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} MMO Store. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Hệ thống hoạt động ổn định</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

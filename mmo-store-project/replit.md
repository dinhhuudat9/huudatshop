# MMO Store

Website chợ điện tử bán mã nguồn và tài nguyên MMO (Make Money Online) dành cho developers và dân kiếm tiền online Việt Nam.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — chạy API server (port 8080)
- `pnpm --filter @workspace/mmo-store run dev` — chạy frontend (port 24457)
- `pnpm run typecheck` — full typecheck toàn bộ packages
- `pnpm run build` — typecheck + build tất cả packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks và Zod schemas từ OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Tailwind CSS v4 + shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (bcryptjs + jsonwebtoken)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (từ OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — Drizzle schema (users, categories, products, orders, reviews, posts)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/mmo-store/src/` — React frontend
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/` — Generated Zod schemas

## Architecture decisions

- JWT-based auth: token stored in localStorage, sent as Bearer header — no session/cookie needed for deployment flexibility
- Dark-only theme: site có một chủ đề dark duy nhất, không có light mode
- Prices in VND: giá hiển thị dạng "150.000đ" phù hợp thị trường Việt Nam
- Balance system: user nạp tiền vào balance, mua sản phẩm trừ balance — không dùng payment gateway
- Admin role: user có role="admin" mới truy cập được /admin

## Product

- Trang chủ với featured products, popular products, danh mục, blog
- Danh sách sản phẩm với search, filter, sort, pagination
- Chi tiết sản phẩm với mô tả, tech stack, reviews, nút mua
- Hệ thống tài khoản: đăng ký/đăng nhập, nạp tiền, lịch sử mua, downloads
- Admin panel: quản lý sản phẩm, bài viết, xem thống kê

## Test accounts

- Admin: `admin@mmostore.vn` / `admin123`
- User: `user@mmostore.vn` / `user123`

## User preferences

- Toàn bộ UI bằng tiếng Việt
- Dark theme only, màu primary là indigo/violet
- Giá hiển thị định dạng VND

## Gotchas

- Chạy `pnpm --filter @workspace/api-spec run codegen` sau mỗi lần thay đổi openapi.yaml
- Không thay đổi `info.title` trong openapi.yaml (ảnh hưởng đến tên file generated)
- `@apply dark` không hợp lệ trong Tailwind v4 — thêm class "dark" vào html element từ JS
- Session secret cần được set trong env để JWT hoạt động đúng

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

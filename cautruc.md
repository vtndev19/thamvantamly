# Cấu trúc thư mục – SafeSchool Hub

Dự án sử dụng **React Router v8** (Framework mode) + **TailwindCSS v4**.

```
my-react-router-app/
├── app/
│   ├── app.css                        # Design tokens (CSS custom properties) + global styles
│   ├── root.tsx                       # Layout root: fonts, meta, ScrollRestoration
│   ├── routes.ts                      # Khai báo các route
│   │
│   ├── components/
│   │   ├── ui/                        # Primitive – tái sử dụng tối đa
│   │   │   ├── Button.tsx             # Button (variant: primary | outline | ghost)
│   │   │   └── Icon.tsx               # Material Symbols wrapper
│   │   │
│   │   ├── layout/                    # Shell layout – dùng trên mọi trang
│   │   │   ├── Navbar.tsx             # Sticky navbar với glassmorphism
│   │   │   └── Footer.tsx             # Footer với quick-links & copyright
│   │   │
│   │   └── home/                      # Components riêng cho trang chủ
│   │       ├── HeroSection.tsx        # Hero: tiêu đề, tagline, stats, CTA
│   │       ├── FeatureCard.tsx        # Card tái sử dụng cho 1 tính năng
│   │       └── FeatureGrid.tsx        # Bento grid 3 cột chứa FeatureCard
│   │
│   ├── routes/
│   │   └── home.tsx                   # Trang chủ – lắp ráp tất cả components
│   │
│   └── src/
│       └── config/                    # (dành cho Firebase / env config)
│
├── public/                            # Static assets
├── react-router.config.ts
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

## Nguyên tắc thiết kế

| Layer | Vai trò |
|---|---|
| `components/ui/` | Atomic: không phụ thuộc vào logic nghiệp vụ |
| `components/layout/` | Khung trang (Navbar, Footer) – reuse qua mọi route |
| `components/home/` | Feature-specific – chỉ dùng cho trang chủ |
| `routes/` | Page entry points – compose các components |

## Design System

- **Font**: Be Vietnam Pro (Google Fonts)
- **Icons**: Material Symbols Outlined
- **Colors**: CSS custom properties (`--color-primary`, `--color-secondary`, ...)
- **Spacing**: `--spacing-xs | sm | md | lg | xl | 2xl`
- **Border Radius**: `--radius | --radius-lg | --radius-xl | --radius-full`
- **Animations**: `animate-fade-in-up` với `animation-delay-*`

## Thêm trang mới

1. Tạo file trong `app/routes/<tên-trang>.tsx`
2. Đăng ký trong `app/routes.ts`
3. Tái sử dụng `<Navbar />` và `<Footer />` từ `components/layout/`
4. Tạo thêm components riêng trong `components/<feature>/` nếu cần

# Huy's

Ứng dụng React/Vite dùng Supabase cho đăng nhập, dữ liệu và Edge Functions. Mã nguồn có thể triển khai độc lập với Lovable.

## Chạy và build

Yêu cầu Node.js 20+ và npm.

```sh
npm ci
npm run dev
npm run build
```

Bản tĩnh được tạo trong `dist/`. Khi triển khai trên Vercel, import repository này, chọn Vite, dùng `npm run build` và output directory `dist`. `vercel.json` đã chuyển các đường dẫn của React Router về `index.html`. Nếu dùng một host khác, cấu hình fallback tương đương cho các đường dẫn như `/story/:id` và `/dashboard`.

## Kết nối domain mới

- Trỏ domain tới host của ứng dụng và bật HTTPS.
- Trong Supabase Authentication → URL Configuration, thêm `https://DOMAIN/` và `https://DOMAIN/dashboard` vào danh sách Redirect URLs. Nếu domain mới là site chính, đặt Site URL tương ứng.
- Google One Tap sử dụng OAuth client trong `src/components/GoogleOneTap.tsx`. Thêm origin `https://DOMAIN` vào Authorized JavaScript origins trong Google Cloud. Kiểm tra cấu hình Google/Facebook OAuth provider nếu bạn sử dụng các nút đăng nhập đó.
- Frontend hiện kết nối với Supabase project `onihezlpgofqzutuxahv`; site mới dùng chung nội dung, tài khoản và dữ liệu với site hiện tại. Ảnh gallery/banner tải từ `cdn.nguyenduchuy.io.vn`. Đảm bảo Supabase project và CDN thuộc quyền quản lý của bạn.
- Edge Function `speech-assess` dùng trực tiếp OpenAI Audio Transcriptions. Cấu hình `OPENAI_API_KEY` trong Supabase Edge Function Secrets rồi deploy lại function này. Không đưa API key vào frontend hay GitHub.

Các Edge Functions, cron, webhook và dữ liệu đang chạy trong Supabase project hiện tại. Triển khai frontend trên domain mới không tự sao chép hoặc chuyển chúng sang project khác.

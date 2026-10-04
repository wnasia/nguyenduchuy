# Sửa toàn diện giao diện Hộp thư Fanpage

## Mục tiêu
Biến màn hình hiện tại thành bố cục hộp thư quen thuộc như Messenger/Telegram: không che nhau, không cuộn cả trang để đọc hoặc trả lời, dùng tốt trên máy tính và điện thoại.

## Thay đổi chính
- Tách màn hình thành ba vùng ổn định: thanh fanpage, danh sách hội thoại, khung chat.
- Trên máy tính, hộp thư chiếm phần chiều cao còn lại của màn hình; chỉ danh sách hội thoại và lịch sử tin được cuộn độc lập.
- Thanh tiêu đề cuộc trò chuyện luôn ở trên; ô nhập và nút gửi luôn ghim ở đáy khung chat.
- Khi chọn hội thoại hoặc nhận tin mới, lịch sử tự cuộn xuống tin mới nhất mà không kéo cả trang.
- Trên điện thoại, dùng hai màn hình rõ ràng: danh sách hội thoại → cuộc trò chuyện; nút quay lại cố định, ô trả lời luôn nhìn thấy phía dưới.
- Thu gọn các nút quản trị và bộ lọc fanpage để không lấn nội dung; chuyển quản lý fanpage/nhân viên vào hộp cấu hình riêng.
- Thay phần xác nhận xóa mặc định bằng hộp xác nhận rõ ràng; xóa xong cập nhật ngay danh sách và hội thoại đang mở.
- Giữ báo tin realtime, âm báo, giới hạn trả lời của Meta và phân quyền nhân viên như hiện tại.

## Kiểm tra
- Kiểm tra ở kích thước máy tính và điện thoại, gồm trạng thái chưa chọn hội thoại, đang chat, nhiều tin dài và cảnh báo quá hạn.
- Kiểm tra ô trả lời luôn ở đáy, không bị footer hoặc thanh quản trị che.
- Kiểm tra lỗi biên dịch và lỗi hiển thị sau khi sửa.

## Chi tiết kỹ thuật
- Loại bỏ chiều cao dựa trên `72vh`; dùng vùng nội dung quản trị có chiều cao theo viewport và `min-height: 0` xuyên suốt chuỗi flex/grid.
- Khóa overflow ở vỏ hộp thư; chỉ bật `overflow-y-auto` cho hai vùng dữ liệu cần cuộn.
- Dùng dialog quản lý fanpage riêng và AlertDialog cho thao tác xóa.

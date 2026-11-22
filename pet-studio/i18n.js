// i18n vi/en cho giao diện. Dịch theo văn bản gốc (vi) để không phải sửa HTML.

export const VI_EN = {
  'Tên pet': 'Pet name',
  'Màu': 'Color',
  'Hồ sơ nhanh': 'Quick profiles',
  'Chế độ đơn giản (ẩn bớt nút)': 'Simple mode (fewer buttons)',
  'Đổi màu theo giờ (tối = tím)': 'Color by time (night = purple)',
  'Tự đổi pet theo mùa (Tết / tuyết)': 'Seasonal pet (Tết / snow)',
  'Hiện FPS': 'Show FPS',
  'Ghi lỗi trên máy (không gửi đi)': 'Log errors on device (never sent)',
  'Đọc thành tiếng khi có việc': 'Read aloud when something happens',
  'Giọng đọc': 'Voice',
  'Giọng mặc định': 'Default voice',
  'Tốc độ': 'Speed',
  'Nghe thử': 'Test voice',
  'Âm thanh môi trường': 'Ambient sound',
  'Tắt': 'Off',
  'Mưa': 'Rain',
  'Sóng biển': 'Ocean waves',
  'Kết nối agent (tuỳ chọn)': 'Agent connection (optional)',
  'Chợ pack': 'Pack market',
  'Mở chợ pack': 'Open pack market',
  'Trò chuyện': 'Chat',
  'Gửi': 'Send',
  'Kể chuyện': 'Tell a story',
  'Tóm tắt hôm nay': "Today's summary",
  'Pet nhớ': 'Pet remembers',
  'Thêm': 'Add',
  'Nhật ký': 'Journal',
  'Chia sẻ': 'Share',
  'Chép liên kết cấu hình': 'Copy config link',
  'Xuất ảnh pet': 'Export pet image',
  'Xuất GIF': 'Export GIF',
  'Mã QR': 'QR code',
  'Tặng pet (.zip)': 'Gift pet (.zip)',
  'Thư viện': 'Library',
  'Về Pet Studio': 'About Pet Studio',
  'Lộ trình 100 ý tưởng': '100-idea roadmap',
  'Sao lưu': 'Backup',
  'Sao chép JSON': 'Copy JSON',
  'Đặt lại': 'Reset',
  'Nhập': 'Import',
  'Cài đặt pet': 'Pet settings',
  'Đóng': 'Close',
  'Pet đã nhập': 'Imported pets',
  'Nhập ảnh / GIF / zip': 'Import image / GIF / zip',
  'Pack': 'Pack',
  'Cỡ': 'Size',
  'Nhỏ · 30': 'Small · 30',
  'Vừa · 40': 'Medium · 40',
  'Lớn · 64': 'Large · 64',
  'Khổng lồ · 96': 'Huge · 96',
  'Im lặng': 'Quiet',
  'Tự diễn': 'Auto demo',
  'Cài đặt': 'Settings',
  'Nổi': 'Float',
  'Chăm sóc': 'Care',
  'Tập trung 25′': 'Focus 25′',
  'Nghỉ 5′': 'Break 5′',
  'Dừng': 'Stop',
  'chưa chạy': 'not running',
  'Nhắc đứng dậy mỗi': 'Remind to stand up every',
  'Pet nổi ngoài app': 'Floating pet',
  'Bật cửa sổ nổi': 'Show floating window',
  'Bật': 'On',
  'Đứng chờ': 'Idle',
  'Đang nghĩ': 'Thinking',
  'Đang làm': 'Working',
  'Xong rồi': 'Done',
  'Gặp lỗi': 'Error',
  'Chờ bạn': 'Waiting',
  'Ngủ': 'Sleep',
  'Thức': 'Awake',
  'Đi dạo': 'Roam',
  'Vui': 'Happy',
  'Buồn ngủ': 'Sleepy',
  'Hờn': 'Grumpy',
  'Chạm trái/phải để chọc, chạm 3 lần để cù, kéo để nhấc. Đứng yên 60 giây pet sẽ ngủ.':
    'Tap left/right to poke, tap 3 times to tickle, drag to lift. Idle 60s and the pet sleeps.',
  'Chào mừng đến Pet Studio': 'Welcome to Pet Studio',
  'Một chú pet nhỏ sống trên màn hình của bạn.': 'A tiny pet living on your screen.',
  'Bắt đầu': 'Get started',
  'chưa có gì': 'nothing yet',
  'Chuỗi: —': 'Streak: —',
  'Tải & nhập': 'Download & import',
  'Mã QR cấu hình': 'Config QR',
  'Lưu QR': 'Save QR',
  'hoặc dán link .zip': 'or paste a .zip link',
  'chưa kết nối': 'not connected',
  'Chưa có ảnh/GIF nào. Dùng “Xuất ảnh pet” hoặc “Xuất GIF” trước.':
    'No images/GIFs yet. Use “Export pet image” or “Export GIF” first.',
  'Ảnh & GIF đã xuất': 'Exported images & GIFs',
};

const PLACEHOLDERS = {
  'đặt tên cho pet': 'name your pet',
  'nói gì đó với pet…': 'say something to your pet…',
  'điều muốn pet nhớ': 'something for your pet to remember',
  'https://… trả về {"state":"working"}': 'https://… returns {"state":"working"}',
  'https://…/pet.zip': 'https://…/pet.zip',
  'Dán JSON sao lưu vào đây rồi bấm Nhập': 'Paste backup JSON here, then Import',
};

let current = 'vi';
export function getLang() { return current; }
export function pick(vi, en) { return current === 'en' ? en : vi; }

function translateTextNodes() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const raw = node.nodeValue;
    const key = raw.trim();
    if (!key) continue;
    if (!node.__vi) node.__vi = raw;
    const en = VI_EN[key];
    if (current === 'en' && en) {
      node.nodeValue = raw.replace(key, en);
    } else {
      node.nodeValue = node.__vi;
    }
  }
}

function translateAttributes() {
  document.querySelectorAll('[placeholder]').forEach(el => {
    if (!el.dataset.viPlaceholder) el.dataset.viPlaceholder = el.placeholder;
    const vi = el.dataset.viPlaceholder;
    el.placeholder = current === 'en' ? (PLACEHOLDERS[vi] || vi) : vi;
  });
}

export function applyLanguage(lang) {
  current = lang === 'en' ? 'en' : 'vi';
  document.documentElement.lang = current;
  translateTextNodes();
  translateAttributes();
}

export const STATE_TEXT = {
  idle: ['đứng chờ', 'idle'],
  thinking: ['đang nghĩ', 'thinking'],
  working: ['đang làm', 'working'],
  attention: ['vừa xong', 'done'],
  error: ['gặp lỗi', 'error'],
  notification: ['chờ bạn', 'waiting'],
  sleeping: ['đang ngủ', 'sleeping'],
  waking: ['vừa thức', 'waking'],
  roam: ['đi dạo', 'roaming'],
};

export function stateText(state) {
  const pair = STATE_TEXT[state] || [state, state];
  return current === 'en' ? pair[1] : pair[0];
}

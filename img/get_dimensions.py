import os
import struct

def get_image_info(file_path):
    with open(file_path, 'rb') as f:
        data = f.read(24)
        if len(data) >= 24 and data[:8] == b'\x89PNG\r\n\x1a\n':
            w, h = struct.unpack('>II', data[16:24])
            return w, h
        elif len(data) >= 4 and data[:4] == b'\xff\xd8\xff\xe0':
            # JPEG (basic parser)
            f.seek(0)
            data = f.read()
            # Find SOF0 marker
            idx = 0
            while True:
                idx = data.find(b'\xff', idx)
                if idx == -1 or idx == len(data) - 1:
                    break
                if data[idx+1] in (0xc0, 0xc2):
                    h, w = struct.unpack('>HH', data[idx+5:idx+9])
                    return w, h
                idx += 1
    return None

img_dir = r"c:\Users\aksl8\OneDrive\Desktop\edoc-doctor-appointment-system-main\edoc_hms\frontend\img"
for name in os.listdir(img_dir):
    if name.endswith('.png') or name.endswith('.jpg'):
        path = os.path.join(img_dir, name)
        info = get_image_info(path)
        if info:
            w, h = info
            print(f"{name}: {w}x{h} (Aspect Ratio: {w/h:.3f})")

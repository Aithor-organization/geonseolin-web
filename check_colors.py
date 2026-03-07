from PIL import Image
import os

img_path = "public/images/icons/worker.png"
if os.path.exists(img_path):
    img = Image.open(img_path).convert("RGBA")
    corners = [(0,0), (0,1), (1,0), (1,1), (10,10), (20,20)]
    print("Worker corners:")
    for c in corners:
        print(f"{c}: {img.getpixel(c)}")
else:
    print("File not found")

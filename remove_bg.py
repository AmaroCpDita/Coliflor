import sys
from PIL import Image

def remove_green_screen(input_path, output_path):
    # Open the image and convert to RGBA
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()

    new_data = []
    for item in data:
        r, g, b, a = item
        # Define the green screen threshold
        # Pure green is (0, 255, 0). Let's be a bit flexible for anti-aliasing.
        # Check if the pixel is dominantly green
        if g > 150 and r < 100 and b < 100:
            # Fully transparent
            new_data.append((255, 255, 255, 0))
        elif g > r and g > b and g > 100:
            # Edge pixels - try to feather it based on green intensity
            # This is a basic chroma key calculation
            # Calculate how much "extra" green there is
            greenness = g - max(r, b)
            # If greenness is high, reduce alpha
            alpha = max(0, 255 - greenness * 2)
            # Remove the extra green spill from the color
            new_g = min(g, max(r, b))
            new_data.append((r, new_g, b, int(alpha)))
        else:
            new_data.append(item)

    img.putdata(new_data)
    
    # Save as WebP
    img.save(output_path, "WEBP")
    print(f"Saved {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_bg.py <input> <output>")
        sys.exit(1)
    remove_green_screen(sys.argv[1], sys.argv[2])
